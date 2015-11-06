// Parse a string
// Return an array of tokens
//
// 1 token data: token type, line number, column number, length in chars, raw
//   string data, offset within input

"use strict";

var assert = require("assert");

// 2 token type codes: comment, newline, whitespace, punctuation, integer,
//   floating-point, string, identifier, keyword

var DChexDecode = { '0' : 1, '1' : 1, '2' : 1, '3' : 1, '4' : 1, '5' : 1, '6' : 1,
    '7' : 1, '8' : 1, '9' : 1, 'a' : 1, 'b' : 1, 'c' : 1, 'd' : 1, 'e' : 1, 'f' :
        1, 'A' : 1, 'B' : 1, 'C' : 1, 'D' : 1, 'E' : 1, 'F' : 1 };

// return -1 on error
var FFdecodeUnicodeEscape4 = function FFdecodeUnicodeEscape4(LVx) {
    assert(typeof LVx == 'string');
    assert(LVx.length == 4);
    if (DChexDecode[LVx[0]] == 1 &&
        DChexDecode[LVx[1]] == 1 &&   
        DChexDecode[LVx[2]] == 1 &&   
        DChexDecode[LVx[3]] == 1) {
        return unescape('%u' + LVx);
    }
    return -1;
};

// return -1 on error
var FFdecodeUnicodeEscape2 = function FFdecodeUnicodeEscape2(LVx) {
    assert(typeof LVx == 'string');
    assert(LVx.length == 2);
    if (DChexDecode[LVx[0]] == 1 &&
        DChexDecode[LVx[1]] == 1) {
        return unescape('%' + LVx);
    }
    return -1;
};

var DCcommentTypeCode = 'DCcommentTypeCode';
var DCnewlineTypeCode = 'DCnewlineTypeCode';
var DCwhitespaceTypeCode = 'DCwhitespaceTypeCode';
var DCpunctTypeCode = 'DCpunctTypeCode';
var DCintTypeCode = 'DCintTypeCode';
var DCfloatTypeCode = 'DCfloatTypeCode';
var DCstrTypeCode = 'DCstrTypeCode';
var DCidTypeCode = 'DCidTypeCode';
var DCkeywordTypeCode = 'DCkeywordTypeCode';
var GVpunctArray = ["{", "}", "(", ")", "[", "]", "<", ">", "<=", ">=", "==",
    "!=", "===", "!==", "<<", ">>", ">>>", "=", "*=", "/=", "%=", "+=", "-=",
    "<<=", ">>=", ">>>=", "&=", "^=", "|=", "?", ":", "|", "&", "^", "~", "||",
    "&&", "!", "+", "-", "*", "/", "%", ".", ",", ";"];
var GVpuncts = {};
var GVpunctInitChars = {};
GVpunctArray.forEach(function (PVk) { GVpuncts[PVk] = 1; });
GVpunctArray.forEach(function (PVk) { GVpunctInitChars[PVk.slice(0,1)] = 1; });
var GVdigitArray = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
var GVdigits = {};
GVdigitArray.forEach(function (PVk) { GVdigits[PVk] = 1; });
var GVhexDigits = {};
var GVhexDigitChars = ['a','A','b','B','c','C','d','D','e','E','f','F'];
GVhexDigitChars.forEach(function (PVk) { GVhexDigits[PVk] = 1; });
GVdigitArray.forEach(function (PVk) { GVhexDigits[PVk] = 1; });
var GVletterArray = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l',
    'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'A',
    'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P',
    'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
var GVletters = {};
GVletterArray.forEach(function (PVk) { GVletters[PVk] = 1; });
var GVkeywordStrings = ['for', 'while', 'continue', 'break', 'return', 'var',
    'throw', 'function', 'typeof', 'void', 'if', 'else', 'false', 'true', 'null',
    'instanceof'];
var GVkeywords = {};
GVkeywordStrings.forEach(function(PVk) { GVkeywords[PVk] = 1; });
var GVinvalidIdsArray = [ 'case', 'class', 'catch', 'const', 'debugger', 'default',
    'delete', 'do', 'export', 'extends', 'finally', 'import', 'in', 'let', 'new',
    'super', 'switch', 'this', 'try', 'with', 'yield',
    'assign', 'create', 'defineProperties', 'defineProperty', 'freeze',
    'getNotifier', 'getOwnPropertyDescriptor', 'getOwnPropertySymbols',
    'getPrototypeOf', '__defineGetter__', '__defineSetter__', '__lookupGetter__',
    '__lookupSetter__', 'constructor','GETITEM','SETITEM','HASITEM'];
