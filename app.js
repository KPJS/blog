var port = process.env.PORT || 1337;
var http = require('http');
var templateStart = "<html><head><meta charset=\"UTF-8\"></head><body><div>";
var templateEnd = "</div></body></html>";
var fs = require('fs');
http.createServer(function (req, res) {
  if(/.png$/.test(req.url)) {
    res.writeHead(200, {'Content-Type': 'image/png'});
    readFile('.' + req.url, function(content) {
      res.end(content);
    });
  } else {
    res.writeHead(200, {'Content-Type': 'text/html'});
    readFile('1st-post.txt', function(content) {
      res.end(templateStart + content + templateEnd);
    });
  }
}).listen(port);
console.log('Server running on '+ port);

function readFile(path, callback) {
  fs.readFile(path, function(err, content) {
    if(err)
      console.log(err);
    callback(content);
  });
}
