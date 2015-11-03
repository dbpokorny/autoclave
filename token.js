// Parse a string
// Return an array of tokens
//
// 1 token data
//   1.1 token type
//   1.2 line number
//   1.3 column number
//   1.4 length in chars
//   1.5 raw string data
//   1.6 offset within input
//
// 2 token type codes
//   2.1 whitespace
//   2.2 punctuation
//   2.3 keyword
//   2.4 number
//   2.5 string
//   2.6 identifier
//

var assert = require("assert");

var DCwhitespace = 'DCwhitespace';
var DCpunct = 'DCpunct';
var DCnumber = 'DCnumber';
var DCstring = 'DCstring';
var DCidORkw = 'DCidORkw';

var DCcommentTypeCode = 'DCcommentTypeCode';
var DCnewlineTypeCode = 'DCnewlineTypeCode';
var DCwhitespaceTypeCode = 'DCwhitespaceTypeCode';
var DCpunctTypeCode = 'DCpunctTypeCode';
var DCintTypeCode = 'DCintTypeCode';
var DCfloatTypeCode = 'DCfloatTypeCode';
var DCstrTypeCode = 'DCstrTypeCode';
var DCidTypeCode = 'DCidTypeCode';
var DCkeywordTypeCode = 'DCkeywordTypeCode';

var GVpuncts = {};
GVpuncts["{"] = 1;
GVpuncts["}"] = 1;
GVpuncts["("] = 1;
GVpuncts[")"] = 1;
GVpuncts["["] = 1;
GVpuncts["]"] = 1;

GVpuncts["<"] = 1;
GVpuncts[">"] = 1;
GVpuncts["<="] = 1;
GVpuncts[">="] = 1;

GVpuncts["=="] = 1;
GVpuncts["!="] = 1;
GVpuncts["==="] = 1;
GVpuncts["!=="] = 1;

GVpuncts["<<"] = 1;
GVpuncts[">>"] = 1;
GVpuncts[">>>"] = 1;

GVpuncts["="] = 1;
GVpuncts["*="] = 1;
GVpuncts["/="] = 1;
GVpuncts["%="] = 1;
GVpuncts["+="] = 1;
GVpuncts["-="] = 1;
GVpuncts["<<="] = 1;
GVpuncts[">>="] = 1;
GVpuncts[">>>="] = 1;
GVpuncts["&="] = 1;
GVpuncts["^="] = 1;
GVpuncts["|="] = 1;

GVpuncts["?"] = 1;
GVpuncts[":"] = 1;

GVpuncts["|"] = 1;
GVpuncts["&"] = 1;
GVpuncts["^"] = 1;
GVpuncts["~"] = 1;

GVpuncts["||"] = 1;
GVpuncts["&&"] = 1;
GVpuncts["!"] = 1;

GVpuncts["+"] = 1;
GVpuncts["-"] = 1;
GVpuncts["*"] = 1;
GVpuncts["/"] = 1;
GVpuncts["%"] = 1;

GVpuncts["."] = 1;
GVpuncts[","] = 1;
GVpuncts[";"] = 1;

var GVpunctInitChars = {};

var FFmakePunctInitChars = function FFmakePunctInitChars() {
    Object.keys(GVpuncts).forEach(function (PVk) {
        GVpunctInitChars[PVk.slice(0,1)] = 1;
    });
};

FFmakePunctInitChars();

var GVdigits = {};
GVdigits['0'] = 1;
GVdigits['1'] = 1;
GVdigits['2'] = 1;
GVdigits['3'] = 1;
GVdigits['4'] = 1;
GVdigits['5'] = 1;
GVdigits['6'] = 1;
GVdigits['7'] = 1;
GVdigits['8'] = 1;
GVdigits['9'] = 1;

var GVhexDigits = {};
GVhexDigits['a'] = 1;
GVhexDigits['A'] = 1;
GVhexDigits['b'] = 1;
GVhexDigits['B'] = 1;
GVhexDigits['c'] = 1;
GVhexDigits['C'] = 1;
GVhexDigits['d'] = 1;
GVhexDigits['D'] = 1;
GVhexDigits['e'] = 1;
GVhexDigits['E'] = 1;
GVhexDigits['f'] = 1;
GVhexDigits['F'] = 1;

