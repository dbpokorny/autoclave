"use strict";

var RRtoken = require("./token.js");
var RRtable = require("./table.js");
var assert = require("assert");

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

var RRfs = require('fs');

var FFdeepFlatten = function FFdeepFlatten(PVx) {
    var LVresult = [];
    var FFdfHelper = function FFdfHelper(PVn) {
        if (PVn instanceof Array) {
            var LVi;
            for (LVi = 0; LVi < PVn.length; LVi += 1) {
                FFdfHelper(PVn[LVi]);
            }
        } else {
            LVresult.push(PVn);
        }
    };
    FFdfHelper(PVx);
    return LVresult;
};

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

var FFtest = function FFtest(PVfilename) {
    RRfs.readFile(PVfilename, 'utf8', function (err, data) {
        if (err) {
            console.log(err);
            return;
        }
        var LVbundle = FFtree(data);
        if (LVbundle.MMrc != 0) {
            console.log(LVbundle);
            return;
        }
        console.log(data);
        console.log("# Word Tree");
        var LVword = LVbundle.MMword.toString().replace(RegExp(",","g")," ");
        console.log(LVword);
        console.log("# Member data");
        var LVmember = LVbundle.MMdata4.toString().replace(RegExp(",","g")," ");
        console.log(LVmember);
        console.log("# Draft data");
        var LVdraft = FFformatDraft(LVbundle.MMdata5);
        console.log(LVdraft);
    });
};

if (require.main === module && process.argv.length >= 3) {
    FFtest(process.argv[2]);
}

module.exports = {
    FFassertWordDigest : FFassertWordDigest,
    FFtestTreeVar : FFtestTreeVar,
    FFtree: FFtree
};
