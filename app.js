var port = process.env.PORT || 1337;
var http = require('http');
var fs = require('fs');
var hbs = require('hbs');
var express = require('express');

var app = express();
app.engine('html', hbs.__express);
app.set('view engine', 'html');
app.use(express.static('static'));

app.get('/', function (req, res) {
    res.setHeader('Content-Type', 'text/html; charset=UTF-8');
    res.setHeader('Content-Language', 'sk');
    
    fs.readdir('blogs', function (err, files) {
        if (!err) {
            res.render('index.html', { blogs: files });
        } else {
            res.status(500).send('Ultimate failure');
        }
    });
});

app.get('/blogs/:filename', function (req, res) {
    res.setHeader('Content-Type', 'text/html; charset=UTF-8');
    res.setHeader('Content-Language', 'sk');
    
    fs.readFile('blogs/' + req.params.filename, function (err, file) {
        if (!err) {
            res.render('blog.html', { body: file, title: req.params.filename });
        } else {
            res.status(404).send('Blog not found');
        }
    });
});

app.listen(port);
console.log('Server running on ' + port);