var FFmakeHexDigits = function FFmakeHexDigits() {
    Object.keys(GVdigits).forEach(function (PVk) {
        GVhexDigits[PVk] = 1;
    });
};

FFmakeHexDigits();

var GVletters = {};
GVletters['a'] = 1;
GVletters['b'] = 1;
GVletters['c'] = 1;
GVletters['d'] = 1;
GVletters['e'] = 1;
GVletters['f'] = 1;
GVletters['g'] = 1;
GVletters['h'] = 1;
GVletters['i'] = 1;
GVletters['j'] = 1;
GVletters['k'] = 1;
GVletters['l'] = 1;
GVletters['m'] = 1;
GVletters['n'] = 1;
GVletters['o'] = 1;
GVletters['p'] = 1;
GVletters['q'] = 1;
GVletters['r'] = 1;
GVletters['s'] = 1;
GVletters['t'] = 1;
GVletters['u'] = 1;
GVletters['v'] = 1;
GVletters['w'] = 1;
GVletters['x'] = 1;
GVletters['y'] = 1;
GVletters['z'] = 1;
GVletters['A'] = 1;
GVletters['B'] = 1;
GVletters['C'] = 1;
GVletters['D'] = 1;
GVletters['E'] = 1;
GVletters['F'] = 1;
GVletters['G'] = 1;
GVletters['H'] = 1;
GVletters['I'] = 1;
GVletters['J'] = 1;
GVletters['K'] = 1;
GVletters['L'] = 1;
GVletters['M'] = 1;
GVletters['N'] = 1;
GVletters['O'] = 1;
GVletters['P'] = 1;
GVletters['Q'] = 1;
GVletters['R'] = 1;
GVletters['S'] = 1;
GVletters['T'] = 1;
GVletters['U'] = 1;
GVletters['V'] = 1;
GVletters['W'] = 1;
GVletters['X'] = 1;
GVletters['Y'] = 1;
GVletters['Z'] = 1;

var GVkeywords = {};
GVkeywords['for'] = 1;
GVkeywords['while'] = 1;
GVkeywords['continue'] = 1;
GVkeywords['break'] = 1;
GVkeywords['return'] = 1;
GVkeywords['var'] = 1;

GVkeywords['throw'] = 1;

GVkeywords['function'] = 1;
GVkeywords['typeof'] = 1;
GVkeywords['void'] = 1;
GVkeywords['if'] = 1;
GVkeywords['else'] = 1;

GVkeywords['false'] = 1;
GVkeywords['true'] = 1;
GVkeywords['null'] = 1;

GVkeywords['instanceof'] = 1;

var GVinvalidIds = {};
GVinvalidIds['assign'] = 1;
GVinvalidIds['create'] = 1;
GVinvalidIds['defineProperties'] = 1;
GVinvalidIds['defineProperty'] = 1;
GVinvalidIds['freeze'] = 1;
GVinvalidIds['getNotifier'] = 1;
GVinvalidIds['getOwnPropertyDescriptor'] = 1;
GVinvalidIds['getOwnPropertySymbols'] = 1;
GVinvalidIds['getPrototypeOf'] = 1;
GVinvalidIds['__defineGetter__'] = 1;
GVinvalidIds['__defineSetter__'] = 1;
GVinvalidIds['__lookupGetter__'] = 1;
GVinvalidIds['__lookupSetter__'] = 1;
GVinvalidIds['constructor'] = 1;


var GVstrEscapes = {};
GVstrEscapes["n"] = "\n";
GVstrEscapes["r"] = "\r";
GVstrEscapes["t"] = "\t";

var GVstrChars = {};

