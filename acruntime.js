"use strict";

var GVpassthroughStrings = ['apply', 'argv','concat','filter', 'forEach',
    'hasOwnProperty', 'indexOf', 'join', 'keys', 'log','length', 'main', 'map',
    'max', 'min', 'pop', 'prototype', 'push', 'readFile', 'reduce', 'reduceRight',
    'replace', 'reverse', 'slice', 'sort','splice','split','toString','writeFile'
];
var GVpassthrough = {};
GVpassthroughStrings.forEach(function (PVk) { GVpassthrough['#' + PVk] = 1; });

var FFkeys;

var FFgetItem = function FFgetItem(PVx, PVy) {
    if (GVpassthrough.hasOwnProperty('#' + PVy) || (! isNaN(PVy))) {
        var LVx = PVx[PVy];
        if (typeof LVx == 'function') {
            if (PVy == "hasOwnProperty") {
                return FFhasItemCurry(PVx);
            } else if (PVy == "keys") {
                return FFkeys;
            } else {
                return LVx.bind(PVx);
            }
        } else {
            return LVx;
        }
    } else {
        var LVx = PVx[PVy.toString() + '$'];
        return LVx;
    }
};

var GVsetOK = {'#exports' : 1};

var FFsetItem = function FFsetItem(PVx, PVy, PVz) {
    if (GVsetOK.hasOwnProperty('#' + PVy) || (! isNaN(PVy))) {
        PVx[PVy] = PVz;
    } else {
        PVx[PVy.toString() + '$'] = PVz;
    }
};

var FFhasItem = function FFhasItem(PVx, PVy) {
    if (GVpassthrough.hasOwnProperty('#' + PVy) || (! isNaN(PVy))) {
        return PVx.hasOwnProperty(PVy);
    } else {
        return PVx.hasOwnProperty(PVy.toString() + '$');
    }
};

var FFhasItemCurry = function FFhasItemCurry(PVx) {
    var LVf = function f (PVy) { return FFhasItem(PVx,PVy); };
    return LVf;
};

// keys == Object.keys
var FFkeys = function FFkeys (PVobj) {
    return Object.keys(PVobj).filter(
        function (PVx) { return (! isNaN(PVx)) || PVx[PVx.length - 1] == '$'; }).map(
        function (PVx) { return isNaN(PVx) ? PVx.slice(0,PVx.length - 1) : PVx; });
};

var FFwrapRequire = function FFwrapRequire(PVreq) {
    var LVnewReq = function (PVx) {
        if (PVx.slice(0,2) == "./") {
            return PVreq("./XX" + PVx.slice(2));
        } else {
            return PVreq(PVx);
        }
    };
    LVnewReq.main = PVreq.main;
    return LVnewReq;
};

module.exports = {
    MMgetItem : FFgetItem,
    MMsetItem : FFsetItem,
    MMkeys : FFkeys,
    MMwrapRequire : FFwrapRequire
};
