"use strict";

var RRtoken = require("./token.js");
var RRtable = require("./table.js");
var assert = require("assert");
var RRfs = require('fs');
var RRpath = require("path");
var RRutil = require("util");

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
// - It is an error to both define and use a variable in a scope if the use comes
//   before the definition
// - The syntax "if (...) var v;" is invalid
// - The syntax "for (var x = 0; ..." is invalid
// - Any compound statement (CS) introduces a new scope which is identified by an
//   offset and length corresponding to the extent of "{ ... }" in the source code
// 
var FFformatTokenRef = RRtable.MMformatTokenRef;

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
var DCdefErrorDesc = "definition for variable exists in enclosing scope: ";

// Walk syntax tree and extract def-use data
var FFwalkTree = function FFwalkTree(PVtree) {
    var LVscopeTree = [];
    var LVstack = [LVscopeTree];
    var LVparams = null;
    var LVscopeStack = [['undefined']];
    var LVdefStack = [{
        '#console':'global',
        '#decodeURIComponent':'global',
        '#escape':'global',
        '#module':'global',
        '#process':'global',
        '#require':'global',
        '#undefined':'global',
        '#unescape':'global',
        '#Array':'global',
        '#JSON':'global',
        '#Math':'global',
        '#Object':'global',
        '#RegExp':'global'
    }];
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
                MMdata : LVwalkResult
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
    var LVmdHelper = function LVmdHelper () {
        if (LVpartials.length == 0) {
            return PVk(null, LVcreated);
        }
        var LVpartial = LVpartials[0];
        RRfs.exists(LVpartial, function (PVexists) {
            if (! PVexists) {
                RRfs.mkdir(function (PVerror) {
                    if (PVerror) {
                        return PVk(PVerror, LVcreated);
                    }
                    LVpartials = LVpartials.slice(1);
                    return LVmdHelper();
                });
            }
        });
    };
};

// Build a bridge to the file
var FFbridgeFile = function FFbridgeFile(PVpath, PVdata) {
    RRfs.writeFile(PVpath, PVdata,
        function (PVerror) {
            if (PVerror) {
                return FFmakeDirs(PVpath, function (PVerror, PVdirs) {
                    if (! PVerror) {
                        RRfs.writeFile(PVpath, PVdata);
                    }
                });
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

// PVk(error, draft)
var FFtreeDraft = function FFtreeDraft(PVfilename, PVk) {
    assert(PVk.length == 2);
    RRfs.readFile(PVfilename, 'utf8', function (PVerror, PVdata) {
        if (PVerror) {
            return PVk(PVerror, null);
        }
        var LVbundle = FFtree(PVdata);
        if (LVbundle.MMrc != 0) {
            return PVk(LVbundle, null);
        }
        var LVdraft = FFformatDraft(LVbundle.MMdata5);
        var LVruntimePath = RRpath.resolve('.') + '/runtime.js';
        var LVheader = (
            '"use strict";\n' +
            'var ACruntime = require("' + LVruntimePath + '");\n' +
            'var ACgetItem = ACruntime.MMgetItem;\n' +
            'var ACsetItem = ACruntime.MMsetItem;\n' +
            'require = ACruntime.MMrequire;\n' +
            '\n'
        );
        return PVk(null, LVheader + LVdraft);
    });
};

var DCfileUrlError = -10;
var DCfileUrlErrorMsg = "Cannot read file URL";
var DCfileUrlSegmentError = -20;
var DCfileUrlSegmentErrorMsg = "Invalid pathname segment";
// Given a github file URL, return the main path to the local
// (it may or may not exist)
var FFfileUrlToLocal = function (PVurl) {
    if (PVurl.slice(PVurl.length - 3) != ".js") {
        return { MMrc : DCfileUrlError, MMmsg : DCfileUrlErrorMsg,
            MMurl : PVurl
        };
    }
    PVurl = PVurl.slice(0,PVurl.length - 3);
    var LVlastColon = PVurl.lastIndexOf(':');
    if (LVlastColon <= 0) {
        return { MMrc : DCfileUrlError, MMmsg : DCfileUrlErrorMsg,
            MMurl : PVurl
        };
    }
    var LVpathSegments = PVurl.slice(LVlastColon + 1).split('/');
    if (LVpathSegments.length == 0) {
        return { MMrc : DCfileUrlError, MMmsg : DCfileUrlErrorMsg,
            MMurl : PVurl
        };
    }
    var LVi;
    for (LVi = 0; LVi < LVpathSegments.length; LVi += 1) {
        if (! RegExp("^[-a-zA-Z0-9_]{2,50}$").test(LVpathSegments[LVi])) {
            return { MMrc : DCfileUrlSegmentError,
                MMmsg : DCfileUrlSegmentErrorMsg, MMsegment : LVpathSegments[LVi]
            };
        }
    }
    return { MMrc : 0, MMrootPath : PVurl.slice(LVlastColon + 1) };
};


// perform all batch operations for the file identified by url PVurl
// calls PVk (error, list of files written)
// Note that this may return before the files are actually written
var FFfullBatch = function FFfullBatch(PVurl, PVk) {
    assert(PVk.length == 2);
    var LVparseUrl = FFfileUrlToLocal(PVurl);
    if (LVparseUrl.MMrc) {
        return PVk(LVparseUrl, []);
    }
    var LVpathname = LVparseUrl.MMrootPath;
    var LVfilename = "ghcache/" + LVpathname + ".js";
    FFfullScopeTest(LVfilename, function (PVerror, PVscope) {
        if (PVerror) {
            var LVerrorPath = 'acbuild/error/' + LVpathname;
            var LVerrorData = RRutil.format(PVerror);
            FFbridgeFile(LVerrorPath, LVerrorData);
            return PVk(PVerror, [LVerrorPath]);
        }
        FFtreeDraft(LVfilename, function (PVerror2, PVjs) {
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
            return PVk(null, [LVscopePath, LVhtmlPath, LVjsPath]);
        });
    });
};

var FFfullMain = function FFfullMain(PVurl) {
    FFfullBatch(PVurl, function (PVerror, PVfiles) {
        if (PVerror) {
            console.log(PVerror);
        }
        console.log("wrote files: " + PVfiles);
    });
};

// Usage: node tree.js git@github.com:user/repo/path/to/file.js

if (require.main === module && process.argv.length >= 3) {
    FFfullMain(process.argv[2]);
}

module.exports = {
    FFassertWordDigest : FFassertWordDigest,
    FFtree: FFtree,
    MMscopeParse: FFscopeParse,
    MMbridgeFile: FFbridgeFile,
    MMfullBatch : FFfullBatch,
};