GVstrChars[" "] = 1;
GVstrChars["!"] = 1;
GVstrChars['"'] = 1;
GVstrChars["#"] = 1;
GVstrChars["$"] = 1;
GVstrChars["%"] = 1;
GVstrChars["&"] = 1;
GVstrChars["'"] = 1;
GVstrChars["("] = 1;
GVstrChars[")"] = 1;
GVstrChars["*"] = 1;
GVstrChars["+"] = 1;
GVstrChars[","] = 1;
GVstrChars["-"] = 1;
GVstrChars["."] = 1;
GVstrChars["/"] = 1;
GVstrChars["0"] = 1;
GVstrChars["1"] = 1;
GVstrChars["2"] = 1;
GVstrChars["3"] = 1;
GVstrChars["4"] = 1;
GVstrChars["5"] = 1;
GVstrChars["6"] = 1;
GVstrChars["7"] = 1;
GVstrChars["8"] = 1;
GVstrChars["9"] = 1;
GVstrChars[":"] = 1;
GVstrChars[";"] = 1;
GVstrChars["<"] = 1;
GVstrChars["="] = 1;
GVstrChars[">"] = 1;
GVstrChars["?"] = 1;
GVstrChars["@"] = 1;
GVstrChars["A"] = 1;
GVstrChars["B"] = 1;
GVstrChars["C"] = 1;
GVstrChars["D"] = 1;
GVstrChars["E"] = 1;
GVstrChars["F"] = 1;
GVstrChars["G"] = 1;
GVstrChars["H"] = 1;
GVstrChars["I"] = 1;
GVstrChars["J"] = 1;
GVstrChars["K"] = 1;
GVstrChars["L"] = 1;
GVstrChars["M"] = 1;
GVstrChars["N"] = 1;
GVstrChars["O"] = 1;
GVstrChars["P"] = 1;
GVstrChars["Q"] = 1;
GVstrChars["R"] = 1;
GVstrChars["S"] = 1;
GVstrChars["T"] = 1;
GVstrChars["U"] = 1;
GVstrChars["V"] = 1;
GVstrChars["W"] = 1;
GVstrChars["X"] = 1;
GVstrChars["Y"] = 1;
GVstrChars["Z"] = 1;
GVstrChars["["] = 1;
GVstrChars["\\"] = 1;
GVstrChars["]"] = 1;
GVstrChars["^"] = 1;
GVstrChars["_"] = 1;
GVstrChars["`"] = 1;
GVstrChars["a"] = 1;
GVstrChars["b"] = 1;
GVstrChars["c"] = 1;
GVstrChars["d"] = 1;
GVstrChars["e"] = 1;
GVstrChars["f"] = 1;
GVstrChars["g"] = 1;
GVstrChars["h"] = 1;
GVstrChars["i"] = 1;
GVstrChars["j"] = 1;
GVstrChars["k"] = 1;
GVstrChars["l"] = 1;
GVstrChars["m"] = 1;
GVstrChars["n"] = 1;
GVstrChars["o"] = 1;
GVstrChars["p"] = 1;
GVstrChars["q"] = 1;
GVstrChars["r"] = 1;
GVstrChars["s"] = 1;
GVstrChars["t"] = 1;
GVstrChars["u"] = 1;
GVstrChars["v"] = 1;
GVstrChars["w"] = 1;
GVstrChars["x"] = 1;
GVstrChars["y"] = 1;
GVstrChars["z"] = 1;
GVstrChars["{"] = 1;
GVstrChars["|"] = 1;
GVstrChars["}"] = 1;
GVstrChars["~"] = 1;

var DCpunctError = -10;
var DCnumberError = -20;
var DCscanError = -30;
var DCstringError = -40;
var DCinvalidIdError = -50;

