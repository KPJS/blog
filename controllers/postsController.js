module.exports = function(mongo) {
	if(!mongo) {
		throw 'Missing mongo';
	}

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
			res.render('index.html', { title: items[0].title, perex: items[0].content.replace(/(<([^>]+)>)/ig, '').substring(0, 200) + '...', uri: items[0].uri });
		});
	}

	function getPostsRouteHandler(req, res, next) {
		mongo.collection('posts').find({}, { title: 1, uri: 1, publishDate: 1 }).sort({ publishDate: -1 }).toArray(function(err, items) {
			if (err) {
				return next(err);
			}
			res.render('allPosts.html', { title: 'KPJS blog', posts: items.map(function(i) {
					return { title: i.title, uri: i.uri, date: i.publishDate };
				})
			});
		});
	}

	function getReadRouteHandler(req, res, next) {
		mongo.collection('posts').findOne({ uri: req.params.uri }, { title: 1, content: 1 }, function(err, item) {
			if (err) {
				return next(err);
			}
			if (!item) {
				var error = new Error('Post not found');
				error.statusCode = 404;
				return next(error);
			}
			res.render('post.html', { title: item.title, content: item.content, user: req.user });
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
			res.render('editPost.html', { title: item.title, content: item.content });
		});
	}

	function postEditRouteHandler(req, res, next) {
		var title = req.body.title;
		var content = req.body.content;
		if(!title || !content) {
			var error = new Error('Title and content are mandatory');
			error.statusCode = 400;
			return next(error);
		}
		mongo.collection('posts').findOneAndUpdate({ uri: req.params.uri }, { $set: { title: title, content: content } }, function(err, item) {
			if(err) {
				return next(err);
			}
			if (!item.value) {
				var error = new Error('Post not found');
				error.statusCode = 404;
				return next(error);
			}
			res.redirect('/posts/' + req.params.uri);
		});
	}

	function getCreateRouteHandler(req, res) {
		res.render('create.html', { title: 'Create post' });
	}

	function postCreateRouteHandler(req, res, next) {
		var title = req.body.title;
		var content = req.body.content;
		if(!title || !content) {
			var error = new Error('Title and content are mandatory');
			error.statusCode = 400;
			return next(error);
		}
		var url = req.body.url;
		if(!url) {
			url = title.replace(/\s+/g, '-');
		}
		var ObjectID = require('mongodb').ObjectID;
		mongo.collection('posts').insertOne({ title: title, uri: url, content: content, author_id: new ObjectID(req.user.id), publishDate: new Date() }, function(err) {
			if(err) {
				if(err.code === 11000) { //duplicate key
					return res.render('create.html', { post: { url: url, title: title, content: content, exists: true } });
				}
				return next(err);
			}
			res.redirect('/posts/' + url);
		});
	}

	function getMyPostsRouteHandler(req, res, next) {
		var ObjectID = require('mongodb').ObjectID;
		mongo.collection('posts').find({ author_id: new ObjectID(req.user.id) }, { title: 1, uri: 1, publishDate: 1 }).sort({ publishDate: -1 }).toArray(function(err, items) {
			if (err) {
				return next(err);
			}
			res.render('myPosts.html', { title: 'My posts', posts: items.map(function(i) {
					return { title: i.title, uri: i.uri, date: i.publishDate };
				})
			});
		});
	}
};
