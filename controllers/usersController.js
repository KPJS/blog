module.exports = function(mongo) {
  if(!mongo) {
    throw "Missing mongo";
  }

  return {
    getAllUsersRouteHandler: getAllUsersRouteHandler,
    getUserDetailRouteHandler: getUserDetailRouteHandler
  };

  function getAllUsersRouteHandler(req, res, next) {
    mongo.collection('users').find({ }, { name: 1, provider: 1, _id: 1 }).toArray(function(err, items) {
      if (err) {
        var error = new Error("Failed to get users");
        error.statusCode = 500;
        return next(error);
      }
      res.render('users.html', { user: req.user, users: items });
    });
  }

  function getUserDetailRouteHandler(req, res, next) {
    var ObjectID = require('mongodb').ObjectID;
    mongo.collection('users').findOne({ _id: new ObjectID(req.params.id) }, function(err, item) {
      if (err) {
        var error = new Error("User not found");
        error.statusCode = 404;
        return next(error);
      }
      res.render('userDetail.html', { user: req.user, userDetail: item });
    });
  }
};
