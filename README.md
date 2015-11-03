# autoclave.js

There is one big idea in autoclave: source code is considered to be a sublanguage
of JavaScript / ECMAScript and executes as it normally would, in either a browser
client or node server process, with one exception: all code (outside system
library functions described below) executes as the agent of a *repository*, the
*origin* of the executing code (identified by URL).

This code only has access to properties P of *any* object X such that P ends with
"$" followed by origin's URL, for example "$ssh://git@github.com/ghuser/ghrepo"
for a particular user "ghuser" who has a repository named "ghrepo". There are
exceptions for numbers and for dealing with ordinary objects like arrays such as
`forEach`, `length`, `keys`, ...

When the supervising program receives source code from a given URL, it applies a
static code transformation that, among other things, applies the following
transformation:

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

From the point of view of the code that executes within this "jail", nothing has
changed, aside from being restricted to a subset of JavaScript / ECMAScript.

#### `ACexportProperty(subject, foreignURL, property)`

#### `ACexportProperties(subject, foreignURL, propertyList)`

These library functions take an arbitrary argument for `subject`, a string such as
"$ssh://git@github.com/ghuser/ghrepo" (that is to say: a dollar sign followed by a
git URL) for `foreignURL`, and either a single property name for `property` or an
array of property names for `properties`. It first checks that the caller has
write access to the property or properties named for the foreign URL specified.
This write access is granted if and only if the following condition is met: the
value of the property is a two-element array `["#import", "$..."]` where `"$..."`
is the string naming the URL the object expects to get a value from or the string
"*". This "import token" grants the right to receive a value via `ACexport`.

`ACexport` then copies the value/values of the corresponding property/properties
from one URL to another so code that executes from the other URL can access those
properties. For example if `subject` is `x`, `property` is `"foo"` and
`foreignURL` is "$ssh://git@github.com/nietzsche/superbot", then the following are
executed in the enclosing interpreter:

    var hostURL = "ssh://git@github.com/ghuser/ghrepo";
    var foreignURL = "ssh://git@github.com/nietzsche/superbot";
    assert(x["foo$" + foreignURL][0] == "#import");
    assert(x["foo$" + foreignURL][1] == host || x["foo$" + foreignURL][1] == "*");
    x["foo$" + foreign] = x["foo$" + host];

code that executes with origin equal to the superbot can now "see" the properties
"foo" and "bar" on the object x, and the superbot can access this value with the
expression "x.foo" or "x['foo']". This is made possible by rewriting the syntax
tree for expressions matching the patterns "a.b" and "a[b]" described above.

In order to see whether or not a given property can be exported to, a library
function (which, being a system function, executes "without origin" and therefore
without the constraint that it only read from and write to properties with an
$-URL extension) `ACcanExport(subject, foreignURL, property)` returns true or false
depending on whether or not the subject[property] can be exported to the supplied
URL. It is implemented as

    var ACcanExport = function ACcanExport(hostURL, subject, foreignURL, property) {
        var token = subject[property + foreignURL];
        return (token instanceof Array && token.length == 2 &&
            token[0] == "#import" && (token[1] == hostURL || token[1] == "*"));
    };

The caller only passes the last three of the four parameters. The remaining
parameter, `hostURL`, gains its value through a static code transformation that
inserts a string representing the git URL of the host.

#### `ACimportProperty(subject, foreignURL, property)`

#### `ACimportProperties(subject, foreignURL, properties)`

The library functions  and operates in the inverse manner by reading the value of
a property for an object that has been made available. The function requires read
access for the named properties. This read access is granted when the value is
wrapped in an "export token" such as the three-element array `["#export",
"$ORIGIN", y]`. This grants read access for the value y to code executing from the
origin named. It is possible to give general read access with `["#export", "*",
y]` which allows code anywhere to run `ACimport` in order to get at it (of course
the code must first gain access to a reference to the parent object in order to
pass it to `ACimport` the first place).

For example if `ACimport` is called from code that executes from origin
"github.com/ghuser/ghrepo" where `subject` is `x`, `property` is `"foo"`
and `foreignURL` is "$git@github.com/plato/lib", then `ACimportProperty` will
perform the check for read access and copy:

    var hostURL = "ssh://git@github.com/ghuser/ghrepo";
    var foreignURL = "ssh://git@github.com/plato/lib";
    assert(x["foo$" + foreignURL][0] == "#export");
    assert(x["foo$" + foreignURL][1] == hostURL || x["foo$ + foreignURL" == "*");
    x["foo$" + hostURL] = x["foo$" + foreignURL][2];

The function `Object.keys()` is replaced with `hostKeys()` which returns only
those keys of an object corresponding to the host URL of the caller, with the
$-URL suffix removed.