// returns { MMrc : result code, MMtokens : list of tokens }
var FFmakeTokens = function FFmakeTokens(PVinput) {
    var LVi = 0;
    var LVtokens = [];
    var LVlineno = 0; // zero-based
    var LVcolno = 0;
    while (true) { // #mainloop
        assert(LVi <= PVinput.length);
        if (LVi == PVinput.length) {
            var LVresult = {};
            LVresult.MMrc = 0;
            LVresult.MMtokens = LVtokens;
            return LVresult;
        }
        assert(LVi < PVinput.length);
        var LVc = PVinput[LVi];

        // double forward slash single-line comment
        if (LVc == "/" && LVi + 1 < PVinput.length && PVinput[LVi + 1] == "/") {
            var LVj = 2;
            while (true) {
                if (LVi + LVj == PVinput.length) {
                    break;
                }
                if (PVinput[LVi + LVj] == '\n') {
                    LVj += 1;
                    break;
                }
                LVj += 1;
            }
            var LVtoken = {}; LVtoken.MMtype = DCcommentTypeCode;
            LVtoken.MMlineno = LVlineno; LVtoken.MMcolno = LVcolno;
            LVtoken.MMlength = LVj; LVtoken.MMoffset = LVi;
            LVtoken.MMchars = PVinput.slice(LVi, LVi + LVj);
            LVtokens.push(LVtoken); LVlineno += 1; LVcolno = 0; LVi += LVj;
            continue; // #mainloop
        }

        // forward slash star multi-line comment
        if (LVc == "/" && LVi + 1 < PVinput.length && PVinput[LVi + 1] == "*") {
            var LVstartLineno = LVlineno;
            var LVstartColno = LVcolno;
            var LVj = 2;
            LVcolno += 2;
            while (true) {
                if (LVi + LVj == PVinput.length) {
                    break;
                }
                if (PVinput[LVi + LVj] == "*" &&
                        LVi + LVj + 1 < PVinput.length &&
                        PVinput[LVi + LVj + 1] == "/") {
                    LVj += 2;
                    LVcolno += 2;
                    break;
                }
                if (PVinput[LVi + LVj] == '\n') {
                    LVj += 1;
                    LVlineno += 1;
                    LVcolno = 0;
                } else {
                    LVj += 1;
                    LVcolno += 1;
                }
            }
            var LVtoken = {}; LVtoken.MMtype = DCcommentTypeCode;
            LVtoken.MMlineno = LVstartLineno; LVtoken.MMcolno = LVstartColno;
            LVtoken.MMlength = LVj; LVtoken.MMoffset = LVi;
            LVtoken.MMchars = PVinput.slice(LVi, LVi + LVj);
            LVtokens.push(LVtoken); LVi += LVj;
            continue; // #mainloop
        }

        // space or tab
        if (LVc == " " || LVc == "\t") {
            var LVtoken = {}; LVtoken.MMtype = DCwhitespaceTypeCode;
            LVtoken.MMlineno = LVlineno; LVtoken.MMcolno = LVcolno;
            LVtoken.MMlength = 1; LVtoken.MMoffset = LVi; LVtoken.MMchars = LVc;
            LVtokens.push(LVtoken); LVcolno += 1; LVi += 1;
            continue; // #mainloop
        }

        // newline
        if (LVc == "\n") {
            var LVtoken = {}; LVtoken.MMtype = DCnewlineTypeCode;
            LVtoken.MMlineno = LVlineno; LVtoken.MMcolno = LVcolno;
            LVtoken.MMlength = 1; LVtoken.MMoffset = LVi; LVtoken.MMchars = LVc;
            LVtokens.push(LVtoken); LVlineno += 1; LVcolno = 0; LVi += 1;
            continue; // #mainloop
        }

        // handle + or -
        if (LVc == '-' || LVc == '+') {
            if (LVi + 1 == PVinput.length) {
                // punctuation
                var LVtoken = {}; LVtoken.MMtype = DCpunctTypeCode;
                LVtoken.MMlineno = LVlineno; LVtoken.MMcolno = LVcolno;
                LVtoken.MMlength = 1; LVtoken.MMoffset = LVi;
                LVtoken.MMchars = LVc; LVtokens.push(LVtoken); LVcolno += 1;
                LVi += 1;
                continue; // #mainloop
            }
            var LVd = PVinput[LVi + 1];
            if (GVdigits[LVd] == 1 || LVd == '.') {
                var LVj = 2;
                var LVhaveDot;
                var LVhaveX = 0;
                if (LVd == '.') {
                    LVhaveDot = 1;
                } else {
                    LVhaveDot = 0;
                }
                var LVlongestNumber = -1;
                while (true) { // #signumloop
                    if (LVj >= 3 || LVhaveDot == 0) {
                        LVlongestNumber = LVj;
                    }
                    if (LVi + LVj == PVinput.length) {
                        break; // #signumloop
                    }
                    LVd = PVinput[LVi + LVj];
                    if (GVdigits[LVd] == 1) {
                        LVj += 1;
                        continue; // #signumloop
                    }
                    if (LVd == "." && LVhaveDot == 0) {
                        LVhaveDot = 1;
                        LVj += 1;
                        continue; // #signumloop
                    }
                    if (LVd == "x" && LVhaveX == 0) {
                        LVhaveX = 1;
                        LVj += 1;
                        continue; // #signumloop
                    }
                    if (GVhexDigits[LVd] == 1 && LVhaveX) {
                        LVj += 1;
                        continue; // #signumloop
                    }
                    break; // #signumloop
                }
                if (LVlongestNumber == -1) {
                    var LVresult = {};
                    LVresult.MMrc = DCnumberError;
                    LVresult.MMerror =
                        "unrecognized number-like fragment at end of input";
                    LVresult.MMlineno = LVlineno;
                    LVresult.MMcolno = LVcolno;
                    return LVresult;
                }
                LVj = LVlongestNumber;
                // number
                var LVtoken = {}; if (LVhaveDot) { LVtoken.MMtype =
                DCfloatTypeCode; } else { LVtoken.MMtype = DCintTypeCode; }
                LVtoken.MMlineno = LVlineno; LVtoken.MMcolno = LVcolno;
                LVtoken.MMlength = LVj; LVtoken.MMoffset = LVi;
                LVtoken.MMchars = PVinput.slice(LVi,LVi+LVj);
                LVtokens.push(LVtoken); LVcolno += 1; LVi += LVj;
                continue; // #mainloop
            }
            // punctuation + - += -=
            var LVtoken = {}; LVtoken.MMtype = DCpunctTypeCode;
            LVtoken.MMlineno = LVlineno; LVtoken.MMcolno = LVcolno;
            LVtoken.MMoffset = LVi;
            var LVj;
            if (LVd == '=') {
                LVj = 2;
                LVtoken.MMchars = LVc + LVd; 
            } else {
                LVj = 1;
                LVtoken.MMchars = LVc;
            }
            LVtoken.MMlength = LVj;
            LVtokens.push(LVtoken); LVcolno += LVj; LVi += LVj;
            continue; // # mainloop
        }
        // end handle + or -

        // punct
        if (GVpunctInitChars[LVc] == 1) {
            // Determine extent of punctuation
            var LVj = 1;
            var LVlongestPunct = -1;
            while (true) { // #punctloop
                var LVpunctCand = PVinput.slice(LVi, LVi + LVj);
                if (GVpuncts[LVpunctCand] == 1) {
                    LVlongestPunct = LVj;
                }
                if (LVi + LVj == PVinput.length) {
                    break; // #punctloop
                }
                if (GVpuncts[LVpunctCand] == 1) {
                    LVj += 1;
                    continue; // # punctloop
                }
                break; // # punctloop
            }
            if (LVlongestPunct == -1) {
                var LVresult = {};
                LVresult.MMrc = DCpunctError;
                LVresult.MMerror =
                    "unrecognized punctuation-like fragment at end of input";
                LVresult.MMlineno = LVlineno;
                LVresult.MMcolno = LVcolno;
                return LVresult;
            }
            LVj = LVlongestPunct;
            // punctuation
            var LVtoken = {}; LVtoken.MMtype = DCpunctTypeCode;
            LVtoken.MMlineno = LVlineno; LVtoken.MMcolno = LVcolno;
            LVtoken.MMlength = LVj; LVtoken.MMoffset = LVi;
            LVtoken.MMchars = PVinput.slice(LVi,LVi+LVj); LVtokens.push(LVtoken);
            LVcolno += LVj; LVi += LVj;
            continue; // # mainloop
        }
        // end punct

        // number
        if (GVdigits[LVc] == 1 || LVc == ".") {
            var LVj = 1;
            var LVhaveDot;
            var LVhaveX = 0;
            if (LVc == ".") {
                LVhaveDot = 1;
            } else {
                LVhaveDot = 0;
            }
            var LVlongestNumber = -1;
            while (true) { // #numberloop
                if (LVj >= 2 || LVhaveDot == 0) {
                    LVlongestNumber = LVj;
                }
                if (LVi + LVj == PVinput.length) {
                    break; // #numberloop
                }
                var LVd = PVinput[LVi + LVj];
                if (GVdigits[LVd] == 1) {
                    LVj += 1;
                    continue; // #numberloop
                }
                if (LVd == "." && LVhaveDot == 0) {
                    LVhaveDot = 1;
                    LVj += 1;
                    continue; // #numberloop
                }
                if (LVd == "x" && LVhaveX == 0) {
                    LVhaveX = 1;
                    LVj += 1;
                    continue; // #numberloop
                }
                if (GVhexDigits[LVd] == 1 && LVhaveX) {
                    LVj += 1;
                    continue; // #numberloop
                }
                break; // #numberloop
            }
            if (LVlongestNumber == -1) {
                var LVresult = {};
                LVresult.MMrc = DCnumberError;
                LVresult.MMerror =
                    "unrecognized number-like fragment at end of input";
                LVresult.MMlineno = LVlineno;
                LVresult.MMcolno = LVcolno;
                return LVresult;
            }
            LVj = LVlongestNumber;
            // number
            var LVtoken = {}; if (LVhaveDot) { LVtoken.MMtype =
                    DCfloatTypeCode; } else { LVtoken.MMtype =
                        DCintTypeCode; }
            LVtoken.MMlineno = LVlineno; LVtoken.MMcolno = LVcolno;
            LVtoken.MMlength = LVj; LVtoken.MMoffset = LVi;
            LVtoken.MMchars = PVinput.slice(LVi, LVi + LVj);
            LVtokens.push(LVtoken); LVcolno += LVj; LVi += LVj;
            continue; // #mainloop
        }
        // end number

        // identifier or keyword
        if (GVletters[LVc] == 1 || LVc == '_') {
            var LVj = 1;
            var LVlongestIdkw = -1;
            while (true) { // # idkwloop
                LVlongestIdkw = LVj;
                if (LVi + LVj == PVinput.length) {
                    break; // # idkwloop
                }
                var LVd = PVinput[LVi + LVj];
                if (GVletters[LVd] == 1 || GVdigits[LVd] == 1 || LVd == "_") {
                    LVj += 1;
                    continue; // # idkwloop
                }
                break; // # idkwloop
            }
            LVj = LVlongestIdkw;
            var LVidkwCand = PVinput.slice(LVi, LVi + LVj);
            if (GVinvalidIds[LVidkwCand] == 1) {
                var LVresult = {};
                LVresult.MMrc = DCinvalidIdError;
                LVresult.MMerror = "Invalid identifier: " + LVidkwCand;
                LVresult.MMlineno = LVlineno;
                LVresult.MMcolno = LVcolno;
                return LVresult;
            }
            var LVtoken = {}; if (GVkeywords[LVidkwCand] == 1) {
                LVtoken.MMtype = DCkeywordTypeCode; } else { LVtoken.MMtype =
                    DCidTypeCode; }
            LVtoken.MMlineno = LVlineno; LVtoken.MMcolno = LVcolno;
            LVtoken.MMlength = LVj; LVtoken.MMoffset = LVi;
            LVtoken.MMchars = LVidkwCand;
            LVtokens.push(LVtoken); LVcolno += LVj; LVi += LVj;
            continue; // #mainloop
        }
        // end identifier or keyword

        // single-quoted string
        if (LVc == "'") {
            var LVj = 1;
            var LVstrVal = []; // the string value is LVstrVal.join("")
            var LVlongestStr = -1; // length of string literal if valid
            while (true) { // #strloop
                assert(LVi + LVj <= PVinput.length);
                if (LVi + LVj == PVinput.length) {
                    break; // #strloop (error)
                }
                var LVd = PVinput[LVi + LVj];
                if (LVd == '\n') {
                    break; // #strloop (error)
                }
                if (LVd == "'") {
                    LVj += 1;
                    LVlongestStr = LVj;
                    break; // #strloop
                }
                if (LVd == '\\') {
                    LVj += 1;
                    if (LVi + LVj == PVinput.length) {
                        break; // #strloop (error)
                    }
                    var LVe = PVinput[LVi + LVj];
                    var LVeVal;
                    if (GVstrEscapes.hasOwnProperty(LVe)) {
                        LVeVal = GVstrEscapes[LVe];
                    } else {
                        LVeVal = LVe;
                    }
                    LVstrVal.push(LVeVal);
                    LVj += 1;
                    continue; // #strloop
                }

                if (GVstrChars[LVd]) {
                    LVstrVal.push(LVd);
                    LVj += 1;
                    continue; // #strloop
                }
                break; // #strloop (error)
            }
            if (LVlongestStr == -1) {
                var LVresult = {};
                LVresult.MMrc = DCstringError;
                LVresult.MMerror = "error scanning string";
                LVresult.MMlineno = LVlineno;
                LVresult.MMcolno = LVcolno;
                return LVresult;
            }
            LVj = LVlongestStr;
            var LVtoken = {}; LVtoken.MMtype = DCstrTypeCode; LVtoken.MMlineno =
                LVlineno; LVtoken.MMcolno = LVcolno; LVtoken.MMlength = LVj;
            LVtoken.MMoffset = LVi; LVtoken.MMchars = PVinput.slice(LVi,LVi+LVj);
            LVtoken.MMstrVal = LVstrVal.join(""); LVtokens.push(LVtoken); LVcolno
                += LVj; LVi += LVj;
            continue; // #mainloop
        }
        // end single-quoted string

        // double-quoted string
        if (LVc == '"') {
            var LVj = 1;
            var LVstrVal = []; // the string value is LVstrVal.join("")
            var LVlongestStr = -1; // length of string literal if valid
            while (true) { // #strloop
                assert(LVi + LVj <= PVinput.length);
                if (LVi + LVj == PVinput.length) {
                    break; // #strloop (error)
                }
                var LVd = PVinput[LVi + LVj];
                if (LVd == '\n') {
                    break; // #strloop (error)
                }
                if (LVd == '"') {
                    LVj += 1;
                    LVlongestStr = LVj;
                    break; // #strloop
                }
                if (LVd == '\\') {
                    LVj += 1;
                    if (LVi + LVj == PVinput.length) {
                        break; // #strloop (error)
                    }
                    var LVe = PVinput[LVi + LVj];
                    var LVeVal;
                    if (GVstrEscapes.hasOwnProperty(LVe)) {
                        LVeVal = GVstrEscapes[LVe];
                    } else {
                        LVeVal = LVe;
                    }
                    LVstrVal.push(LVeVal);
                    LVj += 1;
                    continue; // #strloop
                }

                if (GVstrChars.hasOwnProperty(LVd)) {
                    LVstrVal.push(LVd);
                    LVj += 1;
                    continue; // #strloop
                }
                break; // #strloop (error)
            }
            if (LVlongestStr == -1) {
                var LVresult = {};
                LVresult.MMrc = DCstringError;
                LVresult.MMerror = "error scanning string";
                LVresult.MMlineno = LVlineno;
                LVresult.MMcolno = LVcolno;
                return LVresult;
            }
            LVj = LVlongestStr;
            var LVtoken = {}; LVtoken.MMtype = DCstrTypeCode; LVtoken.MMlineno =
                LVlineno; LVtoken.MMcolno = LVcolno; LVtoken.MMlength = LVj;
            LVtoken.MMoffset = LVi; LVtoken.MMchars = PVinput.slice(LVi,LVi+LVj);
            LVtoken.MMstrVal = LVstrVal.join(""); LVtokens.push(LVtoken); LVcolno
                += LVj; LVi += LVj;
            continue; // #mainloop
        }
        // end double-quoted string

        var LVresult = {};
        LVresult.MMrc = DCscanError;
        LVresult.MMerror = "error scanning input";
        LVresult.MMlineno = LVlineno;
        LVresult.MMcolno = LVcolno;
        return LVresult;
    } // end #mainloop
};

