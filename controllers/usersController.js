module.exports = function(mongo) {
  if(!mongo) {
		throw "Missing mongo";
	}
	
	return {
    getAllUsersRouteHandler: getAllUsersRouteHandler
  };
  
    function getAllUsersRouteHandler(req, res, next) {
    mongo.collection('users').find({ }, { name: 1 }).toArray(function(err, items) {
			if (err) {
				var error = new Error("Users not found");
				error.statusCode = 404;
				return next(error);
			}
			res.render('users.html', { user: req.user, users: items });
		});
  }
};
