function start(logger, mongo, callback) {
	var port = process.env.PORT || 1337;
	var express = require('express');
	var hbs = require('hbs');
        var passport = require('passport');
        var GithubStrategy = require('passport-github').Strategy;
	var cookie = require('cookie-parser');
	var session = require('express-session');

	var app = express();
	app.set('view engine', 'html');
	app.engine('html', hbs.__express);
	app.use(express.static('static'));
        app.use(cookie());
        app.use(session({secret: 'put-here-super-secret-secret'}));
        app.use(passport.initialize());
        app.use(passport.session());

        passport.use(new GithubStrategy({
          clientID: 'put-here-client-id',
          clientSecret: 'put-here-super-secret-secret',
          callbackURL: 'http://localhost:1337/github-callback'
        }, function(accessToken, refreshToken, profile, done){
          done(null, {
            accessToken: accessToken,
            profile: profile
          });
        }));

        passport.serializeUser(function(user, done) {
          // for the time being tou can serialize the user 
          // object {accessToken: accessToken, profile: profile }
          // In the real app you might be storing on the id like user.profile.id 
          done(null, user);
        });

        passport.deserializeUser(function(user, done) {
          // If you are storing the whole user on session we can just pass to the done method, 
          // But if you are storing the user id you need to query your db and get the user 
          //object and pass to done() 
          done(null, user);
        });

	app.use(function(req, res, next) {
		logger.info("Request for " + req.path);
		next();
	});

	app.get('/', function(req, res, next) {
		if(req.user)
		{
		  console.log(req.user.profile.username);
		}
		mongo.collection('posts').find({}, { title: 1, uri: 1, publishDate: 1 }).sort({ publishDate: -1 }).toArray(function(err, items) {
			if (err) {
				var error = new Error("Could not retrieve posts");
				error.statusCode = 500;
				return next(error);
			}
			res.render('index.html', { posts: items.map(function(i) { return { title: i.title, uri: i.uri, date: i.publishDate }; }) });
		});
	});

	app.get('/github-login', passport.authenticate('github'));
	app.get('/github-error', function(req, res){ res.send('Login error'); });
	app.get('/github-callback',
	  passport.authenticate('github', {failureRedirect: '/github-error'}),
	  function(req, res){ res.redirect('/'); }
	);

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
		if(!err.statusCode)
			err.statusCode = 500;
		res.status(err.statusCode);
		res.render('error.html', { title: err.message, errorCode: err.statusCode });
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
