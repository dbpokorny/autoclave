"use strict";

// AC - reserved namespace
// AG - global remap prefix
var ACpassStrings = ["apply", "concat","filter", "forEach",
   "indexOf", "join", "length", "map",
   "max", "min", "pop", "push", "reduce", "reduceRight",
   "replace", "reverse", "slice", "sort", "splice", "split", "toString",
];
var ACpass = {};
ACpassStrings.forEach(function (PVk) { ACpass["#" + PVk] = 1; });

var ACsaved = {};
ACsaved.MMArray = Array;
// ACsaved.MMObject = Object;
ACsaved.MMObjectKeys = Object.keys;
ACsaved.MMRegExp = RegExp;
ACsaved.MMisNaN = isNaN;
// ACsaved.MMconsole = console;
ACsaved.MMconsoleLog = console.log;
ACsaved.MMescape = escape;
ACsaved.MMunescape = unescape;
ACsaved.MMdecodeURI = decodeURI;
ACsaved.MMdecodeURIComponent = decodeURIComponent;
ACsaved.MMencodeURI = encodeURI;
ACsaved.MMencodeURIComponent = encodeURIComponent;
ACsaved.MMmodule = module;
// ACsaved.MMpath = require('path');
ACsaved.MMrequire = require;
// ACsaved.MMutil = require('util');
ACsaved.MMutilFormat = require('util').format;

