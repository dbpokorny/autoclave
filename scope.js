// - It is an error to both define and use a variable in a scope if the use comes
//   before the definition
// - The syntax "if (...) var v;" is invalid
// - The syntax "for (var x = 0; ..." is invalid
// - Any compound statement (CS) introduces a new scope which is identified by an
//   offset and length corresponding to the extent of "{ ... }" in the source code

"use strict";

var assert = require("assert");
var util = require("util");

var RRtoken = require("./token.js");
var RRtable = require("./table.js");
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

var FFformatHTML = function FFformatHTML(PVtree) {
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
    return LVindented.join(" ");
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
    var LVdefStack = [{'#console':'global',
        '#module':'global',
        '#Array':'global',
        '#Math':'global',
        '#Object':'global',
        '#undefined':'global',
        '#unescape':'global',
        '#process':'global',
        '#require':'global',
        '#RegExp':'global'}];
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

var RRfs = require('fs');

var FFrootFilename = function FFrootFilename(PVfilename) {
    var LVdotIndex = PVfilename.lastIndexOf('.');
    assert(LVdotIndex > 0);
    return PVfilename.slice(0,LVdotIndex);
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

// Check whether or not the named file follows the scope rules
// PVfilename - name of input file
//
// Calls PVk(PVerror)
var FFtest = function FFtest(PVfilename, PVk) {
    assert(typeof PVfilename == "string");
    RRfs.readFile(PVfilename, 'utf8', function (PVerror, PVdata) {
        if (PVerror) {
            return PVk({
                MMrc : DCfileError,
                MMmsg : "Unable to read file: " + PVfilename
            });
        }
        var LVparse = FFscopeParse(PVdata);
        if (LVparse.MMrc != 0) {
            return PVk({
                MMrc : DCscopeParseError,
                MMmsg : "scopeParse failed",
                MMdata : LVparse
            });
        }
        var LVsyntax = LVparse.MMsyntax;
        var LVwalkResult = FFwalkTree(LVsyntax.MMdata3);
        if (LVwalkResult.MMrc != 0) {
            return PVk({
                MMrc : LVwalkResult.MMrc,
                MMmsg : "walkTree failed",
                MMdata : LVwalkResult
            });
        }
        if (LVwalkResult.MMundef.length > 0 ) {
            return PVk({
                MMrc : DCundefVarError,
                MMmsg : "undefined variables",
                MMdata : LVwalkResult,
                MMdata2 : LVwalkResult.MMundef
            });
        }
        PVk(null);
    });
};


// PVfilename - name of input file
//
// Calls PVk(PVerror, PVscope)
//
// PVscope.tree - tree of def-use data
// PVscope.html - html data
var FFfullTest = function FFfullTest(PVfilename, PVk) {
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
                MMdata : LVwalkResult
            }, null);
        }
        if (LVwalkResult.MMundef.length > 0 ) {
            // console.log("# Undefined variables");
            // console.log(LVwalkResult.MMundef);
            return PVk({
                MMrc : DCundefVarError,
                MMmsg : "undefined variables",
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
        var LVhtml = FFformatHTML(LVparse2.MMhtml);
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
        PVk(null, {
            MMtree : LVwalkResult.MMscopeTree,
            MMhtml : LVheader + LVhtml + LVfooter
        });
    });
};

// Given a path to a file, make all intermediate directories if needed
var FFmakeDirs = function FFmakeDirs (PVpath) {
    var LVslashes = []; // indexes of slashes in PVpash
    var LVi;
    for (LVi = 0; LVi < PVpath.length; LVi += 1) {
        if (PVpath[LVi] == '/') {
            LVslashes.push(LVi);
        }
    }
    for (LVi = 0; LVi < LVslashes.length; LVi += 1) {
        var LVpartial = PVpath.slice(0,LVslashes[LVi])
        if (! RRfs.existsSync(LVpartial)) {
            RRfs.mkdirSync(LVpartial);
        }
    }
};

// Build a bridge to the file
var FFbridgeFile = function FFbridgeFile(PVpath, PVdata) {
    RRfs.writeFile(PVpath, PVdata,
        function (PVerror) {
            if (PVerror) {
                FFmakeDirs(PVpath);
                RRfs.writeFile(PVpath, PVdata);
            }
        }
    );
};

var FFmain = function FFmain(PVfile) {
    FFfullTest(PVfile, function (PVerror, PVscope) {
        if (PVerror) {
            console.log(PVerror);
            return;
        }
        var LVscopePath = 'acbuild/scope/' + FFrootFilename(PVfile);
        var LVscopeData = FFformatScope(PVscope.MMtree);
        FFbridgeFile(LVscopePath, LVscopeData);
        var LVhtmlPath = 'acbuild/html/' + FFrootFilename(PVfile) + '.html';
        var LVhtmlData = PVscope.MMhtml;
        FFbridgeFile(LVhtmlPath, LVhtmlData);
    });
};

// Calls PVk( list of files written )
var FFbatch = function FFbatch(PVfile, PVk) {
    FFfullTest(PVfile, function (PVerror, PVscope) {
        if (PVerror) {
            var LVerrorPath = 'acbuild/error/' + FFrootFilename(PVfile);
            var LVerrorData = util.format(PVerror);
            FFbridgeFile(LVerrorPath, LVerrorData);
            return PVk([LVerrorPath]);
        }
        var LVscopePath = 'acbuild/scope/' + FFrootFilename(PVfile);
        var LVscopeData = FFformatScope(PVscope.MMtree);
        FFbridgeFile(LVscopePath, LVscopeData);
        var LVhtmlPath = 'acbuild/html/' + FFrootFilename(PVfile) + '.html';
        var LVhtmlData = PVscope.MMhtml;
        FFbridgeFile(LVhtmlPath, LVhtmlData);
        return PVk([LVscopePath, LVhtmlPath]);
    });
};

if (require.main === module && process.argv.length >= 3) {
    FFmain(process.argv[2]);
}

module.exports = {
    MMscopeParse: FFscopeParse,
    MMbridgeFile: FFbridgeFile,
    MMbatch : FFbatch,
    MMtest : FFtest
};

