// Keep track of rate limits
//
// EE - event type name
//
// defaults rate limit caps
// - EEcloneRepo clone no more than 12 repositories per minute
// - EEbatchFile batch process no more than file 600 files per minute (tree.batch)
//
// Rate limits work as follows: when an application module is about to perform a
// rate-limited task, it calls a function RRrate.MMpunchCard(event) which attempts
// to "punch the currently active card" the bot has for the time period for the
// event type. For example if the event type is 'cloneRepo', then the time period
// is "minute" and the punch card has 12 slots. If there is an unpunched slot on
// the card, then the function returns the 0-based slot punched, and returns a
// result code of 0. If all slots have been punched, then the call fails and it
// returns a result code of DCpunchCardError. In addition, it returns in MMdelay
// the number of milliseconds that must elapse before a subsequent call for the
// same event type can succeed.
//
// The caller must the the appropriate action, which is usually
// - inform the user that a rate limit cap has been reached
// - reschedule with setTimeout(function () { ... }, LVpunchCardresult.MMdelay)
// 


// Rate-limited actions
//
// - reading/writing files
//   it is possible to read/write any URL. This is translated by the runtime to
//   reads and writes against the filesystem in a subdirectory of ghcache (in the
//   git repository itself)
