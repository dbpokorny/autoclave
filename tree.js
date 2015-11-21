"use strict";

var RRtoken = require("./token.js");
var RRtable = require("./table.js");
var assert = require("assert");
var RRfs = require('fs');
var RRpath = require("path");
var RRutil = require("util");
var RRacutil = require("./acutil.js");
var FFcheckFilePath = RRacutil.FFcheckFilePath;

var FFdeepFlatten = function FFdeepFlatten(PVx) {
    var LVresult = [];
    var FFdfHelper = function FFdfHelper(PVn) {
        if (PVn instanceof Array) {
            var LVi;
            for (LVi = 0; LVi < PVn.length; LVi += 1) {
                FFdfHelper(PVn[LVi]);
            }
        } else {
            if (PVn != '') {
                LVresult.push(PVn);
            }
        }
    };
    FFdfHelper(PVx);
    return LVresult;
};

var FFformatHtml = function FFformatHtml(PVtree) {
    var LVpreIndent = FFdeepFlatten(PVtree);
    var LVindented = [];
    var LVi;
    var LVindentLevel = 0;
    for (LVi = 0; LVi < LVpreIndent.length; LVi += 1) {
        var LVt = LVpreIndent[LVi];
        if (LVt == '{' || LVt == '[') {
            LVindentLevel += 1;
            LVindented.push(LVt);
        } else if (LVt == '}' || LVt == ']') {
            LVindentLevel -= 1;
            LVindented.push(LVt);
        } else if (LVt == '***INDENT***') {
            var LVj = 0;
            if (LVi + 1 < LVpreIndent.length && (LVpreIndent[LVi + 1][0] == '}' ||
                        LVpreIndent[LVi + 1] == ']')) {
                LVj = 1;
            }
            for (; LVj < LVindentLevel; LVj += 1) {
                LVindented.push('&nbsp;&nbsp;&nbsp;&nbsp;');
            }
        } else {
            LVindented.push(LVt);
        }
    }
    var LVheader = ('<html><head>' +
            '<script type="application/javascript" src="/jquery-2.1.4.js"></script>' +
            '<script>' +
'var FFtoggleElt = function FFtoggleElt(PVid) { $("#" + PVid).f };' +
            '</script>' +
            '<style>' +
            'a { text-decoration: none;}' +
            '.hiFunction {color:#40ffff;}' +
            '.hiIdentifier {color:#40ffff;}' +
            '.hiNormal {color:#ffffff;}' +
            '.hiUndefVar {color:#ff0000;}' +
            '.hiParam {border: 1px solid green;}' +
            '.hiStatement {color:#ffff60;}' +
            '.hiRepeat {color:#ffff60;}' +
            '</style></head>' +
            '<body style="background-color: black; ' +
            'color: white; ' +
            'font-family:Courier; ' +
            'font-size:14px;">');
    var LVfooter = '</body></html>';
    return LVheader + LVindented.join(" ") + LVfooter;
};

// Scope
// S1 It is an error to both define and use a variable in a scope if the use comes
//    before the definition
// S2 The syntax "if (...) var v;" is invalid
// S3 The syntax "for (var x = 0; ..." is invalid
// S4 Any compound statement (CS) introduces a new scope which is identified by an
//    offset and length corresponding to the extent of "{ ... }" in the source
//    code
// S6 Replace require(pathname) with require(URL) which takes a URL argument
var FFformatTokenRef = RRtable.MMformatTokenRef;

var DCidError = -10;

var FFscopeParse = function FFscopeParse(PVinput) {
    var LVtokSym = RRtoken.MMtokSym(PVinput);
    if (LVtokSym.MMrc != 0) {
        return LVtokSym;
    }
    var LVsymbols = LVtokSym.MMsymbols;
    var LVtokens = LVtokSym.MMtokens;

    // console.log(LVsymbols);
    // console.log(LVtokens);
    var LVsyntax = RRtable.MMtestParse(LVsymbols, LVtokens);
    if (LVsyntax.MMrc != 0) {
        return LVsyntax;
    }
    return {
        MMrc : 0,
        MMsyntax : LVsyntax,
        MMtokens : LVtokens,
        MMsymbols : LVsymbols
    };
};

