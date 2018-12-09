var gaze = require('gaze');
var execshell = require('exec-sh'); 

if (process.argv.length < 4) {
  console.error("SYNTAX: node testWatcher \"mocha --someargs\" \"test/**/*\" \"*\" \"someOtherPathToWatch\"")
  return
}

execshell(process.argv[2])

gaze(process.argv.slice(3), function (_err, _watcher) {
  this.on('all', function(_filepath) {
    execshell(process.argv[2])
  });
})
