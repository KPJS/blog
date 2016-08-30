var assert = require('assert');
var http = require('http');

var fakeLogger = { error: function() {}, info: function() {} };
var fakeAuth = {
	setup: function() {},
	ensureZombie: function(req, res, next) { next(); },
	ensureCitizen: function(req, res, next) { next(); },
	ensureRuler: function(req, res, next) { next(); },
	ensureRulerOrOwner: function(req, res, next) { next(); },
	ensureRulerOrMyself: function(req, res, next) { next(); } };
var fakePostsController = {
	getRootRouteHandler: function(req, res) {
		res.end("root - GET");
	},
	getReadRouteHandler: function(req, res) {
		res.end("read post - GET");
	},
	deletePostRouteHandler: function(req, res){
		res.end("deleting post");
	},
	getEditRouteHandler: function(req, res){
		res.end("edit post - GET");
	},
	postEditRouteHandler: function(req, res) {
		res.end("edit post - POST");
	},
	getCreateRouteHandler: function(req, res) {
		res.end("create post - GET");
	},
	postCreateRouteHandler: function(req, res) {
		res.end("create post - POST");
	},
	getPostsRouteHandler: function(req, res) {
		res.end("all posts - GET");
	},
	aboutRouteHandler: function(req, res) {
		res.end("about - GET");
	},
	contactRouteHandler: function(req, res) {
		res.end("contact - GET");
	},
	getMyPostsRouteHandler: function(req, res) {
		res.end("my posts - GET");
	}
};
var fakeUsersController = {
	getAllUsersRouteHandler: function(req, res) {
		res.end("User list - GET");
	},
	getUserRouteHandler: function(req, res) {
		res.end("read user - GET");
	},
	postUserRouteHandler: function(req, res) {
		res.end("edit user - POST");
	}
};
var fakeImageUploadController = {
	uploadImageRouteHandler: function(req, res) {
		res.end("upload image - POST");
	}
};

var fakeScheduler = { start: function() {} };

describe('Server initialization tests', function() {
	var server = require('../server')(fakeLogger, fakeAuth, fakePostsController, fakeUsersController, fakeImageUploadController, fakeScheduler);

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

	it('Server can be stopped multiple times', function(done) {
		server.start(function(err) {
			server.stop();
			server.stop();
			assert.equal(err, null, 'There should be no error');
			done();
		});
	});
});

describe('Route authorization tests [successfull auth]', function() {
	var server = require('../server')(fakeLogger, fakeAuth, fakePostsController, fakeUsersController, fakeImageUploadController, fakeScheduler);

	afterEach(function() { server.stop(); });

	it('GET root call - 200 is returned', function(done) {
		server.start(function(err, addr) {
			http.get('http://localhost:' + addr.port, function(res) {
				assert.equal(res.statusCode, 200);
				done();
			});
		});
	});

	it('GET post call - 200 is returned', function(done) {
		server.start(function(err, addr) {
			http.get('http://localhost:' + addr.port + "/posts/qwerty", function(res) {
				assert.equal(res.statusCode, 200);
				done();
			});
		});
	});

	it('GET edit post call - 200 is returned', function(done) {
		server.start(function(err, addr) {
			http.get('http://localhost:' + addr.port + "/edit/qwerty", function(res) {
				assert.equal(res.statusCode, 200);
				done();
			});
		});
	});

	it('GET create post call - 200 is returned', function(done) {
		server.start(function(err, addr) {
			http.get('http://localhost:' + addr.port + "/create", function(res) {
				assert.equal(res.statusCode, 200);
				done();
			});
		});
	});

	it('GET users list call - 200 is returned', function(done) {
		server.start(function(err, addr) {
			http.get('http://localhost:' + addr.port + "/users", function(res) {
				assert.equal(res.statusCode, 200);
				done();
			});
		});
	});

	it('GET user detail call - 200 is returned', function(done) {
		server.start(function(err, addr) {
			http.get('http://localhost:' + addr.port + "/users/someUser", function(res) {
				assert.equal(res.statusCode, 200);
				done();
			});
		});
	});

	it('POST image - 200 is returned', function(done) {
		server.start(function(err, addr) {
			var options = {
				hostname: 'localhost',
				port: addr.port,
				path: '/uploadImage',
				method: 'POST'
			};
			http.request(options, function(res) {
				assert.equal(res.statusCode, 200);
				done();
			}).end();
		});
	});
});

describe('Route authorization tests [failed auth]', function() {
	var fakeAuth2 = {
		setup: function(){},
		ensureZombie: function(req, res, next){ var e = new Error("err"); e.statusCode = 401; next(e); },
		ensureCitizen: function(req, res, next){ var e = new Error("err"); e.statusCode = 401; next(e); },
		ensureRuler: function(req, res, next){ var e = new Error("err"); e.statusCode = 401; next(e); },
		ensureRulerOrOwner: function(req, res, next){ var e = new Error("err"); e.statusCode = 401; next(e); },
		ensureRulerOrMyself: function(req, res, next){ var e = new Error("err"); e.statusCode = 401; next(e); }
	};
	var server = require('../server')(fakeLogger, fakeAuth2, fakePostsController, fakeUsersController, fakeImageUploadController, fakeScheduler);

	afterEach(function() { server.stop(); });

	it('GET root call [not auth] - 200 is returned', function(done) {
		server.start(function(err, addr) {
			http.get('http://localhost:' + addr.port, function(res) {
				assert.equal(res.statusCode, 200);
				done();
			});
		});
	});

	it('GET post call [not auth] - 200 is returned', function(done) {
		server.start(function(err, addr) {
			http.get('http://localhost:' + addr.port + "/posts/qwerty", function(res) {
				assert.equal(res.statusCode, 200);
				done();
			});
		});
	});

	it('GET edit post call [not ruler|owner] - 401 is returned', function(done) {
		server.start(function(err, addr) {
			http.get('http://localhost:' + addr.port + "/edit/qwerty", function(res) {
				assert.equal(res.statusCode, 401);
				done();
			});
		});
	});

	it('GET create post call [not citizen] - 401 is returned', function(done) {
		server.start(function(err, addr) {
			http.get('http://localhost:' + addr.port + "/edit/qwerty", function(res) {
				assert.equal(res.statusCode, 401);
				done();
			});
		});
	});

	it('GET users list call [not ruler] - 401 is returned', function(done) {
		server.start(function(err, addr) {
			http.get('http://localhost:' + addr.port + "/users", function(res) {
				assert.equal(res.statusCode, 401);
				done();
			});
		});
	});

	it('GET user detail call [not ruler] - 401 is returned', function(done) {
		server.start(function(err, addr) {
			http.get('http://localhost:' + addr.port + "/users/someUser", function(res) {
				assert.equal(res.statusCode, 401);
				done();
			});
		});
	});

	it('POST image [not ruler|owner] - 401 is returned', function(done) {
		server.start(function(err, addr) {
			var options = {
				hostname: 'localhost',
				port: addr.port,
				path: '/uploadImage',
				method: 'POST'
			};
			http.request(options, function(res) {
				assert.equal(res.statusCode, 401);
				done();
			}).end();
		});
	});
});
