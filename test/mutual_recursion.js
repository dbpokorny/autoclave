var g;
var f = function f ( x ) {
    if ( x == 0 ) {
        return 0;
    } else {
        return 1 + g ( x - 1);
    }
};

g = function g ( x ) {
    if ( x == 0 ) {
        return 0;
    } else {
        return 1 + f ( x - 1);
    }
};

module.exports = { f : f , g : g } ;