var FFdefStackLookup = function FFdefStackLookup(PVdefStack, PVuseName) {
    var LVi;
    for (LVi = PVdefStack.length - 1; LVi >= 0; LVi -= 1) {
        if (PVdefStack[LVi].hasOwnProperty('#' + PVuseName)) {
            var LVlink = PVdefStack[LVi]['#' + PVuseName];
            return { MMrc : 0, MMlink : LVlink };
        }
    }
    return { MMrc : -1 };
};

var DCdefError = -10;
var DCdefErrorDesc = "invalid duplicate or shadow variable: ";

// Walk syntax tree and extract def-use data
var FFwalkTree = function FFwalkTree(PVtree) {
    var LVscopeTree = [];
    var LVstack = [LVscopeTree];
    var LVparams = null;
    var LVscopeStack = [['undefined']];
    var LVdefStack = [{}];
    RRtable.MMbuiltinStrings.forEach(function (PVx) {
        LVdefStack[0]['#AG' + PVx] = 'global';
    });
    var LVtokenRefLinks = {};
    // compile a list of undefined variables
    var LVundef = [];
    var FFwalkHelper = function FFwalkHelper (PVexpr) {
        if (! (PVexpr instanceof Array)) {
            LVstack[LVstack.length - 1].push(PVexpr);
            return { MMrc : 0 };
        }
        // update definitions
        if (PVexpr.length >= 2 && PVexpr[0] == '(' && PVexpr[1] == 'def') {
            var LVatLoc = PVexpr[2].indexOf('@');
            assert(LVatLoc > 0);
            var LVdefName = PVexpr[2].slice(0,LVatLoc);
            // disallow the creation of a binding that shadows another
            if (FFdefStackLookup(LVdefStack,LVdefName).MMrc == 0) {
                return {
                    MMrc : DCdefError,
                    MMerror : DCdefErrorDesc + PVexpr[2]
                };
            }
            LVdefStack[LVdefStack.length - 1]['#' + LVdefName] = PVexpr[2];
        }
        var LVelt = [];
        LVstack[LVstack.length - 1].push(LVelt);
        LVstack.push(LVelt);
        if (PVexpr.length == 0) {
            LVstack.pop();
            return { MMrc : 0 };
        }
        // set up use
        var LVuseFlag = 0;
        var LVuseData = [];
        if (PVexpr.length >= 2 && PVexpr[0] == '(' && PVexpr[1] == 'use') {
            LVuseFlag = 1;
            var LVatLoc = PVexpr[2].indexOf('@');
            assert(LVatLoc > 0);
            var LVuseName = PVexpr[2].slice(0,LVatLoc);
            var LVdef = FFdefStackLookup(LVdefStack, LVuseName);
            if (LVdef.MMrc == 0) {
                LVtokenRefLinks[PVexpr[2]] = LVdef.MMlink;
                LVuseData = ['->',LVdef.MMlink];
            } else {
                LVundef.push(PVexpr[2]);
                LVuseData = ['->','???'];
            }
        }
        // set up lambda
        var LVlambdaFlag = 0;
        if (PVexpr.length >= 2 && PVexpr[0] == '(' && PVexpr[1] == 'lambda' && PVexpr[3] != ')') {
            LVparams = PVexpr[3];
            assert(LVparams != null);
        }
        // visit elements
        var LVi;
        if (PVexpr[0][0] == '{') {
            LVscopeStack.push(PVexpr);
            LVdefStack.push({});
            if (LVparams != null) {
                for (LVi = 0; LVi < LVparams.length; LVi += 1) {
                    var LVparam = LVparams[LVi];
                    var LVatLoc = LVparam.indexOf('@');
                    assert(LVatLoc > 0);
                    var LVdefName = LVparam.slice(0,LVatLoc);
                    // disallow the creation of a binding that shadows another
                    if (FFdefStackLookup(LVdefStack, LVdefName).MMrc == 0) {
                        return {
                            MMrc : DCdefError,
                            MMerror : DCdefErrorDesc + LVparam
                        };
                    }
                    LVdefStack[LVdefStack.length - 1]['#' + LVdefName] = LVparam;
                }
                LVparams = null;
            }
            for (LVi = 0; LVi < PVexpr.length; LVi += 1) {
                var LVwhResult = FFwalkHelper(PVexpr[LVi]);
                if (LVwhResult.MMrc != 0) {
                    return LVwhResult;
                }
            }
            LVscopeStack.pop();
            LVdefStack.pop();
        } else {
            for (LVi = 0; LVi < PVexpr.length; LVi += 1) {
                if (LVuseFlag && PVexpr[LVi] == ')') {
                    LVuseData.forEach(function (PVx) { LVelt.push(PVx); });
                }
                var LVwhResult = FFwalkHelper(PVexpr[LVi]);
                if (LVwhResult.MMrc != 0) {
                    return LVwhResult;
                }
            }
        }
        return { MMrc : 0 };
    };
    var LVwhResult = FFwalkHelper(PVtree);
    if (LVwhResult.MMrc != 0) {
        return LVwhResult;
    }
    return {
        MMrc : 0,
        MMscopeTree : LVscopeTree,
        MMundef : LVundef,
        MMtokenRefLinks : LVtokenRefLinks
    };
};

