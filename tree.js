var RRtoken = require("./token.js");
var RRtable = require("./table.js");
var assert = require("assert");

function FFtree(PVinput) {
    var LVtokSym = RRtoken.MMtokSym(PVinput);
    if (LVtokSym == -1) {
        console.log("MMtokSym failed");
        return -1;
    }
    var LVsymbols = LVtokSym.MMsymbols;
    var LVtokens = LVtokSym.MMtokens;
    assert(LVsymbols != undefined);
    // console.log(LVsymbols);
    assert(LVtokens != undefined);
    // console.log(LVtokens);
    var LVsyntax = RRtable.MMtestParse(LVsymbols, LVtokens);
    if (LVsyntax == -1) {
        return -1;
    }
    return LVsyntax;
};

function FFassertTreeDigest(PVsrc,PVexpected) {
    var LVactual = FFtree(PVsrc).MMtree + "";
    if (LVactual != PVexpected) {
        console.log("Unexpected source code digest");
        console.log(PVsrc);
        console.log(PVexpected);
        console.log(LVactual);
        assert(false);
    }
};

function FFtestTreeVar() {
    FFassertTreeDigest("var x;","var,x");
    FFassertTreeDigest("var x = 10;","var,x,=,10");
    FFassertTreeDigest("var x = '';","var,x,=,''");
    FFassertTreeDigest("var x = 'e';","var,x,=,'e'");
    FFassertTreeDigest("var x = y + z;","var,x,=,y,add,z");
    FFassertTreeDigest("var x = y + (z / w);","var,x,=,y,add,(,z,div,w,)");
    FFassertTreeDigest("var x = function (x) { return x; };",
            "var,x,=,function(,x,),{,return,x,}");
    FFassertTreeDigest("if (x == 1) { break; }","if,(,x,eqeq,1,),{,break,}");
    FFassertTreeDigest('console.log("foo" + x);','console,.,log,(,"foo",add,x,)');
    FFassertTreeDigest(
    'var f = function (x,y) {' +
    '    return x[y];' +
    '};',"var,f,=,function(,x,y,),{,return,x,[,y,],}");
    FFassertTreeDigest('{"foo":"bar",1:"baz",qux:"quux"};',
            '{,"foo",:,"bar",1,:,"baz",qux,:,"quux",}');
    FFassertTreeDigest('throw x;',"throw,x");
    FFassertTreeDigest('if (1) { throw x; }',"if,(,1,),{,throw,x,}");
};

FFtestTreeVar();

var RRfs = require('fs');

// FFtree(src).MMdata3.toString().replace(/,/g," ")

function FFdeepFlatten(PVx) {
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

function FFformatDraft(PVdraftTree) {
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

function FFtest(PVfilename) {
    RRfs.readFile(PVfilename, 'utf8', function (err, data) {
        if (! err) {
            var LVtree = FFtree(data);
            if (LVtree != -1) {
                console.log(data);
                console.log("# Member data");
                var LVmember = LVtree.MMdata4.toString().replace(RegExp(",","g")," ");
                console.log(LVmember);
                console.log("# Draft data");
                var LVdraft = FFformatDraft(LVtree.MMdata5);
                console.log(LVdraft);
            }
        }
    });
};

if (require.main === module) {
    FFtest("./table.js");
}

module.exports = {
    FFassertTreeDigest : FFassertTreeDigest,
    FFtestTreeVar : FFtestTreeVar,
    FFtree: FFtree
};
