// Generate a report on a file for display on the web
//
// First of all, "git URL" is a bit misleading. Since gift doesn't take a protocol
// prefix these are not, strictly speaking, URLs.
//
// Encode the file URL and put it in the URL argument 'js'. The http endpoint
//
//     /report?js=git%40github.com%3Auser%2Frepo%2Fpath%2Fto%2Ffile.js
//
// should answer the following questions:
//
// - Title of page in <h2>: the file URL
//   - title links to local cache if it exists
// - is there a local cache of the file?
//   - if the local cache exists in ghcache/ then use it
//   - if the local cache exists in filecache/ then use it
//   - otherwise, request() the file and cache it in filecache/
// - what is the path to the local cache of the file?
//
// - does it sanitize and transform error-free?
// - does it generate a HTML rendering?
//   - provide a link to the HTML rendering if it exists
// - does a transformed version exists?
//   - what is the path to the sanitized version of the file?
//
// - what globals does it use? can they all be accounted for?
// - what members did it use? can they all be accounted for?
// - what URLs does it require?
// - what node modules does it require?
//   - for each node module required, is there an entry in package.json?
// - what local ('./path/to/file.js') files does it require?
//
// # User interaction
//
// The button "cache file" clones the git repository the file resides in and
// performs tree.batch.
//
// The button "test file"
// request()s the file (resolving
// git@gitlab.com:autoclave/autoclave/foo.js to
// https://gitlab.com/autoclave/stub/raw/a3d.../foo/bar.js
// where a3d... = a3d19f82375c6be0fc6724a1f28c89c763c885d7 is the commit hash of
// master HEAD.