var FFassertWalk = function FFassertWalk(PVinput, PVrc) {
    var LVparse = FFscopeParse(PVinput);
    assert(LVparse.MMrc == 0);
    var LVsyntax = LVparse.MMsyntax;
    var LVwalkResult = FFwalkTree(LVsyntax.MMdata3);
    assert(LVwalkResult.MMrc == PVrc);
};

FFassertWalk("var q = function e(a,b) { var a = 10; };", DCdefError);
FFassertWalk("var e = function e(a,b) {" +
        "var f = function f(b,c) { ; }; };", DCdefError);

var DCfileError = -10;
var DCscopeParseError = -20;
var DCwalkTreeError = -30;
var DCundefVarError = -40;

// PVfilename - name of input file
//
// Calls PVk(PVerror, PVoutput)
//
// PVoutput.tree - tree of def-use data
// PVoutput.html - html data
var FFfullScopeTest = function FFfullScopeTest(PVfilename, PVk) {
    assert(PVk.length == 2);
    assert(typeof PVfilename == "string");
    RRfs.readFile(PVfilename, 'utf8', function (PVerror, PVdata) {
        if (PVerror) {
            // console.log("Unable to read file: " + PVfilename);
            return PVk({
                MMrc : DCfileError,
                MMmsg : "Unable to read file: " + PVfilename
            }, null);
        }
        var LVparse = FFscopeParse(PVdata);
        if (LVparse.MMrc != 0) {
            // console.log("FFscopeParse failed");
            // console.log(LVparse);
            return PVk({
                MMrc : DCscopeParseError,
                MMmsg : "scopeParse failed",
                MMfile : PVfilename,
                MMdata : LVparse
            }, null);
        }
        var LVsyntax = LVparse.MMsyntax;
        var LVtokens = LVparse.MMtokens;
        var LVsymbols = LVparse.MMsymbols;
        var LVwalkResult = FFwalkTree(LVsyntax.MMdata3);
        if (LVwalkResult.MMrc != 0) {
            // console.log("walkTree failed");
            // console.log(LVwalkResult);
            return PVk({
                MMrc : LVwalkResult.MMrc,
                MMmsg : "walkTree failed",
                MMfile : PVfilename,
                MMdata : LVwalkResult
            }, null);
        }
        if (LVwalkResult.MMundef.length > 0 ) {
            // console.log("# Undefined variables");
            // console.log(LVwalkResult.MMundef);
            return PVk({
                MMrc : DCundefVarError,
                MMmsg : "undefined variables",
                MMfile : PVfilename,
                MMdata : LVwalkResult.MMundef
            }, null);
        }
        var LVtokenRefLinks = LVwalkResult.MMtokenRefLinks;
        // console.log(LVtokenRefLinks);
        
        // annotate tokens with links
        var LVi;
        for (LVi = 0; LVi < LVtokens.length; LVi += 1) {
            var LVtoken = LVtokens[LVi];
            var LVtokenRef = FFformatTokenRef(LVtoken);
            if (LVtokenRefLinks.hasOwnProperty(LVtokenRef)) {
                LVtoken.MMlink = LVtokenRefLinks[LVtokenRef];
            }
        }
        // console.log(LVtokens);

        // Generate HTML
        var LVparse2 = RRtable.MMtestParse2(LVsymbols, LVtokens);
        assert(LVparse2.MMrc == 0);
        return PVk(null, {
            MMtree : LVwalkResult.MMscopeTree,
            MMhtmlTree : LVparse2.MMhtml
        });
    });
};

