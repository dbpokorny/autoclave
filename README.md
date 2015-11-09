# autoclave.js

Today, if you want to distribute a node.js package that depends on another
package, you indicate this with metadata in "package.json" and require the user to
use "npm install" to sort out the dependencies between packages.

Autoclave complements this network by giving you a new way to execute semi-trusted
JavaScript that resides on *any* GitHub repository. Simply pass a URL to
`require`:

    var file = require("git@github.com:ghuser/ghrepo/path/to/file.js");

Code loaded this way, which must be written in a simplified sub-language of
JavaScript, is first subject to sanitization and a static code transformation that
prevents it from interfering with your code and third-party code.