var FFtestScan = function FFtestScan(PVstr) {
    console.log("scan: " + PVstr);
    console.log(FFmakeTokens(PVstr));
    console.log("scan: " + PVstr);
};

var FFtestToken = function FFtestToken() {
    FFtestScan("a");
    FFtestScan("-0");
    FFtestScan("-1");
    FFtestScan("-.");
    FFtestScan("-.1");
    FFtestScan("+");
    FFtestScan("+0");
    FFtestScan("+0.");
    FFtestScan("+0.0");
    FFtestScan("x y");
    FFtestScan("0xa");
    FFtestScan("0xab");
    FFtestScan("0xab x");
    FFtestScan("'");
    FFtestScan("''");
    FFtestScan("'x'");
    FFtestScan("'\\'");
    FFtestScan("'\\''");
    FFtestScan('"');
    FFtestScan('""');
    FFtestScan('"x"');
    FFtestScan('"\\"');
    FFtestScan('"\\""');
};

var FFtestStringScan = function FFtestStringScan() {
    assert(FFmakeTokens('"').MMrc == DCstringError);
    assert(FFmakeTokens('"foo').MMrc == DCstringError);
    assert(FFmakeTokens('"foo\n').MMrc == DCstringError);
    assert(FFmakeTokens('e.__defineGetter__').MMrc == DCinvalidIdError);
};

