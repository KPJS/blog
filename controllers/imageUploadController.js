module.exports = {
	uploadImageRouteHandler: function(req, res) {
		var fs = require('fs');
		req.pipe(req.busboy);
		req.busboy.on('file', function(fieldname, file, filename) {
			var fstream = fs.createWriteStream(__dirname + '/../static/uploads/' + filename);
			file.pipe(fstream);
			fstream.on('close', function() {
				res.json({ uploaded: 1, fileName: filename, url: '/uploads/' + filename });
			});
			fstream.on('error', function(err) {
				res.json({ uploaded: 0, error: err });
			});
		});
	}
};
