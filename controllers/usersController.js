module.exports = function(mongo) {
  if(!mongo) {
		throw "Missing mongo";
	}
	
	return {
    getAllUsersRouteHandler: getAllUsersRouteHandler,
    getUserRouteHandler: getUserRouteHandler,
    postUserRouteHandler: postUserRouteHandler
  };
  
  function getAllUsersRouteHandler(req, res, next) {
    mongo.collection('users').find({ }, { name: 1, provider: 1, _id: 1 }).toArray(function(err, items) {
			if (err) {
				var error = new Error("Users not found");
				error.statusCode = 404;
				return next(error);
			}
			res.render('users.html', { user: req.user, users: items });
		});
  }

	function getUserRouteHandler(req, res, next) {
    var ObjectID = require('mongodb').ObjectID;
		mongo.collection('users').findOne({ _id: new ObjectID(req.params.id) }, { name: 1, provider: 1, _id: 1, type: 1 }, function(err, item){
			if(err){
				var error = new Error("User not found");
				error.statusCode = 404;
				return next(error);
			}
			res.render('userDetail.html', { user: req.user, userName: item.name, userProvider: item.provider, userRank: item.type, userId: item._id });
		});
	}

	function postUserRouteHandler(req, res, next) {
		var ObjectID = require('mongodb').ObjectID;
		mongo.collection('users').findOne({ _id: new ObjectID(req.params.id) }, { name: 1, provider: 1, _id: 1 }, function(err, item) {
			if(err){
				var error = new Error("User not found");
				error.statusCode = 404;
				return next(error);
			}
			mongo.collection('users').findAndModify({ _id: new ObjectID(req.params.id) }, [], { $set: { } }, { new: true }, function(err){
				if(err){ console.log(err); }
				// if(err) { return next(err); }
			});
			res.render('userDetail.html', { user: req.user, userName: item.name, userProvider: item.provider, userRank: req.body.type, userId: item._id });
		});
	}
};
