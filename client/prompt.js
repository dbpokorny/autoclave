// CL - class name
// AT - attribute name
// ID - DOM id name

var GVkeymap = {};

var GVmark = 0;
var GVmarkLine = 0;
var GVmarkCol = 0;

var GVinitBuffer = "FooBar";

var assert = function assert(PVx) {
    console.assert(PVx);
};

var FFrange = function FFrange(PVa,PVb) {
    var LVresult = [];
    var LVi;
    for (LVi = PVa; LVi < PVb; LVi += 1) {
        LVresult.push(LVi);
    }
    return LVresult;
};

var GVkeymapBuild = [
    [FFrange(65,91).map(function (PVx) { return "S-key" + PVx; }),
        "ABCDEFGHIJKLMNOPQRSTUVWXYZ"],
    [FFrange(65,91).map(function (PVx) { return "key" + PVx; }),
        "abcdefghijklmnopqrstuvwxyz"],
    [FFrange(48,58).map(function (PVx) { return "key" + PVx; }),
        "0123456789"]
];

GVkeymapBuild.forEach(function (PVr) {
    assert(PVr[0].length == PVr[1].length);
    var LVi;
    for (LVi = 0; LVi < PVr[0].length; LVi += 1) {
        GVkeymap[PVr[0][LVi]] = PVr[1][LVi];
    }
});

var FFhandleBackspace = function FFhandleBackspace(PVevent) {
    var LVmatrix = $('#IDmatrix')[0];
    var LVrows = LVmatrix.children;
    if (LVrows.length == 0) {
        return;
    }
    var LVlastRow = LVrows[LVrows.length - 1];
    assert(LVlastRow instanceof Element);
    if (LVlastRow.nElts == 0) {
        LVmatrix.removeChild(LVmatrix.children[LVmatrix.children.length - 1]);
        return;
    };
    LVlastRow.removeChild(LVlastRow.children[LVlastRow.children.length - 1]);
    LVlastRow.nElts -= 1;
};

// add a row to the matrix
var FFaddRow = function FFaddRow() {
    var LVe = document.createElement("div");
    LVe.className = "CLrow";
    LVe.nElts = 0;
    $("#IDmatrix")[0].appendChild(LVe);
};

// Modifier keys
GVkeymap["C-key17"] = function () {;};
GVkeymap["S-key16"] = function () {;};
GVkeymap["A-key18"] = function () {;};
GVkeymap["M-key91"] = function () {;};

GVkeymap["key8"] = FFhandleBackspace;
GVkeymap["key13"] = FFaddRow;
GVkeymap["key32"] = "&nbsp;";
GVkeymap["key192"] = "`";
GVkeymap["S-key192"] = "~";
GVkeymap["key189"] = "-";
GVkeymap["key187"] = "=";
GVkeymap["S-key189"] = "_";
GVkeymap["S-key187"] = "+";
GVkeymap["key219"] = "[";
GVkeymap["key221"] = "]";
GVkeymap["key220"] = "\\";
GVkeymap["S-key219"] = "{";
GVkeymap["S-key221"] = "}";
GVkeymap["S-key220"] = "|";

GVkeymap["key186"] = ";";
GVkeymap["key222"] = "'";
GVkeymap["S-key186"] = ":";
GVkeymap["S-key222"] = "\"";

GVkeymap["key188"] = ",";
GVkeymap["key190"] = ".";
GVkeymap["key191"] = "/";
GVkeymap["S-key188"] = "&lt;";
GVkeymap["S-key190"] = "&gt;";
GVkeymap["S-key191"] = "?";

GVkeymap["S-key48"] = ")";
GVkeymap["S-key49"] = "!";
GVkeymap["S-key50"] = "@";
GVkeymap["S-key51"] = "#";
GVkeymap["S-key52"] = "$";
GVkeymap["S-key53"] = "%";
GVkeymap["S-key54"] = "^";
GVkeymap["S-key55"] = "&amp;";
GVkeymap["S-key56"] = "*";
GVkeymap["S-key57"] = "(";

var FFaddElt = function FFaddElt(PVe) {
    var LVrows = $('#IDmatrix')[0].children;
    assert(LVrows.length > 0);
    var LVlastRow = LVrows[LVrows.length - 1];
    assert(LVlastRow instanceof Element);
    LVlastRow.appendChild(PVe);
    LVlastRow.nElts += 1;
};

var GVcidNum = 0;

var FFcreateBufferElt = function FFcreateBufferElt(PVc, PVctrl, PVshift) {
    var LVe = document.createElement("span");
    LVe.style.color = "#f0f";
    LVe.style.fontSize = "200%";
    LVe.setAttribute("ATcid","id" + GVcidNum);
    LVe.setAttribute("ATclickCount","0");
    GVcidNum += 1;
    LVe.innerHTML = PVc;
    $(LVe).click(function (PVe) {
        console.log("clicked: ");
        console.log(this);
        console.log("event: " + PVe);
        console.log("clientX: " + PVe.clientX);
        console.log("clientY: " + PVe.clientY);
        console.log("this.offsetLeft: " + this.offsetLeft);
        console.log("this.offsetTop: " + this.offsetTop);
        console.log("left,top = " + (PVe.clientX - this.offsetLeft) + "," +
            (PVe.clientY - this.offsetTop));
        console.log("this.offsetHeight: " + this.offsetHeight);
        console.log("this.offsetWidth: " + this.offsetWidth);
        console.log("this.ATcid: " + this.getAttribute("ATcid"));
        this.setAttribute("ATclickCount", "" + (1 + (0 |
                    this.getAttribute("ATclickCount"))));
        if (0 | this.getAttribute("ATclickCount") % 2 == 1) {
            this.style.backgroundColor = "#0ff";
        } else {
            this.style.backgroundColor = "";
        }
        PVe.stopPropagation();
    });
    return LVe;
};

// dict of key commands that should not prevent default
var GVdefaultKeys = {};

GVdefaultKeys['M-key82'] = 1; // M-r Reload
GVdefaultKeys['A-M-key73'] = 1; // A-M-i Dev tools
GVdefaultKeys['A-M-key74'] = 1; // A-M-j JS Console

var FFhandleKeydown = function handleKeydown (PVevent) {
    var LVn = PVevent.keyCode;
    var LVctrl = PVevent.ctrlKey ? "C-" : "";
    var LValt = PVevent.altKey ? "A-" : "";
    var LVshift = PVevent.shiftKey ? "S-" : "";
    var LVmeta = PVevent.metaKey ? "M-" : "";
    var LVk = LVctrl + LValt + LVmeta + LVshift + "key" + LVn;
    if (GVdefaultKeys.hasOwnProperty(LVk)) {
        return;
    }
    PVevent.preventDefault();
    if (GVkeymap.hasOwnProperty(LVk)) {
        var LVkeyAction = GVkeymap[LVk];
        if (typeof LVkeyAction == "string") {
            var LVe = FFcreateBufferElt(LVkeyAction, !! LVctrl, !! LVshift);
            return FFaddElt(LVe);
        } else {
            return LVkeyAction(PVevent);
        }
    } else if (LVn == 13) {
        FFaddRow();
        return;
    }
    console.log(LVk);
};

// Capture keyboard events
$(document).unbind('keydown').bind('keydown', FFhandleKeydown);

var FFdocReady = function FFdocReady (PVk) {
    $("body").click(function (PVe) {
        console.log(PVe);
    });
    FFaddRow();
};
