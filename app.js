'use strict';

var express = require('express');
var http = require('http');
var path = require('path');
var handlebars = require('hbs');
var app = express();
require('./router')(app);

app.set('port', 3000);

app.engine('handlebars', handlebars.__express);
app.set('view engine', 'handlebars');

app.use(express.static(path.join(__dirname, 'static')));

http.createServer(app).listen(app.get('port'), function() {
	console.log('KPJS blog server listening on port ' + app.get('port'));
});