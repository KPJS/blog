var winston = require('winston');

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

var server = require("./server")(logger);

var startCallback = function(err, url) {
		if (!err) {
			console.log('Server running on '+ url);
		} else {
			console.log('Zle je');
		}
	};

server.start(startCallback);