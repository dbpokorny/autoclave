// construct parsing table

var assert = require('assert');
var util = require('util');

var DOT = '(O)';

var PR = 'PR'; // program
var PA2 = 'PA2'; // parts
var PA = 'PA'; // part
var CS = 'CS'; // compound statement
var S2 = 'S2'; // statements
var S = 'S'; // statement
var CO = 'CO'; // condition
var X = 'X'; // expression
var AO = 'AO'; // assignment operator
var CX = 'CX'; // conditional expression
var OX = 'OX'; // or expression
var NX = 'NX'; // and expression
var BOX = 'BOX'; // bitwise or expression
var BXX = 'BXX'; // bitwise xor expression
var BNX = 'BNX'; // bitwise and expression
var QX = 'QX'; // equality expression
var QO = 'QO'; // equality operator
var RX = 'RX'; // relational expression
var RO = 'RO'; // relational operator
var SHX = 'SHX'; // shift expression
var SHO = 'SHO'; // shift operator
var AX = 'AX'; // additive expression
var MULX = 'MULX'; // multiplicative expression
var MO = 'MO'; // multiplicative operator
var UX = 'UX'; // unary expression
var MEMX = 'MEMX'; // member expression
var ARGL = 'ARGL'; // argument list
var ALIT = 'ALIT'; // array literal
var ELTL = 'ELTL'; // element list
var OLIT = 'OLIT'; // object literal
var FL = 'FL'; // field list
var LITF = 'LITF'; // literal field
var PX = 'PX'; // primary expression
var FX = 'FX'; // function expression
var AF = 'AF'; // anonymous function
var NF = 'NF'; // named function
var PL = 'PL'; // parameter list

var FFformatTokenRef;
var FFdeepLength;
var FFzapDivTags;
var FFhtmlEntities;
var FFbuildForHTML;

// Fit small syntax trees onto a single line
var DCsingleLineLimit = 300;

