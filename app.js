var winston = require('winston');
var mongoClient = require('mongodb').MongoClient;
__rootDir = __dirname;

var mongoConnStr = process.env.CUSTOMCONNSTR_MONGOLABS_BLOG || 'mongodb://localhost:27017/blog';

var logger = new (winston.Logger)({
	transports: [
		new (winston.transports.File)({
			name: 'info-file',
			filename: 'requests.log',
			level: 'info'
		}),
		new (winston.transports.File)({
			name: 'error-file',
			filename: 'error.log',
			level: 'error',
			handleExceptions: process.env.NODE_ENV === 'production' ? true : false
		})
	]
});

var startCallback = function(err, addr) {
	if (err) {
		console.error('Failed to start server: %j', err);
		process.exit(1);
	} else {
		console.info('Server running on %j', addr);
	}
};

mongoClient.connect(mongoConnStr, function(err, db) {
	if(err) {
		console.error('Failed to connect to mongo: %j', err);
		process.exit(1);
	}
	else {
		console.info('Connected to mongo, starting server...');
		var authenticationController = require('./controllers/authenticationController')(db);
		var postsController = require('./controllers/postsController')(db);
		var usersController = require('./controllers/usersController')(db);
		var imageUploadController = require('./controllers/imageUploadController');
		var server = require('./server')(logger, authenticationController, postsController, usersController, imageUploadController);
		server.start(startCallback);
	}
});
