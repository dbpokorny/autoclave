var https = require('https');
var fs = require('fs');

var options = {
  key: fs.readFileSync('/home/dbp/ssl/server/my-server.key.pem'),
  cert: fs.readFileSync('/home/dbp/ssl/server/my-server.crt.pem')
};

https.createServer(options, function (req, res) {
    console.log(Object.keys(res))
    res.writeHead(200 {'Content-Type': 'text/html'});
    res.end(
        '<html><head></head><body>hello world, <b>how are you?</b>' +
        '</body></html>');
    console.log("hello!\n");
}).listen(8443);
console.log("server running\n");