// the first rule of GVrulesAndReducers must be [PR,'->',[*]] for some [*]
var GVrulesAndReducers = [
    [PR,'->',[PA2]],
        function (PVx) { return PVx; },
        function (PVx) { return PVx; },
        function (PVx) { return PVx; },
        function (PVx) { return PVx; },
        function (PVx) { return PVx; },
    [PA2,'->',[PA]],
        function (PVx) { return [PVx]; },
        function (PVx) { return [PVx]; },
        function (PVx) { return [PVx]; },
        function (PVx) { return [PVx]; },
        function (PVx) { return [PVx]; },
    [PA2,'->',[PA,PA2]],
        function (PVx,PVx2) { return Array.prototype.concat([PVx],PVx2); },
        function (PVx,PVx2) { return Array.prototype.concat([PVx],PVx2); },
        function (PVx,PVx2) { return Array.prototype.concat([PVx],PVx2); },
        function (PVx,PVx2) { return Array.prototype.concat([PVx],PVx2); },
        function (PVx,PVx2) { return Array.prototype.concat([PVx],PVx2); },
    [PA,'->',[S]],
        function (PVx) { return PVx; },
        function (PVx) { return PVx; },
        function (PVx) { return PVx; },
        function (PVx) { return PVx; },
        function (PVx) { return PVx; },
    [CS,'->',['{',S2,'}']],
        function (PV_,PVy,PV__) { return ['{',PVy,'}']; },
        function (PV_,PVy,PV__) { return [FFformatTokenRef(PV_),'\n','***INDENT***',PVy,FFformatTokenRef(PV__),'\n','***INDENT***']; },
        function (PV_,PVy,PV__) { return PVy; },
        function (PV_,PVy,PV__) { return ['{','\n','***INDENT***',PVy,'}']; },
        function (PV_,PVy,PV__) { return ['{','<div>',PVy,'</div>','***INDENT***','}']; },
    [S2,'->',[S]],
        function (PVx) { return [PVx]; },
        function (PVx) { return [PVx]; },
        function (PVx) { return [PVx]; },
        function (PVx) { return [PVx]; },
        function (PVx) { return [PVx]; },
    [S2,'->',[S,S2]],
        function (PVx,PVx2) { return Array.prototype.concat([PVx],PVx2); },
        function (PVx,PVx2) { return Array.prototype.concat([PVx],PVx2); },
        function (PVx,PVx2) { return Array.prototype.concat([PVx],PVx2); },
        function (PVx,PVx2) { return Array.prototype.concat([PVx],PVx2); },
        function (PVx,PVx2) { return Array.prototype.concat([PVx],PVx2); },
    [S,'->',[CS]],
        function (PVx) { return PVx; },
        function (PVx) { return PVx; },
        function (PVx) { return PVx; },
        function (PVx) { return PVx; },
        function (PVx) { return PVx; },
    [S,'->',[';']],
        function (PVx) { return PVx; },
        function (PVx) { return PVx; },
        function (PVx) { return PVx; },
        function (PVx) { return [';','\n','***INDENT***']; },
        function (PVx) { return ['<div>','***INDENT***',';','</div>']; },
    [S,'->',['if',CO,CS]],
        function (PV_,PVco,PVcs) { return ['if',PVco,PVcs]; },
        function (PV_,PVco,PVcs) { return [PVco,PVcs]; },
        function (PV_,PVco,PVcs) { return [PVco,PVcs]; },
        function (PV_,PVco,PVcs) { return ['if',PVco,PVcs]; },
        function (PV_,PVco,PVcs) { return ['<div>','***INDENT***','if',PVco,PVcs,'</div>']; },
    [S,'->',['if',CO,CS,'else',S]],
        function (PV_,PVco,PVcs,PV__,PVs) { return ['if',PVco,PVcs,'else',PVs]; },
        function (PV_,PVco,PVcs,PV__,PVs) { return [PVco,PVcs,PVs]; },
        function (PV_,PVco,PVcs,PV__,PVs) { return [PVco,PVcs,PVs]; },
        function (PV_,PVco,PVcs,PV__,PVs) { return ['if',PVco,PVcs,'else',PVs]; },
        function (PV_,PVco,PVcs,PV__,PVs) { return ['<div>','***INDENT***','if',PVco,PVcs,'else',PVs,'</div>']; },
    [S,'->',['while',CO,CS]],
        function (PV_,PVco,PVcs) { return ['while',PVco,PVcs]; },
        function (PV_,PVco,PVcs) { return [PVco,PVcs]; },
        function (PV_,PVco,PVcs) { return [PVco,PVcs]; },
        function (PV_,PVco,PVcs) { return ['while',PVco,PVcs]; },
        function (PV_,PVco,PVcs) { return ['<div>','***INDENT***','while',PVco,PVcs,'</div>']; },
    [S,'->',['for','(',';',';',')',CS]],
        function (PVfor,PV_o,PV_,PV__,PV_c,PVcs) { return ['for(;;)',PVcs]; },
        function (PVfor,PV_o,PV_,PV__,PV_c,PVcs) { return PVcs; },
        function (PVfor,PV_o,PV_,PV__,PV_c,PVcs) { return PVcs; },
        function (PVfor,PV_o,PV_,PV__,PV_c,PVcs) { return ['for ( ; ; )',PVcs,'\n','***INDENT***']; },
        function (PVfor,PV_o,PV_,PV__,PV_c,PVcs) { return FFbuildForHTML([],[],[],PVcs); },
    [S,'->',['for','(',';',';',X,')',CS]],
        function (PVfor,PV_o,PV_,PV__,PVx,PV_c,PVcs) { return ['for(;;',PVx,')',PVcs]; },
        function (PVfor,PV_o,PV_,PV__,PVx,PV_c,PVcs) { return [PVx,PVcs]; },
        function (PVfor,PV_o,PV_,PV__,PVx,PV_c,PVcs) { return [PVx,PVcs]; },
        function (PVfor,PV_o,PV_,PV__,PVx,PV_c,PVcs) { return ['for ( ; ;',PVx,')',PVcs,'\n','***INDENT***']; },
        function (PVfor,PV_o,PV_,PV__,PVx,PV_c,PVcs) { return FFbuildForHTML([],[],PVx,PVcs); },
    [S,'->',['for','(',';',X,';',')',CS]],
        function (PVfor,PV_o,PV_,PVx,PV__,PV_c,PVcs) { return ['for(;',PVx,';)',PVcs]; },
        function (PVfor,PV_o,PV_,PVx,PV__,PV_c,PVcs) { return [PVx,PVcs]; },
        function (PVfor,PV_o,PV_,PVx,PV__,PV_c,PVcs) { return [PVx,PVcs]; },
        function (PVfor,PV_o,PV_,PVx,PV__,PV_c,PVcs) { return ['for ( ;',PVx,'; )', PVcs,'\n','***INDENT***']; },
        function (PVfor,PV_o,PV_,PVx,PV__,PV_c,PVcs) { return FFbuildForHTML([],PVx,[],PVcs); },
    [S,'->',['for','(',';',X,';',X,')',CS]],
        function (PVfor,PV_o,PV_,PVx,PV__,PVx2,PV_c,PVcs) { return ['for(;',PVx,';',PVx2,')',PVcs]; },
        function (PVfor,PV_o,PV_,PVx,PV__,PVx2,PV_c,PVcs) { return [PVx,PVx2,PVcs]; },
        function (PVfor,PV_o,PV_,PVx,PV__,PVx2,PV_c,PVcs) { return [PVx,PVx2,PVcs]; },
        function (PVfor,PV_o,PV_,PVx,PV__,PVx2,PV_c,PVcs) { return ['for ( ;',PVx,';',PVx2,')',PVcs,'\n','***INDENT***']; },
        function (PVfor,PV_o,PV_,PVx,PV__,PVx2,PV_c,PVcs) { return FFbuildForHTML([],PVx,PVx2,PVcs); },
    [S,'->',['for','(',X,';',';',')',CS]],
        function (PVfor,PV_o,PVx,PV_,PV__,PV_c,PVcs) { return ['for(',PVx,';;)',PVcs]; },
        function (PVfor,PV_o,PVx,PV_,PV__,PV_c,PVcs) { return [PVx,PVcs]; },
        function (PVfor,PV_o,PVx,PV_,PV__,PV_c,PVcs) { return [PVx,PVcs]; },
        function (PVfor,PV_o,PVx,PV_,PV__,PV_c,PVcs) { return ['for (',PVx,'; ; )',PVcs,'\n','***INDENT***']; },
        function (PVfor,PV_o,PVx,PV_,PV__,PV_c,PVcs) { return FFbuildForHTML(PVx,[],[],PVcs); },
    [S,'->',['for','(',X,';',';',X,')',CS]],
        function (PVfor,PV_o,PVx,PV_,PV__,PVx2,PV_c,PVcs) { return ['for(',PVx,';;',PVx2,')',PVcs]; },
        function (PVfor,PV_o,PVx,PV_,PV__,PVx2,PV_c,PVcs) { return [PVx,PVx2,PVcs]; },
        function (PVfor,PV_o,PVx,PV_,PV__,PVx2,PV_c,PVcs) { return [PVx,PVx2,PVcs]; },
        function (PVfor,PV_o,PVx,PV_,PV__,PVx2,PV_c,PVcs) { return ['for (',PVx,'; ;',PVx2,')',PVcs,'\n','***INDENT***']; },
        function (PVfor,PV_o,PVx,PV_,PV__,PVx2,PV_c,PVcs) { return FFbuildForHTML(PVx,[],PVx2,PVcs); },
    [S,'->',['for','(',X,';',X,';',')',CS]],
        function (PVfor,PV_o,PVx,PV_,PVx2,PV__,PV_c,PVcs) { return ['for(',PVx,';',PVx2,';)',PVcs]; },
        function (PVfor,PV_o,PVx,PV_,PVx2,PV__,PV_c,PVcs) { return [PVx,PVx2,PVcs]; },
        function (PVfor,PV_o,PVx,PV_,PVx2,PV__,PV_c,PVcs) { return [PVx,PVx2,PVcs]; },
        function (PVfor,PV_o,PVx,PV_,PVx2,PV__,PV_c,PVcs) { return ['for (',PVx,';',PVx2,';)',PVcs,'\n','***INDENT***']; },
        function (PVfor,PV_o,PVx,PV_,PVx2,PV__,PV_c,PVcs) { return FFbuildForHTML(PVx,PVx2,[],PVcs); },
    [S,'->',['for','(',X,';',X,';',X,')',CS]],
        function (PVfor,PV_o,PVx,PV_,PVx2,PV__,PVx3,PV_c,PVcs) { return ['for(',PVx,';',PVx2,';',PVx3,')',PVcs]; },
        function (PVfor,PV_o,PVx,PV_,PVx2,PV__,PVx3,PV_c,PVcs) { return [PVx,PVx2,PVx3,PVcs]; },
        function (PVfor,PV_o,PVx,PV_,PVx2,PV__,PVx3,PV_c,PVcs) { return [PVx,PVx2,PVx3,PVcs]; },
        function (PVfor,PV_o,PVx,PV_,PVx2,PV__,PVx3,PV_c,PVcs) { return ['for (',PVx,';',PVx2,';',PVx3,')',PVcs,'\n','***INDENT***']; },
        function (PVfor,PV_o,PVx,PV_,PVx2,PV__,PVx3,PV_c,PVcs) { return FFbuildForHTML(PVx,PVx2,PVx3,PVcs); },
    [S,'->',['break',';']],
        function (PV_,PV__) { return 'break'; },
        function (PV_,PV__) { return ''; },
        function (PV_,PV__) { return ''; },
        function (PV_,PV__) { return ['break',';','\n','***INDENT***']; },
        function (PV_,PV__) { return ['<div>','***INDENT***','break',';','</div>']; },
    [S,'->',['continue',';']],
        function (PV_,PV__) { return 'continue'; },
        function (PV_,PV__) { return ''; },
        function (PV_,PV__) { return ''; },
        function (PV_,PV__) { return ['continue',';','\n','***INDENT***']; },
        function (PV_,PV__) { return ['<div>','***INDENT***','continue',';','</div>']; },
    [S,'->',['return',';']],
        function (PV_,PV__) { return 'return'; },
        function (PV_,PV__) { return ''; },
        function (PV_,PV__) { return ''; },
        function (PV_,PV__) { return ['return',';','\n','***INDENT***']; },
        function (PV_,PV__) { return ['<div>','***INDENT***','return',';','</div>']; },
    [S,'->',['return',X,';']],
        function (PV_,PVx,PV__) { return ['return',PVx]; },
        function (PV_,PVx,PV__) { return PVx; },
        function (PV_,PVx,PV__) { return PVx; },
        function (PV_,PVx,PV__) { return ['return',PVx,';','\n','***INDENT***']; },
        function (PV_,PVx,PV__) { return ['<div>','***INDENT***','return',PVx,';','</div>']; },
    [S,'->',['var','NAME',';']],
        function (PV_,PVn,PV__) { return ['var',PVn]; },
        function (PV_,PVn,PV__) { return ['(','def', FFformatTokenRef(PVn),')','\n','***INDENT***']; },
        function (PV_,PVn,PV__) { return ''; },
        function (PV_,PVn,PV__) { return ['var',PVn.MMchars,';','\n','***INDENT***']; },
        function (PV_,PVn,PV__) { return ['<div>','***INDENT***','<span class="hiIdentifier">','var','</span>',PVn.MMchars,';','</div>']; },
    [S,'->',['var','NAME','=',X,';']],
        function (PV_,PVn,PV__,PVx,PV___) { return ['var',PVn,'=',PVx]; },
        function (PV_,PVn,PV__,PVx,PV___) { return ['(','def', FFformatTokenRef(PVn),PVx,')','\n','***INDENT***']; },
        function (PV_,PVn,PV__,PVx,PV___) { return PVx; },
        function (PV_,PVn,PV__,PVx,PV___) { return ['var',PVn.MMchars,'=',PVx,';','\n','***INDENT***']; },
        function (PV_,PVn,PV__,PVx,PV___) { return ['<div>','***INDENT***','<span class="hiIdentifier">','var','</span>',PVn.MMchars,'=',PVx,';','</div>']; },
    [S,'->',['throw',X,';']],
        function (PV_,PVx,PV__) { return ['throw',PVx]; },
        function (PV_,PVx,PV__) { return PVx; },
        function (PV_,PVx,PV__) { return PVx; },
        function (PV_,PVx,PV__) { return ['throw',PVx,';','\n','***INDENT***']; },
        function (PV_,PVx,PV__) { return ['<div>','***INDENT***','throw',PVx,';','</div>']; },
    [S,'->',[X,';']],
        function (PVx,PV_) { return PVx; },
        function (PVx,PV_) { return PVx; },
        function (PVx,PV_) { return PVx; },
        function (PVx,PV_) { return [PVx,';','\n','***INDENT***']; },
        function (PVx,PV_) { return ['<div>','***INDENT***',PVx,';','</div>']; },
    [CO,'->',['(',X,')']],
        function (PV_,PVx,PV__) { return ['(',PVx,')']; },
        function (PV_,PVx,PV__) { return PVx; },
        function (PV_,PVx,PV__) { return PVx; },
        function (PV_,PVx,PV__) { return ['(',PVx,')']; },
        function (PV_,PVx,PV__) { return ['(',PVx,')']; },
    [X,'->',[CX]],
        function (PVx) { return PVx; },
        function (PVx) { return PVx; },
        function (PVx) { return PVx; },
        function (PVx) { return PVx; },
        function (PVx) { return PVx; },
    [X,'->',[CX,AO,X]],
        function (PVcx,PVao,PVx) { return [PVcx,PVao,PVx]; },
        function (PVcx,PVao,PVx) { return [PVcx,PVx]; },
        function (PVcx,PVao,PVx) { return [PVcx,PVx]; },
        function (PVcx,PVao,PVx) { return (
                (PVao == "=" && PVcx instanceof Array && PVcx[0] == "GETITEM") ?
            ['SETITEM','(',PVcx[2],',',PVcx[4],',',PVx,')'] : [PVcx,PVao,PVx]);},
        function (PVcx,PVao,PVx) { return [PVcx,PVao,PVx];},
    [AO,'->',['=']],
        function (PVx) { return "eq"; },
        function (PVx) { return ""; },
        function (PVx) { return ""; },
        function (PVx) { return "="; },
        function (PVx) { return "="; },
    [AO,'->',['*=']],
        function (PVx) { return "muleq"; },
        function (PVx) { return ""; },
        function (PVx) { return ""; },
        function (PVx) { return "*="; },
        function (PVx) { return "*="; },
    [AO,'->',['/=']],
        function (PVx) { return "diveq"; },
        function (PVx) { return ""; },
        function (PVx) { return ""; },
        function (PVx) { return "/="; },
        function (PVx) { return "/="; },
    [AO,'->',['%=']],
        function (PVx) { return "modeq"; },
        function (PVx) { return ""; },
        function (PVx) { return ""; },
        function (PVx) { return "%="; },
        function (PVx) { return "%="; },
    [AO,'->',['+=']],
        function (PVx) { return "addeq"; },
        function (PVx) { return ""; },
        function (PVx) { return ""; },
        function (PVx) { return "+="; },
        function (PVx) { return "+="; },
    [AO,'->',['-=']],
        function (PVx) { return "subeq"; },
        function (PVx) { return ""; },
        function (PVx) { return ""; },
        function (PVx) { return "-="; },
        function (PVx) { return "-="; },
    [AO,'->',['<<=']],
        function (PVx) { return "lshifteq"; },
        function (PVx) { return ""; },
        function (PVx) { return ""; },
        function (PVx) { return "<<="; },
        function (PVx) { return "&lt;&lt;="; },
    [AO,'->',['>>=']],
        function (PVx) { return "rshifteq"; },
        function (PVx) { return ""; },
        function (PVx) { return ""; },
        function (PVx) { return ">>="; },
        function (PVx) { return "&gt;&gt;="; },
    [AO,'->',['>>>=']],
        function (PVx) { return "zshifteq"; },
        function (PVx) { return ""; },
        function (PVx) { return ""; },
        function (PVx) { return ">>>="; },
        function (PVx) { return "&gt;&gt;&gt;="; },
    [CX,'->',[OX]],
        function (PVx) { return PVx; },
        function (PVx) { return PVx; },
        function (PVx) { return PVx; },
        function (PVx) { return PVx; },
        function (PVx) { return PVx; },
    [CX,'->',[OX,'?',X,':',X]],
        function (PVx,PV_,PVy,PV__,PVz) { return ['?:',PVx,PVy,PVz]; },
        function (PVx,PV_,PVy,PV__,PVz) { return [PVx,PVy,PVz]; },
        function (PVx,PV_,PVy,PV__,PVz) { return [PVx,PVy,PVz]; },
        function (PVx,PV_,PVy,PV__,PVz) { return [PVx,'?',PVy,':',PVz]; },
        function (PVx,PV_,PVy,PV__,PVz) { return [PVx,'?',PVy,':',PVz]; },
    [OX,'->',[NX]],
        function (PVx) { return PVx; },
        function (PVx) { return PVx; },
        function (PVx) { return PVx; },
        function (PVx) { return PVx; },
        function (PVx) { return PVx; },
    [OX,'->',[NX,'||',OX]],
        function (PVx,PVy,PVz) { return [PVx,"lor",PVz]; },
        function (PVx,PVy,PVz) { return [PVx,PVz]; },
        function (PVx,PVy,PVz) { return [PVx,PVz]; },
        function (PVx,PVy,PVz) { return [PVx,'||',PVz]; },
        function (PVx,PVy,PVz) { return [PVx,'||',PVz]; },
    [NX,'->',[BOX]],
        function (PVx) { return PVx; },
        function (PVx) { return PVx; },
        function (PVx) { return PVx; },
        function (PVx) { return PVx; },
        function (PVx) { return PVx; },
    [NX,'->',[BOX,'&&',NX]],
        function (PVx,PVy,PVz) { return [PVx,"land",PVz]; },
        function (PVx,PVy,PVz) { return [PVx,PVz]; },
        function (PVx,PVy,PVz) { return [PVx,PVz]; },
        function (PVx,PVy,PVz) { return [PVx,'&&',PVz]; },
        function (PVx,PVy,PVz) { return [PVx,'&amp;&amp;',PVz]; },
    [BOX,'->',[BXX]],
        function (PVx) { return PVx; },
        function (PVx) { return PVx; },
        function (PVx) { return PVx; },
        function (PVx) { return PVx; },
        function (PVx) { return PVx; },
    [BOX,'->',[BXX,'|',BOX]],
        function (PVx,PVy,PVz) { return [PVx,"bor",PVz]; },
        function (PVx,PVy,PVz) { return [PVx,PVz]; },
        function (PVx,PVy,PVz) { return [PVx,PVz]; },
        function (PVx,PVy,PVz) { return [PVx,'|',PVz]; },
        function (PVx,PVy,PVz) { return [PVx,'|',PVz]; },
    [BXX,'->',[BNX]],
        function (PVx) { return PVx; },
        function (PVx) { return PVx; },
        function (PVx) { return PVx; },
        function (PVx) { return PVx; },
        function (PVx) { return PVx; },
    [BXX,'->',[BNX,'^',BXX]],
        function (PVx,PVy,PVz) { return [PVx,"bxor",PVz]; },
        function (PVx,PVy,PVz) { return [PVx,PVz]; },
        function (PVx,PVy,PVz) { return [PVx,PVz]; },
        function (PVx,PVy,PVz) { return [PVx,'^',PVz]; },
        function (PVx,PVy,PVz) { return [PVx,'^',PVz]; },
    [BNX,'->',[QX]],
        function (PVx) { return PVx; },
        function (PVx) { return PVx; },
        function (PVx) { return PVx; },
        function (PVx) { return PVx; },
        function (PVx) { return PVx; },
    [BNX,'->',[QX,'&',BNX]],
        function (PVx,PVy,PVz) { return [PVx,"band",PVz]; },
        function (PVx,PVy,PVz) { return [PVx,PVz]; },
        function (PVx,PVy,PVz) { return [PVx,PVz]; },
        function (PVx,PVy,PVz) { return [PVx,'&',PVz]; },
        function (PVx,PVy,PVz) { return [PVx,'&amp;',PVz]; },
    [QX,'->',[RX]],
        function (PVx) { return PVx; },
        function (PVx) { return PVx; },
        function (PVx) { return PVx; },
        function (PVx) { return PVx; },
        function (PVx) { return PVx; },
    [QX,'->',[RX,QO,QX]],
        function (PVx,PVy,PVz) { return [PVx,PVy,PVz]; },
        function (PVx,PVy,PVz) { return [PVx,PVz]; },
        function (PVx,PVy,PVz) { return [PVx,PVz]; },
        function (PVx,PVy,PVz) { return [PVx,PVy,PVz]; },
        function (PVx,PVy,PVz) { return [PVx,PVy,PVz]; },
    [QO,'->',['==']],
        function (PVx) { return "eqeq"; },
        function (PVx) { return ""; },
        function (PVx) { return ""; },
        function (PVx) { return "=="; },
        function (PVx) { return "=="; },
    [QO,'->',['!=']],
        function (PVx) { return "noteq"; },
        function (PVx) { return ""; },
        function (PVx) { return ""; },
        function (PVx) { return "!="; },
        function (PVx) { return "!="; },
    [QO,'->',['===']],
        function (PVx) { return "eqeqeq"; },
        function (PVx) { return ""; },
        function (PVx) { return ""; },
        function (PVx) { return "==="; },
        function (PVx) { return "==="; },
    [QO,'->',['!==']],
        function (PVx) { return "noteqeq"; },
        function (PVx) { return ""; },
        function (PVx) { return ""; },
        function (PVx) { return "!=="; },
        function (PVx) { return "!=="; },
    [RX,'->',[SHX]],
        function (PVx) { return PVx; },
        function (PVx) { return PVx; },
        function (PVx) { return PVx; },
        function (PVx) { return PVx; },
        function (PVx) { return PVx; },
    [RX,'->',[RX,RO,SHX]],
        function (PVx,PVy,PVz) { return [PVx,PVy,PVz]; },
        function (PVx,PVy,PVz) { return [PVx,PVz]; },
        function (PVx,PVy,PVz) { return [PVx,PVz]; },
        function (PVx,PVy,PVz) { return [PVx,PVy,PVz]; },
        function (PVx,PVy,PVz) { return [PVx,PVy,PVz]; },
    [RO,'->',['<']],
        function (PVx) { return "lt"; },
        function (PVx) { return ""; },
        function (PVx) { return ""; },
        function (PVx) { return "<"; },
        function (PVx) { return "&lt;"; },
    [RO,'->',['>']],
        function (PVx) { return "gt"; },
        function (PVx) { return ""; },
        function (PVx) { return ""; },
        function (PVx) { return ">"; },
        function (PVx) { return "&gt;"; },
    [RO,'->',['<=']],
        function (PVx) { return "le"; },
        function (PVx) { return ""; },
        function (PVx) { return ""; },
        function (PVx) { return "<="; },
        function (PVx) { return "&lt;="; },
    [RO,'->',['>=']],
        function (PVx) { return "ge"; },
        function (PVx) { return ""; },
        function (PVx) { return ""; },
        function (PVx) { return ">="; },
        function (PVx) { return "&gt;="; },
    [RO,'->',['instanceof']],
        function (PVx) { return "instanceof"; },
        function (PVx) { return ""; },
        function (PVx) { return ""; },
        function (PVx) { return "instanceof"; },
        function (PVx) { return "instanceof"; },
    [SHX,'->',[AX]],
        function (PVx) { return PVx; },
        function (PVx) { return PVx; },
        function (PVx) { return PVx; },
        function (PVx) { return PVx; },
        function (PVx) { return PVx; },
    [SHX,'->',[AX,SHO,SHX]],
        function (PVx,PVy,PVz) { return [PVx,PVy,PVz]; },
        function (PVx,PVy,PVz) { return [PVx,PVz]; },
        function (PVx,PVy,PVz) { return [PVx,PVz]; },
        function (PVx,PVy,PVz) { return [PVx,PVy,PVz]; },
        function (PVx,PVy,PVz) { return [PVx,PVy,PVz]; },
    [SHO,'->',['<<']],
        function (PVx) { return "lshift"; },
        function (PVx) { return ""; },
        function (PVx) { return ""; },
        function (PVx) { return "<<"; },
        function (PVx) { return "&lt;&lt;"; },
    [SHO,'->',['>>']],
        function (PVx) { return "rshift"; },
        function (PVx) { return ""; },
        function (PVx) { return ""; },
        function (PVx) { return ">>"; },
        function (PVx) { return "&gt;&gt;"; },
    [SHO,'->',['>>>']],
        function (PVx) { return "zshift"; },
        function (PVx) { return ""; },
        function (PVx) { return ""; },
        function (PVx) { return ">>>"; },
        function (PVx) { return "&gt;&gt;&gt;"; },
    [AX,'->',[MULX]],
        function (PVx) { return PVx; },
        function (PVx) { return PVx; },
        function (PVx) { return PVx; },
        function (PVx) { return PVx; },
        function (PVx) { return PVx; },
    [AX,'->',[MULX,'+',AX]],
        function (PVmulx,PVop,PVax) { return [PVmulx,"add",PVax]; },
        function (PVmulx,PVop,PVax) { return [PVmulx,PVax]; },
        function (PVmulx,PVop,PVax) { return [PVmulx,PVax]; },
        function (PVmulx,PVop,PVax) { return [PVmulx,'+',PVax]; },
        function (PVmulx,PVop,PVax) { return [PVmulx,'+',PVax]; },
    [AX,'->',[MULX,'-',AX]],
        function (PVmulx,PVop,PVax) { return [PVmulx,"sub",PVax]; },
        function (PVmulx,PVop,PVax) { return [PVmulx,PVax]; },
        function (PVmulx,PVop,PVax) { return [PVmulx,PVax]; },
        function (PVmulx,PVop,PVax) { return [PVmulx,'-',PVax]; },
        function (PVmulx,PVop,PVax) { return [PVmulx,'-',PVax]; },
    [MULX,'->',[UX]],
        function (PVx) { return PVx; },
        function (PVx) { return PVx; },
        function (PVx) { return PVx; },
        function (PVx) { return PVx; },
        function (PVx) { return PVx; },
    [MULX,'->',[UX,MO,MULX]],
        function (PVux,PVmo,PVmulx) { return [PVux,PVmo,PVmulx]; },
        function (PVux,PVmo,PVmulx) { return [PVux,PVmulx]; },
        function (PVux,PVmo,PVmulx) { return [PVux,PVmulx]; },
        function (PVux,PVmo,PVmulx) { return [PVux,PVmo,PVmulx]; },
        function (PVux,PVmo,PVmulx) { return [PVux,PVmo,PVmulx]; },
    [MO,'->',['*']],
        function (PVx) { return "mul"; },
        function (PVx) { return ""; },
        function (PVx) { return ""; },
        function (PVx) { return "*"; },
        function (PVx) { return "*"; },
    [MO,'->',['/']],
        function (PVx) { return "div"; },
        function (PVx) { return ""; },
        function (PVx) { return ""; },
        function (PVx) { return "/"; },
        function (PVx) { return "/"; },
    [MO,'->',['%']],
        function (PVx) { return "mod"; },
        function (PVx) { return ""; },
        function (PVx) { return ""; },
        function (PVx) { return "%"; },
        function (PVx) { return "%"; },
    [UX,'->',[MEMX]],
        function (PVx) { return PVx; },
        function (PVx) { return PVx; },
        function (PVx) { return PVx; },
        function (PVx) { return PVx; },
        function (PVx) { return PVx; },
    [UX,'->',['!',UX]],
        function (PV_,PVx) { return ['lnot',PVx]; },
        function (PV_,PVx) { return PVx; },
        function (PV_,PVx) { return PVx; },
        function (PV_,PVx) { return ['!',PVx]; },
        function (PV_,PVx) { return ['!',PVx]; },
    [UX,'->',['~',UX]],
        function (PV_,PVx) { return ['bneg', PVx]; },
        function (PV_,PVx) { return PVx; },
        function (PV_,PVx) { return PVx; },
        function (PV_,PVx) { return ['~',PVx]; },
        function (PV_,PVx) { return ['~',PVx]; },
    [UX,'->',['-',UX]],
        function (PV_,PVx) { return ['neg', PVx]; },
        function (PV_,PVx) { return PVx; },
        function (PV_,PVx) { return PVx; },
        function (PV_,PVx) { return ['-',PVx]; },
        function (PV_,PVx) { return ['-',PVx]; },
    [UX,'->',['typeof',UX]],
        function (PV_,PVx) { return ['typeof', PVx]; },
        function (PV_,PVx) { return PVx; },
        function (PV_,PVx) { return PVx; },
        function (PV_,PVx) { return ['typeof', PVx]; },
        function (PV_,PVx) { return ['typeof', PVx]; },
    [UX,'->',['void',UX]],
        function (PV_,PVx) { return ['void', PVx]; },
        function (PV_,PVx) { return PVx; },
        function (PV_,PVx) { return PVx; },
        function (PV_,PVx) { return ['void', PVx]; },
        function (PV_,PVx) { return ['void', PVx]; },
    [MEMX,'->',[PX]],
        function (PVx) { return PVx; },
        function (PVx) { return PVx; },
        function (PVx) { return PVx; },
        function (PVx) { return PVx; },
        function (PVx) { return PVx; },
    [MEMX,'->',[MEMX,'(',')']],
        function (PVx,PV_,PV__) { return [PVx,'()']; },
        function (PVx,PV_,PV__) { return PVx; },
        function (PVx,PV_,PV__) { return PVx; },
        function (PVx,PV_,PV__) { return [PVx,'()']; },
        function (PVx,PV_,PV__) { return [PVx,'()']; },
    [MEMX,'->',[MEMX,'(',ARGL,')']],
        function (PVx,PV_,PVargl,PV__) { return [PVx,'(',PVargl,')']; },
        function (PVx,PV_,PVargl,PV__) { return [PVx,PVargl]; },
        function (PVx,PV_,PVargl,PV__) { return [PVx,PVargl]; },
        function (PVx,PV_,PVargl,PV__) { return [PVx,'(',PVargl,')']; },
        function (PVx,PV_,PVargl,PV__) { return [PVx,'(',PVargl,')']; },
    [MEMX,'->',[MEMX,'.','NAME']],
        function (PVx,PV_,PVm) { return [PVx,'.',PVm]; },
        function (PVx,PV_,PVm) { return PVx; },
        function (PVx,PV_,PVm) { return [PVx,PV_,PVm]; },
        function (PVx,PV_,PVm) { return ['GETITEM','(',PVx,',',('"' + PVm.MMchars + '"'),')']; },
        function (PVx,PV_,PVm) { return [PVx,'.',PVm.MMchars]; },
    [MEMX,'->',[MEMX,'[',X,']']],
        function (PVx,PV_,PVs,PV__) { return [PVx,'[',PVs,']']; },
        function (PVx,PV_,PVs,PV__) { return [PVx,PVs]; },
        function (PVx,PV_,PVs,PV__) { return [PVx,PVs]; },
        function (PVx,PV_,PVs,PV__) { return ['GETITEM','(',PVx,',',PVs,')']; },
        function (PVx,PV_,PVs,PV__) { return [PVx,'[',PVs,']']; },
    [ARGL,'->',[X]],
        function (PVx) { return [PVx]; },
        function (PVx) { return [PVx]; },
        function (PVx) { return [PVx]; },
        function (PVx) { return [PVx]; },
        function (PVx) { return [PVx]; },
    [ARGL,'->',[X,",",ARGL]],
        function (PVx,PV_,PVargl) { return Array.prototype.concat([PVx],PVargl); },
        function (PVx,PV_,PVargl) { return Array.prototype.concat([PVx],PVargl); },
        function (PVx,PV_,PVargl) { return Array.prototype.concat([PVx],PVargl); },
        function (PVx,PV_,PVargl) { return Array.prototype.concat([PVx,','],PVargl); },
        function (PVx,PV_,PVargl) { return Array.prototype.concat([PVx,','],PVargl); },
    [ALIT,'->',['[',']']],
        function (PV_,PV__) { return "[]"; },
        function (PV_,PV__) { return ""; },
        function (PV_,PV__) { return ""; },
        function (PV_,PV__) { return "[]"; },
        function (PV_,PV__) { return "[]"; },
    [ALIT,'->',['[',ELTL,']']],
        function (PV_,PVx,PV__) { return ['[',PVx,']']; },
        function (PV_,PVx,PV__) { return PVx; },
        function (PV_,PVx,PV__) { return PVx; },
        function (PV_,PVx,PV__) { return ['[',PVx,']']; },
        function (PV_,PVx,PV__) { if (FFdeepLength(PVx) < DCsingleLineLimit) { FFzapDivTags(PVx); }
            return ['[',PVx,'</div>',']']; },
    [ALIT,'->',['[',ELTL,',',']']],
        function (PV_,PVx,PV__,PV___) { return ['[',PVx,']']; },
        function (PV_,PVx,PV__,PV___) { return PVx; },
        function (PV_,PVx,PV__,PV___) { return PVx; },
        function (PV_,PVx,PV__,PV___) { return ['[',PVx,']']; },
        function (PV_,PVx,PV__,PV___) { if (FFdeepLength(PVx) < DCsingleLineLimit) { FFzapDivTags(PVx); }
            return ['[',PVx,'</div>',']']; },
    [ELTL,'->',[X]],
        function (PVx) { return [PVx]; },
        function (PVx) { return [PVx]; },
        function (PVx) { return [PVx]; },
        function (PVx) { return [PVx]; },
        function (PVx) { if (FFdeepLength(PVx) < DCsingleLineLimit) { FFzapDivTags(PVx); }
            return ['<div>','***INDENT***',PVx]; },
    [ELTL,'->',[ELTL,',',X]],
        function (PVeltl,PV_,PVx) { return Array.prototype.concat(PVeltl,[PVx]); },
        function (PVeltl,PV_,PVx) { return Array.prototype.concat(PVeltl,[PVx]); },
        function (PVeltl,PV_,PVx) { return Array.prototype.concat(PVeltl,[PVx]); },
        function (PVeltl,PV_,PVx) { return Array.prototype.concat(PVeltl,[',',PVx]); },
        function (PVeltl,PV_,PVx) { if (FFdeepLength(PVx) < DCsingleLineLimit) { FFzapDivTags(PVx); }
            return Array.prototype.concat(PVeltl,[',','</div>','<div>','***INDENT***',PVx]); },
    [OLIT,'->',['{','}']],
        function (PV_,PV__) { return "{}"; },
        function (PV_,PV__) { return ""; },
        function (PV_,PV__) { return ""; },
        function (PV_,PV__) { return "{}"; },
        function (PV_,PV__) { return "{}"; },
    [OLIT,'->',['{',FL,'}']],
        function (PV_,PVfl,PV__) { return ['{',PVfl,'}']; },
        function (PV_,PVfl,PV__) { return PVfl; },
        function (PV_,PVfl,PV__) { return PVfl; },
        function (PV_,PVfl,PV__) { return ['{','\n','***INDENT***',PVfl,'\n','***INDENT***','}']; },
        function (PV_,PVfl,PV__) { if (FFdeepLength(PVfl) < DCsingleLineLimit) { FFzapDivTags(PVfl); }
            return ['{',PVfl,'</div>','}']; },
    [OLIT,'->',['{',FL,',','}']],
        function (PV_,PVfl,PV__,PV___) { return ['{',PVfl,'}']; },
        function (PV_,PVfl,PV__,PV___) { return PVfl; },
        function (PV_,PVfl,PV__,PV___) { return PVfl; },
        function (PV_,PVfl,PV__,PV___) { return ['{','\n','***INDENT***',PVfl,'\n','***INDENT***','}']; },
        function (PV_,PVfl,PV__,PV___) { if (FFdeepLength(PVfl) < DCsingleLineLimit) { FFzapDivTags(PVfl); }
            return ['{',PVfl,'</div>','}']; },
    [FL,'->',[LITF]],
        function (PVx) { return [PVx]; },
        function (PVx) { return [PVx]; },
        function (PVx) { return [PVx]; },
        function (PVx) { return [PVx]; },
        function (PVx) { return ['<div>','***INDENT***',PVx]; },
    [FL,'->',[FL,',',LITF]],
        function (PVfl,PV_,PVlitf) { return Array.prototype.concat(PVfl,[PVlitf]); },
        function (PVfl,PV_,PVlitf) { return Array.prototype.concat(PVfl,[PVlitf]); },
        function (PVfl,PV_,PVlitf) { return Array.prototype.concat(PVfl,[PVlitf]); },
        function (PVfl,PV_,PVlitf) { return Array.prototype.concat(PVfl,[',','\n','***INDENT***',PVlitf]); },
        function (PVfl,PV_,PVlitf) { return Array.prototype.concat(PVfl,[',','</div>','<div>','***INDENT***',PVlitf]); },
    [LITF,'->',['NAME',':',X]],
        function (PVn,PV_,PVx) { return [PVn,':',PVx]; },
        function (PVn,PV_,PVx) { return [PVx]; },
        function (PVn,PV_,PVx) { return [PVn,PVx]; },
        function (PVn,PV_,PVx) { return [PVn.MMchars,':',PVx]; },
        function (PVn,PV_,PVx) { return [PVn.MMchars,':',PVx]; },
    [LITF,'->',['NUMBER',':',X]],
        function (PVn,PV_,PVx) { return [PVn,':',PVx]; },
        function (PVn,PV_,PVx) { return [PVx]; },
        function (PVn,PV_,PVx) { return [PVn,PVx]; },
        function (PVn,PV_,PVx) { return [PVn.MMchars,':',PVx]; },
        function (PVn,PV_,PVx) { return [PVn.MMchars,':',PVx]; },
    [LITF,'->',['STRING',':',X]],
        function (PVn,PV_,PVx) { return [PVn,':',PVx]; },
        function (PVn,PV_,PVx) { return [PVx]; },
        function (PVn,PV_,PVx) { return [PVn,PVx]; },
        function (PVn,PV_,PVx) { return [PVn.MMchars,':',PVx]; },
        function (PVn,PV_,PVx) { return [FFhtmlEntities(PVn.MMchars),':',PVx]; },
    [PX,'->',['(', X, ')']],
        function (PVx,PVy,PVz) { return ['(',PVy,')']; },
        function (PVx,PVy,PVz) { return PVy; },
        function (PVx,PVy,PVz) { return PVy; },
        function (PVx,PVy,PVz) { return ['(',PVy,')']; },
        function (PVx,PVy,PVz) { return ['(',PVy,')']; },
    [PX,'->',[ALIT]],
        function (PVx) { return PVx; },
        function (PVx) { return PVx; },
        function (PVx) { return PVx; },
        function (PVx) { return PVx; },
        function (PVx) { return PVx; },
    [PX,'->',[OLIT]],
        function (PVx) { return PVx; },
        function (PVx) { return PVx; },
        function (PVx) { return PVx; },
        function (PVx) { return PVx; },
        function (PVx) { return PVx; },
    [PX,'->',['NAME']],
        function (PVx) { return PVx; },
        function (PVx) { return ['(','use', FFformatTokenRef(PVx),')','\n','***INDENT***']; },
        function (PVx) { return ""; },
        function (PVx) { return PVx.MMchars; },
        function (PVx) { return PVx.MMchars; },
    [PX,'->',['NUMBER']],
        function (PVx) { return PVx; },
        function (PVx) { return ""; },
        function (PVx) { return ""; },
        function (PVx) { return PVx.MMchars;; },
        function (PVx) { return PVx.MMchars;; },
    [PX,'->',['STRING']],
        function (PVx) { return PVx; },
        function (PVx) { return ""; },
        function (PVx) { return ""; },
        function (PVx) { return PVx.MMchars; },
        function (PVx) { return FFhtmlEntities(PVx.MMchars); },
    [PX,'->',['false']],
        function (PVx) { return "false"; },
        function (PVx) { return ""; },
        function (PVx) { return ""; },
        function (PVx) { return "false"; },
        function (PVx) { return "false"; },
    [PX,'->',['true']],
        function (PVx) { return "true"; },
        function (PVx) { return ""; },
        function (PVx) { return ""; },
        function (PVx) { return "true"; },
        function (PVx) { return "true"; },
    [PX,'->',['null']],
        function (PVx) { return "null"; },
        function (PVx) { return ""; },
        function (PVx) { return ""; },
        function (PVx) { return "null"; },
        function (PVx) { return "null"; },
    [PX,'->',[FX]],
        function (PVx) { return PVx; },
        function (PVx) { return PVx; },
        function (PVx) { return PVx; },
        function (PVx) { return PVx; },
        function (PVx) { return PVx; },
    [FX,'->',[AF]],
        function (PVx) { return PVx; },
        function (PVx) { return PVx; },
        function (PVx) { return PVx; },
        function (PVx) { return PVx; },
        function (PVx) { return PVx; },
    [FX,'->',[NF]],
        function (PVx) { return PVx; },
        function (PVx) { return PVx; },
        function (PVx) { return PVx; },
        function (PVx) { return PVx; },
        function (PVx) { return PVx; },
    [AF,'->',['function','(',')',CS]],
        function (PVf,PV_o,PV_c,PVcs) { return ['function()',PVcs]; },
        function (PVf,PV_o,PV_c,PVcs) { return ['(','lambda','(',')',PVcs,')','\n','***INDENT***']; },
        function (PVf,PV_o,PV_c,PVcs) { return PVcs; },
        function (PVf,PV_o,PV_c,PVcs) { return ['function ()',PVcs]; },
        function (PVf,PV_o,PV_c,PVcs) { return ['<span class="hiFunction">','function','</span>','()',PVcs]; },
    [AF,'->',['function','(',PL,')',CS]],
        function (PVf,PV_o,PVpl,PV_c,PVcs) { return ['function(',PVpl,')',PVcs]; },
        function (PVf,PV_o,PVpl,PV_c,PVcs) { return ['(','lambda','(',PVpl,')',PVcs,')','\n','***INDENT***']; },
        function (PVf,PV_o,PVpl,PV_c,PVcs) { return PVcs; },
        function (PVf,PV_o,PVpl,PV_c,PVcs) { return ['function (',PVpl,')',PVcs]; },
        function (PVf,PV_o,PVpl,PV_c,PVcs) { return ['<span class="hiFunction">','function','</span>','(',PVpl,')',PVcs]; },
    [NF,'->',['function','NAME','(',')',CS]],
        function (PVf,PVn,PV_o,PV_c,PVcs) { return ['function',PVn,'()',PVcs]; },
        function (PVf,PVn,PV_o,PV_c,PVcs) { return ['(','lambda','(',')',PVcs,')','\n','***INDENT***']; },
        function (PVf,PVn,PV_o,PV_c,PVcs) { return PVcs; },
        function (PVf,PVn,PV_o,PV_c,PVcs) { return ['function',PVn.MMchars,'()',PVcs]; },
        function (PVf,PVn,PV_o,PV_c,PVcs) { return ['<span class="hiFunction">','function','</span>','<b>',PVn.MMchars,'</b>','()',PVcs]; },
    [NF,'->',['function','NAME','(',PL,')',CS]],
        function (PVf,PVn,PV_o,PVpl,PV_c,PVcs) { return ['function',PVn,'(',PVpl,')',PVcs]; },
        function (PVf,PVn,PV_o,PVpl,PV_c,PVcs) { return ['(','lambda','(',PVpl,')',PVcs,')','\n','***INDENT***']; },
        function (PVf,PVn,PV_o,PVpl,PV_c,PVcs) { return PVcs; },
        function (PVf,PVn,PV_o,PVpl,PV_c,PVcs) { return ['function',PVn.MMchars,'(',PVpl,')',PVcs]; },
        function (PVf,PVn,PV_o,PVpl,PV_c,PVcs) { return ['<span class="hiFunction">','function','</span>','<b>',PVn.MMchars,'</b>','(',PVpl,')',PVcs]; },
    [PL,'->',['NAME']],
        function (PVn) { return [PVn]; },
        function (PVn) { return [FFformatTokenRef(PVn)]; },
        function (PVn) { return ""; },
        function (PVn) { return [PVn.MMchars]; },
        function (PVn) { return [PVn.MMchars]; },
    [PL,'->',['NAME',',',PL]],
        function (PVn,PV_,PVl) { return Array.prototype.concat([PVn],PVl); },
        function (PVn,PV_,PVl) { return Array.prototype.concat([FFformatTokenRef(PVn)],PVl); },
        function (PVn,PV_,PVl) { return ""; },
        function (PVn,PV_,PVl) { return Array.prototype.concat([PVn.MMchars,','],PVl); },
        function (PVn,PV_,PVl) { return Array.prototype.concat([PVn.MMchars,','],PVl); },
];

