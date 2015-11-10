// 1. User provides a git repo URL to fetch and cache. URL must be in the form of
//    git@github.com:user/repo.git. It is cloned to ghcache/user/repo and an entry
//    is added to GVrepoCache. Walk the repo file tree, and for all
//    files ending in '.js', make an entry in GVjsFiles, which maps file URL (a
//    file URL looks like git@github.com:user/repo/path/to/file.js) to its git
//    repo URL. This is the list of candidate files to translate. Also make an
//    entry in GVinputFiles.
//
// 2. User queries:
//    2.1 has the following git URL been cached yet?
//    2.2 has the local git repo been walked yet?
//    2.3 does the repo need 'npm install'?
//        2.3.1 for each package in package.json, is it ok to run out of the box
//              or does it need an interface that disables / rate limits functions
//              that could annoy or pose a security risk?
//    2.4 given a GIT url and a pathname to a directory in the repository, list
//    the files it contains
//    2.5 list all files in the tree (git ls-files)
//    2.6 for a given javascript file, is it suitable for translation?
//
// 2. User selects a JavaScript file to translate. The result will be stored in
//    acbuild/user/repo/path/to/file.js. In addition, an entry is made in
//    GVfileCache.
//
// 3. User may ask for a pull request against the cached repository in which case
//    it pulls the latest from github. Next, it gets a list of the files in
//    acbuild/ to determine which need to be updated. Upon request, it will
//    rebuild those files.
//
// See https://github.com/keybase/keybase-issues/issues/757 for the rules for
// valid github user names

var RRfs = require('fs');
var RRgit = require('gift');
var RRtree = require('./tree.js');

var assert = require('assert');

// map file URL to path to local file
var GVinputFiles = {};

// map file URL to path to translated file in acbuild/
var GVfileCache = {};

// map git URL to pathname to root of local clone
var GVrepoCache = {};

// map git URL to repo object
var GVrepoObjectCache = {};

// map git URL to list of paths to ".js" files in the local cache
var GVjsFiles = {};

// Return true if the local cache of a given repository exists
var FFlocalCacheExists = function FFlocalCacheExists (PVurl) {

};

var DCurlError = -10;
var DCurlErrorMsg = "Cannot read URL";
var DCghUserUrlError = -20;
var DCghUserUrlErrorMsg = "Cannot read github user name from URL";
var DCghRepoUrlError = -30;
var DCghRepoUrlErrorMsg = "Cannot read github repo name from URL";
// Given a github repo URL, extract user and repo
var FFgitUrlToUserRepo = function FFgitUrlToUserRepo(PVurl) {
    var LVlastColon = PVurl.lastIndexOf(':');
    var LVlastSlash = PVurl.lastIndexOf('/');
    var LVlastDot = PVurl.lastIndexOf('.');
    if (LVlastColon <= 0 || LVlastSlash <= 0 || LVlastDot <= 0) { return {
        MMrc : DCurlError, MMmsg : DCurlErrorMsg, MMdata : PVurl }; }
    var LVghUser = PVurl.slice(LVlastColon + 1, LVlastSlash);
    var LVghRepo = PVurl.slice(LVlastSlash + 1, LVlastDot);
    if (! RegExp("^[-a-zA-Z0-9_]{2,25}$").test(LVghUser)) { return {
        MMrc : DCghUserUrlError, MMmsg : DCghUserUrlErrorMsg, MMdata : PVurl }; }
    if (! RegExp("^[-a-zA-Z0-9_]{2,50}$").test(LVghRepo)) { return {
        MMrc : DCghRepoUrlError, MMmsg : DCghRepoUrlErrorMsg, MMdata : PVurl }; }
    return { MMrc : 0, MMghUser : LVghUser, MMghRepo : LVghRepo };
}

// Fetches a git URL (if necessary) and caches it
// Does not update (pull) repo if it exists
// returns PVk(error, repo)
var FFgitURL = function FFgitURL(PVurl, PVk) {
    if (GVrepoCache.hasOwnProperty(PVurl)) {
        console.log('cache of ' + PVurl + ' is ' + GVrepoCache[PVurl]);
        return PVk(0, GVrepoObjectCache[PVurl]);
    }
    // "https://git@github.com:dbpokorny/autoclave.git"
    var LVghUserRepo = FFgitUrlToUserRepo(PVurl);
    if (LVghUserRepo.MMrc) {
        return PVk(LVghUserRepo, null);
    }
    var LVrepoPath = ("ghcache/" + LVghUserRepo.MMghUser + "/" + 
            LVghUserRepo.MMghRepo);
    var LVgit = RRgit(LVrepoPath);
    LVgit.status(function (PVe, PVstatus) {
        if (PVe) {
            RRgit.clone(PVurl, LVrepoPath, function (PVe2, PVrepo) {
                if (PVe2) {
                    console.log("error: " + PVe2);
                    return PVk(PVe2, null);
                } else {
                    console.log('cloned ' + PVurl + ' to ' + LVrepoPath);
                    GVrepoCache[PVurl] = LVrepoPath;
                    GVrepoObjectCache[PVurl] = PVrepo;
                    return PVk(0, PVrepo);
                }
            });
        } else {
            console.log('loaded local cache from disk for ' + PVurl + ' at ' +
                LVrepoPath);
            GVrepoCache[PVurl] = LVrepoPath;
            GVrepoObjectCache[PVurl] = LVgit;
            return PVk(0, LVgit);
        }
    });
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
    }
    FFwtHelper(PVroot);
};

var FFmakeFileUrl = function FFmakeFileUrl(PVpath) {
    assert(PVpath.slice(PVpath.length - 3) == ".js");
    assert(PVpath.slice(0,8) == 'ghcache/');
    return 'git@github.com:' + PVpath.slice(8);
};

var FFtest = function FFtest(PVgitURL) {
    FFgitURL(PVgitURL, function (PVe, PVr) {
        if (PVe) {
            console.log(PVe);
        } else {
            console.log(PVr);
            FFwalkTreeSync(GVrepoCache[PVgitURL], function (PVx) {
                if (PVx.slice(PVx.length - 3) == ".js") {
                    console.log('javascript file found, checking...');
                    var LVfileUrl = FFmakeFileUrl(PVx);
                    RRtree.MMfullBatch(LVfileUrl,
                        function (PVerror, PVfiles) {
                        if (PVerror) {
                            console.log(PVerror);
                        }
                        console.log('wrote files: ' + PVfiles);
                    });
                }
            });
        }
    });
};

if (require.main === module && process.argv.length >= 3) {
    FFtest(process.argv[2]);
}

// FFtest('git@github.com:benoitvallon/react-native-nw-react-calculator.git');
// FFtest('git@github.com:botwillacceptanything/botwillacceptanything.git');

module.exports = {
    MMgitURL : FFgitURL,
    MMwalkTreeSync : FFwalkTreeSync,
    MMtest : FFtest
};
