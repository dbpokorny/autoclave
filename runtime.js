"use strict";

var GVpassthroughStrings = ['apply', 'argv','concat','filter', 'forEach',
    'hasOwnProperty', 'indexOf', 'join', 'keys', 'log','length', 'main', 'map',
    'max', 'min', 'pop', 'push', 'readFile', 'reduce', 'reduceRight',
    'replace', 'resolve', 'reverse', 'slice', 'sort','splice','split','toString',
    'writeFile'
];
var GVpassthrough = {};
GVpassthroughStrings.forEach(function (PVk) { GVpassthrough['#' + PVk] = 1; });

var FFkeys;

var FFgetItem = function FFgetItem(PVx, PVy) {
    if (GVpassthrough.hasOwnProperty('#' + PVy) || (! isNaN(PVy))) {
        var LVx = PVx[PVy];
        if (typeof LVx == 'function') {
            if (PVy == "hasOwnProperty") {
                return FFhasItemCurry(PVx);
            } else if (PVy == "keys") {
                return FFkeys;
            } else {
                return LVx.bind(PVx);
            }
        } else {
            return LVx;
        }
    } else {
        var LVx = PVx['`' + PVy.toString() + '`'];
        return LVx;
    }
};

var GVsetOK = {'#exports' : 1};

var FFsetItem = function FFsetItem(PVx, PVy, PVz) {
    if (GVsetOK.hasOwnProperty('#' + PVy) || (! isNaN(PVy))) {
        PVx[PVy] = PVz;
    } else {
        PVx['`' + PVy.toString() + '`'] = PVz;
    }
};

var FFhasItem = function FFhasItem(PVx, PVy) {
    if (GVpassthrough.hasOwnProperty('#' + PVy) || (! isNaN(PVy))) {
        return PVx.hasOwnProperty(PVy);
    } else {
        return PVx.hasOwnProperty('`' + PVy.toString() + '`');
    }
};

var FFhasItemCurry = function FFhasItemCurry(PVx) {
    var LVf = function f (PVy) { return FFhasItem(PVx,PVy); };
    return LVf;
};

// keys == Object.keys
var FFkeys = function FFkeys (PVobj) {
    return Object.keys(PVobj).filter(
        function (PVx) { return (! isNaN(PVx)) || (typeof PVx == "string" &&
            PVx.length > 0 && PVx[0] == '`' && PVx[PVx.length - 1] == '`'); }).map(
        function (PVx) { return isNaN(PVx) ? PVx.slice(1,PVx.length - 1) : PVx; });
};

var DCfileUrlError = -10;
var DCfileUrlErrorMsg = "Cannot read file URL";
var DCfileUrlSegmentError = -20;
var DCfileUrlSegmentErrorMsg = "Invalid pathname segment";
// Given a github file URL, return the path to the local (it may or may not exist)
var FFfileUrlToLocal = function (PVurl) {
    var LVlastColon = PVurl.lastIndexOf(':');
    if (LVlastColon <= 0) { return {
        MMrc : DCfileUrlError, MMmsg : DCfileUrlErrorMsg, MMdata : PVurl }; }
    var LVpathSegments = PVurl.slice(LVlastColon + 1).split('/');
    var LVi;
    for (LVi = 0; LVi < LVpathSegments.length - 1; LVi += 1) {
        if (! RegExp("^[-a-zA-Z0-9_]{2,50}$").test(LVpathSegments[LVi])) {
            return { MMrc : DCfileUrlSegmentError,
                MMmsg : DCfileUrlSegmentErrorMsg, MMdata : LVpathSegments[LVi]
            };
        }
    }
    var LVfilename = LVpathSegments[-1];
    var LVfilenameRoot = LVfilename.slice(0,LVfilename.length - 3);
    var LVfilenameExt = LVfilename.slice(LVfilename.length - 3);
    if (! (LVfilenameExt == ".js" &&
            RegExp("^[-a-zA-Z0-9_]{2,50}$").test(LVfilenameRoot))) {
        return { MMrc : DCfileUrlSegmentError,
            MMmsg : DCfileUrlSegmentErrorMsg, MMdata : LVfilename
        };
    }
    return { MMrc : 0, MMpath : "acbuild/js/" + PVurl.slice(LVlastColon + 1) };
}

// FFwrapRequire returns a function that replaces require(pathname). The new
// function takes a git file URL git@github.com:user/repo/path/to/file.js and
// loads acbuild/js/user/repo/path/to/file.js
var FFwrapRequire = function FFwrapRequire(PVreq) {
    var LVnewReq = function (PVx) {
        var LVpathResult = FFfileUrlToLocal(PVx);
        if (LVpathResult.MMrc == 0) {
            var LVpath = LVpathResult.MMpath;
            return require(LVpath);
        }
        console.log("Require takes a URL argument");
        console.log(LVpathResult);
    };
    LVnewReq.main = PVreq.main;
    return LVnewReq;
};

module.exports = {
    MMgetItem : FFgetItem,
    MMsetItem : FFsetItem,
    MMkeys : FFkeys,
    MMwrapRequire : FFwrapRequire
};
