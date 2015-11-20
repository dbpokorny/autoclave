var assert = require('assert');
var RRfs = require('fs');
var DCsegmentError = -20;
var DCsegmentErrorMsg = "Invalid pathname segment";
var FFcheckFilePath = function FFcheckFilePath(PVsegments) {
    assert(PVsegments instanceof Array);
    var LVi;
    for (LVi = 0; LVi < PVsegments.length; LVi += 1) {
        var LVsegment = PVsegments[LVi];
        var LVregExpOK = RegExp("^[-.a-zA-Z0-9_]{2,50}$").test(LVsegment);
        var LVdotDotFree = LVsegment.indexOf("..") == -1;
        if (! (LVregExpOK && LVdotDotFree)) {
            return { MMrc : DCsegmentError,
                MMmsg : DCsegmentErrorMsg, MMsegment : LVsegment
            };
        }
    }
    return { MMrc : 0 };
};

// Call PVf on all file paths in the repository named at PVroot
// skip "node_modules"
var FFwalkTreeSync = function FFwalkTreeSync(PVroot, PVf) {
    var FFwtHelper = function FFwtHelper(PVpath) {
        var LVstats = RRfs.statSync(PVpath);
        if (LVstats.isDirectory()) {
            var LVls = RRfs.readdirSync(PVpath).filter(function (PVname) {
                return PVname[0] != '.'; });
            var LVi;
            for (LVi = 0; LVi < LVls.length; LVi += 1) {
                var LVname = LVls[LVi];
                if (LVname != "node_modules") {
                    var LVnewPath = PVpath + '/' + LVls[LVi];
                    FFwtHelper(LVnewPath);
                }
            }
        } else if (LVstats.isFile()) {
            PVf(PVpath);
        }
    };
    FFwtHelper(PVroot);
};

module.exports = {
    FFcheckFilePath : FFcheckFilePath,
    FFwalkTreeSync : FFwalkTreeSync
};
