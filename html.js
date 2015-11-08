// Load the http module to create an http server.
var http = require('http');
var fs = require('fs');
var escapeHtml = require('escape-html');

var assert = require('assert');

var RRfetch = require('./fetch.js');

var GVget = {
    "/foo" : ["text/plain","<b>ee</b>"],
    "/infobox.js" : ["application/javascript",
"var FFinfoboxLog = function FFinfoboxLog(PVm) {\n" +
"    var LVe = document.createElement('div');\n" +
"    LVe.innerHTML = PVm;\n" +
"    var LVinfobox = document.getElementById('IDinfobox');\n" +
"    LVinfobox.appendChild(LVe);\n" +
"    LVinfobox.scrollTop = LVinfobox.scrollHeight;\n" +
"};\n" +
"\n" +
"var FFdemoPost = function FFdemoPost() {\n" +
"    $.post(document.location.pathname, \n" +
"        JSON.stringify({foo:'bar',baz:27}), \n" +
"        function (data, status) {\n" +
"            if (status == 'success') {\n" +
"                console.log(data);\n" +
"                console.log(data.hello);\n" +
"            } else {\n" +
"                console.log('Status: ' + status);\n" +
"            }\n" +
"        },'json'\n" + 
"    );\n" +
"};\n"],
    "/" :["text/html",
"<!doctype html><html>" +
    "<head>" + 
        '<script type="application/javascript" src="/jquery-2.1.4.js"></script>' +
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
    "<h1>autoclave.io</h1>" +
    '<div>Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam  ' +
    'saepius.                                                           </div>' +
    '<button onclick="FFdemoPost();">click me</button>' +
"</body></html>"
]
};

fs.readFile('./favicon.ico', function (err, data) {
    if (err) {
        console.log("error reading favicon");
        return;
    }
    GVget["/favicon.ico"] = ["image/x-icon",data];
});

fs.readFile('./jquery-2.1.4.js', function (err, data) {
    if (err) {
        console.log("error reading jquery");
        return;
    }
    GVget["/jquery-2.1.4.js"] = ["application/javascript",data];
});

// map from github user name to array of repo names
var GVuserRepos = {};

// list of 'user/repo' github repos in local cache
var GVrepoList = [];

// list of github users who have at least one repo in the cache
var GVghUsers = fs.readdirSync('ghcache/');

GVghUsers.forEach(function (PVuser) {
    GVuserRepos[PVuser] = fs.readdirSync('ghcache/' + PVuser + '/');
    GVuserRepos[PVuser].forEach(function (PVrepo) {
        GVrepoList.push(PVuser + '/' + PVrepo);
    });
});

RRfetch.MMwalkTree('acbuild/scope', function (PVscopeFile) {
    assert(PVscopeFile.slice(0,7) == 'acbuild');
    GVget[PVscopeFile.slice(7)] = function (PVk) {
        PVk(['text/plain', fs.readFileSync(PVscopeFile)]);
    };
});

var FFmakeMainPage = function FFmakeMainPage() {
    GVget['/'] = ["text/html",
    '<!doctype html>' +
    '<html>' +
        '<head>' + 
            '<script type="application/javascript" src="/jquery-2.1.4.js"></script>' +
            '<script type="application/javascript" src="/infobox.js"></script>' +
            '<style>' +
                'body {background-color:#808080; color:white; font-family: Courier;}' +
                'h1 {color:red;}' +
                '.CLinfobox {' +
                    'border:1px solid black;' +
                    'background-color: lightblue;' +
                    'width: 150px;' +
                    'height: 150px;' +
                    'overflow: scroll;' +
                '}' +
                '.hiFunction {color:#40ffff;}' +
                '.hiComment {color:#80a0ff;}' +
            '</style>' +
        '</head>' +
        '<body>' +
            '<h1>autoclave.io</h1>' +
            '<div>Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam  ' +
            'saepius.                                                           </div>' +
            '<button onclick="FFdemoPost();">click me</button>' +
            '<h2>List of Repositories</h2>' +
            GVrepoList.map(function (PVx) { return '<div>' + escapeHtml(PVx) + '</div>'; }).join(' ') +
            '<h2>List of Services</h2>' +
            Object.keys(GVget).map(function (PVsvcName) {
                return ('<div>' + '<a href="' + escape(PVsvcName) + '">' +
                    escapeHtml(PVsvcName) + '</a>' + '</div>'); }).join(' ') +
        '</body>' +
    '</html>'
    ];
};

