// Parse a string
// Return an array of tokens
//
// 1 token data:
//   1.1 MMtype - token type
//   1.2 MMlineno - line number (zero-based)
//   1.3 MMcolno - column number (zero-based)
//   1.4 MMlength - length in chars
//   1.5 MMchars - raw source data
//   1.5 MMoffset - offset of token relative to start of input
//
// T1 a token may not start with
//    T1.1 AC - reserved namespace for runtime
//    T1.2 AG - reserved for global variable remap
//
// T2 a regular expression literal is not a valid token

"use strict" ;

var assert = require ( "assert" ) ;
var RRutil = require ( 'util' ) ;
var RRfs = require ( "fs" ) ;

// 2 token type codes: comment , newline , whitespace , punctuation , integer ,
//   floating-point , string , identifier , keyword

var DChexDecode = { '0' : 1 , '1' : 1 , '2' : 1 , '3' : 1 , '4' : 1 , '5' : 1 ,
    '6' : 1 , '7' : 1 , '8' : 1 , '9' : 1 , 'a' : 1 , 'b' : 1 , 'c' : 1 ,
    'd' : 1 , 'e' : 1 , 'f' : 1 , 'A' : 1 , 'B' : 1 , 'C' : 1 , 'D' : 1 ,
    'E' : 1 , 'F' : 1 } ;

// return -1 on error
var FFdecodeUnicodeEscape4 = function FFdecodeUnicodeEscape4 ( LVx ) {
    assert ( typeof LVx == 'string' ) ;
    assert ( LVx.length == 4 ) ;
    if ( DChexDecode [ LVx [ 0 ] ] == 1 && DChexDecode [ LVx [ 1 ] ] == 1 &&   
        DChexDecode [ LVx [ 2 ] ] == 1 && DChexDecode [ LVx [ 3 ] ] == 1 ) {
        return unescape ( '%u' + LVx ) ; } return -1 ; } ;

// return -1 on error
var FFdecodeUnicodeEscape2 = function FFdecodeUnicodeEscape2 ( LVx ) {
    assert ( typeof LVx == 'string' ) ;
    assert ( LVx.length == 2 ) ;
    if ( DChexDecode [ LVx [ 0 ] ] == 1 &&
        DChexDecode [ LVx [ 1 ] ] == 1 ) {
        return unescape ( '%' + LVx ) ; } return -1 ; } ;

var DCcommentTypeCode = 'DCcommentTypeCode' ;
var DCnewlineTypeCode = 'DCnewlineTypeCode' ;
var DCwhitespaceTypeCode = 'DCwhitespaceTypeCode' ;
var DCpunctTypeCode = 'DCpunctTypeCode' ;
var DCintTypeCode = 'DCintTypeCode' ;
var DCfloatTypeCode = 'DCfloatTypeCode' ;
var DCstrTypeCode = 'DCstrTypeCode' ;
var DCidTypeCode = 'DCidTypeCode' ;
var DCkeywordTypeCode = 'DCkeywordTypeCode' ;
var GVpunctArray = [ "{" , "}" , "(" , ")" , "[" , "]" , "<" , ">" , "<=" , ">=" ,
    "==" , "!=" , "===" , "!==" , "<<" , ">>" , ">>>" , "=" , "*=" , "/=" , "%=" ,
    "+=" , "-=" , "<<=" , ">>=" , ">>>=" , "&=" , "^=" , "|=" , "?" , ":" , "|" ,
    "&" , "^" , "~" , "||" , "&&" , "!" , "+" , "-" , "*" , "/" , "%" , "." , ","
    , ";" ] ;
var GVpuncts = { } ;
var GVpunctInitChars = { } ;
GVpunctArray.forEach ( function ( PVk ) { GVpuncts [ PVk ] = 1 ; } ) ;
GVpunctArray.forEach ( function ( PVk ) {
    GVpunctInitChars [ PVk.slice ( 0 , 1 ) ] = 1 ; } ) ;
