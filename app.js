var winston = require('winston');
var mongoClient = require('mongodb').MongoClient;

var mongoConnStr = process.env.CUSTOMCONNSTR_MONGOLABS_BLOG || "mongodb://localhost:27017/blog";
mongoClient.connect(mongoConnStr, function(err, db) {
    if(err) {
      console.log('Failed to connect to mongo');
      process.exit(1);
    }
    else {
      console.log('Connected to mongo, setting up server...');
      var server = require("./server")(logger, db);
      server.start(startCallback);
    }
});

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
    level: 'error'
    })
]
});

var startCallback = function(err, addr) {
		if (!err) {
			console.log('Server running on %j', addr);
		} else {
			console.log('Zle je');
		}
	};
