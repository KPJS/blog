var port = process.env.PORT || 1337;

var express = require('express');
var hbs = require('hbs');
var fs = require('fs');
var winston = require('winston');

var logger = new (winston.Logger)({
  transports: [
    new (winston.transports.File)({
      name: 'info-file',
      filename: 'requests.log',
      level: 'info'
    }),
    new (winston.transports.File)({
      name: 'error-file',
      filename: 'error.log',
      level: 'error'
    })
  ]
});

var app = express();
app.set('view engine', 'html');
app.engine('html', hbs.__express);
app.use(express.static('static'));

app.use(function(req, res, next) {
    logger.info("Request for " + req.path);    
    next();
});

app.get('/', function(req, res) {
    fs.readdir('posts', function(err, files){
        res.render('index.html', { posts: files });
    });
});
app.get('/posts/:file', function(req, res, next) {
    fs.readFile('posts/'+ req.params.file, function(err, content){
        if (err) {
            var error = new Error("Post not found");
            error.statusCode = 404; 
            return next(error);
        }
                
        res.render('post.html', {title: req.params.file, content: content });        
    });
});
app.use(function(req, res, next) {
    var error = new Error("Page not found");
    error.statusCode = 404;
    next(error);
});
app.use(function(err, req, res, next) {
    logger.error("Error: " + err.message, { path: req.path, stackTrace: err.stack });
    res.status(err.statusCode);
    res.render('error.html', { title: err.message, errorCode: err.statusCode });
});

app.listen(port, function(err) {    
    if (!err) {
        console.log('Server running on '+ port);
    } else {
        console.log('Zle je');
    }
});

