// 1. User provides a git repo URL to fetch and cache. URL must be in the form of
//    ssh://git@github.com/user/repo.git. It will be cloned to
//    ghcache/user/repo. In addition, an entry is made in GVrepoCache.
//    1.1 walk the repo file tree. For all files ending in '.js', an entry is
//        made in GVinputFileRepo, which maps file URL (a file URL looks like
//        ssh://git@github.com/user/repo/path/to/file.js) to its git repo URL.
//        This is the list of candidate files to translate. In addition it is
//        added to GVinputFiles which maps file URL to path to local file.
//
// 2. User queries:
//    2.1 has the following git URL been cached yet?
//    2.1 has the local git repo been walked yet?
//    2.2 list the files in a directory
//    2.3 list all files in the tree (git ls-files)
//    2.4 for a given javascript file, is it suitable for translation?
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

var fs = require('fs');
var git = require('gift');
var assert = require('assert');

// map file URL to path to local file
var GVinputFiles = {};

// map javascript file URL to git repo URL
var GVinputFileRepo = {};

// map file URL to path to translated file in acbuild/
var GVfileCache = {};

// map git URL to pathname to root of local clone
var GVrepoCache = {};

// map git URL to repo object
var GVrepoObjectCache = {};

// map git URL to list of pathnames to JS files it contains
var GVjsFiles = {};

// Fetches a git URL (if necessary) and caches it
// Does not update (pull) repo if it exists
// returns PVk(error, repo)
var FFgitURL = function FFgitURL(PVurl, PVk) {
    if (GVrepoCache.hasOwnProperty(PVurl)) {
        // console.log('cache of ' + PVurl + ' is ' + GVrepoCache[PVurl]);
        return PVk(0, GVrepoObjectCache[PVurl]);
    }
    // "https://git@github.com:dbpokorny/autoclave.git"
    var LVlastColon = PVurl.lastIndexOf(':');
    assert(LVlastColon > 0);
    var LVlastSlash = PVurl.lastIndexOf('/');
    assert(LVlastSlash > 0);
    var LVlastDot = PVurl.lastIndexOf('.');
    assert(LVlastDot > 0);
    var LVghUser = PVurl.slice(LVlastColon + 1, LVlastSlash);
    var LVghRepo = PVurl.slice(LVlastSlash + 1, LVlastDot);
    assert(LVghUser.length > 0);
    assert(RegExp("^[-a-zA-Z0-9_]{2,25}$").test(LVghUser));
    assert(LVghRepo.length > 0);
    assert(RegExp("^[a-zA-Z0-9_]{2,25}$").test(LVghRepo));
    var LVrepoPath = "ghcache/" + LVghUser + "/" + LVghRepo;
    var LVgit = git(LVrepoPath);
    LVgit.status(function (PVe, PVstatus) {
        if (PVe) {
            git.clone(PVurl, LVrepoPath, function (PVe2, PVrepo) {
                if (PVe2) {
                    console.log("error: " + PVe2);
                    return PVk(PVe2, null);
                } else {
                    console.log('cloned ' + PVurl + ' to ' + LVrepoPath);
                    console.log(Object.keys(PVrepo))
                    GVrepoCache[PVurl] = LVrepoPath;
                    GVrepoObjectCache[PVurl] = PVrepo;
                    return PVk(0, PVrepo);
                }
            });
        } else {
            GVrepoCache[PVurl] = LVrepoPath;
            GVrepoObjectCache[PVurl] = LVgit;
            return PVk(0, LVgit);
        }
    });
};

// Call PVf on all files in the repository named at PVroot
// skip "node_modules"
var FFwalkTree = function FFwalkTree(PVroot, PVf) {
    var FFwtHelper = function FFwtHelper(PVpath) {
        var LVstats = fs.statSync(PVpath);
        if (LVstats.isDirectory()) {
            var LVls = fs.readdirSync(PVpath).filter(function (PVname) {
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

module.exports = {
    MMgitURL : FFgitURL,
    MMwalkTree : FFwalkTree
};
