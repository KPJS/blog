module.exports = function(mongo) {
  if(!mongo) {
		throw "Missing mongo";
	}
	
	return {
    getAllUsersRouteHandler: getAllUsersRouteHandler,
    getUserRouteHandler: getUserRouteHandler
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
		mongo.collection('users').findOne({ _id: new ObjectID(req.params.id) }, { name: 1, provider: 1, _id: 1}, function(err, item){
			if(err){
				var error = new Error("User not found");
				error.statusCode = 404;
				return next(error);
			}
			res.render('userDetail.html', { user: req.user, userName: item.name, userProvider: item.provider, userRank: 1, userId: item._id });
		})
	}
};
