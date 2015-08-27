var express = require('express');
var fs = require('fs');
var router = express.Router();

/* GET specific post */
router.get('/:fileName', function(req, res, next) {
  readFile(req.params.fileName, function(content) {
    res.render('post', { 'content': content });
    next();
  }, function(){
    res.status(404).send('Post not found');
    next();
  });
});

function readFile(path, callback, fallback) {
  fs.readFile('./posts/' + path, function(err, content) {
    if(err)
      fallback();
    else
      callback(content);
  });
}

module.exports = router;
