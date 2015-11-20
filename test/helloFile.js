// To run this file
// 1 Compile with tree.js
//     $ node tree.js test/helloFile.js
// 2 Run compiled file
//     $ node acbuild/js/cache/gh/__local__/__local__/test/helloFile.js
// 3 Observe results
//     $ cat filesys/gh/__local__/__local__/HELLO_WORLD
var fs = require('fs');
fs.writeFile("HELLO_WORLD","hi!\n", function () {;});
