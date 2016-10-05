module.exports = function() {
	return {
		start: function() {
			start();
		}
	};

	function start() {
		var schedule = require('node-schedule');
		var fs = require('fs');
		var path = __rootDir + '/static/uploads';
		var job = schedule.scheduleJob('42 * * * * *', function() {
			fs.readdir(path, function(err, files) {
				if (!err) {
					files.map(function(file) {
						fs.stat(path + file, function(err, stats) {
							if ((Date.now() - stats.mtime) / 1000 / 60 / 60 / 24 > 30) {
								fs.unlink(path + file, function(err) {
									if (err) {
										console.error('unable to delete image ' + file);
									}
								});
							}
						});
					});
				}
			});
		});
	}
};
