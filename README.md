# autoclave.js

[Updated Nov 14, 2015]

Today, if you want to distribute a node.js package that depends on another
package, you indicate this with metadata in "package.json" and require the user to
use "npm install" to sort out the dependencies between packages.

Autoclave complements this network by giving your code a new way to execute
semi-trusted JavaScript that resides on *any* GitHub repository by passing a URL
to `require`:

    var file = require("git@github.com:ghuser/ghrepo/path/to/file.js");

Code loaded this way, which must be written in a sub-language of JavaScript, is
first subject to sanitization and static transformations. The generated files,
which are in one-to-one correspondence with the originals, use surrogate library
functions to implement basic language and system features such as
`Object.keys(...)`, `require(...)`, and `fs`.

Whereas most modern operating systems limit the access rights of executing
programs, autoclave-transformed programs are presented with what appears to be
ordinary system resources. Autoclave may implement these with conditions such as:

 - access to the network may be rate-limited
 - access to the disk may be rate-limited and capped
 - file paths may be checked and mapped
 - ...

From the point of view of the executing program, there is no "autoclave API". From
the point of view of the autoclave client, it is possible to get information
about a given JavaScript program prior to execution:
 - the modules it requires (when the argument to `require(...)` is a constant)
 - the built-in global variables it uses

During execution, an autoclave client may alter the emulated behavior of the
virtual machine in the following ways:
 - intercept attempts to get / set the value of *any* property of *any* object
 - intercept attempts to determine if the object has a given property

## Implementation

Autoclave is supported by by static code transformations and a runtime library.
JavaScript code must refrain from using
 - object-oriented functions
 - exception handling
 - the slash-delimited regular expression syntax
 - invalid identifiers listed in token.js
 - ...

Programs must define all global variables and require modules by one of...
   - identifier: `fs`, `path`, ...
   - "git file url" which joins a git URL for a repository and a pathname relative
     to the repository root: `git@github.com:autoclave/fs.js`
   - current working directory: `./module.js`

Code is transformed so that any attempt to access a user-defined property causes
the code to refer instead to the property name enclosed in backticks. Using a
property `x` of any object will be translated to use of property \``x`\`.
Exceptions are listed in `runtime.js`.

## Filesystem

It is possible for a program to read from and write to the filesystem. This data
is stored in filesys/user/repo, so a path such as "path/to/file" will effectively
read and write filesys/user/repo/path/to/file. All reads and writes must use
relative pathnames