var GVinvalidIds = {};
GVinvalidIdsArray.forEach(function(PVk) { GVinvalidIds[PVk] = 1; });
var GVstrEscapes = {};
GVstrEscapes["n"] = "\n";
GVstrEscapes["r"] = "\r";
GVstrEscapes["t"] = "\t";
var GVstrCharsArray = [
    " ", "!", '"', "#", "$", "%", "&", "'", "(", ")", "*", "+", ",", "-", ".",
    "/", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", ":", ";", "<", "=",
    ">", "?", "@", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L",
    "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "[",
    "\\", "]", "^", "_", "`", "a", "b", "c", "d", "e", "f", "g", "h", "i", "j",
    "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y",
    "z", "{", "|", "}", "~"];
var GVstrChars = {};
GVstrCharsArray.forEach(function(PVk) { GVstrChars[PVk] = 1; });

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
            return {
                MMrc : 0,
                MMtokens : LVtokens
            };
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
            LVtokens.push({
                MMtype : DCcommentTypeCode, MMlineno : LVlineno,
                MMcolno : LVcolno, MMlength : LVj, MMoffset : LVi, MMchars :
                PVinput.slice(LVi, LVi + LVj)
            });
            LVlineno += 1; LVcolno = 0; LVi += LVj;
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
            LVtokens.push({
                MMtype : DCcommentTypeCode, MMlineno : LVstartLineno,
                MMcolno : LVstartColno, MMlength : LVj, MMoffset : LVi, MMchars :
                PVinput.slice(LVi, LVi + LVj)
            });
            LVi += LVj;
            continue; // #mainloop
        }

        // space or tab
        if (LVc == " " || LVc == "\t") {
            LVtokens.push({
                MMtype : DCwhitespaceTypeCode, MMlineno : LVlineno, MMcolno :
                LVcolno, MMlength : 1, MMoffset : LVi, MMchars : LVc
            });
            LVcolno += 1; LVi += 1;
            continue; // #mainloop
        }

        // newline
        if (LVc == "\n") {
            LVtokens.push({
                MMtype : DCnewlineTypeCode, MMlineno : LVlineno, MMcolno :
                LVcolno, MMlength : 1, MMoffset : LVi, MMchars : LVc
            });
            LVlineno += 1; LVcolno = 0; LVi += 1;
            continue; // #mainloop
        }

        // handle + or -
        if (LVc == '-' || LVc == '+') {
            if (LVi + 1 == PVinput.length) {
                // punctuation
                LVtokens.push({
                    MMtype : DCpunctTypeCode, MMlineno : LVlineno, MMcolno :
                    LVcolno, MMlength : 1, MMoffset : LVi, MMchars : LVc
                });
                LVcolno += 1; LVi += 1;
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
                    return {
                        MMrc : DCnumberError,
                        MMerror : "unrecognized characters at end of input",
                        MMlineno : LVlineno, MMcolno : LVcolno
                    };
                }
                LVj = LVlongestNumber;
                // number
                LVtokens.push({
                    MMtype : (LVhaveDot ?  DCfloatTypeCode : DCintTypeCode),
                    MMlineno : LVlineno, MMcolno : LVcolno, MMlength : LVj,
                    MMoffset : LVi, MMchars : PVinput.slice(LVi,LVi+LVj)
                });
                LVcolno += 1; LVi += LVj;
                continue; // #mainloop
            }
            // punctuation + - += -=
            var LVj = (LVd == '=' ? 2 : 1);
            LVtokens.push({
                MMtype : DCpunctTypeCode, MMlineno : LVlineno,
                MMcolno : LVcolno, MMoffset : LVi, MMlength : LVj,
                MMchars : PVinput.slice(LVi,LVi+LVj)
            });
            LVcolno += LVj; LVi += LVj;
            continue; // # mainloop
        }
        // end handle + or -

        // punctuation
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
                return {
                    MMrc : DCpunctError,
                    MMerror : "unrecognized characters at end of input",
                    MMlineno : LVlineno,
                    MMcolno : LVcolno
                };
            }
            LVj = LVlongestPunct;
            // punctuation
            LVtokens.push({
                MMtype : DCpunctTypeCode, MMlineno : LVlineno,
                MMcolno : LVcolno, MMlength : LVj, MMoffset : LVi,
                MMchars : PVinput.slice(LVi,LVi+LVj)
            });
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
                return {
                    MMrc : DCnumberError,
                    MMerror : "unrecognized characters at end of input",
                    MMlineno : LVlineno,
                    MMcolno : LVcolno
                };
            }
            LVj = LVlongestNumber;
            // number
            LVtokens.push({
                MMtype : (LVhaveDot ?  DCfloatTypeCode : DCintTypeCode),
                MMlineno : LVlineno, MMcolno : LVcolno, MMlength : LVj, MMoffset :
                LVi, MMchars : PVinput.slice(LVi, LVi + LVj)
            });
            LVcolno += LVj; LVi += LVj;
            continue; // #mainloop
        }
        // end number

        // identifier (keyword, variable)
        if (GVletters[LVc] == 1 || LVc == '_' || LVc == '$') {
            var LVj = 1;
            var LVlongestId = -1;
            while (true) { // # idloop
                LVlongestId = LVj;
                if (LVi + LVj == PVinput.length) {
                    break; // # idloop
                }
                var LVd = PVinput[LVi + LVj];
                if (GVletters[LVd] == 1 || GVdigits[LVd] == 1 ||
                        LVd == '_' || LVd == '$') {
                    LVj += 1;
                    continue; // # idloop
                }
                break; // # idloop
            }
            LVj = LVlongestId;
            var LVidCand = PVinput.slice(LVi, LVi + LVj);
            if (GVinvalidIds[LVidCand] == 1) {
                return {
                    MMrc : DCinvalidIdError, MMerror : "Invalid identifier: "
                    + LVidCand, MMlineno : LVlineno, MMcolno : LVcolno
                };
            }
            LVtokens.push({
                MMtype : (GVkeywords[LVidCand] == 1 ?  DCkeywordTypeCode :
                          DCidTypeCode), MMlineno : LVlineno, MMcolno : LVcolno,
                       MMlength : LVj, MMoffset : LVi, MMchars : LVidCand
            });
            LVcolno += LVj; LVi += LVj;
            continue; // #mainloop
        }
        // end identifier or keyword

        // single-quoted or double-quoted string
        if (LVc == "'" || LVc == '"') {
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
                if (LVd == LVc) {
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
                    if (LVe == 'u') {
                        LVj += 5;
                        if (LVi + LVj >= PVinput.length) {
                            break; // #strloop (error)
                        }
                        LVeVal = FFdecodeUnicodeEscape4(PVinput.slice(LVi+LVj - 4,LVi+LVj));
                        if (LVeVal == -1) {
                            break; // #strloop (error)
                        }
                    } else if (LVe == 'x') {
                        LVj += 3;
                        if (LVi + LVj >= PVinput.length) {
                            break; // #strloop (error)
                        }
                        LVeVal = FFdecodeUnicodeEscape2(PVinput.slice(LVi+LVj - 2,LVi+LVj));
                        if (LVeVal == -1) {
                            break; // #strloop (error)
                        }
                    } else {
                        if (GVstrEscapes.hasOwnProperty(LVe)) {
                            LVeVal = GVstrEscapes[LVe];
                        } else {
                            LVeVal = LVe;
                        }
                        LVj += 1;
                    }
                    LVstrVal.push(LVeVal);
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
                return {
                    MMrc : DCstringError, MMerror : "error scanning string",
                    MMlineno : LVlineno, MMcolno : LVcolno
                };
            }
            LVj = LVlongestStr;
            LVtokens.push({
                MMtype : DCstrTypeCode, MMlineno : LVlineno,
                MMcolno : LVcolno, MMlength : LVj, MMoffset : LVi, MMchars :
                PVinput.slice(LVi,LVi+LVj), MMstrVal : LVstrVal.join("")
            });
            LVcolno += LVj; LVi += LVj;
            continue; // #mainloop
        }
        // end single-quoted string

        return {
            MMrc : DCscanError, MMerror : "error scanning input", MMlineno :
            LVlineno, MMcolno : LVcolno, MMchars : PVinput.slice(LVi,LVi + 10) + '...'
        };
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
    assert(FFmakeTokens('"\\uabcd"').MMrc == 0);
    assert(FFmakeTokens('"\\uabcd"').MMtokens[0].MMstrVal == '\uabcd');
    assert(FFmakeTokens('"\\xef"').MMrc == 0);
    assert(FFmakeTokens('"\\xef"').MMtokens[0].MMstrVal == '\xef');
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
