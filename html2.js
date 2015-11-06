var https = require('https');
var fs = require('fs');

var options = {
  key: fs.readFileSync('/home/dbp/ssl/server/my-server.key.pem'),
  cert: fs.readFileSync('/home/dbp/ssl/server/my-server.crt.pem')
};

https.createServer(options, function (req, res) {
  res.writeHead(200);
  res.end("hello world\n");
  console.log("hello!\n");
}).listen(8443);
console.log("server running\n");
