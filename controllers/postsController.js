'use strict';

var fs = require('fs');

module.exports.index = function(req, res) {
		
	fs.readdir("./static/posts", function (err, files) {  
 	if (!err)  
		res.render('posts/index', {posts:files});	
 	else 
 		throw err;  
 	}); 
};

module.exports.post = function(req, res) {
	fs.readFile("./static/posts/" + req.params.filename, function(err, content) {
	if (!err)  
		res.render('posts/page', {body:content});
 	else 
 		throw err;  
	});
};