// Load the http module to create an http server.
var RRhttp = require('http');
var RRfs = require('fs');
var GVservices = {
    "/foo" : ["text/plain","<b>ee</b>"],
    "/infobox.js" : ["application/javascript",
"function FFinfoboxLog(PVm) {" +
    "var LVe = document.createElement('div');" +
    "LVe.innerHTML = PVm;" +
    "var LVinfobox = document.getElementById('IDinfobox');" +
    "LVinfobox.appendChild(LVe);" +
    "LVinfobox.scrollTop = LVinfobox.scrollHeight;" +
"};"],
    "/" :["text/html",
"<!doctype html><html><head>" + 
        '<script type="application/javascript" src="/infobox.js"></script>' +
    "<style>" +
        "body {background-color:#808080; color:white; font-family: Courier;}" +
        "h1 {color:red;}" +
        ".CLinfobox {" +
            "border:1px solid black;" +
            "background-color: lightblue;" +
            "width: 150px;" +
            "height: 150px;" +
            "overflow: scroll;" +
        "}" +
        ".hiFunction {color:#40ffff;}" +
        ".hiComment {color:#80a0ff;}" +
    "</style>" +
"</head>" +
'<body>' +
    "<h1>header</h1>" +
    '<div>' +
        '<span class="hiFunction" onclick="FFinfoboxLog(\'2\');">function</span>' +
        '() {' +
        '<div>&nbsp;&nbsp;&nbsp;&nbsp;foo</div>' +
        '}' +
    '</div>' +
    '<div><span class="hiComment">// this is a comment</span></div>' +
    "<p>Hello World</p>" +
    "<div>XXX</div>" +
    '<div id="foobar" foo="bar">foobar</div>' +
    "<div><span>ab</span><span>cd</span></div>" +
    '<div id="IDinfobox" class="CLinfobox">' +
        '<div>foo</div>' +
        '<div>bar</div>' +
        '<div>Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat. Ut wisi enim ad minim veniam, quis nostrud exerci tation ullamcorper suscipit lobortis nisl ut aliquip ex ea commodo consequat. Duis autem vel eum iriure dolor in hendrerit in vulputate velit esse molestie consequat, vel illum dolore eu feugiat nulla facilisis at vero eros et accumsan et iusto odio dignissim qui blandit praesent luptatum zzril delenit augue duis dolore te feugait nulla facilisi. Nam liber tempor cum soluta nobis eleifend option congue nihil imperdiet doming id quod mazim placerat facer possim assum. Typi non habent claritatem insitam; est usus legentis in iis qui facit eorum claritatem. Investigationes demonstraverunt lectores legere me lius quod ii legunt saepius.</div>' +
    '</div>' +
"</body></html>"]
};

RRfs.readFile('./favicon.ico', function (err, data) {
    if (err) {
        console.log("error reading favicon");
        return;
    }
    GVservices["/favicon.ico"] = ["image/x-icon",data];
});

var FFserver = RRhttp.createServer(function (PVrequest, PVresponse) {
    // console.log(Object.keys(PVrequest));
    // console.log(PVrequest.domain);
    console.log(PVrequest.method + " " + PVrequest.url);
    if (GVservices.hasOwnProperty(PVrequest.url)) {
        var LVservice = GVservices[PVrequest.url];
        PVresponse.writeHead(200, {"Content-Type": LVservice[0]});
        PVresponse.end(LVservice[1]);
    }
    // console.log(PVrequest);
    PVresponse.writeHead(404, {"Content-Type": "text/plain"});
    PVresponse.end("404 error");
});


// Listen on port 8000, IP defaults to 127.0.0.1
FFserver.listen(8000);

// Put a friendly message on the terminal
console.log("Server running at http://127.0.0.1:8000/");

