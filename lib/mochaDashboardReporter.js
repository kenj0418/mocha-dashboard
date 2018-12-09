const mocha = require('mocha');
const out = require("./reporterOutput")

function MochaDashboardReporter(runner) {
  mocha.reporters.Base.call(this, runner);

  runner.on("start", (suite) => {
    out.clearScreen()
  })

  runner.on("suite", (suite) => {
  })

  runner.on("suite end", (suite) => {
  })

  runner.on("test", (suite) => {
  })

  runner.on("test end", (suite) => {
  })

  runner.on('pass', function(test) {
    // passes++;
    const isModeratelySlow = false
    const isRatherSlow = true
    const timeMs = 90210
    if (isRatherSlow) {
      out.print(out.yellow, `${test.fullTitle()} : ${timeMs}ms`, true)
    } else if (isModeratelySlow) {
      out.print(out.yellow, `${test.fullTitle()} : ${timeMs}ms`)
    } else {
      // do nothing on fast pass
    }
  });

  runner.on('pending', function(test) {
    // pending++
    out.print(out.cyan, test.fullTitle(), true)
  })

  runner.on('fail', function(test, err) {
    // failures++;
    out.print(out.red, `${test.fullTitle()} : ${err.message}`, true)
  });

  // var pending = 0;
  // var passes = 0;
  // var failures = 0;

  // runner.on('end', function() {
  //   console.error('end: %d/%d', passes, passes + failures);
  //   if (pending) {
  //     console.error("pending: %d", pending)
  //   }
  // });
}

module.exports = MochaDashboardReporter;
