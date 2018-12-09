const mocha = require('mocha');
const out = require("./reporterOutput")

const nowMs = () => {
  return new Date().getTime()
}

function MochaDashboardReporter(runner) {
  let runStartTime
  let startTimes = {}
  let passing = 0
  let pending = 0
  let slowTests = 0
  let failing = 0
  let messages = []

  mocha.reporters.Base.call(this, runner);

  runner.on("start", (run) => {
    runStartTime = nowMs()
    out.clearScreen()
  })

  runner.on("end", (run) => {
    if (failing) {
      // has already been displayed
    } else if (slowTests) {
      out.colorIndicator(out.yellowBackground)
    } else if (passing) {
      out.colorIndicator(out.greenBackground)
    } else {
      out.colorIndicator(out.cyanBackground)
    }

    const totalRunTime = nowMs() - runStartTime
    if (passing) {
      out.print(out.green, `  ${passing} passing (${totalRunTime}ms)`)
    }
    if (slowTests) {
      out.print(out.yellow, `    ${slowTests} slow-running`)
    }
    if (pending) {
      out.print(out.cyan, `  ${pending} pending`)
    }
    if (failing) {
      out.print(out.red, `  ${failing} failing`)
    }
    
    messages.forEach((msg) => {
      out.print(msg.color, msg.text)
    })

    out.resetColor()
  })

  runner.on("suite", (suite) => {
  })

  runner.on("suite end", (suite) => {
  })

  runner.on("test", (test) => {
    startTimes[test.fullTitle()] = nowMs()
  })

  runner.on("test end", (test) => {
  })

  runner.on('pass', function(test) {
    passing++;
    const runTime = nowMs() - startTimes[test.fullTitle()]
    const isSlow = (runTime >= 100) //todo change this to pull from mocha settings
    if (isSlow) {
      slowTests++
      messages.push({color: out.yellow, text: `${test.fullTitle()} : ${runTime}ms`})
    } else {
      // do nothing on fast pass
    }
  });

  runner.on('pending', function(test) {
    pending++
  })

  runner.on('fail', function(test, err) {
    if (!failing) { //first error            
      out.colorIndicator(out.redBackground)
    }
    failing++
    messages.push({color: out.red, text: `${test.fullTitle()} : ${err.message}`})
  });
}

module.exports = MochaDashboardReporter;
