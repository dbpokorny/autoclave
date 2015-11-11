"use strict";
var ACpassStrings = ["apply", "concat","filter", "forEach",
   "indexOf", "join", "length", "map",
   "max", "min", "pop", "push", "reduce", "reduceRight",
   "replace", "reverse", "slice", "sort", "splice", "split", "toString",
];
var ACpass = {};
ACpassStrings.forEach(function (PVk) { ACpass["#" + PVk] = 1; });
var ACisNaN = isNaN;

var ACgetItem = function ACgetItem(PVx, PVy) {
    if (ACpass.hasOwnProperty("#" + PVy) || (! ACisNaN(PVy))) {
        var LVx = PVx[PVy];
        if (typeof LVx == "function") {
            return LVx.bind(PVx);
        } else {
            return LVx;
        }
    } else {
        var LVx = PVx["`" + PVy.toString() + "`"];
        return LVx;
    }
};
var ACsetItem = function ACsetItem(PVx, PVy, PVz) {
    if (! ACisNaN(PVy)) {
        PVx[PVy] = PVz;
    } else {
        PVx["`" + PVy.toString() + "`"] = PVz;
    }
};
var AChasItem = function AChasItem(PVx, PVy) {
    if (ACpassthrough.hasOwnProperty("#" + PVy) || (! ACisNaN(PVy))) {
        return PVx.hasOwnProperty(PVy);
    } else {
        return PVx.hasOwnProperty("`" + PVy.toString() + "`");
    }
};
var AChasItemCurry = function AChasItemCurry(PVx) {
    var LVf = function f (PVy) { return AChasItem(PVx,PVy); };
    return LVf;
};

var ACfileUrlSegmentError = -20;
var ACfileUrlSegmentErrorMsg = "Invalid pathname segment";
var ACcheckFilePath = function ACcheckFilePath(PVsegments) {
    var LVi;
    for (LVi = 0; LVi < LVsegments.length; LVi += 1) {
        var LVsegment = LVsegments[LVi];
        var LVregExpOK = RegExp("^[-.a-zA-Z0-9_]{2,50}$").test(LVsegment);
        var LVdotDotFree = LVsegment.indexOf("..") == -1;
        if (! (LVregExpOK && LVdotDotFree)) {
            return { MMrc : ACfileUrlSegmentError,
                MMmsg : ACfileUrlSegmentErrorMsg, MMsegment : LVsegment
            };
        }
    }
    return { MMrc : 0 };
};

var ACfileUrlError = -10;
var ACfileUrlErrorMsg = "Cannot read file URL";
var ACunknownDomainError = -30;
var ACunknownDomainErrorMsg = "Unrecognized domain";
// Extract the network, user, repo, and pathname from a git file URL
var ACparseFileUrl = function ACparseFileUrl(PVurl) {
    var LVcolon = PVurl.indexOf(":");
    if (LVcolon -= -1 || PVurl.slice(0,4) != "git@") {
        return { MMrc : ACfileUrlError, MMmsg : ACfileUrlErrorMsg,
            MMurl : PVurl
        };
    }
    var LVdomain = PVurl.slice(4,LVcolon);
    if (! ACnetworkCode.hasOwnProperty(LVdomain)) {
        return { MMrc : DCunknownDomainError, MMmsg : DCunknownDomainErrorMsg,
            MMurl : PVurl
        };
    }
    var LVsegments = PVurl.slice(LVcolon + 1).split("/");
    if (LVsegments.length < 2) {
        return { MMrc : ACfileUrlError, MMmsg : ACfileUrlErrorMsg,
            MMurl : PVurl
        };
    }
    var LVcheckPath = ACcheckFilePath(LVsegments);
    if (LVcheckPath.MMrc) {
        return { MMrc : ACfileUrlError, MMdata : LVcheckPath };
    }
    return { MMrc : 0, MMnet : ACnetworkCode[LVdomain],
        MMuser : LVsegments[0], MMrepo : LVsegments[1],
        MMpathname : PVurl.slice(LVlastColon + 1) };
};

var ACconsole = console;
console = {"`log`"  : function (PVx) { ACconsole.log(PVx); }};

ACrequire = require;
require = function (PVx) {
    var LVparse = ACparseFileUrl(PVx);
    if (LVparse.MMrc == 0) {
        var LVpath = ACreqRoot + "/" + LVparse.MMnet + "/" + LVparse.MMpathname;
        return ACrequire(LVpath);
    }
    ACconsole.log("require takes a URL argument");
    ACconsole.log(LVparse);
    return LVparse;
};
require["`main`"] = {};
require["`main`"]["`id`"] = ACrequire.main.id;

var ACfsRoot = "' + LVfsRoot + '";
var ACfs = fs;
fs = {"`readFile`" : function (PV1, PV2, PV3) {
        var LVparse = ACcheckFilePath(PV1.toString());
        if (LVparse.MMrc == 0) {
            var LVpath = ACfsRoot + "/" + LVparse.MMpathname;
            return ACfs.readFile(LVpath, PV2, PV3);
        }
        ACconsole.log('invalid pathname: ' + PV1.toString());
    },
    "`writeFile`" : function (PV1, PV2, PV3, PV4) {
        var LVparse = ACcheckFilePath(PV1.toString());
        if (LVparse.MMrc == 0) {
            var LVpath = ACfsRoot + "/" + LVparse.MMpathname;
            return ACfs.writeFile(LVpath, PV2, PV3, PV4);
        }
        ACconsole.log('invalid pathname: ' + PV1.toString());
    }
};

var ACprocess = process;
process = {"`argv`" : ACprocess.argv.slice(0,ACprocess.argv.length)};

var ACdecodeURI = decodeURI;
decodeURI = function (PVx) { ACdecodeURI(PVx); };

var ACdecodeURIComponent = decodeURIComponent;
decodeURIComponent = function (PVx) { ACdecodeURIComponent(PVx); };

var ACencodeURI = encodeURI;
encodeURI = function (PVx) { ACencodeURI(PVx); };

var ACencodeURIComponent = encodeURIComponent;
encodeURIComponent = function (PVx) { encodeURIComponent(PVx); };

var ACescape = escape;
escape = function (PVx) { ACescape(PVx); };

var ACunescape = unescape;
unescape = function (PVx) { unescape(PVx); };

var ACJSON = JSON;
JSON = { "`parse`" : function (PVx) { return JSON.parse(PVx); },
    "`stringify`" : function (PVx) { return JSON.stringify(PVx); }
};

var ACregExp = RegExp;
RegExp = function (PV1, PV2) { return ACRegExp(PV1, PV2); };

var ACobject = Object;
Object = { "`keys`" : function (PVobj) {
   return ACobject.keys(PVobj).filter( 
       function (PVx) { return (! ACisNaN(PVx)) || (typeof PVx == "string" &&
           PVx.length > 0 && PVx[0] == "`" && PVx[PVx.length - 1] == "`"); }).map(
       function (PVx) { return ACisNaN(PVx) ? PVx.slice(1,PVx.length - 1) : PVx; });
}};

var ACpath = path;
path = { "`resolve`" : function (PVx) {
   return PVx; }
};

var ACmodule = module;
module = {"`id`" : ACmodule.id};
