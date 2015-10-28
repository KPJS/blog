var assert = require('assert');

var fakeLogger = { error: function() {}, info: function() {} };
var fakePosts = [{ title: "first", content: "first content" }, { title: "second", content: "second content" }];
var fakeMongo = { collection: function(){
	return {
		toArray: function(callback){
			return callback(null, fakePosts);
		},
		findOne: function(query, callback){
			return callback(null, fakePosts[0]);
		},
		find: function() { return this; },
		sort: function() { return this; }
	};
}};
var server = require('../server')(fakeLogger, fakeMongo);

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
});
