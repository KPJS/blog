var assert = require('assert');

var fakeLogger = { error: function() {}, info: function() {} };
var fakePosts = [{ title: "first", content: "first content" }, { title: "second", content: "second content" }];
var fakeMongo = { collection: function(){
	return {
		toArray: function(callback){
			return callback(null, fakePosts);
		},
		findOne: function(query, projection, callback){
			return callback(null, fakePosts[0]);
		},
		find: function() { return this; },
		sort: function() { return this; }
	};
} };
var fakeAuth = { setup: function(){}, ensureAuthenticated: function(req, res, next){ next(); } };
var fekePostsController = {
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
var server = require('../server')(fakeLogger, fakeMongo, fakeAuth, fekePostsController);

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

	it('Post call, 200 is returned', function(done) {
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

	it('Edit call - GET, 200 is returned', function(done) {
		server.start(function(err, addr) {
			var http = require('http');

			http.get('http://localhost:' + addr.port + "/edit/qwerty", function(res) {
				assert.equal(res.statusCode, 200);
				done();
			});
		});
	});

	it('Edit call NO AUTH - GET, 401 is returned', function(done) {
		var fakeAuth2 = { setup: function(){}, ensureAuthenticated: function(req, res, next){ var e = new Error("err"); e.statusCode = 401; next(e); } };
		var server2 = require('../server')(fakeLogger, fakeMongo, fakeAuth2, fekePostsController);
		server2.start(function(err, addr) {
			var http = require('http');
			fakeAuth.ensureAuthenticated = function(req, res, next){ next(new Error("bad")); };
			http.get('http://localhost:' + addr.port + "/edit/qwerty", function(res) {
				assert.equal(res.statusCode, 401);
				server2.stop();
				done();
			});
		});
	});
});
