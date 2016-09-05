module.exports = function() {
	return {
		start: function() {
			start();
		}
	};

	function start() {
		var schedule = require('node-schedule');
		var fs = require('fs');
		var i = 0;
		var job = schedule.scheduleJob('42 * * * * *', function() {
			fs.readdir(__rootDir + '/static/uploads', function(err, files) {
				files.map(function(file) {
					fs.stat(__rootDir + '/static/uploads/' + file, function(err, stats) {
						if ((Date.now() - stats.mtime) / 1000 / 60 / 60 / 24 > 30) {
							fs.unlink(__rootDir + '/static/uploads/' + file, function(err) {
								if(err) {
									console.error('unable to delete image ' + file);
								}
							});
						}
					});
				});
			});
		});
	}
};
