function start(logger, authenticationController, postsController, usersController, callback) {
	var port = process.env.PORT || 1337;
	var express = require('express');
	var hbs = require('hbs');
	hbs.registerHelper('select', function(selected, options) {
		return options.fn(this).replace(
        new RegExp(' value=\"' + selected + '\"'),
        '$& selected="selected"');
	});
	hbs.registerPartials(__dirname + '/views/partials');

	var app = express();
	app.set('view engine', 'html');
	app.engine('html', hbs.__express);
	app.use(express.static('static'));

	hbs.localsAsTemplateData(app);

	var bodyParser = require('body-parser');
	app.use(bodyParser.urlencoded({ extended: false }));

	app.use(function(req, res, next) {
		logger.info('Request for ' + req.path);
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

	app.use(function(req, res, next) {
		res.locals.user = req.user;
		next();
	});

	registerPostControllerRoutes(app, authenticationController.ensureOwner, authenticationController.ensureCitizen, postsController);
	registerUserControllerRoutes(app, authenticationController.ensureRuler, usersController);

	// handler for all other paths
	app.use(function(req, res, next) {
		var error = new Error('Page not found');
		error.statusCode = 404;
		next(error);
	});

	// error handler
	app.use(function(err, req, res, next) { // jshint ignore:line
		logger.error('Error: ' + err.message, { path: req.path, stackTrace: err.stack });
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

function registerUserControllerRoutes(app, verifyRuler, usersController) {
	app.get('/users', verifyRuler, usersController.getAllUsersRouteHandler);
	app.get('/users/:id', verifyRuler, usersController.getUserRouteHandler);
	app.post('/users/:id', verifyRuler, usersController.postUserRouteHandler);
}

function registerPostControllerRoutes(app, verifyOwner, verifyCitizen, postsController) {
	app.get('/', postsController.getRootRouteHandler);
	app.get('/posts/:uri', postsController.getReadRouteHandler);
	app.get('/edit/:uri', verifyOwner, postsController.getEditRouteHandler);
	app.post('/edit/:uri', verifyOwner, postsController.postEditRouteHandler);
	app.get('/create', verifyCitizen, postsController.getCreateRouteHandler);
	app.post('/create', verifyCitizen, postsController.postCreateRouteHandler);
}

module.exports = function(logger, authenticationController, postsController, usersController) {
	if(!logger) {
		throw 'Missing logger';
	}
	if(!authenticationController) {
		throw 'Missing authenticationController';
	}
	if(!postsController) {
		throw 'Missing postsController';
	}
	if(!usersController) {
		throw 'Missing usersController';
	}

	var server;

	return {
		start: function(startCallback) {
			start(logger, authenticationController, postsController, usersController, function(err, srv) {
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