// Format a reference to a token (see scope / LVdata3)
FFformatTokenRef = function FFformatTokenRef(PVtoken) {
    return PVtoken.MMchars + '@' + (PVtoken.MMlineno + 1) + ',' + (PVtoken.MMcolno + 1) + '/' + PVtoken.MMoffset;
};

// Compute the sum of the lengths of all (non-tag) strings
FFdeepLength = function FFdeepLength(PVx) {
    var LVresult = 0;
    var FFdlHelper = function dlHelper(PVe) {
        if (PVe instanceof Array) {
            var LVi;
            for (LVi = 0; LVi < PVe.length; LVi += 1) {
                FFdlHelper(PVe[LVi]);
            }
        } else if (typeof PVe == "string" && PVe.length > 0 && PVe[0] != '<' ) {
            LVresult += PVe.length;
        }
    };
    FFdlHelper(PVx);
    return LVresult;
};

// set all <div> and </div> entries to the empty string
// also removes indents
FFzapDivTags = function FFzapDivTags(PVx) {
    var FFzdtHelper = function dlHelper(PVe) {
        if (PVe instanceof Array) {
            var LVi;
            for (LVi = 0; LVi < PVe.length; LVi += 1) {
                if (PVe[LVi] == '<div>' || PVe[LVi] == '</div>' || PVe[LVi] == '***INDENT***') {
                    PVe[LVi] = '';
                } else {
                    FFzdtHelper(PVe[LVi]);
                }
            }
        }
    };
    FFzdtHelper(PVx);
};

