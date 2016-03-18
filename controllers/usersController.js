module.exports = function(mongo) {
  if(!mongo) {
    throw "Missing mongo";
  }

  var permissionFlags = {
    read: 1, //0001, default
    write: 2,//0010
    admin: 4 //0100
  };

  return {
    getAllUsersRouteHandler: getAllUsersRouteHandler,
    getUserDetailRouteHandler: getUserDetailRouteHandler,
    postUserDetailRouteHandler: postUserDetailRouteHandler
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
      res.render('userDetail.html', { user: req.user, userDetail: toViewModel(item) });
    });
  }

  function toViewModel(dbRecord) {
    return {
      id: dbRecord._id,
      name: dbRecord.name,
      provider: dbRecord.provider,
      providerId: dbRecord.providerId,
      permissions: {
        read: dbRecord.permissionsMask & permissionFlags.read,
        write: dbRecord.permissionsMask & permissionFlags.write,
        admin: dbRecord.permissionsMask & permissionFlags.admin
      }
    };
  }

  function postUserDetailRouteHandler(req, res, next) {
    var ObjectID = require('mongodb').ObjectID;
    mongo.collection('users').findAndModify({ _id: new ObjectID(req.params.id) }, [], { $set: { permissionsMask: toMask(req.body.permissions) } }, { new: true },
      function(err, item){
        if(err){ return next(err); }
        res.render('userDetail.html', { user: req.user, userDetail: toViewModel(item.value) });
      });
  }

  function toMask(permissions){
    if(!Array.isArray(permissions)){//only single permission
      return permissionFlags[permissions];
    }
    var mask = 0;
    permissions.forEach(function(item){
      mask |= permissionFlags[item];
    });
    return mask;
  }
};
