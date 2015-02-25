var http = require("http");
var handler = require('./request-handler.js');
var urlParser = require('url');
var utils = require('./utils');

var port = 3000;
var ip = "127.0.0.1";

var routes = {
  '/classes/messages': handler,
  '/': handler
};

var server = http.createServer(function(request, response) {
  var parts = urlParser.parse(request.url);
  var route = routes[parts.pathname];
  if (route) {
    route(request, response);
  } else {
    utils.sendResponse(response, 'NOT FOUND', 404);
  }
});
console.log("Listening on http://" + ip + ":" + port);
server.listen(port, ip);


