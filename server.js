function start(logger, mongo, callback) {
	var port = process.env.PORT || 1337;
	var express = require('express');
	var hbs = require('hbs');
	var passport = require('passport');
	var twitterStrategy = require('passport-twitter').Strategy;

	var app = express();
	app.set('view engine', 'html');
	app.engine('html', hbs.__express);
	app.use(express.static('static'));
	
	passport.use(new twitterStrategy({
		consumerKey: 'KEY VAR',
		consumerSecret: 'SECRET VAR',
		callbackURL: 'http://127.0.0.1:1337/login/twitter/callback'
	},
	function(token, tokenSecret, profile, cb) {
		return cb(null, profile);
	}));

	passport.serializeUser(function(user, cb) {
		cb(null, user);
	});
	
	passport.deserializeUser(function(obj, cb) {
		cb(null, obj);
	});
	
	app.use(require('cookie-parser')());
	app.use(require('express-session')({ secret: 'keyboard cat', resave: true, saveUninitialized: true }));
	app.use(passport.initialize());
	app.use(passport.session());

	app.use(function(req, res, next) {
		logger.info("Request for " + req.path);
		next();
	});

	app.get('/login/twitter', passport.authenticate('twitter'));

	app.get('/login/twitter/callback', 
	passport.authenticate('twitter', { failureRedirect: '/login/twitter' }),
	function(req, res) {
		res.redirect('/');
	});

	app.get('/', function(req, res, next) {
		mongo.collection('posts').find({}, { title: 1, uri: 1, publishDate: 1 }).sort({ publishDate: -1 }).toArray(function(err, items) {
			if (err) {
				var error = new Error("Could not retrieve posts");
				error.statusCode = 500;
				return next(error);
			}
			res.render('index.html', { posts: items.map(function(i) { return { title: i.title, uri: i.uri, date: i.publishDate }; }) });
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
		res.status(err.statusCode);
		res.render('error.html', { title: err.message });
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
