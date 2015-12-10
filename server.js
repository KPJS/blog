function start(logger, mongo, authenticator, postsController, callback) {
	var port = process.env.PORT || 1337;
	var express = require('express');
	var hbs = require('hbs');

	var app = express();
	app.set('view engine', 'html');
	app.engine('html', hbs.__express);
	app.use(express.static('static'));

	app.use(function(req, res, next) {
		logger.info("Request for " + req.path);
		next();
	});

	var session = require('express-session');
	var FileStore = require('session-file-store')(session);
	app.use(session({
		secret: 'kPjS s3cr3t',
		name: 'kpjs.blog.session',
		resave: true,
		saveUninitialized: true,
		store: new FileStore({ ttl: 1800, reapInterval: 1800, logFn: logger.info })
	}));

	authenticator.setup(app, mongo);

	app.get('/', function(req, res, next) {
		mongo.collection('posts').find({}, { title: 1, uri: 1, publishDate: 1 }).sort({ publishDate: -1 }).toArray(function(err, items) {
			if (err) {
				var error = new Error("Could not retrieve posts");
				error.statusCode = 500;
				return next(error);
			}
			res.render('index.html', { user: req.user, posts: items.map(function(i) { return { title: i.title, uri: i.uri, date: i.publishDate }; }) });
		});
	});

	app.get('/posts/:uri', function(req, res, next) {
		mongo.collection('posts').findOne({ uri: req.params.uri }, { title: 1, content: 1 }, function(err, item) {
			if (err) {
				var error = new Error("Post not found");
				error.statusCode = 404;
				return next(error);
			}
			res.render('post.html', { title: item.title, content: item.content });
		});
	});

	registerPostControllerRoutes(app, postsController);

	// handler for all other paths
	app.use(function(req, res, next) {
		var error = new Error("Page not found");
		error.statusCode = 404;
		next(error);
	});

	// error handler
	app.use(function(err, req, res, next) { // jshint ignore:line
		logger.error("Error: " + err.message, { path: req.path, stackTrace: err.stack });
		err.statusCode = err.statusCode || 500;
		res.status(err.statusCode);
		res.render('error.html', { message: err.message, errorCode: err.statusCode });
	});

	var server = app.listen(port, function(err) {
		if (err) {
			logger.error('Server initialization failed', err);
			callback(err);
		}
		else {
			logger.info('Server listening');
			callback(null, server);
		}
	});
}

function stop(server, logger) {
	if (server) {
		server.close();
		server = null;
		logger.info('Server stopped');
	}
}

function registerPostControllerRoutes(app, postsController) {
	app.get('/edit/:uri', verifyAuth, postsController.getEditRouteHandler);
	app.post('/edit/:uri', verifyAuth, postsController.postEditGetRouteHandler);
	app.get('/create', verifyAuth, postsController.getCreateRouteHandler);
	app.post('/create', verifyAuth, postsController.postCreateRouteHandler);
}

function verifyAuth(req, res, next) {
	if(!req.isAuthenticated()){
		var error = new Error("Not logged in");
		error.statusCode = 401;
		return next(error);
	}
	next();
}

module.exports = function(logger, mongo, authenticator, postsController) {
	if(!logger) {
		throw "Missing logger";
	}
	if(!mongo) {
		throw "Missing mongo";
	}
	if(!authenticator) {
		throw "Missing authenticator";
	}
	if(!postsController) {
		throw "Missing postsController";
	}

	var server;

	return {
		start: function(startCallback) {
			start(logger, mongo, authenticator, postsController, function(err, srv) {
				if (err) {
					return startCallback(err);
				}
				server = srv;
				startCallback(null, server.address());
			});
		},
		stop: function() {
			stop(server, logger);
		}
	};
};
