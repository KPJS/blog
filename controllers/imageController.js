module.exports = function(mongo) {
	if (!mongo) {
		throw 'Missing mongo';
	}

	var ObjectID = require('mongodb').ObjectID;

	return {
		uploadImageRouteHandler: uploadImageRouteHandler,
		getTempImageRouteHandler: getTempImageRouteHandler,
		getPostImageRouteHandler: getPostImageRouteHandler
	};

	function uploadImageRouteHandler(req, res) {
		var requestContainsFile = false;
		req.busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
			if(requestContainsFile) {
				return; // only one file pre request processed
			}
			requestContainsFile = true;

			var data = [];
			file.on('data', function(chunk) {
				data.push(chunk);
			});
			file.on('end', function() {
				var buffer = Buffer.concat(data);
				mongo.collection('tempImages').insertOne({
					imageData: buffer.toString('base64'),
					filename: filename,
					created: Date.now(),
					mimetype: mimetype }, function(err, item) {
					if(err) {
						res.json({ uploaded: 0, error: err });
					}
					res.json({ uploaded: 1, fileName: filename, url: '/tempImages/' + item.insertedId });
				});
			});
			file.on('error', function(err) {
				res.json({ uploaded: 0, error: err });
			});
		});
		req.pipe(req.busboy);
	}

	function getTempImageRouteHandler(req, res, next) {
		mongo.collection('tempImages').findOne({ _id: new ObjectID(req.params.id) }, function(err, item) {
			if (err) {
				return next(err);
			}
			if (!item) {
				var error = new Error('Image not found');
				error.statusCode = 404;
				return next(error);
			}
			res.type(item.mimetype);
			res.end(item.imageData, 'base64');
		});
	}

	function getPostImageRouteHandler(req, res, next) {
		mongo.collection('posts').findOne({ uri: req.params.uri, 'images._id': new ObjectID(req.params.id) }, { 'images.$': 1 }, function(err, item) {
			if (err) {
				return next(err);
			}
			if (!item) {
				var error = new Error('Image not found');
				error.statusCode = 404;
				return next(error);
			}
			res.type(item.images[0].mimetype);
			res.end(item.images[0].imageData, 'base64');
		});
	}
};

