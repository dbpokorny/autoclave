// 1. User provides a git repo URL to fetch and cache. URL must be in the form of
//    git@NETWORK:user/repo.git. For example NETWORK=github.com will clone to
//    cache/gh/user/repo. This creates an entry in GVrepoCache. Next, walk the
//    repo file tree, and for all files ending in '.js', make an entry in
//    GVjsFiles, which maps file URL (a file URL looks like
//    git@github.com:user/repo/path/to/file.js) to its git repo URL.  This is the
//    list of candidate files to translate.
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
//    it pulls the latest from the git network. Next, it gets a list of the files
//    in acbuild/ to determine which need to be updated. Upon request, it will
//    rebuild those files.

var RRfs = require('fs');
var RRgit = require('gift');
var RRtree = require('./tree.js');

var assert = require('assert');

// map file URL to path to translated file in acbuild/
var GVfileCache = {};

// map git URL to pathname to {
//     MMpathname : root of local clone
//     MMnet : network code
//     MMobject : repo object
// }
var GVrepoCache = {};

// map git URL to list of paths to ".js" files in the local cache
var GVjsFiles = {};

// - if core memory cache exists for URL, use it
// - if local repo exists for URL and 'git status' works, load it into core memory
//   cache and use it
// - clone git URL and load it into core memory cache
// does not update (pull) repo if it exists
// returns PVk(error, repo)
var FFgitURL = function FFgitURL(PVurl, PVk) {
    assert(PVk.length == 2);
    if (GVrepoCache.hasOwnProperty(PVurl)) {
        console.log('cache of ' + PVurl + ' is ' + GVrepoCache[PVurl].MMpathname);
        var LVrepo = GVrepoCache[PVurl].MMobject;
        return PVk(null, LVrepo);
    }
    var LVparse = RRtree.MMparseGitUrl(PVurl);
    if (LVparse.MMrc) {
        return PVk(LVparse, null);
    }
    var LVrepoPath = ("cache/" + LVparse.MMnet + "/" + LVparse.MMuser + "/" +
            LVparse.MMrepo);
    var LVrepo = RRgit(LVrepoPath);
    LVrepo.status(function (PVe, PVstatus) {
        if (PVe) {
            RRgit.clone(PVurl, LVrepoPath, function (PVe2, PVrepo) {
                if (PVe2) {
                    console.log("error: " + PVe2);
                    return PVk(PVe2, null);
                } else {
                    console.log('cloned ' + PVurl + ' to ' + LVrepoPath);
                    GVrepoCache[PVurl] = {
                        MMnet : LVparse.MMnet,
                        MMpathname : LVrepoPath,
                        MMobject : PVrepo
                    };
                    return PVk(null, PVrepo);
                }
            });
        } else {
            console.log('loaded local cache from disk for ' + PVurl + ' at ' +
                LVrepoPath);
            GVrepoCache[PVurl] = {
                MMnet : LVparse.MMnet,
                MMpathname : LVrepoPath,
                MMobject : LVrepo
            };
            return PVk(null, LVrepo);
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
    var LVsegments = PVpath.split('/');
    assert(LVsegments.length >= 2);
    assert(LVsegments[0] == 'cache');
    var LVnet = LVsegments[1];
    assert(RRtree.MMnetDomain.hasOwnProperty(LVnet));
    return 'git@' + RRtree.MMnetDomain[LVnet] + ':' + PVpath.slice(9);
};

// Takes a git URL
var FFtest = function FFtest(PVurl) {
    FFgitURL(PVurl, function (PVe, PVr) {
        if (PVe) {
            console.log(PVe);
            return;
        }
        // console.log(PVr);
        PVr.pull(function (PVerror) {
            if (PVerror) {
                console.log(PVerror);
                return;
            }
            FFwalkTreeSync(GVrepoCache[PVurl].MMpathname, function (PVx) {
                if (PVx.slice(PVx.length - 3) == ".js") {
                    // console.log('javascript file found, checking...');
                    var LVfileUrl = FFmakeFileUrl(PVx);
                    RRtree.MMbatch(LVfileUrl,
                        function (PVerror, PVfiles) {
                        if (PVerror) {
                            // console.log(PVerror);
                        }
                        console.log('wrote files: ' + PVfiles);
                    });
                }
            });
        });
    });
};

if (require.main.id === module.id && process.argv.length >= 3) {
    FFtest(process.argv[2]);
}

// FFtest('git@github.com:benoitvallon/react-native-nw-react-calculator.git');
// FFtest('git@github.com:botwillacceptanything/botwillacceptanything.git');

module.exports = {
    MMgitURL : FFgitURL,
    MMwalkTreeSync : FFwalkTreeSync,
    MMtest : FFtest
};