var GVdigitArray = [ '0' , '1' , '2' , '3' , '4' , '5' , '6' , '7' , '8' , '9' ] ;
var GVdigits = { } ;
GVdigitArray.forEach ( function ( PVk ) { GVdigits [ PVk ] = 1 ; } ) ;
var GVhexDigits = { } ;
var GVhexDigitChars = [ 'a' , 'A' , 'b' , 'B' , 'c' , 'C' , 'd' , 'D' , 'e' , 'E'
, 'f' , 'F' ] ;
GVhexDigitChars.forEach ( function ( PVk ) { GVhexDigits [ PVk ] = 1 ; } ) ;
GVdigitArray.forEach ( function ( PVk ) { GVhexDigits [ PVk ] = 1 ; } ) ;
var GVletterArray = [ 'a' , 'b' , 'c' , 'd' , 'e' , 'f' , 'g' , 'h' , 'i' , 'j' ,
    'k' , 'l' , 'm' , 'n' , 'o' , 'p' , 'q' , 'r' , 's' , 't' , 'u' , 'v' , 'w' ,
    'x' , 'y' , 'z' , 'A' , 'B' , 'C' , 'D' , 'E' , 'F' , 'G' , 'H' , 'I' , 'J' ,
    'K' , 'L' , 'M' , 'N' , 'O' , 'P' , 'Q' , 'R' , 'S' , 'T' , 'U' , 'V' , 'W' ,
    'X' , 'Y' , 'Z' ] ;
var GVletters = { } ;
GVletterArray.forEach ( function ( PVk ) { GVletters [ PVk ] = 1 ; } ) ;
var GVkeywordStrings = [ 'for' , 'while' , 'continue' , 'break' , 'return' ,
    'var' , 'throw' , 'function' , 'typeof' , 'void' , 'if' , 'else' , 'false' ,
    'true' , 'null' , 'instanceof' ] ;
var GVkeywords = { } ;
GVkeywordStrings.forEach ( function ( PVk ) { GVkeywords [ PVk ] = 1 ; } ) ;
var GVinvalidIdsArray = [ 'case' , 'class' , 'catch' , 'const' , 'debugger' ,
    'default' , 'delete' , 'do' , 'export' , 'extends' , 'finally' , 'import' ,
    'in' , 'let' , 'new' , 'prototype' , 'super' , 'switch' , 'this' , 'try' ,
    'with' , 'yield' , 'assign' , 'create' , 'defineProperties' , 'defineProperty'
    , 'freeze' , 'getNotifier' , 'getOwnPropertyDescriptor' ,
    'getOwnPropertySymbols' , 'getPrototypeOf' , '__defineGetter__' ,
    '__defineSetter__' , '__lookupGetter__' , '__lookupSetter__' ,
    'constructor' ] ;
var GVinvalidIds = { } ;
GVinvalidIdsArray.forEach ( function ( PVk ) { GVinvalidIds [ PVk ] = 1 ; } ) ;
var GVstrEscapes = { } ;
GVstrEscapes [ "n" ] = "\n" ;
GVstrEscapes [ "r" ] = "\r" ;
GVstrEscapes [ "t" ] = "\t" ;
var GVstrCharsArray = [ " " , "!" , '"' , "#" , "$" , "%" , "&" , "'" , "(" ,
    ")" , "*" , "+" , "," , "-" , "." , "/" , "0" , "1" , "2" , "3" , "4" , "5" ,
    "6" , "7" , "8" , "9" , ":" , ";" , "<" , "=" , ">" , "?" , "@" , "A" , "B" ,
    "C" , "D" , "E" , "F" , "G" , "H" , "I" , "J" , "K" , "L" , "M" , "N" , "O" ,
    "P" , "Q" , "R" , "S" , "T" , "U" , "V" , "W" , "X" , "Y" , "Z" , "["
    , "]" , "^" , "_" , "`" , "a" , "b" , "c" , "d" , "e" , "f" , "g" , "h" , "i"
    , "j" , "k" , "l" , "m" , "n" , "o" , "p" , "q" , "r" , "s" , "t" , "u" , "v"
    , "w" , "x" , "y" , "z" , "{" , "|" , "}" , "~" ] ;
