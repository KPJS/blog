function start(logger, authenticationController, postsController, usersController, callback) {
	var port = process.env.PORT || 1337;
	var express = require('express');
	var hbs = require('hbs');

	var app = express();
	app.set('view engine', 'html');
	app.engine('html', hbs.__express);
	app.use(express.static('static'));

	var bodyParser = require('body-parser');
	app.use(bodyParser.urlencoded({ extended: false }));

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

	authenticationController.setup(app);
	registerPostControllerRoutes(app, authenticationController.ensureAuthenticated, postsController);
	registerUserControllerRoutes(app, authenticationController.ensureAuthenticated, usersController);

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

function registerUserControllerRoutes(app, verifyAuth, usersController) {
	app.get('/users', verifyAuth, usersController.getAllUsersRouteHandler);
	app.get('/users/:id', verifyAuth, usersController.getUserDetailRouteHandler);
	app.post('/users/:id', verifyAuth, usersController.postUserDetailRouteHandler);
}

function registerPostControllerRoutes(app, verifyAuth, postsController) {
	app.get('/', postsController.getRootRouteHandler);
	app.get('/posts/:uri', postsController.getReadRouteHandler);
	app.get('/edit/:uri', verifyAuth, postsController.getEditRouteHandler);
	app.post('/edit/:uri', verifyAuth, postsController.postEditRouteHandler);
	app.get('/create', verifyAuth, postsController.getCreateRouteHandler);
	app.post('/create', verifyAuth, postsController.postCreateRouteHandler);
}

module.exports = function(logger, authenticationController, postsController, usersController) {
	if(!logger) {
		throw "Missing logger";
	}
	if(!authenticationController) {
		throw "Missing authenticationController";
	}
	if(!postsController) {
		throw "Missing postsController";
	}
	if(!usersController) {
		throw "Missing usersController";
	}

	var server;

	return {
		start: function(startCallback) {
			start(logger, authenticationController, postsController, usersController, function(err, srv){
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
