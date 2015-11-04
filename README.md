# autoclave.js (fictional / speculative)

Autoclave is an alternative way to execute a sublanguage of JavaScript. It is
directed at the following problem: give a bot the tools it needs to download code
either directly from a web visitor or from a github repository and run it on the
server or serve it to web visitors. In this way, web visitors can add services to
a websise.

**Table of Contents**

- [autoclave.js (fictional / speculative)](#autoclavejs-fictional--speculative)
- [trusted and semi-trusted code](#trusted-and-semi-trusted-code)
    - [Example](#example)
  - [arrays](#arrays)
  - [built-in properties](#built-in-properties)
  - [instrumenting library functions](#instrumenting-library-functions)
  - [adding the URL to member names](#adding-the-url-to-member-names)
  - [library reference](#library-reference)
      - [`ACexportProperty(obj, foreignURL, property)`](#acexportpropertyobj-foreignurl-property)
      - [`ACcanExportProperty(obj, foreignURL, property)`](#accanexportpropertyobj-foreignurl-property)
      - [`ACimportProperty(obj, foreignURL, property)`](#acimportpropertyobj-foreignurl-property)
      - [`ACkeys(object)`](#ackeysobject)


The proposed technology is orthogonal to and compatible with the iframe sandbox
that manages the interaction of code from different domains in HTML5. On the
server, autoclave isolates the activity of programs from multiple semi-trusted
sources.

Autoclave consists of a scanner, a parser, some static analysis, and some static
transformations.

# trusted and semi-trusted code

There are two classes of code: trusted and semi-trusted. Trusted code is "normal"
and executes in the usual manner in the underlying implementation. Semi-trusted
code is transformed before it is executed:
 - it executes as the agent of a git *repository*, the *origin*, identified by git
   URL
 - its origin URL is "baked in" and available as a string literal to library
   functions
 - the properties of an object which semi-trusted code may access is limited to
   those with a "$-URL" suffix: a name ending with "$" followed by the origin URL

This creates a private namespace of fields per *URL* (unlike cookies which work
per *domain*). From the point of view of code, member access operations are
rewritten by a code transformation to satisfy this constraint.

### Example

Code from "ssh://git@github.com/ghuser/ghrepo" that wishes to access the member
"scopeTree" of object "x" is compiled to
`x["scopeTree$ssh://git@github.com/ghuser/ghrepo"]`.

## arrays

There is an exception for numbers: code like `x[(...) | 0]` is allowed in spite of
the rule above because the compiler knows `(...) | 0` is always an int and not
subject to the URL transformation described below.

## built-in properties

Exceptions are not made for built-in functions such as `forEach`, `push`, and
`length`. Rather, utility functions `ACforEach`, `ACpush`, and `AClength` provide
replacement services.

The function `Object.keys()` is not available. In its place `ACkeys()` returns an
array of only those key names matching the host URL (with the $-URL suffix
removed).

## instrumenting library functions

Library functions are aware of the host URL because the compiler recognizes them
and inserts an extra argument before the listed arguments during translation. This
extra argument is a string constant equal to the URL of the code's origin. For
example, a call to `ACkeys(x)` is translated to `ACkeys(originURL,x)` and
implemented as

    var ACkeys = function ACkeys(PVurl,PVobj) {
        var LVresult = [];
        Object.keys(PVobj).forEach(function (PVk) {
            var LVi = PVk.lastIndexOf('$');
            if (LVi > 0 && PVk.slice(LVi + 1) == PVurl) {
                LVresult.push(PVk.slice(0,LVi));
            }
        });
        return LVresult;
    }

## adding the URL to member names

<table>
    <tr>
        <th>Original Syntax</th><th>Transformed Syntax</th>
    </tr>
    <tr>
        <td><code>a.b</code></td><td><code>a['b'+'$'+originURL]</code></td>
    </tr>
    <tr>
        <td><code>x[y]</code></td><td><code>x[y+'$'+originURL]</code></td>
    </tr>
</table>

From the point of view of the user code, the transformation that adds the URL is
transparent.

## library reference

#### `ACexportProperty(obj, foreignURL, property)`

These library functions take an arbitrary argument for `obj`, a string such as
"$ssh://git@github.com/ghuser/ghrepo" (that is to say: a dollar sign followed by a
git URL) for `foreignURL`, and a property name for `property`. It first checks
that the caller has write access to the property named for the foreign URL
specified. This write access is granted if and only if the following condition is
met: the value of the property is a two-element array `["#import", "$..."]` where
`"$..."` is the string naming the origin URL or the string "*". This "import
token" grants the right to receive a value via `ACexport`.

`ACexport` then copies the value of the property from the host URL to the foreign
URL so code that executes in the foreign URL can access that property. For example
if `obj` is `x`, `property` is `"foo"` and `foreignURL` is
"$ssh://git@github.com/nietzsche/superbot", then the following are executed:

    var hostURL = "ssh://git@github.com/ghuser/ghrepo";
    var foreignURL = "ssh://git@github.com/nietzsche/superbot";
    assert(x["foo$" + foreignURL][0] == "#import");
    assert(x["foo$" + foreignURL][1] == host || x["foo$" + foreignURL][1] == "*");
    x["foo$" + foreign] = x["foo$" + host];

code that executes with origin equal to the superbot can now "see" the property
"foo" on the object x, and the superbot can access this value with the expression
"x.foo" or "x['foo']".

#### `ACcanExportProperty(obj, foreignURL, property)`

In order to see whether or not a given property can be exported to, these library
functions (which, being system functions, execute "without origin" and therefore
without the constraint that it only read from and write to properties with a
$-URL extension) return true or false depending on whether or not the
obj[property] can be exported to the supplied URL. It is implemented as

    var ACcanExport = function ACcanExport(hostURL, obj, foreignURL, property) {
        var token = obj[property + foreignURL];
        return (token instanceof Array && token.length == 2 &&
            token[0] == "#import" && (token[1] == hostURL || token[1] == "*"));
    };

The caller only passes the last three of the four parameters. The remaining
parameter, `hostURL`, gains its value through a static code transformation that
inserts a string representing the origin URL of the host.

#### `ACimportProperty(obj, foreignURL, property)`

These library functions operate in the inverse manner by reading the value of a
property for an object that has been made available. The function requires read
access for the named property. This read access is granted when the value is
wrapped in an "export token" such as the three-element array `["#export",
"$url", y]`. This grants read access for the value y to code executing from the
url named. It is possible to give general read access with `["#export", "*",
y]` which allows code anywhere to run `ACimport` in order to get at it (of course
the code must first gain access to a reference to the parent object in order to
pass it to `ACimport` the first place).

For example if `ACimport` is called from code that executes from origin
"github.com/ghuser/ghrepo" where `obj` is `x`, `property` is `"foo"`
and `foreignURL` is "$git@github.com/plato/lib", then `ACimportProperty` will
perform the check for read access and copy:

    var hostURL = "ssh://git@github.com/ghuser/ghrepo";
    var foreignURL = "ssh://git@github.com/plato/lib";
    assert(x["foo$" + foreignURL][0] == "#export");
    assert(x["foo$" + foreignURL][1] == hostURL || x["foo$ + foreignURL" == "*");
    x["foo$" + hostURL] = x["foo$" + foreignURL][2];

#### `ACkeys(object)`
The function `Object.keys()` is replaced with `ACkeys()` which returns only
those keys of an object corresponding to the host URL of the caller, with the
$-URL suffix removed.