// Given a path to a file, make all intermediate directories if needed
// When finished, call PVk(error, dirsCreated) with an array of strings giving the
// pathnames of the directories that were created
var FFmakeDirs = function FFmakeDirs (PVpath, PVk) {
    // console.log("makedirs " + PVpath);
    assert(PVk.length == 2);
    var LVslashes = []; // indexes of slashes in PVpash
    var LVi;
    for (LVi = 0; LVi < PVpath.length; LVi += 1) {
        if (PVpath[LVi] == '/') {
            LVslashes.push(LVi);
        }
    }
    var LVpartials = [];
    var LVcreated = [];
    for (LVi = 0; LVi < LVslashes.length; LVi += 1) {
        var LVpartial = PVpath.slice(0,LVslashes[LVi]);
        LVpartials.push(LVpartial);
    }
    LVpartials.push(PVpath);
    var LVmdHelper = function LVmdHelper () {
        if (LVpartials.length == 0) {
            return PVk(null, LVcreated);
        }
        var LVpartial = LVpartials[0];
        return RRfs.mkdir(LVpartial, function (PVerror) {
            LVpartials = LVpartials.slice(1);
            return LVmdHelper();
        });
    };
    return LVmdHelper();
};

var FFremoveLastPathComponent = function FFremoveLastPathComponent (PVpath) {
    var LVlastSlash = PVpath.lastIndexOf('/');
    return PVpath.slice(0, LVlastSlash);
};

// Build a bridge to the file
// PVk(error)
var FFbridgeFile = function FFbridgeFile(PVpath, PVdata, PVk) {
    if (PVk == undefined) {
        PVk = function (PVx) { if (PVx) { console.log(PVx); } };
    }
    RRfs.writeFile(PVpath, PVdata,
        function (PVerror) {
            if (PVerror) {
                var LVdirPath = FFremoveLastPathComponent(PVpath);
                return FFmakeDirs(LVdirPath, function (PVe2, PVdirs) {
                    if (PVe2) {
                        return PVk(PVe2);
                    } else {
                        return RRfs.writeFile(PVpath, PVdata, PVk);
                    }
                });
            } else {
                PVk(null);
            }
        }
    );
};

//
//  //
//  // Tree
//  //
//

var FFtree = function FFtree(PVinput) {
    var LVtokSym = RRtoken.MMtokSym(PVinput);
    if (LVtokSym.MMrc != 0) {
        return LVtokSym;
    }
    var LVsymbols = LVtokSym.MMsymbols;
    var LVtokens = LVtokSym.MMtokens;
    assert(LVsymbols != undefined);
    // console.log(LVsymbols);
    assert(LVtokens != undefined);
    // console.log(LVtokens);
    var LVsyntax = RRtable.MMtestParse(LVsymbols, LVtokens);
    if (LVsyntax.MMrc != 0) {
        return LVsyntax;
    }
    return LVsyntax;
};

var FFassertWordDigest = function FFassertWordDigest(PVsrc,PVexpected) {
    var LVtree = FFtree(PVsrc);
    if (LVtree.MMrc != 0) {
        console.log("FFtree failed");
        assert(false);
    }
    var LVactual = LVtree.MMword + "";
    if (LVactual != PVexpected) {
        console.log("Unexpected source code digest");
        console.log(PVsrc);
        console.log(PVexpected);
        console.log(LVactual);
        assert(false);
    }
};

var FFtestTreeVar = function FFtestTreeVar() {
    FFassertWordDigest("var x;","var,x");
    FFassertWordDigest("var x = 10;","var,x,=,10");
    FFassertWordDigest("var x = '';","var,x,=,''");
    FFassertWordDigest("var x = 'e';","var,x,=,'e'");
    FFassertWordDigest("var x = y + z;","var,x,=,y,add,z");
    FFassertWordDigest("var x = y + (z / w);","var,x,=,y,add,(,z,div,w,)");
    FFassertWordDigest("var x = function (x) { return x; };",
            "var,x,=,function(,x,),{,return,x,}");
    FFassertWordDigest("if (x == 1) { break; }","if,(,x,eqeq,1,),{,break,}");
    FFassertWordDigest('console.log("foo" + x);','console,.,log,(,"foo",add,x,)');
    FFassertWordDigest(
    'var f = function (x,y) {' +
    '    return x[y];' +
    '};',"var,f,=,function(,x,y,),{,return,x,[,y,],}");
    FFassertWordDigest('{"foo":"bar",1:"baz",qux:"quux"};',
            '{,"foo",:,"bar",1,:,"baz",qux,:,"quux",}');
    FFassertWordDigest('throw x;',"throw,x");
    FFassertWordDigest('if (1) { throw x; }',"if,(,1,),{,throw,x,}");
};

