module.exports = function(mongo) {
	if (!mongo) {
		throw 'Missing mongo';
	}

	var fs = require('fs');

	return {
		getRootRouteHandler: getRootRouteHandler,
		getPostsRouteHandler: getPostsRouteHandler,
		getReadRouteHandler: getReadRouteHandler,
		getEditRouteHandler: getEditRouteHandler,
		deletePostRouteHandler: deletePostRouteHandler,
		postEditRouteHandler: postEditRouteHandler,
		getCreateRouteHandler: getCreateRouteHandler,
		postCreateRouteHandler: postCreateRouteHandler,
		aboutRouteHandler: aboutRouteHandler,
		contactRouteHandler: contactRouteHandler,
		getMyPostsRouteHandler: getMyPostsRouteHandler
	};

	function aboutRouteHandler(req, res) {
		res.render('about.html', { title: 'About Us' });
	}

	function contactRouteHandler(req, res) {
		res.render('contact.html', { title: 'Contact' });
	}

	function getRootRouteHandler(req, res, next) {
		mongo.collection('posts').find({}, { title: 1, uri: 1, publishDate: 1, content: 1 }).sort({ publishDate: -1 }).limit(1).toArray(function(err, items) {
			if (err) {
				return next(err);
			}
			var model = { title: items[0].title, perex: items[0].content.replace(/(<([^>]+)>)/ig, '').substring(0, 200) + '...', uri: items[0].uri };
			res.format({
				html: function() {
					res.render('index.html', model);
				},
				json: function() {
					res.json(model);
				}
			});
		});
	}

	function getPostsRouteHandler(req, res, next) {
		mongo.collection('posts').find({}, { title: 1, uri: 1, publishDate: 1, author_id: 1 }).sort({ publishDate: -1 }).toArray(function(err, items) {
			if (err) {
				return next(err);
			}
			populateAuthors(items, function(err, authors) {
				if (err) {
					return next(err);
				}
				var model = {
					title: 'KPJS blog',
					posts: items.map(function(i) {
						return { title: i.title, uri: i.uri, dateIsoStr: i.publishDate.toISOString(), authorName: authors[i.author_id] };
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
		});
	}

	function populateAuthors(postProjections, callback) {
		var ObjectID = require('mongodb').ObjectID;
		var authorIds = postProjections.map(function(x) {
			return new ObjectID(x.author_id);
		});
		mongo.collection('users').find({ _id: { $in: authorIds } }, { _id: 1, name: 1 }).toArray(function(err, items) {
			if (err) {
				return callback(err);
			}
			var authors = {};
			for (var i = 0; i < items.length; i++) {
				authors[items[i]._id] = items[i].name;
			}
			callback(null, authors);
		});
	}

	function getReadRouteHandler(req, res, next) {
		var ObjectID = require('mongodb').ObjectID;
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

				mongo.collection('posts').find({}, { title: 1, uri: 1, publishDate: 1 }).sort({ publishDate: -1 }).toArray(function(err, items) {
					if (err) {
						return next(err);
					}

					var model = { title: item.title, content: item.content, dateIsoStr: item.publishDate.toISOString(), author: user.name, posts: items };

					res.format({
						html: function() {
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
		content = moveImages(content);
		mongo.collection('posts').findOneAndUpdate({ uri: req.params.uri }, { $set: { title: title, content: content } }, function(err, item) {
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
		content = moveImages(content);
		var ObjectID = require('mongodb').ObjectID;
		mongo.collection('posts').insertOne({ title: title, uri: url, content: content, author_id: new ObjectID(req.user.id), publishDate: new Date() }, function(err) {
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
	}

	function moveImages(content) {
		var result = content.replace(new RegExp('<img\\s+src="/uploads/([^"]*)"', 'g'), function(wholeMatch, filename) {
			fs.rename(__rootDir + '/static/uploads/' + filename, __rootDir + '/static/postImages/' + filename);
			return wholeMatch.replace('"/uploads/' + filename + '"', '"/postImages/' + filename + '"');
		});
		return result;
	}

	function getMyPostsRouteHandler(req, res, next) {
		var ObjectID = require('mongodb').ObjectID;
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
