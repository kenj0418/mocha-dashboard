const mocha = require('mocha');
const expect = require('chai').expect
const sinon = require("sinon")
const MochaDashboardReporter = require("../lib/mochaDashboardReporter")
const out = require("../lib/reporterOutput")

describe("mochaDashboardReporter", () => {
  let mochaBaseMock, clearScreenMock, printMock
  let testRunner, runnerEvents

  beforeEach(() => {
    mochaBaseMock = sinon.stub(mocha.reporters.Base, "call")
    clearScreenMock = sinon.stub(out, "clearScreen")
    printMock = sinon.stub(out, "print")
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

    testRunner = {
      on: (eventType, cb) => {
        if (runnerEvents[eventType]) {
          runnerEvents[eventType] = cb
        } else {
          throw new Error("Unknown event type passed to on: " + eventType)
        }
      }
    }
  })

  afterEach(() => {
    mochaBaseMock.restore()
    clearScreenMock.restore()
    printMock.restore()
  })

  const obj = (providedTitle = "test") => {
    return {
      title : () => {return providedTitle},
      fullTitle: () => {return providedTitle}
    }
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

    it("nothing is printed for passing test", () => {
      runnerEvents["test"](obj())
      runnerEvents["pass"](obj())
      runnerEvents["test end"](obj())
      expect(printMock.callCount).to.equal(0)
    })

    it("prints title in bold cyan for pending test", () => {
      const testName = "ThisIsMyTest1"
      runnerEvents["test"](obj(testName))
      runnerEvents["pending"](obj(testName))
      expect(printMock.callCount).to.equal(1)
      expect(printMock.firstCall.args).to.deep.equal([out.cyan, testName, true])
    })

    it("prints title in pale yellow for moderately slow test", () => {
      //todo change this to use sinon fake timer
      const testName = "ThisIsMyTest1"
      const testMilliseconds = 40
      runnerEvents["test"](obj(testName))
      setTimeout(() => {
        runnerEvents["pass"](obj(testName))
        runnerEvents["test end"](obj(testName))

        expect(printMock.callCount).to.equal(1)
        expect(printMock.firstCall.args).to.deep.equal([out.yellow, `${testName} : ${testMilliseconds}msx`])
      }, testMilliseconds)
    })

    it("prints title in bold yellow for slow test", () => {
      //todo change this to use sinon fake timer
      const testName = "ThisIsMyTest1"
      const testMilliseconds = 200
      runnerEvents["test"](obj(testName))
      setTimeout(() => {
        runnerEvents["pass"](obj(testName))
        runnerEvents["test end"](obj(testName))

        expect(printMock.callCount).to.equal(1)
        expect(printMock.firstCall.args).to.deep.equal([out.yellow, `${testName} : ${testMilliseconds}ms`, true])
      }, testMilliseconds)
    })

    it("prints title in bold red for failed test", () => {
      const testMessage = "This is the error from the test"
      const testName = "ThisIsMyTest1"
      runnerEvents["test"](obj())
      runnerEvents["fail"](obj(testName), {message: testMessage})
      runnerEvents["test end"](obj())
      expect(printMock.callCount).to.equal(1)
      expect(printMock.firstCall.args).to.deep.equal([out.red, `${testName} : ${testMessage}`, true])
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
    it("clears screen at start", () => {
      MochaDashboardReporter(testRunner)
      runnerEvents["start"](obj())
      expect(clearScreenMock.callCount).to.equal(1)
    })

    xit("resets color at end", (done) => {
      done("TEST NEEDED")
    })

    describe("all passing", () => {
      xit("need tests for when everything is green", (done) => {
        done("TEST NEEDED")
      })
  
      xit("need tests for slow passing tests", (done) => {
        done("TEST NEEDED")
      })
    })
  
    describe("pending tests", () => {
      xit("need tests for when pending tests exist", (done) => {
        done("TEST NEEDED")
      })
    })
  
    describe("error tests", () => {
      xit("need tests for when tests are failing", (done) => {
        done("TEST NEEDED")
      })
    })
  })

  xdescribe("between runs", () => {
    // need to figure out how to persist state for this (file system?)

    describe("cycle time", () => {
      xit("reports red/green/refactor cycle time", (done) => {
        done("TEST NEEDED")
      })
  
      xit("red restarts cycle time", (done) => {
        done("TEST NEEDED")
      })
  
      xit("green stops cycle time", (done) => {
        done("TEST NEEDED")
      })
  
      xit("pending does not affect cycle time", (done) => {
        done("TEST NEEDED")
      })
  
      xit("slow tests do not affect cycle time", (done) => {
        done("TEST NEEDED")
      })
    })
  })
})