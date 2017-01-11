module.exports = function(mongo) {
	if (!mongo) {
		throw 'Missing mongo';
	}

	return {
		getRootRouteHandler: getRootRouteHandler,
		aboutRouteHandler: aboutRouteHandler,
		contactRouteHandler: contactRouteHandler
	};

	function aboutRouteHandler(req, res) {
		res.render('about.html', { title: 'About Us' });
	}

	function contactRouteHandler(req, res) {
		res.render('contact.html', { title: 'Contact' });
	}

	function getRootRouteHandler(req, res, next) {
		mongo.collection('posts').find({}, { title: 1, uri: 1, publishDate: 1, content: 1 }).sort({ publishDate: -1 }).limit(1).toArray(function(err, items) {
			if (err) {
				return next(err);
			}
			var model = { title: items[0].title, perex: items[0].content.replace(/(<([^>]+)>)/ig, '').substring(0, 200) + '...', uri: items[0].uri };
			res.format({
				html: function() {
					res.render('index.html', model);
				},
				json: function() {
					res.json(model);
				}
			});
		});
	}
};
