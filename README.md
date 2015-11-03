# autoclave

There is one big idea in autoclave: source code is considered to be a sublanguage
of JavaScript / ECMAScript and executes as it normally would, in either a browser
client or node server process, with one exception: all code (outside system
library functions) executes as the agent of a *repository*, the *origin* of the
executing code, and such code only has access to those properties of an object
with name ending in "@" followed by the name of the origin, for example
"@github.com/ghuser/ghrepo" for a particular user "ghuser" who has a repository
named "ghrepo".

The library function `ACexport(object,agent,properties)` takes an arbitrary
argument for `object`, a string like "@github.com/ghuser/ghrepo" for
`agent`, and an array of property names for `properties`. It first checks
that the caller has write access to the properties named for the agent specified.
It then copies the corresponding properties from one origin to another so that
code that executes from the other origin can access those properties. For example
if `object` is `x`, `properties` is `["foo","bar"]` and `agent` is
"@github.com/nietzsche/superbot", then the following are executed in the enclosing
interpreter:

```
x["foo@github.com/nietzsche/superbot"] = x["foo@github.com/ghuser/ghrepo];
x["bar@github.com/nietzsche/superbot"] = x["bar@github.com/ghuser/ghrepo];
```

code that executes with origin equal to the superbot can now "see" the properties
"foo" and "bar" on the object x, and for such code it is now possible to access
this value with the expression "x.foo" or "x['foo']". This is made possible by
rewriting the syntax tree for expressions matching the patterns "a.b" and "a[b]".
