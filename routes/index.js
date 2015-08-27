var express = require('express');
var router = express.Router();
var fs = require('fs');

/* GET home page. */
router.get('/', function(req, res, next) {
  readDirectories('posts', function(posts) {
    res.render('index', { posts: posts });
  });
});

function readDirectories(path, callback) {
  fs.readdir(path, function(err, files) {
    if(err)
      console.log(err);

    callback(files);
  });
}

module.exports = router;
