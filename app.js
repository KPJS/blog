var port = process.env.PORT || 1337;

var express = require('express');
var hbs = require('hbs');
var fs = require('fs');

var app = express();
app.set('view engine', 'html');
app.engine('html', hbs.__express);
app.use(express.static('static'));

app.get('/', function(req, res) {
    fs.readdir('posts', function(err, files){
        res.render('index.html', { posts: files });
    });
});
app.get('/posts/:file', function(req, res) {
    fs.readFile('posts/'+ req.params.file, function(err, content){
        res.render('post.html', {title: req.params.file, content: content });
    });
});

app.listen(port);
console.log('Server running on '+ port);
