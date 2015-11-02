// - It is an error to both define and use a variable in a scope if the use comes
//   before the definition
// - The syntax "if (...) var v;" is invalid
// - The syntax "for (var x = 0; ..." is invalid
// - Any compound statement (CS) introduces a new scope which is identified by an
//   offset and length corresponding to the extent of "{ ... }" in the source code

var RRtoken = require("./token.js");
var RRtable = require("./table.js");
var FFformatTokenRef = RRtable.MMformatTokenRef;
var assert = require("assert");

function FFscopeParse(PVinput) {
    var LVtokSym = RRtoken.MMtokSym(PVinput);
    if (LVtokSym == -1) {
        console.log("MMtokSym failed");
        return -1;
    }
    var LVsymbols = LVtokSym.MMsymbols;
    var LVtokens = LVtokSym.MMtokens;
    // console.log(LVsymbols);
    // console.log(LVtokens);
    var LVsyntax = RRtable.MMtestParse(LVsymbols, LVtokens);
    if (LVsyntax == -1) {
        return -1;
    }
    return {
        MMsyntax : LVsyntax,
        MMtokens : LVtokens,
        MMsymbols : LVsymbols
    };
};

function FFdeepFlatten(PVx) {
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

function FFformatScope(PVtree) {
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
}

function FFformatHTML(PVtree) {
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
}

// Use a hash "#" prefix for definitions in order to avoid confusion when
// LVdefName == toString and so on
var FFwalkTree = function FFwalkTree(PVtree) {
    var LVscopeTree = [];
    var LVstack = [LVscopeTree];
    var LVparams = null;
    var LVscopeStack = [['undefined']];
    var LVdefStack = [{'#console':'global','#module':'global','#Array':'global',
        '#Math':'global','#Object':'global','#undefined':'global',
        '#process':'global','#require':'global'}];
    var LVtokenRefLinks = {};
    // compile a list of undefined variables
    var LVundef = [];
    var FFwalkHelper = function FFwalkHelper (PVexpr) {
        if (! (PVexpr instanceof Array)) {
            LVstack[LVstack.length-1].push(PVexpr);
            return;
        }
        // update definitions
        if (PVexpr.length >= 2 && PVexpr[0] == '(' && PVexpr[1] == 'def') {
            var LVatLoc = PVexpr[2].indexOf('@');
            assert(LVatLoc > 0);
            var LVdefName = PVexpr[2].slice(0,LVatLoc);
            LVdefStack[LVdefStack.length - 1]['#' + LVdefName] = PVexpr[2];
        }
        var LVelt = [];
        LVstack[LVstack.length-1].push(LVelt);
        LVstack.push(LVelt);
        if (PVexpr.length == 0) {
            LVstack.pop();
            return; 
        }
        // set up use
        var LVuseFlag = 0;
        var LVuseData = [];
        if (PVexpr.length >= 2 && PVexpr[0] == '(' && PVexpr[1] == 'use') {
            LVuseFlag = 1;
            var LVatLoc = PVexpr[2].indexOf('@');
            assert(LVatLoc > 0);
            var LVuseName = PVexpr[2].slice(0,LVatLoc);
            var LVi;
            var LVfoundScope = 0;
            for (LVi = LVdefStack.length - 1; LVi >= 0; LVi -= 1) {
                if (LVdefStack[LVi].hasOwnProperty('#' + LVuseName)) {
                    var LVlink = LVdefStack[LVi]['#' + LVuseName];
                    LVuseData = ['->',LVlink];
                    LVtokenRefLinks[PVexpr[2]] = LVlink;
                    LVfoundScope = 1;
                    break;
                }
            }
            if (! LVfoundScope) {
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
        if (PVexpr[0][0] == '{') {
            var LVi;
            LVscopeStack.push(PVexpr);
            LVdefStack.push({});
            if (LVparams != null) {
                for (LVi = 0; LVi < LVparams.length; LVi += 1) {
                    var LVparam = LVparams[LVi];
                    var LVatLoc = LVparam.indexOf('@');
                    assert(LVatLoc > 0);
                    var LVdefName = LVparam.slice(0,LVatLoc);
                    LVdefStack[LVdefStack.length-1]['#' + LVdefName] = LVparam;
                }
                LVparams = null;
            }
            for (LVi = 0; LVi < PVexpr.length; LVi += 1) {
                FFwalkHelper(PVexpr[LVi]);
            }
            LVscopeStack.pop();
            LVdefStack.pop();
        } else {
            var LVi;
            for (LVi = 0; LVi < PVexpr.length; LVi += 1) {
                if (LVuseFlag && PVexpr[LVi] == ')') {
                    LVuseData.forEach(function (PVx) { LVelt.push(PVx); });
                }
                FFwalkHelper(PVexpr[LVi]);
            }
        }
    };
    FFwalkHelper(PVtree);
    return {
        MMrc : 0,
        MMscopeTree : LVscopeTree,
        MMundef : LVundef,
        MMtokenRefLinks : LVtokenRefLinks
    };
};

var RRfs = require('fs');

function FFtest(PVfilename) {
    assert(typeof PVfilename == "string");
    RRfs.readFile(PVfilename, 'utf8', function (err, data) {
        if (err) {
            console.log("Unable to read file: " + PVfilename);
            return;
        }
        var LVparse = FFscopeParse(data);
        if (LVparse == -1) {
            console.log("FFscopeParse failed");
            return;
        }
        var LVsyntax = LVparse.MMsyntax;
        var LVtokens = LVparse.MMtokens;
        var LVsymbols = LVparse.MMsymbols;
        console.log(data);
        console.log("# Scope data");
        LVwalkResult = FFwalkTree(LVsyntax.MMdata3);
        var LVscopeTree = LVwalkResult.MMscopeTree;
        console.log(FFformatScope(LVscopeTree));
        if (LVwalkResult.MMundef.length > 0 ) {
            console.log("# Undefined variables");
            console.log(LVwalkResult.MMundef);
        }
        var LVtokenRefLinks = LVwalkResult.MMtokenRefLinks;
        // console.log(LVtokenRefLinks);
        // console.log(JSON.stringify(LVscopeTree));
        
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
        var LVhtml = FFformatHTML(LVparse2.MMdata6);
        console.log(LVhtml);
        var LVheader = ('<html><head>' +
                '<style>' +
                '.hiFunction {color:#40ffff;}' +
                '.hiIdentifier {color:#40ffff;}' +
                '.hiStatement {color:#ffff60;}' +
                '.hiRepeat {color:#ffff60;}' +
                '</style></head>' +
                '<body style="background-color: black; color: white; font-family:Courier; font-size:14px;">');
        var LVfooter = '</body></html>';
        RRfs.writeFile('draft2.html',LVheader + LVhtml + LVfooter);
    });
};

if (require.main === module) {
    FFtest("./table.js");
}

module.exports = {
    'FFscopeParse': FFscopeParse
};