var GVstrChars = { } ;
GVstrCharsArray.forEach ( function ( PVk ) { assert(PVk.length == 1);
    GVstrChars [ PVk ] = 1 ; } ) ;

var DCpunctError = -10 ;
var DCnumberError = -20 ;
var DCscanError = -30 ;
var DCstringError = -40 ;
var DCinvalidIdError = -50 ;
var GVinvalidPrefix = {"AC" : 1 , "AG" : 1} ;
// returns { MMrc : result code , MMtokens : list of tokens }
var FFmakeTokens = function FFmakeTokens ( PVinput ) {
    var LVi = 0 ; var LVtokens = [ ] ; var LVlineno = 0 ; var LVcolno = 0 ;
    while ( true ) { // #main
        assert ( LVi <= PVinput.length ) ;
        if ( LVi == PVinput.length ) {
            return { MMrc : 0 , MMtokens : LVtokens } ; }
        assert ( LVi < PVinput.length ) ;
        var LVc = PVinput [ LVi ] ;

        // double forward slash single-line comment
        if ( LVc == "/" && LVi + 1 < PVinput.length &&
                PVinput [ LVi + 1 ] == "/" ) {
            var LVj = 2 ;
            while ( true ) {
                if ( LVi + LVj == PVinput.length ) { break ; }
                if ( PVinput [ LVi + LVj ] == '\n' ) { LVj += 1 ; break ; }
                LVj += 1 ; }
            LVtokens.push ( { MMtype : DCcommentTypeCode , MMlineno : LVlineno ,
                MMcolno : LVcolno , MMlength : LVj , MMoffset : LVi ,
                MMchars : PVinput.slice ( LVi , LVi + LVj ) } ) ;
            LVlineno += 1 ; LVcolno = 0 ; LVi += LVj ; continue ; /* #main */ }

        // forward slash star multi-line comment
        if ( LVc == "/" && LVi + 1 < PVinput.length &&
                PVinput [ LVi + 1 ] == "*" ) {
            var LVstartLineno = LVlineno ; var LVstartColno = LVcolno ;
            var LVj = 2 ; LVcolno += 2 ;
            while ( true ) {
                if ( LVi + LVj == PVinput.length ) { break ; }
                if ( PVinput [ LVi + LVj ] == "*" &&
                        LVi + LVj + 1 < PVinput.length &&
                        PVinput [ LVi + LVj + 1 ] == "/" ) {
                    LVj += 2 ; LVcolno += 2 ; break ; }
                if ( PVinput [ LVi + LVj ] == '\n' ) {
                    LVj += 1 ; LVlineno += 1 ; LVcolno = 0 ;
                } else { LVj += 1 ; LVcolno += 1 ; } }
            LVtokens.push ( {
                MMtype : DCcommentTypeCode , MMlineno : LVstartLineno ,
                MMcolno : LVstartColno , MMlength : LVj , MMoffset : LVi ,
                MMchars : PVinput.slice ( LVi , LVi + LVj ) } ) ; LVi += LVj ;
            continue ; /* #main */ }

        // space or tab
        if ( LVc == " " || LVc == "\t" ) {
            LVtokens.push ( {
                MMtype : DCwhitespaceTypeCode , MMlineno : LVlineno , MMcolno :
                LVcolno , MMlength : 1 , MMoffset : LVi , MMchars : LVc
            } ) ;
            LVcolno += 1 ; LVi += 1 ; continue ; /* #main */ }

        // newline
        if ( LVc == "\n" ) { LVtokens.push ( {
                MMtype : DCnewlineTypeCode , MMlineno : LVlineno , MMcolno :
                LVcolno , MMlength : 1 , MMoffset : LVi , MMchars : LVc } ) ;
            LVlineno += 1 ; LVcolno = 0 ; LVi += 1 ; continue ; /* #main */ }

        // handle + or -
        if ( LVc == '-' || LVc == '+' ) {
            if ( LVi + 1 == PVinput.length ) {
                // punctuation
                LVtokens.push ( {
                    MMtype : DCpunctTypeCode , MMlineno : LVlineno , MMcolno :
                    LVcolno , MMlength : 1 , MMoffset : LVi , MMchars : LVc } ) ;
                LVcolno += 1 ; LVi += 1 ; continue ; /* #main */ }
            var LVd = PVinput [ LVi + 1 ] ;
            if ( GVdigits [ LVd ] == 1 || LVd == '.' ) {
                var LVj = 2 ; var LVhaveDot ; var LVhaveX = 0 ;
                if ( LVd == '.' ) { LVhaveDot = 1 ; } else { LVhaveDot = 0 ; }
                var LVlongestNumber = -1 ;
/* #signum */   while ( true ) { 
                    if ( LVj >= 3 || LVhaveDot == 0 ) { LVlongestNumber = LVj ; }
                    if ( LVi + LVj == PVinput.length ) {
                        break ; /* #signum */ }
                    LVd = PVinput [ LVi + LVj ] ;
                    if ( GVdigits [ LVd ] == 1 ) { LVj += 1 ;
                        continue ; /* #signum */ }
                    if ( LVd == "." && LVhaveDot == 0 ) {
                        LVhaveDot = 1 ; LVj += 1 ; continue ; /* #signum */ }
                    if ( LVd == "x" && LVhaveX == 0 ) {
                        LVhaveX = 1 ; LVj += 1 ; continue ; /* #signum */ }
                    if ( GVhexDigits [ LVd ] == 1 && LVhaveX ) {
                        LVj += 1 ; continue ; /* #signum */ }
                    break ; /* #signum */ }
                if ( LVlongestNumber == -1 ) { return { MMrc : DCnumberError ,
                        MMerror : "unrecognized characters at end of input" ,
                        MMlineno : LVlineno , MMcolno : LVcolno } ; }
                LVj = LVlongestNumber ;
                // number
                LVtokens.push ( {
                    MMtype : ( LVhaveDot ?  DCfloatTypeCode : DCintTypeCode ) ,
                    MMlineno : LVlineno , MMcolno : LVcolno , MMlength : LVj ,
                    MMoffset : LVi , MMchars : PVinput.slice ( LVi , LVi+LVj )
                } ) ;
                LVcolno += 1 ; LVi += LVj ; continue ; /* #main */ }
            // punctuation + - += -=
            var LVj = ( LVd == '=' ? 2 : 1 ) ;
            LVtokens.push ( { MMtype : DCpunctTypeCode , MMlineno : LVlineno ,
                MMcolno : LVcolno , MMoffset : LVi , MMlength : LVj ,
                MMchars : PVinput.slice ( LVi , LVi+LVj ) } ) ;
            LVcolno += LVj ; LVi += LVj ; continue ; /* # main */ }
        // end handle + or -

        // punctuation
        if ( GVpunctInitChars [ LVc ] == 1 ) {
            var LVj = 1 ; var LVlongestPunct = -1 ;
/* #p */    while ( true ) {
                var LVpunctCand = PVinput.slice ( LVi , LVi + LVj ) ;
                if ( GVpuncts [ LVpunctCand ] == 1 ) { LVlongestPunct = LVj ; }
                if ( LVi + LVj == PVinput.length ) { break ; /* #p */ }
                if ( GVpuncts [ LVpunctCand ] == 1 ) { LVj += 1 ; continue ;
                    /* #p */ }
                break ; /* #p */ }
            if ( LVlongestPunct == -1 ) { return { MMrc : DCpunctError ,
                    MMerror : "unrecognized characters at end of input" ,
                    MMlineno : LVlineno , MMcolno : LVcolno } ; }
            LVj = LVlongestPunct ;
            LVtokens.push ( { MMtype : DCpunctTypeCode , MMlineno : LVlineno ,
                MMcolno : LVcolno , MMlength : LVj , MMoffset : LVi ,
                MMchars : PVinput.slice ( LVi , LVi+LVj ) } ) ;
            LVcolno += LVj ; LVi += LVj ; continue ; /* # main */ }
        // end punctuation

        // number
        if ( GVdigits [ LVc ] == 1 || LVc == "." ) {
            var LVj = 1 ; var LVhaveDot ; var LVhaveX = 0 ;
            if ( LVc == "." ) { LVhaveDot = 1 ; } else { LVhaveDot = 0 ; }
            var LVlongestNumber = -1 ;
/* #n */ while ( true ) { 
                if ( LVj >= 2 || LVhaveDot == 0 ) { LVlongestNumber = LVj ; }
                if ( LVi + LVj == PVinput.length ) { break ; /* #n */ }
                var LVd = PVinput [ LVi + LVj ] ;
                if ( GVdigits [ LVd ] == 1 ) { LVj += 1 ;
                    continue ; /* #n */ }
                if ( LVd == "." && LVhaveDot == 0 ) { LVhaveDot = 1 ; LVj += 1 ;
                    continue ; /* #n */ }
                if ( LVd == "x" && LVhaveX == 0 ) { LVhaveX = 1 ; LVj += 1 ;
                    continue ; /* #n */ }
                if ( GVhexDigits [ LVd ] == 1 && LVhaveX ) { LVj += 1 ;
                    continue ; /* #n */ }
                break ; /* #n */ }
            if ( LVlongestNumber == -1 ) { return { MMrc : DCnumberError ,
                    MMerror : "unrecognized characters at end of input" ,
                    MMlineno : LVlineno , MMcolno : LVcolno } ; }
            LVj = LVlongestNumber ;
            LVtokens.push ( {
                MMtype : ( LVhaveDot ?  DCfloatTypeCode : DCintTypeCode ) ,
                MMlineno : LVlineno , MMcolno : LVcolno , MMlength : LVj , MMoffset :
                LVi , MMchars : PVinput.slice ( LVi , LVi + LVj ) } ) ;
            LVcolno += LVj ; LVi += LVj ; continue ; /* #main */ }
        // end number

        // identifier ( keyword , variable )
        if ( GVletters [ LVc ] == 1 || LVc == '_' || LVc == '$' ) {
            var LVj = 1 ; var LVlongestId = -1 ;
/* #id */   while ( true ) { LVlongestId = LVj ;
                if ( LVi + LVj == PVinput.length ) { break ; /* #id */ }
                var LVd = PVinput [ LVi + LVj ] ;
                if ( GVletters [ LVd ] == 1 || GVdigits [ LVd ] == 1 ||
                        LVd == '_' || LVd == '$' ) {
                    LVj += 1 ; continue ; /* #id */ }
                break ; /* #id */ }
            LVj = LVlongestId ;
            var LVidCand = PVinput.slice ( LVi , LVi + LVj ) ;
            // Enforce T1
            if ( GVinvalidIds [ LVidCand ] == 1 ||
                    GVinvalidPrefix[ LVidCand.slice ( 0 , 2 ) ] == 1 ) {
                return { MMrc : DCinvalidIdError ,
                    MMerror : "[T1] Invalid identifier: " + LVidCand ,
                    MMlineno : LVlineno , MMcolno : LVcolno } ; }
            LVtokens.push ( {
                MMtype : ( GVkeywords [ LVidCand ] == 1 ?  DCkeywordTypeCode :
                          DCidTypeCode ) , MMlineno : LVlineno , MMcolno : LVcolno ,
                       MMlength : LVj , MMoffset : LVi , MMchars : LVidCand
            } ) ;
            LVcolno += LVj ; LVi += LVj ; continue ; /* #main */ }
        // end identifier or keyword

        // single-quoted or double-quoted string
        if ( LVc == "'" || LVc == '"' ) {
            var LVj = 1 ; var LVstrVal = [ ] ; var LVlongestStr = -1 ;
/* #s */  while ( true ) { 
                assert ( LVi + LVj <= PVinput.length ) ;
                if ( LVi + LVj == PVinput.length ) {
                    break ; // #s ( error )
                }
                var LVd = PVinput [ LVi + LVj ] ;
                if ( LVd == '\n' ) { break ; /* #s ( error ) */ }
                if ( LVd == LVc ) { LVj += 1 ; LVlongestStr = LVj ;
                    break ; /* #s ( ok ) */ }
                if ( LVd == '\\' ) {
                    if ( LVi + LVj + 1 == PVinput.length ) {
                        break ; /* #s ( error ) */ }
                    var LVe = PVinput [ LVi + LVj + 1 ] ; var LcharVal ;
                    if ( LVe == 'u' ) { LVj += 6 ;
                        if ( LVi + LVj >= PVinput.length ) {
                            break ; /* #s ( error ) */ }
                        LcharVal = FFdecodeUnicodeEscape4 (
                                PVinput.slice ( LVi + LVj - 4 , LVi + LVj ) ) ;
                        if ( LcharVal == -1 ) {
                            break ; /* #s ( error ) */ }
                    } else if ( LVe == 'x' ) { LVj += 4 ;
                        if ( LVi + LVj >= PVinput.length ) {
                            break ; /* #s ( error ) */ }
                        LcharVal = FFdecodeUnicodeEscape2 (
                                PVinput.slice ( LVi + LVj - 2 , LVi + LVj ) ) ;
                        if ( LcharVal == -1 ) { break ; /* #s ( error ) */ }
                    } else if ( GVstrEscapes.hasOwnProperty ( LVe ) ) {
                        LVj += 2 ; LcharVal = GVstrEscapes [ LVe ] ;
                    } else { LVj += 2 ; LcharVal = LVe ; }
                    LVstrVal.push ( LcharVal ) ; continue ; /* #s */ }
                if ( GVstrChars.hasOwnProperty ( LVd ) ) {
                    LVstrVal.push ( LVd ) ; LVj += 1 ; continue ; /* #s */ }
                break ; /* #s ( error ) */ }
            if ( LVlongestStr == -1 ) { return { MMrc : DCstringError ,
                MMerror : "error scanning string" ,
                    MMlineno : LVlineno , MMcolno : LVcolno } ; }
            LVj = LVlongestStr ;
            LVtokens.push ( { MMtype : DCstrTypeCode , MMlineno : LVlineno ,
                MMcolno : LVcolno , MMlength : LVj , MMoffset : LVi , MMchars :
                PVinput.slice ( LVi , LVi+LVj ) , MMstrVal : LVstrVal.join ( "" )
            } ) ;
            LVcolno += LVj ; LVi += LVj ; continue ; /* #main */ }
        // end single-quoted string

        return { MMrc : DCscanError , MMerror : "error scanning input" ,
            MMlineno : LVlineno , MMcolno : LVcolno ,
            MMchars : PVinput.slice ( LVi , LVi + 10 ) + '...' } ;
    } // end #main
} ;

