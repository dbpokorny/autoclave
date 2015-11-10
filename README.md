# autoclave.js

Today, if you want to distribute a node.js package that depends on another
package, you indicate this with metadata in "package.json" and require the user to
use "npm install" to sort out the dependencies between packages.

Autoclave complements this network by giving your code a new way to execute
semi-trusted JavaScript that resides on *any* GitHub repository by passing a URL
to `require`:

    var file = require("git@github.com:ghuser/ghrepo/path/to/file.js");

Code loaded this way, which must be written in a sub-language of JavaScript, is
first subject to sanitization and a static code transformation that prevents it
from interfering with your code and third-party code.

## Implementation

Autoclave is supported by by static code transformations and a runtime library.
JavaScript code must refrain from using object-oriented functions, exception
handling, and other non-essential extensions. Programs must

- avoid using invalid identifiers listed in token.js
- define all global variables
- require modules by url (for example 'git@github.com:autoclave/fs.js')

Code is transformed so that any attempt to access a user-defined property causes
the code to refer instead to the property name enclosed in backticks. Using a
property `x` of any object will be translated to use of property \``x`\`.
Exceptions are listed in `runtime.js`.