// Convert string characters to HTML entities
FFhtmlEntities = function FFhtmlEntities(PVx) {
    var LVi;
    var LVresult = [];
    for (LVi = 0; LVi < PVx.length; LVi += 1) {
        var LVc = PVx[LVi];
        if (LVc == '&') {
            LVresult.push('&amp;');
        } else if (LVc == '<') {
            LVresult.push('&lt;');
        } else if (LVc == '>') {
            LVresult.push('&gt;');
        } else {
            LVresult.push(LVc);
        }
    }
    return LVresult.join("");
};

// Build the "for" statement HTML syntax tree
FFbuildForHTML = function FFbuildForHTML(PVa,PVb,PVc,PVbody) {
    var LVresult = ['<div>','***INDENT***','<span class="hiRepeat">','for','</span>','('];
    if (PVa.length > 0) {
        LVresult.push(PVa);
    }
    LVresult.push(';');
    if (PVb.length > 0) {
        LVresult.push(PVb);
    }
    LVresult.push(';');
    if (PVc.length > 0) {
        LVresult.push(PVc);
    }
    LVresult.push(')');
    LVresult.push(PVbody);
    LVresult.push('</div>');
    return LVresult;
};

// 1 GVrules
// data2 GVreducers
// data3 GVscopes
//       these functions compute the scopes of variables
// data4 GVmembers
//       these functions filter ".member" names
// data5 GVdrafts
//       the result of transformation that converts all "a.b" and "a[b]"
// data6 GVhtml
//       (2nd pass) generated HTML
// ? GVconstraints ??? allow a function to reject invalid syntactic forms
var GVrules = [];
var GVreducers = [];
var GVscopes = [];
var GVmembers = [];
var GVdrafts = [];
var GVhtml = [];