FFtestTreeVar();

var FFformatDraft = function FFformatDraft(PVdraftTree) {
    var LVpreIndent = FFdeepFlatten(PVdraftTree);
    var LVindented = [];
    var LVi;
    var LVindentLevel = 0;
    for (LVi = 0; LVi < LVpreIndent.length; LVi += 1) {
        var LVt = LVpreIndent[LVi];
        if (LVt == '{') {
            LVindentLevel += 1;
            LVindented.push(LVt);
        } else if (LVt == '}') {
            LVindentLevel -= 1;
            LVindented.push(LVt);
        } else if (LVt == '***INDENT***') {
            var LVj = 0;
            if (LVi + 1 < LVpreIndent.length && LVpreIndent[LVi + 1] == '}') {
                LVj = 1;
            }
            for (; LVj < LVindentLevel; LVj += 1) {
                LVindented.push('    ');
            }
        } else {
            LVindented.push(LVt);
        }
    }
    return LVindented.join(" ");
};

var FFformatScope = function FFformatScope(PVtree) {
    var LVpreIndent = FFdeepFlatten(PVtree);
    var LVindented = [];
    var LVi;
    var LVindentLevel = 0;
    for (LVi = 0; LVi < LVpreIndent.length; LVi += 1) {
        var LVt = LVpreIndent[LVi];
        if (LVt[0] == '{' || LVt == '(') {
            LVindentLevel += 1;
            LVindented.push(LVt);
        } else if (LVt[0] == '}' || LVt == ')') {
            LVindentLevel -= 1;
            LVindented.push(LVt);
        } else if (LVt == '***INDENT***') {
            var LVj = 0;
            if (LVi + 1 < LVpreIndent.length && (LVpreIndent[LVi + 1][0] == '}' ||
                        LVpreIndent[LVi + 1] == ')')) {
                LVj = 1;
            }
            for (; LVj < LVindentLevel; LVj += 1) {
                LVindented.push('    ');
            }
        } else {
            LVindented.push(LVt);
        }
    }
    return LVindented.join(" ");
};

// map network code to network domain
var GVnetDomain = { gh : 'github.com', gl : 'gitlab.com' };
// map domain to network code
var GVnetworkCode = { "github.com" : "gh", "gitlab.com" : "gl" };

var DCfileUrlError = -10;
var DCfileUrlErrorMsg = "Cannot read file URL";
var DCunknownDomainError = -30;
var DCunknownDomainErrorMsg = "Unknown domain";
// Extract the network, user, repo, and pathname from a git file URL
var FFparseFileUrl = function FFparseFileUrl(PVurl) {
    var LVcolon = PVurl.indexOf(":");
    if (LVcolon == -1 || PVurl.slice(0,4) != "git@") {
        return { MMrc : DCfileUrlError, MMmsg : DCfileUrlErrorMsg,
            MMurl : PVurl
        };
    }
    var LVdomain = PVurl.slice(4,LVcolon);
    if (! GVnetworkCode.hasOwnProperty(LVdomain)) {
        return { MMrc : DCunknownDomainError, MMmsg : DCunknownDomainErrorMsg,
            MMurl : PVurl
        };
    }
    var LVsegments = PVurl.slice(LVcolon + 1).split("/");
    if (LVsegments.length < 2) {
        return { MMrc : DCfileUrlError, MMmsg : DCfileUrlErrorMsg,
            MMurl : PVurl
        };
    }
    var LVcheckPath = FFcheckFilePath(LVsegments);
    if (LVcheckPath.MMrc) {
        return { MMrc : DCfileUrlError, MMdata : LVcheckPath };
    }
    return { MMrc : 0, MMnet : GVnetworkCode[LVdomain],
        MMuser : LVsegments[0], MMrepo : LVsegments[1],
        MMpathname : PVurl.slice(LVcolon + 1) };
};

