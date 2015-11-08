var RRfetch = require('./fetch.js');
var RRscope = require('./scope.js');

var GVgitURL = 'git@github.com:benoitvallon/react-native-nw-react-calculator.git';
var GVgitURL = 'git@github.com:botwillacceptanything/botwillacceptanything.git';
RRfetch.MMgitURL(GVgitURL, function (PVe, PVr) {
    if (PVe) {
        console.log(PVe);
    } else {
        console.log(PVr);
        RRfetch.MMwalkTree(RRfetch.MMrepoCache[GVgitURL], function (PVx) {
            console.log('scope-batch ' + PVx);
            if (PVx.slice(PVx.length - 3) == ".js") {
                // console.log('javascript file found, checking...');
                RRscope.MMbatch(PVx, function (PVfiles) {
                    console.log('wrote files: ' + PVfiles);
                });
            }
        });
    }
});
