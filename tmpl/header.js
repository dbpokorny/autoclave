"use strict";

// AC - reserved namespace
// AG - global remap prefix
var ACpassStrings = ["apply", "concat", "filter", "forEach", "indexOf", "join",
    "length", "map", "pop", "push", "reduce", "reduceRight", "replace", "reverse",
    "slice", "sort", "splice", "split", "toString"];
var ACpass = {};
ACpassStrings.forEach(function (PVk) { ACpass["#" + PVk] = 1; });

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
            MMurl : PVurl };
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

var AGconsole = {"`log`" : function (PVx) { console.log(
        "[" + ACfilename + "]" + 
        "git@" + ACdomain + ":" + ACuser + "/" + ACrepo + "> " + PVx); } };
var AGprocess = { "`argv`" : process.argv.slice(0,process.argv.length) };
var ACrequireThunks = {};
ACrequireThunks.MMfs = function () {
    var LVfs = require('fs');
    return {
        "`readFile`" : function (PV1, PV2, PV3) {
            var LVparse = ACcheckFilePath(PV1.toString().split('/'));
            if (LVparse.MMrc == 0) {
                var LVpath = ACfsRoot + "/" + PV1;
                if (PV3 == undefined) {
                    return LVfs.readFile(LVpath, PV2);
                } else {
                    return LVfs.readFile(LVpath, PV2, PV3);
                }
            }
            console.log('invalid pathname: ' + PV1.toString());
        },
        "`writeFile`" : function (PV1, PV2, PV3, PV4) {
            var LVparse = ACcheckFilePath(PV1.toString().split('/'));
            if (LVparse.MMrc == 0) {
                var LVpath = ACfsRoot + "/" + PV1;
                console.log('writing to ' + LVpath);
                if (PV4 == undefined) {
                    return LVfs.writeFile(LVpath, PV2, PV3);
                } else {
                    return LVfs.writeFile(LVpath, PV2, PV3, PV4);
                }
            }
            console.log('invalid pathname: ' + PV1.toString());
        }
    };
};

var AGArray = {"`isArray`" :
    function (PVx) { return Array.isArray(PVx); } };

var AGObject = {"`keys`" :
    function (PVobj) {
        return ObjectKeys(PVobj).filter(function (PVx) {
            return (! isNaN(PVx)) ||
            (typeof PVx == "string" && PVx.length > 0 && PVx[0] == "`" &&
             PVx[PVx.length - 1] == "`");
        }).map(function (PVx) {
            return isNaN(PVx) ? PVx.slice(1, PVx.length - 1) : PVx; });
    }
};

var ACgetItemB = function ACgetItemB(PVx, PVy) { // x[y]
    if (ACpass.hasOwnProperty("#" + PVy) || (! isNaN(PVy))) {
        return PVx[PVy];
    } else {
        return PVx["`" + PVy.toString() + "`"];
    }
};
var ACgetItemD = function ACgetItemD(PVx, PVy) { // x.y
    if (ACpass.hasOwnProperty("#" + PVy) || (! isNaN(PVy))) {
        var LVx = PVx[PVy];
        if (typeof LVx == "function") {
            return LVx.bind(PVx);
        } else {
            return LVx;
        }
    } else {
        return PVx["`" + PVy.toString() + "`"];
    }
};
var ACsetItemB = function ACsetItemB(PVx, PVy, PVz) { // x[y] = z
    if (! isNaN(PVy)) { PVx[PVy] = PVz; } else {
        PVx["`" + PVy.toString() + "`"] = PVz; } };
var ACsetItemD = function ACsetItemD(PVx, PVy, PVz) { // x.y = z
    if (! isNaN(PVy)) { PVx[PVy] = PVz; } else {
        PVx["`" + PVy.toString() + "`"] = PVz; } };
var AChasItem = function AChasItem(PVx, PVy) {
    if (ACpass.hasOwnProperty("#" + PVy) || (! isNaN(PVy))) {
        return PVx.hasOwnProperty(PVy);
    } else {
        return PVx.hasOwnProperty("`" + PVy.toString() + "`");
    }
};
var AChasItemCurry = function AChasItemCurry(PVx) {
    var LVf = function f (PVy) { return AChasItem(PVx,PVy); };
    return LVf;
};

var AGutil = {"`format`" : function (PVx) { return util.format(PVx); } };
var AGescape = escape;
var AGunescape = unescape;
var AGdecodeURI = decodeURI;
var AGdecodeURIComponent = decodeURIComponent;
var AGencodeURI = encodeURI;
var AGencodeURIComponent = encodeURIComponent;
var AGRegExp = function (PV1, PV2) {
    if (PV2 == undefined) {
        return RegExp(PV1);
    } else {
        return RegExp(PV1, PV2);
    }
};
var AGmodule = {"`id`" : module.id};
var AGpath = { "`resolve`" : function (PVx) { return PVx; } };
var ACbuiltins = {
    assert : ["static", require('assert')],
    fs :   ["thunk", ACrequireThunks.MMfs],
    path : ["static", AGpath],
    util : ["static", AGutil]
};
var AGrequire = function (PVx) {
    if (typeof PVx != "string") {
        console.log("require takes a string argument");
        return undefined;
    }
    if (ACbuiltins.hasOwnProperty(PVx)) {
        var LVent = ACbuiltins[PVx];
        if (LVent[0] == "static") {
            return LVent[1];
        } else if (LVent[0] == "thunk") {
            var LVval = LVent[1]();
            ACbuiltins[PVx] = ["static", LVval];
            return LVval;
        } else {
            assert(false);
        }
    }
    if (PVx.slice(0,2) == "./") {
        PVx = ("git@" + ACdomain + ":" + ACuser + "/" + ACrepo + "/" +
            PVx.slice(2));
    }
    var LVparse = ACparseFileUrl(PVx);
    if (LVparse.MMrc == 0) {
        var LVpath = ACreqRoot + "/" + LVparse.MMnet + "/" + LVparse.MMpathname;
        console.log("redirect require -> " + LVpath);
        return require(LVpath);
    }
    console.log("require takes a URL argument");
    console.log(LVparse);
    return LVparse;
};
AGrequire["`main`"] = {};
AGrequire["`main`"]["`id`"] = require.main.id;
var AGundefined = undefined;
var AGMath = { "`min`" : Math.min, "`max`" : Math.max };
var AGisNaN = isNaN;
var AGJSON = { "`stringify`" : JSON.stringify, "`parse`" : JSON.parse};