var ACfileUrlSegmentError = -20;
var ACfileUrlSegmentErrorMsg = "Invalid pathname segment";
var ACcheckFilePath = function ACcheckFilePath(PVsegments) {
    var LVi;
    for (LVi = 0; LVi < PVsegments.length; LVi += 1) {
        var LVsegment = PVsegments[LVi];
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

var AGconsole = {"`log`" : function (PVx) { ACsaved.MMconsoleLog(
        "git@" + ACdomain + ":" + ACuser + "/" + ACrepo + "> " + PVx); } };
var AGprocess = { "`argv`" : process.argv.slice(0,process.argv.length) };
ACsaved.MMfs = require('fs');
AGfs = {"`readFile`" : function (PV1, PV2, PV3) {
        var LVparse = ACcheckFilePath(PV1.toString().split('/'));
        if (LVparse.MMrc == 0) {
            var LVpath = ACfsRoot + "/" + PV1;
            if (PV3 == undefined) {
                return ACsaved.MMfs.readFile(LVpath, PV2);
            } else {
                return ACsaved.MMfs.readFile(LVpath, PV2, PV3);
            }
        }
        ACsaved.MMconsoleLog('invalid pathname: ' + PV1.toString());
    },
    "`writeFile`" : function (PV1, PV2, PV3, PV4) {
        var LVparse = ACcheckFilePath(PV1.toString().split('/'));
        if (LVparse.MMrc == 0) {
            var LVpath = ACfsRoot + "/" + PV1;
            ACsaved.MMconsoleLog('writing to ' + LVpath);
            if (PV4 == undefined) {
                return ACsaved.MMfs.writeFile(LVpath, PV2, PV3);
            } else {
                return ACsaved.MMfs.writeFile(LVpath, PV2, PV3, PV4);
            }
        }
        ACsaved.MMconsoleLog('invalid pathname: ' + PV1.toString());
    }
};

var AGArray = {"`isArray`" :
    function (PVx) { return ACsaved.MMArray.isArray(PVx); } };

var AGObject = {"`keys`" :
    function (PVobj) {
        return ACsaved.MMobjectKeys(PVobj).filter(function (PVx) {
            return (! ACsaved.MMisNaN(PVx)) ||
            (typeof PVx == "string" && PVx.length > 0 && PVx[0] == "`" &&
             PVx[PVx.length - 1] == "`");
        }).map(function (PVx) {
            return ACsaved.MMisNaN(PVx) ? PVx.slice(1, PVx.length - 1) : PVx; });
    }
};

var ACgetItem = function ACgetItem(PVx, PVy) {
    if (ACpass.hasOwnProperty("#" + PVy) || (! ACsaved.MMisNaN(PVy))) {
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
    if (! ACsaved.MMisNaN(PVy)) {
        PVx[PVy] = PVz;
    } else {
        PVx["`" + PVy.toString() + "`"] = PVz;
    }
};
var AChasItem = function AChasItem(PVx, PVy) {
    if (ACpass.hasOwnProperty("#" + PVy) || (! ACsaved.MMisNaN(PVy))) {
        return PVx.hasOwnProperty(PVy);
    } else {
        return PVx.hasOwnProperty("`" + PVy.toString() + "`");
    }
};
var AChasItemCurry = function AChasItemCurry(PVx) {
    var LVf = function f (PVy) { return AChasItem(PVx,PVy); };
    return LVf;
};

var ACfileUrlError = -10;
var ACfileUrlErrorMsg = "Cannot read file URL";
var ACunknownDomainError = -30;
var ACunknownDomainErrorMsg = "Unrecognized domain";
// Extract the network, user, repo, and pathname from a git file URL
var ACparseFileUrl = function ACparseFileUrl(PVurl) {
    var LVcolon = PVurl.indexOf(":");
    if (LVcolon == -1 || PVurl.slice(0,4) != "git@") {
        return { MMrc : ACfileUrlError, MMmsg : ACfileUrlErrorMsg,
            MMurl : PVurl
        };
    }
    var LVdomain = PVurl.slice(4,LVcolon);
    if (! ACnetworkCode.hasOwnProperty(LVdomain)) {
        return { MMrc : ACunknownDomainError, MMmsg : ACunknownDomainErrorMsg,
            MMurl : PVurl
        };
    }
    var LVsegments = PVurl.slice(LVcolon + 1).split("/");
    if (LVsegments.length < 2) {
        return { MMrc : ACfileUrlError, MMmsg : ACfileUrlErrorMsg,
            MMinfo : "missing user / repo", MMurl : PVurl
        };
    }
    var LVcheckPath = ACcheckFilePath(LVsegments);
    if (LVcheckPath.MMrc) {
        return { MMrc : ACfileUrlError, MMdata : LVcheckPath };
    }
    return { MMrc : 0, MMnet : ACnetworkCode[LVdomain],
        MMuser : LVsegments[0], MMrepo : LVsegments[1],
        MMpathname : PVurl.slice(LVcolon + 1) };
};

AGutil = {"`format`" : function (PVx) { return ACsaved.MMutilFormat(PVx); } };

AGescape = function (PVx) { return ACsaved.MMescape(PVx); };
AGunescape = function (PVx) { return ACsaved.MMunescape(PVx); };
AGdecodeURI = function (PVx) { return ACsaved.MMdecodeURI(PVx); };
AGdecodeURIComponent = function (PVx) { return ACsaved.MMdecodeURIComponent(PVx); };
AGencodeURI = function (PVx) { return ACsaved.MMencodeURI(PVx); };
AGencodeURIComponent = function (PVx) { return ACsaved.MMencodeURIComponent(PVx); };
AGRegExp = function (PV1, PV2) {
    if (PV2 == undefined) {
        return ACsaved.MMRegExp(PV1);
    } else {
        return ACsaved.MMRegExp(PV1, PV2);
    }
};
AGmodule = {"`id`" : ACsaved.MMmodule.id};
AGpath = { "`resolve`" : function (PVx) { return PVx; } };

var ACbuiltins = {
    assert : require('assert'),
    fs : AGfs,
    path : AGpath,
    util : AGutil
};

AGrequire = function (PVx) {
    if (typeof PVx != "string") {
        ACsaved.MMconsoleLog("require takes a string argument");
        return undefined;
    }
    if (ACbuiltins.hasOwnProperty(PVx)) {
        return ACbuiltins[PVx];
    }
    if (PVx.slice(0,2) == "./") {
        PVx = ("git@" + ACdomain + ":" + ACuser + "/" + ACrepo + "/" +
            PVx.slice(2));
    }
    var LVparse = ACparseFileUrl(PVx);
    if (LVparse.MMrc == 0) {
        var LVpath = ACreqRoot + "/" + LVparse.MMnet + "/" + LVparse.MMpathname;
        return ACsaved.MMrequire(LVpath);
    }
    ACsaved.MMconsoleLog("require takes a URL argument");
    ACsaved.MMconsoleLog(LVparse);
    return LVparse;
};
AGrequire["`main`"] = {};
AGrequire["`main`"]["`id`"] = ACsaved.MMrequire.id;
