var RRhttps = require('https');
var RRfs = require('fs');

var FFloadFile = function FFloadFile(PVfilename, PVk) {
    RRfs.readFile(PVfilename, function (PVerr, PVdata) {
        if (PVerr) {
            console.log("error reading " + PVfilename);
            return;
        }
        return PVk(PVdata);
    });
};

var GVoptions = {};

var GVget = {
    "/" :["static", "text/html",
"<!doctype html><html>" +
    "<head>" + 
'<script type="application/javascript" src="/jquery-2.1.4.min.js"></script>' +
"<style>" +
    "body {" +
	"background: #87e0fd;" +
	"background: -moz-linear-gradient(left,  #87e0fd 0%, #53cbf1 40%, #05abe0 100%);" +
	"background: -webkit-linear-gradient(left,  #87e0fd 0%,#53cbf1 40%,#05abe0 100%);" +
	"background: linear-gradient(to right,  #87e0fd 0%,#53cbf1 40%,#05abe0 100%);" +
	"filter: progid:DXImageTransform.Microsoft.gradient( startColorstr='#87e0fd', endColorstr='#05abe0',GradientType=1 );" +
        "}" +
    "div { color:#00008b; text-align: center; font-family : sans-serif; font-weight: light; font-size: 1em; }" +
"</style>" +
"</head>" +
    '<body>' +
'<div>' +
'<img src="/logo.png" />' +
'</div>' +
'<div>autoclave.io</div>' +
    "</body>" +
"</html>"]
};

var FFserverReady = function FFserverReady() {
    if ('key' in GVoptions && 'cert' in GVoptions) {
        RRhttps.createServer(GVoptions, function (PVrequest, PVresponse) {
            // console.log(Object.keys(PVresponse))
            console.log(PVrequest.method + " " + PVrequest.url);
            var LVurl = PVrequest.url;
            if (GVget.hasOwnProperty(LVurl)) {
                var LVservice = GVget[LVurl];
                if (LVservice[0] == "static") {
                    // ["static", "text/plain", "Hello, world!"]
                    PVresponse.writeHead(200, {"Content-Type": LVservice[1]});
                    PVresponse.end(LVservice[2]);
                    return;
                }
            } else {
                // console.log(PVrequest);
                PVresponse.writeHead(404, {"Content-Type": "text/plain"});
                PVresponse.end("404 error");
            }
        }).listen(8443);
        console.log("https server running");
    }
};

FFloadFile('/home/dbp/ssl/server/my-server.key.pem', function (PVx) {
    GVoptions.key = PVx; FFserverReady(); });
FFloadFile('/home/dbp/ssl/server/my-server.crt.pem', function (PVx) {
    GVoptions.cert = PVx; FFserverReady(); });
FFloadFile('client/favicon.ico', function (PVx) {
    GVget["/favicon.ico"] = ["static", "image/x-icon", PVx]; });
FFloadFile('client/prod/jquery-2.1.4.min.js', function (PVx) {
    GVget["/jquery-2.1.4.min.js"] = ["static", "application/javascript", PVx]; });
FFloadFile('client/logo.png', function (PVx) {
    GVget["/logo.png"] = ["static", "image/png", PVx]; });
