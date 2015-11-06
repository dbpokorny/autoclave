var GVpassthroughStrings = ['argv','concat','forEach','hasOwnProperty','indexOf',
    'join', 'log','length', 'main', 'push', 'readFile', 'reduce','reduceRight',
    'reverse', 'slice', 'splice','toString',
];
var GVpassthrough = {};
GVpassthroughStrings.forEach(function (PVk) { GVpassthrough['#' + PVk] = 1; });

var GETITEM = function GETITEM (PVx, PVy) {
    if (GVpassthrough.hasOwnProperty('#' + PVy) || typeof PVy == 'number') {
        var LVx = PVx[PVy];
        if (typeof LVx == 'function') {
            if (PVy == "hasOwnProperty") {
                return HASITEM_CURRY(PVx);
            } else {
                return LVx.bind(PVx);
            }
        } else {
            return LVx;
        }
    } else {
        var LVx = PVx[PVy + '$'];
        if (LVx == undefined) {
            console.log("check property: " + PVy);
        }
        return LVx;
    }
};

var SETITEM = function SETITEM (PVx, PVy, PVz) {
    if (typeof PVy == 'number') {
        PVx[PVy] = PVz;
    } else {
        PVx[PVy + '$'] = PVz;
    }
};

var HASITEM = function HASITEM (PVx, PVy) {
    if (GVpassthrough.hasOwnProperty('#' + PVy) || typeof PVy == 'number') {
        return PVx.hasOwnProperty(PVy);
    } else {
        return PVx.hasOwnProperty(PVy + '$');
    }
};

var HASITEM_CURRY = function HASITEM_CURRY (PVx) {
    var LVf = function f (PVy) { return HASITEM(PVx,PVy); };
    return LVf;
};

module.exports = {
    GETITEM : GETITEM,
    SETITEM : SETITEM,
    HASITEM : HASITEM
};
