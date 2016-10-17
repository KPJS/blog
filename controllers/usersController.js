module.exports = function(mongo) {
	if (!mongo) {
		throw 'Missing mongo';
	}

	return {
		getAllUsersRouteHandler: getAllUsersRouteHandler,
		getUserRouteHandler: getUserRouteHandler,
		postUserRouteHandler: postUserRouteHandler
	};

	function getAllUsersRouteHandler(req, res, next) {
		mongo.collection('users').find({}, { name: 1, provider: 1, _id: 1 }).toArray(function(err, items) {
			if (err) {
				return next(err);
			}
			res.format({
				html: function() {
					res.render('users.html', { users: items, title: 'Users' });
				},
				json: function() {
					res.json({ users: items });
				}
			});
		});
	}

	function getUserRouteHandler(req, res, next) {
		var ObjectID = require('mongodb').ObjectID;
		mongo.collection('users').findOne({ _id: new ObjectID(req.params.userId) }, { name: 1, provider: 1, _id: 1, role: 1, userComment: 1 }, function(err, item) {
			if (err) {
				return next(err);
			}
			if (!item) {
				var error = new Error('User not found');
				error.statusCode = 404;
				return next(error);
			}
			res.format({
				html: function() {
					res.render('userDetail.html', { userName: item.name, userProvider: item.provider, role: item.role, userId: item._id, title: 'User detail', comment: item.userComment });
				},
				json: function() {
					res.json({ userName: item.name, userProvider: item.provider, role: item.role, userId: item._id, comment: item.userComment });
				}
			});
		});
	}

	function postUserRouteHandler(req, res, next) {
		var ObjectID = require('mongodb').ObjectID;
		var update = req.user.isRuler ? { role: req.body.role, userComment: req.body.comment } : { userComment: req.body.comment };
		mongo.collection('users').findOneAndUpdate({ _id: new ObjectID(req.params.userId) }, { $set: update }, { returnOriginal: false }, function(err, item) {
			if (err) {
				return next(err);
			}
			if (!item.value) {
				var error = new Error('User not found');
				error.statusCode = 404;
				return next(error);
			}
			res.format({
				html: function() {
					res.render('userDetail.html', { userName: item.value.name, userProvider: item.value.provider, role: item.value.role, userId: item.value._id, title: 'User detail', comment: req.body.comment });
				},
				json: function() {
					res.json({ userName: item.value.name, userProvider: item.value.provider, role: item.value.role, userId: item.value._id, comment: req.body.comment });
				}
			});
		});
	}
};
