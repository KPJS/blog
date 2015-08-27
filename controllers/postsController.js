'use strict';

var fs = require('fs');

module.exports.index = function(req, res) {
		
	fs.readdir("./static", function (err, files) {  
 	if (!err)  
		res.render('posts/index', {posts:files});	
 	else 
 		throw err;  
 	}); 
};