module.exports = function(mongo) {
  if(!mongo) {
		throw "Missing mongo";
	}

  return {
    getEditRouteHandler: getEditRouteHandler,
    postEditGetRouteHandler: postEditGetRouteHandler,
    getCreateRouteHandler: getCreateRouteHandler,
    postCreateRouteHandler: postCreateRouteHandler
  };

  function getEditRouteHandler(req, res, next) {
    mongo.collection('posts').findOne({ uri: req.params.uri }, { title: 1, content: 1 }, function(err, item) {
			if (err) {
				var error = new Error("Post not found");
				error.statusCode = 404;
				return next(error);
			}
			res.render('editPost.html', { user: req.user, title: item.title, content: item.content });
		});
  }

  function postEditGetRouteHandler(req, res, next) {
    mongo.collection('posts').findAndModify({ uri: req.params.uri }, [], { $set: { title: req.body.title, content: req.body.content } }, { new: true },
      function(err){
        if(err){ return next(err); }
        res.redirect('/posts/' + req.params.uri);
      });
  }

  function getCreateRouteHandler(req, res) {
    res.render('create.html', {});
  }

  function postCreateRouteHandler(req, res) {
    var url = req.body.url;
    var title = req.body.title;
    var content = req.body.content;
    var ObjectID = require('mongodb').ObjectID;
    if(!url){
      url = title.replace(/\s+/g, '-');
    }
    mongo.collection('posts').count({ uri: url }, function(err, count) {
      if(count > 0){
        res.render('create.html', { post: { url: url, title: title, content: content, exists: true } });
      } else {
        mongo.collection('posts').insert([{ title: title, uri: url, content: content, user_id: new ObjectID(req.user.id), publishDate: new Date() }], function(err, result){
          res.redirect('/posts/' + url);
        });
      }
    });
  }
};