var FFmakeRulesAndReducers = function FFmakeRulesAndReducers() {
    var LVi;
    for (LVi = 0; LVi < GVrulesAndReducers.length; LVi += 1) {
        if (LVi % 6 == 0) {
            GVrules.push(GVrulesAndReducers[LVi]);
        } else if (LVi % 6 == 1) {
            GVreducers.push(GVrulesAndReducers[LVi]);
        } else if (LVi % 6 == 2) {
            GVscopes.push(GVrulesAndReducers[LVi]);
        } else if (LVi % 6 == 3) {
            GVmembers.push(GVrulesAndReducers[LVi]);
        } else if (LVi % 6 == 4) {
            GVdrafts.push(GVrulesAndReducers[LVi]);
        } else if (LVi % 6 == 5) {
            GVhtml.push(GVrulesAndReducers[LVi]);
        }
    }
    for (LVi = 0; LVi < GVrules.length; LVi += 1) {
        // console.log(LVi);
        // console.log(GVrules[LVi]);
        assert(GVrules[LVi][2].length == GVreducers[LVi].length);
        assert(GVrules[LVi][2].length == GVscopes[LVi].length);
        assert(GVrules[LVi][2].length == GVmembers[LVi].length);
        assert(GVrules[LVi][2].length == GVdrafts[LVi].length);
        assert(GVrules[LVi][2].length == GVhtml[LVi].length);
    }
};

