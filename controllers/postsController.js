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

  function getEditRouteHandler(req, res) {}// jshint ignore:line
  function postEditGetRouteHandler(req, res) {}// jshint ignore:line
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
