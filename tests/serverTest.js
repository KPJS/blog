var assert = require('assert');

var fakeLogger = { error: function() {}, info: function() {} };
var fakeAuth = {
	setup: function(){},
	ensureOwner: function(req, res, next){ next(); },
	ensureZombie: function(req, res, next){ next(); },
	ensureCitizen: function(req, res, next){ next(); },
	ensureRuler: function(req, res, next){ next(); } };
var fakePostsController = {
	getRootRouteHandler: function(req, res){
		res.end("root - GET");
	},
	getReadRouteHandler: function(req, res){
		res.end("read post - GET");
	},
	getEditRouteHandler: function(req, res){
		res.end("edit post - GET");
	},
	postEditRouteHandler: function(req, res){
		res.end("edit post - POST");
	},
	getCreateRouteHandler: function(req, res){
		res.end("create post - GET");
	},
	postCreateRouteHandler: function(req, res){
		res.end("create post - POST");
	}
};
var fakeUsersController = {
    getAllUsersRouteHandler: function(req, res){
        res.end("User list - GET");
    },
		getUserRouteHandler: function(req, res){
			res.end("read user - GET");
		},
		postUserRouteHandler: function(req, res){
			res.end("edit user - POST");
		}
};
var server = require('../server')(fakeLogger, fakeAuth, fakePostsController, fakeUsersController);

describe('Server initialization', function() {
	afterEach(function() { server.stop(); });

	it('Server should be started', function(done) {
		server.start(function(err) {
			assert.equal(err, null, 'There should be no error');
			done();
		});
	});

	it('Server should be started again', function(done) {
		server.start(function(err) {
			assert.equal(err, null, 'There should be no error');
			done();
		});
	});

	it('Root call, 200 is returned', function(done) {
		server.start(function(err, addr) {
			var http = require('http');

			http.get('http://localhost:' + addr.port, function(res) {
				assert.equal(res.statusCode, 200);
				done();
			});
		});
	});

	it('Read post call, 200 is returned', function(done) {
		server.start(function(err, addr) {
			var http = require('http');

			http.get('http://localhost:' + addr.port + "/posts/qwerty", function(res) {
				assert.equal(res.statusCode, 200);
				done();
			});
		});
	});

	it('Server should be stopped', function(done) {
		server.start(function(err) {
			server.stop();
			server.stop();
			assert.equal(err, null, 'There should be no error');
			done();
		});
	});

	it('Edit post call - GET, 200 is returned', function(done) {
		server.start(function(err, addr) {
			var http = require('http');

			http.get('http://localhost:' + addr.port + "/edit/qwerty", function(res) {
				assert.equal(res.statusCode, 200);
				done();
			});
		});
	});

	it('Edit post call NO AUTH - GET, 401 is returned', function(done) {
		var fakeAuth2 = {
			setup: function(){},
			ensureOwner: function(req, res, next){ var e = new Error("err"); e.statusCode = 401; next(e); },
			ensureZombie: function(req, res, next){ var e = new Error("err"); e.statusCode = 401; next(e); },
			ensureCitizen: function(req, res, next){ next(); },
			ensureRuler: function(req, res, next){ next(); }
		};
		var server2 = require('../server')(fakeLogger, fakeAuth2, fakePostsController, fakeUsersController);
		server2.start(function(err, addr) {
			var http = require('http');
			http.get('http://localhost:' + addr.port + "/edit/qwerty", function(res) {
				assert.equal(res.statusCode, 401);
				server2.stop();
				done();
			});
		});
	});

	it('Get users list call - GET, 200 is returned', function(done) {
		server.start(function(err, addr) {
			var http = require('http');

			http.get('http://localhost:' + addr.port + "/users", function(res) {
				assert.equal(res.statusCode, 200);
				done();
			});
		});
	});
});