FFmakeRulesAndReducers();

var FFprintRules = function FFprintRules() {
    var LVi;
    for (LVi = 0; LVi < GVrules.length; LVi += 1) {
        var LVrule = GVrules[LVi];
        assert(LVrule[1] == '->');
        console.log('#' + LVi + '\t' + LVrule[0] + LVrule[1] + LVrule[2].join("_"));
    }
};

// FFprintRules();

var GVstartRule = GVrules[0];

// 3 GVsymbols
// set of all symbols
var GVsymbols = {};

var FFmakeSymbols = function FFmakeSymbols() {
    var LVi;
    for (LVi = 0; LVi < GVrules.length; LVi += 1) {
        var LVrule = GVrules[LVi];
        assert(typeof LVrule[0] == 'string');
        assert(LVrule[0].length > 0);
        GVsymbols[LVrule[0]] = 1;
        var LVruleBody = LVrule[2];
        var LVj;
        for (LVj = 0; LVj < LVruleBody.length; LVj += 1) {
            assert(typeof LVruleBody[LVj] == 'string');
            assert(LVruleBody[LVj].length > 0);
            GVsymbols[LVruleBody[LVj]] = 1;
        }
    }
};

FFmakeSymbols();

var FFprintSymbols = function FFprintSymbols() {
    console.log("Symbols: " + Object.keys(GVsymbols).join(", "));
};

// FFprintSymbols();

// the item strings
var GVitemStrings = [];

// The rule number for the given item number
var GVitemRules = [];

// boolean: in the item INDEX, is the dot at the leftmost position?
var GVitemDotIsInLeftPos = [];

// symbol to the right of dot or the empty string
// is empty string if and only if dot is in rightmost position
var GVitemSymbolRightDot = [];

// item obtained by moving dot one position to the right
var GVitemMoveDotRight = [];

var GVitems = [];

// key is index into GVitems
// val is index into GVreducers
var GVacceptIndex = {};

var GVacceptItem;

var FFmakeItems = function FFmakeItems() {
    var LVi;
    for (LVi = 0; LVi < GVrules.length; LVi += 1) {
        var LVrule = GVrules[LVi];
        assert(typeof LVrule[0] == 'string');
        assert(typeof LVrule[1] == 'string');
        var LVruleBody = LVrule[2];
        var LVj;
        for (LVj = 0; LVj <= LVruleBody.length; LVj += 1) {
            var LVitem = [];
            LVitem.push(LVrule[0]);
            LVitem.push(LVrule[1]);
            var LVitemBody = [];
            LVitem.push(LVitemBody);
            Array.prototype.push.apply(LVitemBody,LVruleBody.slice(0,LVj));
            LVitemBody.push(DOT);
            Array.prototype.push.apply(LVitemBody,LVruleBody.slice(LVj));
            if (LVi == 0 && LVj == 1) {
                GVacceptItem = GVitems.length;
            }
            GVitems.push(LVitem);
            GVitemRules.push(LVi);
            var LVitemString = LVitem[0] + LVitem[1] + LVitemBody.join("_");
            GVitemStrings.push(LVitemString);
            if (LVj == 0) {
                GVitemDotIsInLeftPos.push(1);
            } else {
                GVitemDotIsInLeftPos.push(0);
            }
            if (LVj == LVruleBody.length) {
                GVitemMoveDotRight.push(-1);
                GVitemSymbolRightDot.push("");
                GVacceptIndex[GVitems.length - 1] = LVi;
            } else {
                assert(typeof LVruleBody[LVj] == 'string');
                GVitemMoveDotRight.push(GVitemMoveDotRight.length + 1);
                GVitemSymbolRightDot.push(LVruleBody[LVj]);
            }
        }
    }
};

FFmakeItems();

var GVstartItem = 0;

// the item numbers for the given item string
var GVitemNumbers = {};

var FFmakeItemNumbers = function FFmakeItemNumbers() {
    var LVi;
    for (LVi = 0; LVi < GVitems.length; LVi += 1) {
        var LVitemString = GVitemStrings[LVi];
        GVitemNumbers[LVitemString] = LVi;
    }
};

FFmakeItemNumbers();

// the item numbers for the closure of each symbol
var GVitemSymbols = {};

var FFmakeItemSymbols = function FFmakeItemSymbols() {
    var LVi;
    for (LVi = 0; LVi < GVitems.length; LVi += 1) {
        var LVsymbol = GVitems[LVi][0];
        if (GVitemDotIsInLeftPos[LVi]) {
            if (GVitemSymbols[LVsymbol] == undefined) {
                GVitemSymbols[LVsymbol] = [];
            }
            GVitemSymbols[LVsymbol].push(LVi);
        }
    }
};

FFmakeItemSymbols();

var FFprintItems = function FFprintItems() {
    var LVi;
    for (LVi = 0; LVi < GVitems.length; LVi += 1) {
        var LVitem = GVitems[LVi];
        console.log('#' + LVi + '\t' + LVitem[0] + LVitem[1] +
                LVitem[2].join("_"));
    }
};

// FFprintItems();

