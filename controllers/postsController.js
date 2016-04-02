module.exports = function(mongo) {
	if(!mongo) {
		throw 'Missing mongo';
	}

	return {
		getRootRouteHandler: getRootRouteHandler,
		getReadRouteHandler: getReadRouteHandler,
		getEditRouteHandler: getEditRouteHandler,
		postEditRouteHandler: postEditRouteHandler,
		getCreateRouteHandler: getCreateRouteHandler,
		postCreateRouteHandler: postCreateRouteHandler
	};

	function getRootRouteHandler(req, res, next) {
		mongo.collection('posts').find({}, { title: 1, uri: 1, publishDate: 1 }).sort({ publishDate: -1 }).toArray(function(err, items) {
			if (err) {
				return next(err);
			}
			res.render('index.html', { user: req.user, posts: items.map(function(i) {
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
			res.render('post.html', { title: item.title, content: item.content });
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
			res.render('editPost.html', { user: req.user, title: item.title, content: item.content });
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
		mongo.collection('posts').findAndModify({ uri: req.params.uri }, [], { $set: { title: title, content: content } }, {}, function(err, item) {
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
		res.render('create.html', {});
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
		mongo.collection('posts').insert({ title: title, uri: url, content: content, user_id: new ObjectID(req.user.id), publishDate: new Date() }, function(err) {
			if(err) {
				if(err.code === 11000) { //duplicate key
					return res.render('create.html', { post: { url: url, title: title, content: content, exists: true } });
				}
				return next(err);
			}
			res.redirect('/posts/' + url);
		});
	}
};
