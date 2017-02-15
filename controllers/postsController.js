module.exports = function(mongo) {
	if (!mongo) {
		throw 'Missing mongo';
	}

	var ObjectID = require('mongodb').ObjectID;
	var imgRegExp = /<img\s+src="\/tempImages\/(.*?)"/gi;

	return {
		getPostsRouteHandler: getPostsRouteHandler,
		getReadRouteHandler: getReadRouteHandler,
		getEditRouteHandler: getEditRouteHandler,
		deletePostRouteHandler: deletePostRouteHandler,
		postEditRouteHandler: postEditRouteHandler,
		getCreateRouteHandler: getCreateRouteHandler,
		postCreateRouteHandler: postCreateRouteHandler,
		getMyPostsRouteHandler: getMyPostsRouteHandler
	};

	function getPostsRouteHandler(req, res, next) {
		mongo.collection('posts').aggregate([
			{ $match: {} },
			{ $sort: { publishDate: -1 } },
			{ $lookup: { from: 'users', localField: 'author_id', foreignField: '_id', as: 'author' } },
			{ $unwind: '$author' },
			{ $project: { title: 1, uri: 1, publishDate: 1, 'author.name': 1 } }
			]).toArray(function(err, items) {
			if (err) {
				return next(err);
			}
			var model = {
				title: 'KPJS blog',
				posts: items.map(function(i) {
					return { title: i.title, uri: i.uri, dateIsoStr: i.publishDate.toISOString(), authorName: i.author.name };
				})
			};
			res.format({
				html: function() {
					res.render('allPosts.html', model);
				},
				json: function() {
					res.json(model.posts);
				}
			});
		});
	}

	function getReadRouteHandler(req, res, next) {
		mongo.collection('posts').findOne({ uri: req.params.uri }, { title: 1, content: 1, publishDate: 1, author_id: 1 }, function(err, item) {
			if (err) {
				return next(err);
			}
			if (!item) {
				var error = new Error('Post not found');
				error.statusCode = 404;
				return next(error);
			}

			mongo.collection('users').findOne({ _id: new ObjectID(item.author_id) }, { name: 1 }, function(err, user) {
				if (err) {
					return next(err);
				}
				if (!user) {
					var error = new Error('User not found');
					error.statusCode = 404;
					return next(error);
				}

				mongo.collection('posts').find({}, { title: 1, uri: 1 }).sort({ publishDate: -1 }).toArray(function(err, items) {
					if (err) {
						return next(err);
					}

					for(var i = 0; i < items.length; i++) {
						if(items[i].uri === req.params.uri) {
							items[i].selected = true;
						}
					}

					var model = { title: item.title, content: item.content, dateIsoStr: item.publishDate.toISOString(), author: user.name, posts: items };

					res.format({
						html: function() {
							model.includeHighlightLib = true;
							res.render('post.html', model);
						},
						json: function() {
							res.json(model);
						}
					});
				});
			});
		});
	}

	function deletePostRouteHandler(req, res, next) {
		mongo.collection('posts').deleteOne({ uri: req.params.uri }, function(err) {
			if (err) {
				return next(err);
			}
			res.writeHead(200, { 'Location': '/posts' });
			res.end();
		});
	}

	function getEditRouteHandler(req, res, next) {
		mongo.collection('posts').findOne({ uri: req.params.uri }, { title: 1, content: 1 }, function(err, item) {
			if (err) {
				return next(err);
			}
			if (!item) {
				var error = new Error('Post not found');
				error.statusCode = 404;
				return next(error);
			}
			var model = { title: item.title, content: item.content };
			res.format({
				html: function() {
					res.render('editPost.html', model);
				},
				json: function() {
					res.json(model);
				}
			});
		});
	}

	function postEditRouteHandler(req, res, next) {
		var title = req.body.title;
		var content = req.body.content;
		if (!title || !content) {
			var error = new Error('Title and content are mandatory');
			error.statusCode = 400;
			return next(error);
		}
		var output = extractTempImages(content, req.params.uri);
		mongo.collection('tempImages').find({ _id: { $in: output.imageIds } }).toArray(function(err, images) {
			if (err) {
				return next(err);
			}
			mongo.collection('posts').findOneAndUpdate({ uri: req.params.uri }, { $set: { title: title, content: content }, $addToSet: { images: images } }, function(err, item) {
				if (err) {
					return next(err);
				}
				if (!item.value) {
					var error = new Error('Post not found');
					error.statusCode = 404;
					return next(error);
				}
				res.format({
					html: function() {
						res.redirect('/posts/' + req.params.uri);
					},
					json: function() {
						res.json({ title: item.title, content: item.content });
					}
				});
			});
		});
	}

	function getCreateRouteHandler(req, res) {
		res.render('create.html', { title: 'Create post' });
	}

	function postCreateRouteHandler(req, res, next) {
		var title = req.body.title;
		var content = req.body.content;
		if (!title || !content) {
			var error = new Error('Title and content are mandatory');
			error.statusCode = 400;
			return next(error);
		}
		var url = req.body.url;
		if (!url) {
			url = title.replace(/\s+/g, '-');
		}
		var output = extractTempImages(content, url);
		mongo.collection('tempImages').find({ _id: { $in: output.imageIds } }).toArray(function(err, images) {
			if (err) {
				return next(err);
			}
			mongo.collection('posts').insertOne({ title: title, uri: url, content: output.newContent, images: images, author_id: new ObjectID(req.user.id), publishDate: new Date() }, function(err) {
				if (err) {
					if (err.code === 11000) { //duplicate key
						return res.render('create.html', { post: { url: url, title: title, content: content, exists: true } });
					}
					return next(err);
				}
				res.format({
					html: function() {
						res.redirect('/posts/' + url);
					},
					json: function() {
						res.statusCode = 201;
						res.location('/posts/' + url);
						res.end();
					}
				});
			});
		});
	}

	function extractTempImages(content, postUri) {
		var imageIds = [];
		var newContent = content.replace(imgRegExp, function(match, imgId) {
			imageIds.push(imgId);
			return '<img src="/images/' + postUri + '/' + imgId + '"';
		});
		imageIds = imageIds.map(function(i) {
			return new ObjectID(i);
		});
		return { imageIds: imageIds, newContent: newContent };
	}

	function getMyPostsRouteHandler(req, res, next) {
		mongo.collection('posts').find({ author_id: new ObjectID(req.user.id) }, { title: 1, uri: 1, publishDate: 1 }).sort({ publishDate: -1 }).toArray(function(err, items) {
			if (err) {
				return next(err);
			}
			var model = {
				title: 'My posts',
				posts: items.map(function(i) {
					return { title: i.title, uri: i.uri, dateIsoStr: i.publishDate.toISOString() };
				})
			};
			res.format({
				html: function() {
					res.render('myPosts.html', model);
				},
				json: function() {
					res.json(model.posts);
				}
			});
		});
	}
};
