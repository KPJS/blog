'use strict';

var postsController = require('./controllers/postsController');

module.exports = function(app) {
	app.get('/', postsController.index);	
};