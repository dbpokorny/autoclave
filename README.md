# <img src="https://raw.githubusercontent.com/dbpokorny/autoclave/master/docs/small_logo.png" /> autoclave.js

> <i>"Note that running untrusted code is a tricky business requiring great care.</i>
> <i>vm.runInContext is quite useful, but safely running untrusted code requires a</i>
> <i>separate process."</i> -- <a href="https://nodejs.org/api/vm.html">Node.js - "vm"</a>

Autoclave.js is a
<a href="https://en.wikipedia.org/wiki/Sandbox_(software_development)">sandbox</a>
based on a
<a href="https://en.wikipedia.org/wiki/Source-to-source_compiler">transpiler</a>
and <a href="https://en.wikipedia.org/wiki/Shim_(computing)">shim</a>
that enforces rules, restrictions, rate-limits, and caps on the behavior of code
of unknown origin so that the host is protected from both intentional and
unintentional malicious / spammy / inappropriate operations [1]. It is intended to
support the creation of a learning tool that, together with a web-based Git
network (GitHub, GitLab, ...) gives visitors a complete
<a href="https://en.wikipedia.org/wiki/Toolchain">toolchain</a> for
building a <a href="https://en.wikipedia.org/wiki/Bot">bot</a> that runs on the
server.

A student may program a bot to...
 - respond to HTTP requests routed to their application's pathname
 - access the file system in response to web visitor or other event
 - fetch, transform, and report on statistics from the web via HTTP
 - depend on other code --- including *peer* code --- with require-by-URL [2]

Since it ordinarily runs on a node.js server, there is no need for the student to
learn HTML, the DOM, CSS, or any other web technology before diving into
JavaScript programming.

## Specification

JavaScript input code must refrain from using
 - object-oriented features (`new` and `constructor`)
 - exception handling (`throw`, `try`, and `catch`)
 - the slash-delimited regular expression literal syntax (`/[a-zA-Z0-9_]*/`)
 - invalid identifiers listed in token.js

Programs must define all global variables and require modules by one of...
   - identifier, such as `fs`, `path`, ...
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

It is possible for a program to read from and write to the filesystem (see
test/helloFile.js). This data is stored in filesys/user/repo, so a path such as
"path/to/file" will effectively read and write filesys/user/repo/path/to/file. All
reads and writes in translated code must use relative pathnames.

[1] The major code transformations are
 - Built-in globals are re-named (table.js)
 - property names are enclosed in backticks (table.js, tmpl/header.js)
 - network and disk access is restricted (tmpl/header.js)
The shim intercepts and routes
 - property to compensate for the added backticks
 - mock versions of built-in modules

[2] With `require("git@github.com:ghuser/ghrepo/path/to/file.js")`. When using
`require` this way, source files are first compiled to the sandbox version before
execution.
