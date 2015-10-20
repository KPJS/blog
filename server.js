function start(startCallback, logger) {
	var port = process.env.PORT || 1337;

	var express = require('express');
	var hbs = require('hbs');
	var fs = require('fs');

	var app = express();
	app.set('view engine', 'html');
	app.engine('html', hbs.__express);
	app.use(express.static('static'));

	app.use(function(req, res, next) {
		logger.info("Request for " + req.path);
		next();
	});

	app.get('/', function(req, res) {
		fs.readdir('posts', function(err, files){
			res.render('index.html', { posts: files });
		});
	});
	app.get('/posts/:file', function(req, res, next) {
		fs.readFile('posts/' + req.params.file, function(err, content){
			if (err) {
				var error = new Error("Post not found");
				error.statusCode = 404;
				return next(error);
			}
			res.render('post.html', { title: req.params.file, content: content });
		});
	});

	app.use(function(req, res, next) {
		var error = new Error("Page not found");
		error.statusCode = 404;
		next(error);
	});
	app.use(function(err, req, res, next) {
		logger.error("Error: " + err.message, { path: req.path, stackTrace: err.stack });
		res.status(err.statusCode);
		res.render('error.html', { title: err.message, errorCode: err.statusCode });
	});

	var server = app.listen(port, function(err) {
		if (err) {
			logger.info('Server initialization failed');
		}
		else {
			logger.info('Server listening');
		}
		startCallback(err, server);
	});
}

function stop(server, logger) {
	if (server) {
		server.close();
		server = null;
		logger.info('Server stopped');
	}
}

module.exports = function(logger) {
	var server;

	return {
		start: function(startCallback) {
			start(function(err, srv) {
				if (err) {
					return startCallback(err);
				}
				server = srv;
				startCallback(null, server.address());
			}, logger);
		},
		stop: function() { stop(server, logger); }
	};
};