FFmakeMainPage();

var GVerror = [];

RRfetch.MMwalkTree('acbuild/error', function (PVerrorFile) {
    GVerror.push([PVerrorFile, fs.readFileSync(PVerrorFile)]);
});

var FFmakeReport = function FFmakeReport() {
    GVget['/report'] = ["text/html",
    '<!doctype html><html>' +
        '<head>' + 
            '<script type="application/javascript" src="/jquery-2.1.4.js"></script>' +
            '<script type="application/javascript" src="/infobox.js"></script>' +
            '<style>' +
                'table {' +
                    'border: 1px solid black;' +
                '}' +
                'th {' +
                    'border: 1px solid black;' +
                '}' +
                'td {' +
                    'border: 1px solid black;' +
                '}' +
            '</style>' +
        '</head>' +
        '<body>' +
            '<table>' +
                '<tr>' + '<th>path</th>' + '<th>error</th>' + '</tr>' +
                GVerror.map(function (PVx) {
                    return ('<tr>' + '<td>' + escapeHtml(PVx[0]) + '</td>' +
                        '<td>' + escapeHtml(PVx[1]) + '</td>' + '</tr>');
                }).join(' ') +
            '</table>' +
        '</body>' +
    '</html>'
    ];
};

FFmakeReport();

var GVpost = {};

GVpost['/'] = function (PVbody, PVk) {
    console.log('the body is: ' + PVbody);
    PVk({hello:'world', 10:20});
};

var FFserver = http.createServer(function (PVrequest, PVresponse) {
    // console.log(Object.keys(PVrequest));
    // console.log(PVrequest.domain);
    console.log(PVrequest.method + " " + PVrequest.url);
    if (PVrequest.method == "POST") {
        var LVbody = "";
        PVrequest.on('data', function (PVchunk) {
            LVbody += PVchunk;
        });
        PVrequest.on('end', function () {
            // console.log('POST: ' + LVbody);
            if (GVpost.hasOwnProperty(PVrequest.url)) {
                var LVhandler = GVpost[PVrequest.url];
                LVhandler(LVbody, function (PVx) {
                    PVresponse.writeHead(200);
                    PVresponse.end(JSON.stringify(PVx));
                });
            } else {
                PVresponse.writeHead(404, {"Content-Type": "text/plain"});
                PVresponse.end("404 error");
            }
        });
        // console.log(Object.keys(PVrequest));
    } else if (GVget.hasOwnProperty(PVrequest.url)) {
        var LVservice = GVget[PVrequest.url];
        if (! (LVservice instanceof Array)) {
            LVservice(function (PVx) {
                GVget[PVrequest.url] = PVx;
                PVresponse.writeHead(200, {"Content-Type": PVx[0]});
                PVresponse.end(PVx[1]);
            });
            return;
        }
        PVresponse.writeHead(200, {"Content-Type": LVservice[0]});
        PVresponse.end(LVservice[1]);
    } else {
        // console.log(PVrequest);
        PVresponse.writeHead(404, {"Content-Type": "text/plain"});
        PVresponse.end("404 error");
    }
});


// Listen on port 8000, IP defaults to 127.0.0.1
FFserver.listen(8000);

// Put a friendly message on the terminal
console.log("Server running at http://127.0.0.1:8000/");

