const mocha = require('mocha');
const expect = require('chai').expect
const sinon = require("sinon")
const async = require("async")
const MochaDashboardReporter = require("../lib/mochaDashboardReporter")
const out = require("../lib/reporterOutput")

describe("mochaDashboardReporter", () => {
  let clock
  let mochaBaseMock, testRunner, runnerEvents, testName
  let clearScreenMock, printMock, resetColorMock, colorIndicatorMock

  //todo change to print red colorIndicator as soon as the first test fails
  //todo change to print a max number of test messages before stopping (do we want to print failing tests first?)
  //todo change to show summary to the right of the color bar

  beforeEach(() => {
    clock = sinon.useFakeTimers();
    mochaBaseMock = sinon.stub(mocha.reporters.Base, "call")
    clearScreenMock = sinon.stub(out, "clearScreen")
    resetColorMock = sinon.stub(out, "resetColor")
    printMock = sinon.stub(out, "print")
    colorIndicatorMock = sinon.stub(out, "colorIndicator")
    const unhandledEvent = () => {throw new Error("Unhandled Event")}
    runnerEvents = {
      start : unhandledEvent,
      end : unhandledEvent,
      suite : unhandledEvent,
      "suite end" : unhandledEvent,
      test : unhandledEvent,
      "test end" : unhandledEvent,
      hook : unhandledEvent,
      "hook end" : unhandledEvent,
      pending : unhandledEvent,
      pass : unhandledEvent,
      fail : unhandledEvent
    }

    testName = "example test"

    testRunner = {
      on: (eventType, cb) => {
        if (runnerEvents[eventType]) {
          runnerEvents[eventType] = cb
        } else {
          throw new Error("Unknown event type passed to on(): " + eventType)
        }
      }
    }
  })

  afterEach(() => {
    clock.restore();
    mochaBaseMock.restore()
    clearScreenMock.restore()
    printMock.restore()
    resetColorMock.restore()
    colorIndicatorMock.restore()
  })

  const obj = (providedTitle = "test") => {
    return {
      title : () => {return providedTitle},
      fullTitle: () => {return providedTitle}
    }
  }

  const simulatePass = (testName, timeToRunMs, cb) => {
    runnerEvents["test"](obj(testName))
    setTimeout(() => {
      runnerEvents["pass"](obj(testName))
      runnerEvents["test end"](obj(testName))
      cb()
    }, timeToRunMs)
    clock.tick(timeToRunMs)
  }

  const simulatePending = (testName) => {
    runnerEvents["test"](obj(testName))
    runnerEvents["pending"](obj(testName))
  }


  const simulateFail = (testName, testMessage) => {
    runnerEvents["test"](obj(testName))
    runnerEvents["fail"](obj(testName), {message: testMessage})
    runnerEvents["test end"](obj(testName))
  }

  describe("basic setup", () => {
    it("calls mocha.reporters.Base", () => {
      MochaDashboardReporter(testRunner)
      expect(mochaBaseMock.callCount).to.equal(1)
      expect(mochaBaseMock.firstCall.args[0]).to.exist
      expect(mochaBaseMock.firstCall.args[1]).to.equal(testRunner)
    })
  })

  describe("at test level", () => {
    beforeEach(() => {
      MochaDashboardReporter(testRunner)
      runnerEvents["start"](obj())
      runnerEvents["suite"](obj())
    })

    it("nothing is printed for passing test", (done) => {
      const shortTime = 5
      simulatePass(testName, shortTime, () => {
        expect(printMock.callCount).to.equal(0)
        done()
      })
    })

    it("nothing is printed for pending test", () => {
      simulatePending(testName)
      expect(printMock.callCount).to.equal(0)
    })

    it("nothing is printed for slow test", (done) => {
      const longTime = 110
      simulatePass(testName, longTime, () => {
        expect(printMock.callCount).to.equal(0)
        done()
      })
    })

    it("color bar is displayed now for failed test", () => {
      simulateFail(testName, "This is the error from the test")
      expect(printMock.callCount).to.equal(0)
      expect(colorIndicatorMock.callCount).to.equal(1)
      expect(colorIndicatorMock.firstCall.args[0]).to.equal(out.redBackground)
    })
  })

  describe("at suite level", () => {
    beforeEach(() => {
      MochaDashboardReporter(testRunner)
      runnerEvents["start"](obj())
    })

    it("nothing is printed at suite start", () => {
      runnerEvents["suite"](obj())
      expect(printMock.callCount).to.equal(0)
    })

    it("nothing is printed at suite end", () => {
      runnerEvents["suite"](obj())
      runnerEvents["suite end"](obj())
      expect(printMock.callCount).to.equal(0)
    })
  })

  describe("at run level", () => {
    beforeEach(() => {
      MochaDashboardReporter(testRunner)
      runnerEvents["start"](obj())
    })

    const runTests = (tests, callback) => {
      async.eachLimit(tests, 1, (test, cb) => {
        if (test.isFail) {
          simulateFail(test.name, test.message)
          cb()
        } else if (test.isPending) {
          simulatePending(test.name)
          cb()
        } else {
          simulatePass(test.name, test.runTime, cb)
        }
      }, callback)
    }

    const countPassing = (tests) => {
      return tests.filter((test) => {return !test.isFail && !test.isPending}).length
    }

    const countSlow = (tests) => {
      return tests.filter((test) => {return !test.isFail && !test.isPending && test.runTime >= 100}).length
    }

    const countPending = (tests) => {
      return tests.filter((test) => {return test.isPending}).length
    }

    const countFailing = (tests) => {
      return tests.filter((test) => {return test.isFail}).length
    }

    const getExpectedHeaderLineCount = (tests) => {
      const failing = countFailing(tests)
      const pending = countPending(tests)
      const slow = countSlow(tests)
      const passing = countPassing(tests)

      return (passing ? 1 : 0) + (slow ? 1 : 0) + (pending ? 1 : 0) + (failing ? 1 : 0)
    }

    const verifyExpectedOutputLineCount = (tests) => {
      const expectedTestLines = countSlow(tests) + countFailing(tests)
      expect(printMock.callCount).to.equal(getExpectedHeaderLineCount(tests) + expectedTestLines)
    }

    const verifyTestLines = (tests) => {
      const headerLineCount = getExpectedHeaderLineCount(tests)
      const testsExcludingPasses = tests.filter((test) => {return test.isFail || test.runTime >= 100})

      testsExcludingPasses.forEach((test, i) => {
        const printCall = printMock.getCall(headerLineCount + i)
        expect(printCall).to.exist
        expect(printCall.args[1]).to.contain.string(test.name)
        if (test.isFail) {
          expect(printCall.args[0]).to.equal(out.red)
        } else {
          expect(printCall.args[0]).to.equal(out.yellow)
        }
      })
    }

    it("clears screen at start", () => {
      expect(clearScreenMock.callCount).to.equal(1)
    })

    it("resets color at end", () => {
      runnerEvents["end"](obj())
      expect(resetColorMock.callCount).to.equal(1)
    })

    describe("all passing", () => {
      describe("everything is green and fast", () => {
        let passingTestCount = 12
        let testRuntime = 300
        let tests

        beforeEach((done) => {
          tests = []
          for (let i = 1; i <= passingTestCount; i++) {
            tests.push({name: `test ${i}`, runTime : 0})
          }
          runTests(tests, done)
        })

        it("color bar is green", () => {
          runnerEvents["end"](obj())
          
          expect(colorIndicatorMock.callCount).to.equal(1)
          expect(colorIndicatorMock.firstCall.args[0]).to.equal(out.greenBackground)
        })

        it("number of tests is listed and total run time", (done) => {
          setTimeout(() => {
            runnerEvents["end"](obj())
            expect(printMock.callCount).to.equal(1)
            expect(printMock.firstCall.args[0]).to.equal(out.green)
            expect(printMock.firstCall.args[1]).to.equal(`  ${passingTestCount} passing (${testRuntime}ms)`)
            done()
          }, testRuntime)

          clock.tick(testRuntime)
        })
      })

      describe("slow but passing tests", () => {
        let slowTestCount = 4
        let slowTestTime = 110
        let tests

        beforeEach((done) => {
          tests = []
          for (let i = 1; i <= slowTestCount; i++) {
            tests.push({name: `test ${i}`, runTime : slowTestTime})
          }
          runTests(tests, done)
        })

        it("color bar is yellow", () => {
          runnerEvents["end"](obj())
          
          expect(colorIndicatorMock.callCount).to.equal(1)
          expect(colorIndicatorMock.firstCall.args[0]).to.equal(out.yellowBackground)
        })

        it("number of tests is listed for only slow", () => {
          runnerEvents["end"](obj())
          
          verifyExpectedOutputLineCount(tests)
          expect(printMock.firstCall.args[0]).to.equal(out.green)
          expect(printMock.firstCall.args[1]).to.contain.string(`  ${slowTestCount} passing (`)
          expect(printMock.secondCall.args[0]).to.equal(out.yellow)
          expect(printMock.secondCall.args[1]).to.equal(`    ${slowTestCount} slow-running`)
        })

        it("problem tests are listed", () => {
          runnerEvents["end"](obj())
          verifyTestLines(tests)
        })
      })

      describe("slow and fast passing tests", () => {
        let tests
        let slowTestTime = 110
        let expectedPass, expectedSlow

        beforeEach((done) => {
          tests = [
            {name: 'test 1 - fast', runTime : 0},
            {name: 'test 2 - slow', runTime : slowTestTime},
            {name: 'test 3 - slow', runTime : slowTestTime},
            {name: 'test 4 - fast', runTime : 10}
          ]
          expectedPass = 4
          expectedSlow = 2
          runTests(tests, done)
        })

        it("color bar is yellow", () => {
          runnerEvents["end"](obj())
          
          expect(colorIndicatorMock.callCount).to.equal(1)
          expect(colorIndicatorMock.firstCall.args[0]).to.equal(out.yellowBackground)
        })

        it("number of tests is listed for slow", () => {
          runnerEvents["end"](obj())
          
          verifyExpectedOutputLineCount(tests)
          expect(printMock.firstCall.args[0]).to.equal(out.green)
          expect(printMock.firstCall.args[1]).to.contain.string(`  ${expectedPass} passing (`)
          expect(printMock.secondCall.args[0]).to.equal(out.yellow)
          expect(printMock.secondCall.args[1]).to.equal(`    ${expectedSlow} slow-running`)
        })

        it("problem tests are listed", () => {
          runnerEvents["end"](obj())
          verifyTestLines(tests)
        })
      })
    })
  
    describe("pending tests", () => {
      describe("only pending tests", () => {
        let tests, expectedPending

        beforeEach((done) => {
          tests = [
            {name: 'test 1 - pending', isPending : true},
            {name: 'test 2 - pending', isPending : true},
            {name: 'test 3 - pending', isPending : true},
            {name: 'test 4 - pending', isPending : true}
          ]
          expectedPending = 4
          runTests(tests, done)
        })

        it("color bar is cyan", () => {
          runnerEvents["end"](obj())
          
          expect(colorIndicatorMock.callCount).to.equal(1)
          expect(colorIndicatorMock.firstCall.args[0]).to.equal(out.cyanBackground)
        })

        it("number of tests is listed for only pending ", () => {
          runnerEvents["end"](obj())
          
          verifyExpectedOutputLineCount(tests)
          expect(printMock.firstCall.args[0]).to.equal(out.cyan)
          expect(printMock.firstCall.args[1]).to.equal(`  ${expectedPending} pending`)
        })

        it("problem tests are listed", () => {
          runnerEvents["end"](obj())
          verifyTestLines(tests)
        })
      })

      describe("pending and fast passing tests", () => {
        let tests, expectedPassing, expectedPending

        beforeEach((done) => {
          tests = [
            {name: 'test 1 - fast', runTime : 0},
            {name: 'test 2 - pending', isPending : true},
            {name: 'test 3 - pending', isPending : true},
            {name: 'test 4 - fast', runTime : 10}
          ]
          expectedPassing = 2
          expectedPending = 2
          runTests(tests, done)
        })
        
        it("color bar is green", () => {
          runnerEvents["end"](obj())
          
          expect(colorIndicatorMock.callCount).to.equal(1)
          expect(colorIndicatorMock.firstCall.args[0]).to.equal(out.greenBackground)
        })

        it("number of tests is listed for passing and pending ", () => {
          runnerEvents["end"](obj())
          
          verifyExpectedOutputLineCount(tests)
          expect(printMock.firstCall.args[0]).to.equal(out.green)
          expect(printMock.firstCall.args[1]).to.contain.string(`  ${expectedPassing} passing (`)
          expect(printMock.secondCall.args[0]).to.equal(out.cyan)
          expect(printMock.secondCall.args[1]).to.equal(`  ${expectedPending} pending`)
        })

        it("problem tests are listed", () => {
          runnerEvents["end"](obj())
          verifyTestLines(tests)
        })
      })

      describe("pending and slow passing tests", () => {
        let slowTestTime = 110
        let tests, expectedPassing, expectedSlow, expectedPending
        beforeEach((done) => {
          tests = [
            {name: 'test 1 - pending', isPending : true},
            {name: 'test 2 - slow', runTime : slowTestTime},
            {name: 'test 3 - slow', runTime : slowTestTime},
            {name: 'test 4 - pending', isPending : true},
          ]
          expectedPassing = 2
          expectedSlow = 2
          expectedPending = 2
          runTests(tests, done)
        })

        it("color bar is yellow", () => {
          runnerEvents["end"](obj())
          
          expect(colorIndicatorMock.callCount).to.equal(1)
          expect(colorIndicatorMock.firstCall.args[0]).to.equal(out.yellowBackground)
        })

        it("number of tests is listed for passing, slow, and pending ", () => {
          runnerEvents["end"](obj())
          
          verifyExpectedOutputLineCount(tests)
          expect(printMock.firstCall.args[0]).to.equal(out.green)
          expect(printMock.firstCall.args[1]).to.contain.string(`  ${expectedPassing} passing (`)
          expect(printMock.secondCall.args[0]).to.equal(out.yellow)
          expect(printMock.secondCall.args[1]).to.equal(`    ${expectedSlow} slow-running`)
          expect(printMock.thirdCall.args[0]).to.equal(out.cyan)
          expect(printMock.thirdCall.args[1]).to.equal(`  ${expectedPending} pending`)
        })

        it("problem tests are listed", () => {
          runnerEvents["end"](obj())
          verifyTestLines(tests)
        })
      })
    })
  
    describe("failing tests", () => {
      describe("only failing tests", () => {
        let tests, expectedFailing

        beforeEach((done) => {
          tests = [
            {name: 'test 1 - fail', isFail : true},
            {name: 'test 2 - fail', isFail : true},
            {name: 'test 3 - fail', isFail : true}
          ]
          expectedFailing = 3
          runTests(tests, done)
        })

        it("color bar is red", () => {
          runnerEvents["end"](obj())
          
          expect(colorIndicatorMock.callCount).to.equal(1)
          expect(colorIndicatorMock.firstCall.args[0]).to.equal(out.redBackground)
        })

        it("number of tests is listed for failing ", () => {
          runnerEvents["end"](obj())
          
          verifyExpectedOutputLineCount(tests)
          expect(printMock.firstCall.args[0]).to.equal(out.red)
          expect(printMock.firstCall.args[1]).to.equal(`  ${expectedFailing} failing`)
        })

        it("problem tests are listed", () => {
          runnerEvents["end"](obj())
          verifyTestLines(tests)
        })
      })

      describe("failing, pending, fast passing, and slow passing tests", () => {
        let slowTestTime = 110
        let tests, expectedPassing, expectedSlow, expectedPending, expectedFailing

        beforeEach((done) => {
          tests = [
            {name: 'test 1 - pending', isPending : true},
            {name: 'test 2 - slow', runTime : slowTestTime},
            {name: 'test 3 - fast', runTime : 5},
            {name: 'test 4 - pending', isPending : true},
            {name: 'test 5 - fail', isFail : true}
          ]
          expectedPassing = 2
          expectedSlow = 1
          expectedPending = 2
          expectedFailing = 1
          runTests(tests, done)
        })

        it("color bar is red", () => {
          runnerEvents["end"](obj())
          
          expect(colorIndicatorMock.callCount).to.equal(1)
          expect(colorIndicatorMock.firstCall.args[0]).to.equal(out.redBackground)
        })

        it("number of tests is listed for passing, slow, pending, and failing ", () => {
          runnerEvents["end"](obj())
          
          verifyExpectedOutputLineCount(tests)
          expect(printMock.firstCall.args[0]).to.equal(out.green)
          expect(printMock.firstCall.args[1]).to.contain.string(`  ${expectedPassing} passing (`)
          expect(printMock.secondCall.args[0]).to.equal(out.yellow)
          expect(printMock.secondCall.args[1]).to.equal(`    ${expectedSlow} slow-running`)
          expect(printMock.thirdCall.args[0]).to.equal(out.cyan)
          expect(printMock.thirdCall.args[1]).to.equal(`  ${expectedPending} pending`)
          expect(printMock.getCall(3).args[0]).to.equal(out.red)
          expect(printMock.getCall(3).args[1]).to.equal(`  ${expectedFailing} failing`)
        })

        it("problem tests are listed", () => {
          runnerEvents["end"](obj())
          verifyTestLines(tests)
        })
      })
    })
  })

  //todo track cycle time between runs
  // xdescribe("between runs", () => {
  //   // need to figure out how to persist state for this (file system?)


  //   describe("cycle time", () => {
  //     xit("reports red/green/refactor cycle time", (done) => {
  //       done("TEST NEEDED")
  //     })
  
  //     xit("red restarts cycle time", (done) => {
  //       done("TEST NEEDED")
  //     })
  
  //     xit("green stops cycle time", (done) => {
  //       done("TEST NEEDED")
  //     })
  
  //     xit("pending does not affect cycle time", (done) => {
  //       done("TEST NEEDED")
  //     })
  
  //     xit("slow tests do not affect cycle time", (done) => {
  //       done("TEST NEEDED")
  //     })
  //   })
  // })
})