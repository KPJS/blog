module.exports = function(logger, authenticationController, postsController, usersController, imageUploadController) {
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
	if(!imageUploadController) {
		throw 'Missing imageUploadController';
	}

	var server;

	return {
		start: function(startCallback) {
			start(logger, authenticationController, postsController, usersController, imageUploadController, function(err, srv) {
				if (err) {
					return startCallback(err);
				}
				server = srv;
				startCallback(null, server.address());
			});
		},
		stop: function() {
			if (server) {
				server.close();
				server = null;
				logger.info('Server stopped');
			}
		}
	};

	function start(logger, authenticationController, postsController, usersController, imageUploadController, callback) {
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

		var busboy = require('connect-busboy');
		app.use(busboy());

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

		registerPostControllerRoutes(app, authenticationController.ensureRulerOrOwner, authenticationController.ensureCitizen, postsController);
		registerUserControllerRoutes(app, authenticationController.ensureRuler, usersController);
		registerImageUploadControllerRoutes(app, authenticationController.ensureCitizen, imageUploadController);

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

		var srv = app.listen(port, function(err) {
			if (err) {
				logger.error('Server initialization failed', err);
				callback(err);
			}
			else {
				logger.info('Server listening');
				callback(null, srv);
			}
		});
	}

	function registerUserControllerRoutes(app, verifyRuler, usersController) {
		app.get('/users', verifyRuler, usersController.getAllUsersRouteHandler);
		app.get('/users/:id', verifyRuler, usersController.getUserRouteHandler);
		app.post('/users/:id', verifyRuler, usersController.postUserRouteHandler);
	}

	function registerPostControllerRoutes(app, verifyRulerOrOwner, verifyCitizen, postsController) {
		app.get('/', postsController.getRootRouteHandler);
		app.get('/about', postsController.aboutRouteHandler);
		app.get('/contact', postsController.contactRouteHandler);
		app.get('/posts', postsController.getPostsRouteHandler);
		app.get('/posts/:uri', postsController.getReadRouteHandler);
		app.delete('/posts/:uri', verifyRulerOrOwner, postsController.deletePostRouteHandler);
		app.get('/edit/:uri', verifyRulerOrOwner, postsController.getEditRouteHandler);
		app.post('/edit/:uri', verifyRulerOrOwner, postsController.postEditRouteHandler);
		app.get('/create', verifyCitizen, postsController.getCreateRouteHandler);
		app.post('/create', verifyCitizen, postsController.postCreateRouteHandler);
		app.get('/myPosts', postsController.getMyPostsRouteHandler);
	}

	function registerImageUploadControllerRoutes(app, verifyRulerOrOwner, imageUploadController) {
		app.post('/uploadImage', verifyRulerOrOwner, imageUploadController.uploadImageRouteHandler);
	}
};
