function start(logger, mongo, callback) {
	var port = process.env.PORT || 1337;
	var express = require('express');
	var hbs = require('hbs');
	var session = require('express-session');
	var FileStore = require('session-file-store')(session);

	var passport = require('passport');
	var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
	passport.use(new GoogleStrategy({
			clientID: process.env.GOOGLE_CLIENT_ID,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET,
			callbackURL: 'http://' + (process.env.NODE_ENV === 'production' ? 'kpjs.azurewebsites.net' : 'localhost:1337') + '/login/google/callback'
		},
		function(token, tokenSecret, profile, done) {
			process.nextTick(function() {
				// To keep the example simple, the user's Google profile is returned to
				// represent the logged-in user.  In a typical application, you would want
				// to associate the Google account with a user record in your database,
				// and return that user instead.
				return done(null, profile);
			});
		}
	));

	passport.serializeUser(function(user, done) {
		done(null, user);
	});

	passport.deserializeUser(function(obj, done) {
		done(null, obj);
	});

	var app = express();
	app.set('view engine', 'html');
	app.engine('html', hbs.__express);
	app.use(express.static('static'));
	app.use(session({ secret: 'keyboard cat', name: 'kpjs.blog.session', resave: true, saveUninitialized: true, store: new FileStore() }));
	app.use(passport.initialize());
	app.use(passport.session());

	app.use(function(req, res, next) {
		logger.info("Request for " + req.path);
		next();
	});

	app.get('/login/google', passport.authenticate('google', { scope: ['https://www.googleapis.com/auth/plus.login', 'https://www.googleapis.com/auth/userinfo.email'] }));
	app.get('/logout', function(req, res){
		req.logout();
		req.session.destroy(function(err){
			res.redirect('/');
		});
	});
	app.get('/login/google/callback',
		passport.authenticate('google', { failureRedirect: '/googleFail', successRedirect: '/' })
  );
	app.get('/googleFail', function(req, res){ res.end('google login failed'); });

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

	app.use(function(req, res, next) { // handler for all other paths
		var error = new Error("Page not found");
		error.statusCode = 404;
		next(error);
	});

	app.use(function(err, req, res, next) { // error handler
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
			logger.info('Server started');
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

module.exports = function(logger, mongo) {
	if(!logger) {
		throw "Missing logger";
	}
	if(!mongo) {
		throw "Missing mongo";
	}

	var server;

	return {
		start: function(startCallback) {
			start(logger, mongo, function(err, srv) {
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