var FFtestScan = function FFtestScan ( PVstr ) {
    console.log ( "scan: " + PVstr ) ;
    console.log ( FFmakeTokens ( PVstr ) ) ;
    console.log ( "scan: " + PVstr ) ;
} ;

var FFtestToken = function FFtestToken ( ) {
    var LVtestScanInputs = [ "a" , "-0" , "-1" , "-." , "-.1" , "+" , "+0" ,
        "+0." , "+0.0" , "x y" , "0xa" , "0xab" , "0xab x" , "'" , "''" , "'x'" ,
        "'\\'" , "'\\''" , '"' , '""' , '"x"' , '"\\"' , '"\\""'];
    LVtestScanInputs.forEach ( function (PVx) { FFtestScan ( PVx ) ; } ) ; } ;

var FFtestStringScan = function FFtestStringScan ( ) {
    assert ( FFmakeTokens ( '"' ).MMrc == DCstringError ) ;
    assert ( FFmakeTokens ( '"foo' ).MMrc == DCstringError ) ;
    assert ( FFmakeTokens ( '"foo\n' ).MMrc == DCstringError ) ;
    assert ( FFmakeTokens ( 'e.__defineGetter__' ).MMrc == DCinvalidIdError ) ;
    // console.log ( RRutil.format ( FFmakeTokens ( '"abcd"' ).MMtokens [ 0 ] ) ) ;
    assert ( FFmakeTokens ( '"abcd"' ).MMtokens [ 0 ].MMstrVal == 'abcd' ) ;
    assert ( FFmakeTokens ( '"\\uabcd"' ).MMrc == 0 ) ;
    assert ( FFmakeTokens ( '"\\uabcd"' ).MMtokens instanceof Array ) ;
    assert ( FFmakeTokens ( '"\\uabcd"' ).MMtokens.length > 0 ) ;
    // console.log ( RRutil.format ( FFmakeTokens ( '"\\uabcd"' ).MMtokens [ 0 ] ) ) ;
    // console.log ( RRutil.format ( FFmakeTokens ( '"\\uabcd"' ).MMtokens [ 0 ].MMstrVal ) ) ;
    assert ( FFmakeTokens ( '"\\uabcd"' ).MMtokens [ 0 ].MMstrVal == '\uabcd' ) ;
    assert ( FFmakeTokens ( '"\\xef"' ).MMrc == 0 ) ;
    assert ( FFmakeTokens ( '"\\xef"' ).MMtokens [ 0 ].MMstrVal == '\xef' ) ; } ;