FFtestStringScan();

// Return the corresponding symbol for a token
var FFsymbolConvert = function FFsymbolConvert(token) {
    if (token.MMtype == DCintTypeCode || token.MMtype == DCfloatTypeCode) {
        return 'NUMBER';
    } else if (token.MMtype == DCidTypeCode) {
        return 'NAME';
    } else if (token.MMtype == DCstrTypeCode) {
        return 'STRING';
    } else if (token.MMtype == DCpunctTypeCode) {
        return token.MMchars;
    } else if (token.MMtype == DCkeywordTypeCode) {
        return token.MMchars;
    }
    console.log("Could not translate token: ");
    console.log(token);
    assert(false);
};

// remove whitespace tokens
// return result object with MMrc status
var FFtokSym = function FFtokSym(PVinput) {
    var LVtokensResult = FFmakeTokens(PVinput);
    if (LVtokensResult.MMrc != 0) {
        return LVtokensResult;
    }
    var LVinTokens = LVtokensResult.MMtokens;
    var LVi;
    var LVsymbols = [];
    var LVoutTokens = [];
    for (LVi = 0; LVi < LVinTokens.length; LVi += 1) {
        var LVinToken = LVinTokens[LVi];
        if (LVinToken.MMtype != DCwhitespaceTypeCode &&
                LVinToken.MMtype != DCnewlineTypeCode &&
                LVinToken.MMtype != DCcommentTypeCode) {
            LVoutTokens.push(LVinTokens[LVi]);
            LVsymbols.push(FFsymbolConvert(LVinTokens[LVi]));
        }
    }
    var LVresult = {};
    LVresult.MMrc = 0;
    LVresult.MMsymbols = LVsymbols;
    LVresult.MMtokens = LVoutTokens;
    return LVresult;
};

var RRfs = require("fs");

var FFtest = function FFtest(PVfilename) {
    RRfs.readFile(PVfilename, 'utf8', function (err, data) {
        if (err) {
            console.log(err);
            return;
        }
        var LVtokens = FFmakeTokens(data);
        console.log(LVtokens);
    });
};

// Usage:
//     node token.js [FILENAME]
if (require.main === module && process.argv.length >= 3) {
    FFtest(process.argv[2]);
}

module.exports = {
    "MMmakeTokens" : FFmakeTokens,
    "MMtestToken" : FFtestToken,
    "MMtokSym" : FFtokSym,
};
