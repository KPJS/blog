var assert = require('assert');
var dummyLogger = {error: function() {}, info: function() {}};
var server = require('../server')(dummyLogger);

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
		server.start(function(err, url) {
			var http = require('http');
			
			http.get('http://' + url, function(res) {
				assert.equal(res.statusCode, 200);
				done();
			});
			
		});
	});
});