// PVset is a set of item IDs
// takes an item set object
// Returns an item set object
var FFcloseItemSet = function FFcloseItemSet(PVset) {
    assert(typeof PVset == "object");
    var LVresult = {};
    var LVcurrent = {};
    Object.keys(PVset).forEach(function (LVitemNum) {
        LVcurrent[LVitemNum] = 1;
    });
    while (1) {
        var LVnext = {};
        Object.keys(LVcurrent).forEach(function (LVitemNum) {
            LVnext[LVitemNum] = 1;
            var LVsymbol = GVitemSymbolRightDot[LVitemNum];
            var LVimpliedItems = GVitemSymbols[LVsymbol];
            if (LVimpliedItems != undefined) {
                var LVi;
                for (LVi = 0; LVi < LVimpliedItems.length; LVi += 1) {
                    LVnext[LVimpliedItems[LVi]] = 1;
                }
            }
        });
        if (Object.keys(LVcurrent).length == Object.keys(LVnext).length) {
            return LVcurrent;
        }
        LVcurrent = LVnext;
    }
};

var FFtestItems = function FFtestItems() {
    var LVitemSet = {};
    LVitemSet[GVitemNumbers['S->(O)_CS']] = 1;
    var LVclosedItemSet = FFcloseItemSet(LVitemSet);
    assert(Object.keys(LVitemSet).length != Object.keys(LVclosedItemSet).length);
};

FFtestItems();

// Return the item set object
var FFitemSetStringToObject = function FFitemSetStringToObject(PVitemSetString) {
    assert(typeof PVitemSetString == "string");
    var LVitemSetArray = PVitemSetString.split(",");
    var LVresult = {};
    var LVi;
    for (LVi = 0; LVi < LVitemSetArray.length; LVi += 1) {
        LVresult[LVitemSetArray[LVi]] = 1;
    }
    return LVresult;
};

// Return the item set string
var FFitemSetObjectToString = function FFitemSetObjectToString(PVitemSetObject) {
    assert(typeof PVitemSetObject == "object");
    return Object.keys(PVitemSetObject).sort().join(",");
};

// return true if item set has the "accept" item
var FFitemSetHasAcceptItem = function FFitemSetHasAcceptItem(PVitemSetObject) {
    assert(typeof PVitemSetObject == "object");
    return (PVitemSetObject[GVacceptItem] == 1);
};

// PVitemSet must be a closed item set
var FFnextItemSet = function FFnextItemSet(PVitemSet, PVsymbol) {
    assert(typeof PVitemSet == "object");
    var LVfilteredSet = {};
    Object.keys(PVitemSet).forEach(function (LVitemNum) {
        if (GVitemSymbolRightDot[LVitemNum] == PVsymbol) {
            LVfilteredSet[LVitemNum] = 1;
        }
    });
    var LVresult = {};
    Object.keys(LVfilteredSet).forEach(function (LVitemNum) {
        var LVnext = GVitemMoveDotRight[LVitemNum];
        assert(LVnext != -1);
        LVresult[LVnext] = 1;
    });
    return FFcloseItemSet(LVresult);
};

var FFprintItemSet = function FFprintItemSet(PVitemSet) {
    assert(typeof PVitemSet == "object");
    var LVitemStrings = [];
    Object.keys(PVitemSet).forEach(function (LVitemNum) {
        LVitemStrings.push(GVitemStrings[LVitemNum]);
    });
    console.log("{" + LVitemStrings.join(", ") + "}");
};

var FFtestNextItemSet = function FFtestNextItemSet() {
    var LVitemSet = {};
    LVitemSet[GVitemNumbers['E->(O)_E_*_B']] = 1;
    LVitemSet = FFcloseItemSet(LVitemSet);
    FFprintItemSet(LVitemSet);
    var LVnext = FFnextItemSet(LVitemSet, "1");
    FFprintItemSet(LVnext);
};
var GVitemSets = [];

// maps item set string to index into GVitemSets
var GVitemSetIndex = {};

// the string for the given item set number
var GVitemSetStrings = [];

// key is CSV string of item IDs in ascending order
// val is index into GVitemSets
var GVitemSetStringsInverse = {};

// key is same as GVitemSetStringsInverse
// val is generation of item set
var GVitemSetGeneration = {};

// key is symbol
// val is array mapping current state number to next state number or -1
var GVitemSetTrans = {};

// key is index into GVitemSets
// val is set of indexes into GVreducers
var GVitemSetReduce = [];

// key is index into GVitemSets
// val is whether or not the item set has the "accept" item
var GVisAcceptingState = [];

var FFmakeItemSets = function FFmakeItemSets() {
    // construct the initial item set object
    var LVstartItemSet = {};
    LVstartItemSet[GVstartItem] = 1;
    LVstartItemSet = FFcloseItemSet(LVstartItemSet);
    var LVstartItemString = FFitemSetObjectToString(LVstartItemSet);

    // LVcurrentGen, LVnextGen, LVallPastGen
    //   key is CSV strings of item IDs in ascending order
    //   val is number "1"
    var LVcurrentGen = {};
    var LVcurrentAndAllPastGen = {};
    LVcurrentGen[LVstartItemString] = 1;
    var LVgenNum = 1;
    while (1) {
        // add everything in the current generation to accumulation
        Object.keys(LVcurrentGen).forEach(function (PVitemSetString) {
            LVcurrentAndAllPastGen[PVitemSetString] = 1;
        });

        // take all item sets in the current generation
        // transition each item set by all symbols
        // add each resulting item set to next generation
        // unless it appears in LVcurrentAndAllPastGen
        var LVnextGen = {};
        Object.keys(LVcurrentGen).forEach(function (PVitemSetString) {
            var LVitemSetObject = FFitemSetStringToObject(PVitemSetString);
            Object.keys(GVsymbols).forEach(function (PVsymbol) {
                var LVnextItemSet = FFnextItemSet(LVitemSetObject, PVsymbol);
                var LVnextItemSetStr = FFitemSetObjectToString(LVnextItemSet);
                if (LVnextItemSetStr.length > 0) {
                    if (LVcurrentAndAllPastGen[LVnextItemSetStr] == 1) {
                        ;
                    } else {
                        LVnextGen[LVnextItemSetStr] = 1;
                        GVitemSetGeneration[LVnextItemSetStr] = LVgenNum;
                    }
                }
            });
        });
        if (Object.keys(LVnextGen).length == 0) {
            break;
        }
        //console.log(Object.keys(LVnextGen).length +
        //        " item sets were added in generation " + LVgenNum);
        LVcurrentGen = LVnextGen;
        LVgenNum += 1;
    }

    // add start item set to GVitemSets and GVitemSetIndex
    assert(GVitemSets.length == 0);
    GVitemSetIndex[LVstartItemString] = GVitemSets.length;
    GVitemSets.push(LVstartItemSet);
    GVitemSetStrings.push(LVstartItemString);
    //console.log("adding " + Object.keys(LVcurrentAndAllPastGen).length +
    //        " item sets");

    // add remaining item sets to GVitemSets
    Object.keys(LVcurrentAndAllPastGen).forEach(function (PVitemSetString) {
        if (PVitemSetString != LVstartItemString) {
            var LVitemSetObject = FFitemSetStringToObject(PVitemSetString);
            GVitemSetIndex[PVitemSetString] = GVitemSets.length;
            GVitemSets.push(LVitemSetObject);
            GVitemSetStrings.push(PVitemSetString);
        }
    });

    // build GVitemSetTrans
    Object.keys(GVsymbols).forEach(function (PVsymbol) {
        GVitemSetTrans[PVsymbol] = [];
        var LVi; // current state ID
        for (LVi = 0; LVi < GVitemSets.length; LVi += 1) {
            var LVnextItemSet = FFnextItemSet(GVitemSets[LVi], PVsymbol);
            var LVnextItemSetStr = FFitemSetObjectToString(LVnextItemSet);
            if (LVnextItemSetStr.length > 0) {
                assert(GVitemSetIndex[LVnextItemSetStr] != undefined);
                GVitemSetTrans[PVsymbol].push(GVitemSetIndex[LVnextItemSetStr]);
            } else {
                GVitemSetTrans[PVsymbol].push(-1);
            }
        }
    });

    var LVi;
    for (LVi = 0; LVi < GVitemSets.length; LVi += 1) {
        if (FFitemSetHasAcceptItem(GVitemSets[LVi])) {
            GVisAcceptingState.push(true);
        } else {
            GVisAcceptingState.push(false);
        }
    }

    // add reductions
    for (LVi = 0; LVi < GVitemSets.length; LVi += 1) {
        var LVreductions = {};
        Object.keys(GVacceptIndex).forEach(function (PVacceptItem) {
            if (GVitemSets[LVi][PVacceptItem] == 1) {
                LVreductions[GVacceptIndex[PVacceptItem]] = 1;
            }
        });
        // check for reduce-reduce conflicts
        if (Object.keys(LVreductions).length > 1) {
            console.log("reduce-reduce conflicts found");
            console.log(LVreductions);
            assert(false);
        }
        GVitemSetReduce.push(LVreductions);
    }
};

FFmakeItemSets();


var FFcomputeIndexSpan = function FFcomputeIndexSpan(PVarray) {
    var LVi;
    var LVmin;
    var LVmax;
    for (LVi = 0; LVi < PVarray.length; LVi += 1) {
        if (LVi == 0) {
            LVmin = PVarray[0][0];
            LVmax = PVarray[0][1];
        } else {
            LVmin = Math.min(LVmin, PVarray[LVi][0]);
            LVmax = Math.max(LVmax, PVarray[LVi][1]);
        }
    }
    return [LVmin, LVmax];
};

var DCsymbolError = -10;
var DCinputError = -20;
var DCactionError = -20;

