module.exports = {
	uploadImageRouteHandler: function(req, res) {
		var fs = require('fs');
		var requestContainsFile = false;
		req.busboy.on('file', function(fieldname, file, filename) {
			requestContainsFile = true;
			var fstream = fs.createWriteStream(__dirname + '/../static/uploads/' + filename);
			file.pipe(fstream);
			fstream.on('close', function() {
				res.json({ uploaded: 1, fileName: filename, url: '/uploads/' + filename });
			});
			fstream.on('error', function(err) {
				res.json({ uploaded: 0, error: err });
			});
		});
		req.busboy.on('finish', function() {
			if(!requestContainsFile) {
				res.writeHead(400, { 'Connection': 'close' });
				res.end('No file in request');
			}
		});
		req.pipe(req.busboy);
	}
};