var DCgitUrlError = -10;
var DCgitUrlErrorMsg = "Cannot read git URL";
var DCnameError = -20;
var DCnameErrorMsg = "Invalid user/repo name";
// Given a git URL, extract user and repo
var FFparseGitUrl = function FFparseGitUrl(PVurl) {
    if (PVurl.slice(PVurl.length - 4) != '.git' ||
            PVurl.slice(0,4) != 'git@') {
        return { MMrc : DCgitUrlError, MMmsg : DCgitUrlErrorMsg,
            MMdata : PVurl };
    }
    var LVlastColon = PVurl.lastIndexOf(':');
    var LVlastSlash = PVurl.lastIndexOf('/');
    var LVlastDot = PVurl.lastIndexOf('.');
    if (LVlastColon <= 0 || LVlastSlash <= 0 || LVlastDot <= 0) { return {
        MMrc : DCgitUrlError, MMmsg : DCgitUrlErrorMsg, MMdata : PVurl };
    }
    var LVdomain = PVurl.slice(4, LVlastColon);
    if (! GVnetworkCode.hasOwnProperty(LVdomain)) {
        return { MMrc : DCunknownDomainError, MMmsg : DCunknownDomainErrorMsg,
            MMurl : PVurl
        };
    }
    var LVuser = PVurl.slice(LVlastColon + 1, LVlastSlash);
    var LVrepo = PVurl.slice(LVlastSlash + 1, LVlastDot);
    var LVuserREok = RegExp("^[-.a-zA-Z0-9_]{2,25}$").test(LVuser);
    var LVuserDDok = LVuser.indexOf('..') == -1;
    var LVrepoREok = RegExp("^[-.a-zA-Z0-9_]{2,25}$").test(LVrepo);
    var LVrepoDDok = LVrepo.indexOf('..') == -1;
    if (! (LVuserREok && LVuserDDok && LVrepoREok && LVrepoDDok)) { return {
        MMrc : DCnameError, MMmsg : DCnameErrorMsg, MMdata : PVurl };
    }
    return { MMrc : 0, MMnet : GVnetworkCode[LVdomain],
        MMuser : LVuser, MMrepo : LVrepo };
};


var GVheaderCache = null;

// PVk(error, draft)
var FFtreeDraft = function FFtreeDraft(PVurl, PVfilename, PVk) {
    // valid PVurl
    var LVparse = FFparseFileUrl(PVurl);
    if (LVparse.MMrc) {
        return PVk(LVparse, null);
    }
    // valid PVfilename
    var LVcheckPath = FFcheckFilePath(PVfilename.split('/'));
    if (LVcheckPath.MMrc) {
        return PVk(LVcheckPath, null);
    }
    // valid PVk
    assert(PVk.length == 2);
    var LVuser = LVparse.MMuser;
    var LVrepo = LVparse.MMrepo;
    var LVnet = LVparse.MMnet;
    var LVdomain = GVnetDomain[LVnet];
    var LVfsRoot = RRpath.resolve('filesys/' + LVnet + '/' + LVuser + '/' + LVrepo);
    RRfs.readFile(PVfilename, 'utf8', function (PVerror, PVdata) {
        if (PVerror) {
            return PVk(PVerror, null);
        }
        var LVbundle = FFtree(PVdata);
        if (LVbundle.MMrc != 0) {
            return PVk(LVbundle, null);
        }
        var LVdraft = FFformatDraft(LVbundle.MMdata5);
        var LVpreHeader = (
'var ACreqRoot = "' + RRpath.resolve('acbuild/js/cache') + '";\n' +
'var ACfsRoot = "' + LVfsRoot + '";\n' +
'var ACdomain = "' + LVdomain + '";\n' +
'// var ACnet = "' + LVnet + '";\n' +
'var ACuser = "' + LVuser + '";\n' +
'var ACrepo = "' + LVrepo + '";\n' +
'var ACfilename = "' + PVfilename + '";\n' +
'var ACnetworkCode = ' + JSON.stringify(GVnetworkCode) + ';\n' +
'// var ACnetDomain = ' + JSON.stringify(GVnetDomain) + ';\n');
        var LVfooter = (
'if (AGmodule["`exports`"]) {\n' +
'    module.exports = AGmodule["`exports`"];\n' +
'}\n');
        if (GVheaderCache) {
            return PVk(null, LVpreHeader + GVheaderCache + LVdraft + LVfooter);
        }
        RRfs.readFile('tmpl/header.js', function (PVe, PVd) {
            if (PVe) {
                console.log("cannot find required file tmpl/header.js");
                assert(false);
            }
            GVheaderCache = PVd;
            return PVk(null, LVpreHeader + GVheaderCache + LVdraft + LVfooter);
        });
    });
};


