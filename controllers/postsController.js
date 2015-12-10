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

  function getCreateRouteHandler(req, res) {}// jshint ignore:line
  function postCreateRouteHandler(req, res) {}// jshint ignore:line
};
