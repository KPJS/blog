'use strict';

var postsController = require('./controllers/postsController');

module.exports = function(app) {
	app.get('/', postsController.index);
	app.get('/posts/:filename', postsController.post);
};