var DCfileExtError = -10;
var DCfileExtErrorMsg = "invalid file extension";
// perform all batch operations for the file identified by url PVurl
// calls PVk (error, list of files written)
// Note that this may return before the files are actually written
var FFbatch = function FFbatch(PVurl, PVk) {
    assert(PVk.length == 2);
    if (PVurl.slice(PVurl.length - 3) != '.js') {
        return PVk({MMrc : DCfileExtError, MMmsg : DCfileExtErrorMsg}, []);
    }
    var PVrootUrl = PVurl.slice(0,PVurl.length - 3);
    var LVparse = FFparseFileUrl(PVrootUrl);
    if (LVparse.MMrc) {
        return PVk(LVparse, []);
    }
    var LVpathname = "cache/" + LVparse.MMnet + "/" + LVparse.MMpathname;
    var LVinFilename = LVpathname + ".js";
    FFfullScopeTest(LVinFilename, function (PVerror, PVscope) {
        if (PVerror) {
            var LVerrorPath = 'acbuild/error/' + LVpathname;
            var LVerrorData = RRutil.format(PVerror);
            FFbridgeFile(LVerrorPath, LVerrorData);
            return PVk(PVerror, [LVerrorPath]);
        }
        FFtreeDraft(PVurl, LVinFilename, function (PVerror2, PVjs) {
            if (PVerror2) {
                var LVerrorPath = 'acbuild/error/' + LVpathname;
                var LVerrorData = RRutil.format(PVerror2);
                FFbridgeFile(LVerrorPath, LVerrorData);
                return PVk(PVerror2, [LVerrorPath]);
            }
            var LVscopePath = 'acbuild/scope/' + LVpathname;
            var LVscopeData = FFformatScope(PVscope.MMtree);
            FFbridgeFile(LVscopePath, LVscopeData);
            var LVhtmlPath = 'acbuild/html/' + LVpathname + '.html';
            var LVhtmlData = FFformatHtml(PVscope.MMhtmlTree);
            FFbridgeFile(LVhtmlPath, LVhtmlData);
            var LVjsPath = 'acbuild/js/' + LVpathname + '.js';
            FFbridgeFile(LVjsPath, PVjs);
            FFmakeDirs('filesys/' + LVparse.MMnet + "/" + LVparse.MMuser + "/" +
                LVparse.MMrepo, function (PVe, PVf) {;});
            return PVk(null, [LVscopePath, LVhtmlPath, LVjsPath]);
        });
    });
};

// no return value
var FFbatchEpilogue = function (PVe, PVfiles) {
    if (PVe) {
        console.log(PVe);
        console.log("wrote files: " + PVfiles);
        process.exit(1);
    }
    console.log("wrote files: " + PVfiles);
};

// no return value
var FFfullMainPath = function FFfullMainPath(PVurl) {
    RRfs.readFile(PVurl, function (PVe, PVd) {
        if (PVe) { console.log(PVe); return; }
        var LVpath = 'cache/gh/__local__/__local__/' + PVurl;
        FFbridgeFile(LVpath, PVd, function (PVe2) {
            if (PVe2) { console.log(PVe2); return; }
            console.log('copy ' + PVurl + ' to ' + LVpath);
            var LVnewUrl = 'git@github.com:__local__/__local__/' + PVurl;
            FFbatch(LVnewUrl, FFbatchEpilogue);
        });
    });
};

// no return value
var FFfullMain = function FFfullMain(PVurl) {
    if (PVurl.indexOf('@') != -1) {
        FFbatch(PVurl, FFbatchEpilogue);
    }
    RRfs.exists(PVurl, function (PVexists) {
        if (PVexists) {
            FFfullMainPath(PVurl);
        } else {
            FFbatch(PVurl, FFbatchEpilogue);
        }
    });
};


// Usage: node tree.js git@github.com:user/repo/path/to/file.js
// Usage: node tree.js file
if (require.main.id === module.id && process.argv.length >= 3) {
    FFfullMain(process.argv[2]);
}

module.exports = {
    MMassertWordDigest : FFassertWordDigest,
    MMtree: FFtree,
    MMscopeParse: FFscopeParse,
    MMbridgeFile: FFbridgeFile,
    MMbatch : FFbatch,
    MMmakeDirs : FFmakeDirs,
    MMparseGitUrl : FFparseGitUrl,
    MMnetDomain : GVnetDomain 
};