var FFformatInfo;
// PVinput and PVinputData must be of same length
// PVinput is an array of symbols
// PVinputData is an array of tokens
// returns object with result code MMrc
var FFtestParse = function FFtestParse(PVinput, PVinputData) {
    var LVi = 0; // index into PVinput
    var LVstack = [0];
    var LVoutput = [];
    var LVtokenTree = [];
    var LVdata2 = []; // chars
    var LVdata3 = []; // scopes
    var LVdata4 = []; // members
    var LVdata5 = []; // drafts
    var LVtree = []; // reductions
    var LVsymbolStack = [];
    var LVindexTree = [];
    var LVlastToken = null;
    while (true) {
        var LVstackTop = LVstack[LVstack.length - 1] | 0;
        var LVsymbol = "";
        if (LVi < PVinput.length) {
            LVsymbol = PVinput[LVi];
            if (GVitemSetTrans[LVsymbol] == undefined) {
                return {
                    MMrc : DCsymbolError,
                    MMerror : "Unknown symbol: " + LVsymbol
                };
            }
            var LVtrans = GVitemSetTrans[LVsymbol][LVstackTop];
            if (LVtrans != -1) {
                LVstack.push(LVtrans);
                var LVtoken = PVinputData[LVi];
                LVlastToken = LVtoken;
                if (LVsymbol != "NAME" && LVsymbol != "NUMBER" && LVsymbol != "STRING") {
                    LVtree.push(LVsymbol);
                    // handle scope
                    if (LVsymbol == '{' || LVsymbol == '}') {
                        LVdata3.push(LVtoken);
                    } else {
                        LVdata3.push(LVsymbol);
                    }
                    if (LVsymbol == ".") {
                        LVdata4.push(".[" + LVtoken.MMoffset + "]");
                    } else {
                        LVdata4.push(LVsymbol);
                    }
                } else {
                    LVtree.push(LVtoken.MMchars);
                    LVdata3.push(LVtoken);
                    LVdata4.push(LVtoken.MMchars + '[' + LVtoken.MMoffset + ':' + LVtoken.MMlength + ']');
                }
                LVtokenTree.push(LVtoken);
                LVdata2.push(LVtoken.MMchars);
                LVdata5.push(LVtoken);
                LVsymbolStack.push(LVsymbol);
                LVindexTree.push([LVi,LVi]);
                LVi += 1;
                continue;
            }
        }
        var LVreduce = GVitemSetReduce[LVstackTop];
        if (Object.keys(LVreduce).length > 0) {
            var LVruleNum;
            Object.keys(LVreduce).forEach(function (PVruleNum) {
                LVruleNum = PVruleNum | 0;
            });
            var LVreduceSymbol = GVrules[LVruleNum][0];
            // reduce
            var LVruleBodyLength = GVrules[LVruleNum][2].length;
            var LVj;
            var LVtreeItems = [];
            var LVdataItems = [];
            var LVdata2Items = [];
            var LVdata3Items = [];
            var LVdata4Items = [];
            var LVdata5Items = [];
            var LVindexItems = [];
            for (LVj = 0; LVj < LVruleBodyLength; LVj += 1) {
                LVtreeItems.push(LVtree.pop());
                LVdata3Items.push(LVdata3.pop());
                LVdata4Items.push(LVdata4.pop());
                LVdata5Items.push(LVdata5.pop());
                LVdataItems.push(LVtokenTree.pop());
                LVdata2Items.push(LVdata2.pop());
                LVsymbolStack.pop();
                LVstack.pop();
                LVindexItems.push(LVindexTree.pop());
            }
            // LVtree
            LVtreeItems.reverse();
            var LVreduceResult = GVreducers[LVruleNum].apply(null, LVtreeItems);
            LVtree.push(LVreduceResult);
            // LVdata3
            LVdata3Items.reverse();
            var LVdata3ScopeResult = GVscopes[LVruleNum].apply(null, LVdata3Items);
            LVdata3.push(LVdata3ScopeResult);
            // LVdata4
            LVdata4Items.reverse();
            var LVdata4MemberResult = GVmembers[LVruleNum].apply(null, LVdata4Items);
            LVdata4.push(LVdata4MemberResult);
            // LVdata5
            LVdata5Items.reverse();
            var LVdata5DraftResult = GVdrafts[LVruleNum].apply(null, LVdata5Items);
            LVdata5.push(LVdata5DraftResult);
            // LVtokenTree
            LVdataItems.push("Rule" + LVruleNum);
            LVdataItems.reverse();
            LVtokenTree.push(LVdataItems);
            // LVdata2
            LVdata2Items.push("Rule" + LVruleNum);
            LVdata2Items.reverse();
            LVdata2.push(LVdata2Items);
            // update symbol stack
            LVsymbolStack.push(LVreduceSymbol);
            // LVindex
            var LVindexSpan = FFcomputeIndexSpan(LVindexItems);
            LVindexTree.push(LVindexSpan);
            var LVreduceStackTop = LVstack[LVstack.length - 1];
            var LVgoto = GVitemSetTrans[LVreduceSymbol][LVreduceStackTop];
            if (LVgoto == -1) {
                assert(GVisAcceptingState[LVstackTop]);
                if (LVi != PVinput.length) {
                    return {
                        MMrc : DCinputError,
                        MMerror : "extra input at end of program"
                    };
                }
                return {
                    MMrc : 0,
                    MMtree : LVtree,
                    MMtokenTree : LVtokenTree,
                    MMdata2 : LVdata2,
                    MMdata3 : LVdata3,
                    MMdata4 : LVdata4,
                    MMdata5 : LVdata5
                };
            } else {
                LVstack.push(LVgoto);
                continue;
            }
        }
        return {
            MMrc : DCactionError,
            MMerror : ("Unknown action on line " +
                    (LVlastToken.MMlineno + 1) + ", col " +
                    (LVlastToken.MMcolno + 1)),
            MMinfo : FFformatInfo(util.format(LVtree))
        };
    }
};

// format an information string
FFformatInfo = function FFformatInfo(PVstr) {
    var LVlines = PVstr.split('\n');
    if (LVlines.length > 10) {
        return (Array.prototype.concat(LVlines.slice(0,10),['...'])).join('\n');
    } else {
        return PVstr;
    }
};

var FFtestParse2 = function FFtestParse2(PVinput, PVinputData) {
    var LVi = 0; // index into PVinput
    var LVstack = [0];
    var LVoutput = [];
    var LVtokenTree = [];
    var LVtree = []; // reductions
    var LVdata6 = []; // html
    var LVsymbolStack = [];
    var LVlastToken = null;
    while (true) {
        var LVstackTop = LVstack[LVstack.length - 1] | 0;
        var LVsymbol = "";
        if (LVi < PVinput.length) {
            LVsymbol = PVinput[LVi];
            if (GVitemSetTrans[LVsymbol] == undefined) {
                assert(false);
            }
            var LVtrans = GVitemSetTrans[LVsymbol][LVstackTop];
            if (LVtrans != -1) {
                LVstack.push(LVtrans);
                var LVtoken = PVinputData[LVi];
                LVlastToken = LVtoken;
                if (LVsymbol != "NAME" && LVsymbol != "NUMBER" && LVsymbol != "STRING") {
                    LVtree.push(LVsymbol);
                } else {
                    LVtree.push(LVtoken.MMchars);
                }
                LVdata6.push(LVtoken);
                LVtokenTree.push(LVtoken);
                LVsymbolStack.push(LVsymbol);
                LVi += 1;
                continue;
            }
        }
        var LVreduce = GVitemSetReduce[LVstackTop];
        if (Object.keys(LVreduce).length > 0) {
            var LVruleNum;
            Object.keys(LVreduce).forEach(function (PVruleNum) {
                LVruleNum = PVruleNum | 0;
            });
            var LVreduceSymbol = GVrules[LVruleNum][0];
            // reduce
            var LVruleBodyLength = GVrules[LVruleNum][2].length;
            var LVj;
            var LVtreeItems = [];
            var LVdataItems = [];
            var LVdata6Items = [];
            for (LVj = 0; LVj < LVruleBodyLength; LVj += 1) {
                LVtreeItems.push(LVtree.pop());
                LVdataItems.push(LVtokenTree.pop());
                LVsymbolStack.pop();
                LVstack.pop();
                LVdata6Items.push(LVdata6.pop());
            }
            // LVtree
            LVtreeItems.reverse();
            var LVreduceResult = GVreducers[LVruleNum].apply(null, LVtreeItems);
            LVtree.push(LVreduceResult);
            // LVdata6
            LVdata6Items.reverse();
            var LVdata6HTMLResult = GVhtml[LVruleNum].apply(null, LVdata6Items);
            LVdata6.push(LVdata6HTMLResult);
            // LVtokenTree
            LVdataItems.push("Rule" + LVruleNum);
            LVdataItems.reverse();
            LVtokenTree.push(LVdataItems);
            // update symbol stack
            LVsymbolStack.push(LVreduceSymbol);
            var LVreduceStackTop = LVstack[LVstack.length - 1];
            var LVgoto = GVitemSetTrans[LVreduceSymbol][LVreduceStackTop];
            if (LVgoto == -1) {
                assert(GVisAcceptingState[LVstackTop]);
                assert(LVi == PVinput.length);
                return {
                    MMrc : 0,
                    MMtree : LVtree,
                    MMtokenTree : LVtokenTree,
                    MMdata6 : LVdata6
                };
            } else {
                LVstack.push(LVgoto);
                continue;
            }
        }
        assert(false);
    }
};

module.exports = {
    MMrules : GVrules,
    MMreducers : GVreducers,
    MMprintRules : FFprintRules,
    MMitems : GVitems,
    MMacceptItem : GVacceptItem,
    MMitemSymbols : GVitemSymbols,
    MMitemSets : GVitemSets,
    MMitemStrings : GVitemStrings,
    MMacceptIndex : GVacceptIndex,
    MMitemSetStrings : GVitemSetStrings,
    MMitemSetIndex : GVitemSetIndex,
    MMitemSetTrans : GVitemSetTrans,
    MMisAcceptingState : GVisAcceptingState,
    MMitemSetReduce : GVitemSetReduce,
    MMprintItems : FFprintItems,
    MMtestNextItemSet : FFtestNextItemSet,
    MMmakeItemSets : FFmakeItemSets,
    MMformatTokenRef : FFformatTokenRef,
    MMtestParse : FFtestParse,
    MMtestParse2 : FFtestParse2,
};