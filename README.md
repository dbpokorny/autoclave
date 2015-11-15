# <img src="https://raw.githubusercontent.com/dbpokorny/autoclave/master/docs/small_logo.png" /> autoclave.js


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

 - rate-limit access to the network
 - rate-limit disk access and enforce quota
 - validate and map file paths
 - ...

From the point of view of the executing program, there is no "autoclave API". From
the point of view of the autoclave client, it is possible to get information
about a JavaScript program prior to execution:
 - the modules it requires (when the argument to `require(...)` is a constant)
 - the built-in global variables it uses

During execution, an autoclave client may alter the apparent behavior of emulated
objects in the following ways:
 - intercept attempts to get / set the value of *any* property of *any* object
 - intercept attempts to determine if the object has a given property

## Implementation

Autoclave is supported by static code transformations and a runtime library.
JavaScript code must refrain from using
 - object-oriented features (`new` and `constructor`)
 - exception handling (`throw`, `try`, and `catch`)
 - the slash-delimited regular expression syntax (`/[a-zA-Z0-9_]*/`)
 - invalid identifiers listed in token.js
 - ...

Programs must define all global variables and require modules by one of...
   - identifier: `fs`, `path`, ...
   - "git file url" which joins a git URL for a repository and a pathname relative
     to the repository root: `git@github.com:autoclave/fs.js`
   - current working directory: `./module.js`

Both code transformations and runtime library functions support the following
change in program behavior: with a few exceptions, access to `x[y]` is translated
to `x[\`y\`]`. Without this translation (which is invisible to the programmer) it
would be necessary to maintain a list of prohibited members names for reading and
writing.

<img height="650px" src="https://raw.githubusercontent.com/dbpokorny/autoclave/master/docs/AutoclaveTransformations.png" />

## Filesystem

It is possible for a program to read from and write to the filesystem. This data
is stored in filesys/user/repo, so a path such as "path/to/file" will effectively
read and write filesys/user/repo/path/to/file. All reads and writes in translated
code must use relative pathnames
