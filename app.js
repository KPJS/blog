var port = process.env.PORT || 1337;

var express = require('express');
var hbs = require('hbs');
var fs = require('fs');

var app = express();
app.set('view engine', 'html');
app.engine('html', hbs.__express);
app.use(express.static('static'));

app.get('/', function(req, res) {
    fs.readdir('static/posts', function(err, files){
        res.render('index.html', { posts: files });
    });
});
app.listen(port);
console.log('Server running on '+ port);
