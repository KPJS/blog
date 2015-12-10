module.exports = function(mongo) {
  if(!mongo) {
		throw "Missing mongo";
	}

  return {
    getEditRouteHandler: getEditRouteHandler,
    postEditGetRouteHandler: postEditGetRouteHandler,
    getCreateRouteHandler: getCreateRouteHandler,
    postCreateRouteHandler: postCreateRouteHandler
  };

  function getEditRouteHandler(req, res) {}// jshint ignore:line
  function postEditGetRouteHandler(req, res) {}// jshint ignore:line
  function getCreateRouteHandler(req, res) {}// jshint ignore:line
  function postCreateRouteHandler(req, res) {}// jshint ignore:line
};