FFtestStringScan ( ) ;

// Return the corresponding symbol for a token
var FFsymbolConvert = function FFsymbolConvert ( token ) {
    if ( token.MMtype == DCintTypeCode || token.MMtype == DCfloatTypeCode ) {
        return 'NUMBER' ;
    } else if ( token.MMtype == DCidTypeCode ) {
        return 'NAME' ;
    } else if ( token.MMtype == DCstrTypeCode ) {
        return 'STRING' ;
    } else if ( token.MMtype == DCpunctTypeCode ) {
        return token.MMchars ;
    } else if ( token.MMtype == DCkeywordTypeCode ) {
        return token.MMchars ;
    }
    console.log ( "Could not translate token: " ) ;
    console.log ( token ) ;
    assert ( false ) ; } ;

// remove whitespace and comments
var FFtokSym = function FFtokSym ( PVinput ) {
    var LVtokensResult = FFmakeTokens ( PVinput ) ;
    if ( LVtokensResult.MMrc != 0 ) {
        return LVtokensResult ;
    }
    var LVinTokens = LVtokensResult.MMtokens ; var LVi ;
    var LVsymbols = [ ] ; var LVoutTokens = [ ] ;
    for ( LVi = 0 ; LVi < LVinTokens.length ; LVi += 1 ) {
        var LVinToken = LVinTokens [ LVi ] ;
        if ( LVinToken.MMtype != DCwhitespaceTypeCode &&
                LVinToken.MMtype != DCnewlineTypeCode &&
                LVinToken.MMtype != DCcommentTypeCode ) {
            LVoutTokens.push ( LVinTokens [ LVi ] ) ;
            LVsymbols.push ( FFsymbolConvert ( LVinTokens [ LVi ] ) ) ; } }
    return { MMrc : 0 , MMsymbols : LVsymbols , MMtokens : LVoutTokens } ; } ;

var FFsummary = function FFsummary ( PVtokens ) {
    return "length = " + PVtokens.length ;
} ;

var FFtest = function FFtest ( PVfilename ) {
    RRfs.readFile ( PVfilename , 'utf8' , function ( PVerror , PVdata ) {
        if ( PVerror ) {
            console.log ( PVerror ) ;
            return ;
        }
        var LVresult = FFmakeTokens ( PVdata ) ;
        if ( LVresult.MMrc ) {
            console.log ( LVresult ) ;
            return ;
        }
        console.log ( FFsummary ( LVresult.MMtokens ) ) ;
    } ) ;
} ;

// Usage:
//     node token.js [ FILENAME ]
if ( require.main.id === module.id && process.argv.length >= 3 ) {
    FFtest ( process.argv [ 2 ] ) ;
}

module.exports = { "MMtokSym" : FFtokSym , } ;
