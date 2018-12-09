const expect = require('chai').expect
const sinon = require("sinon")
const out = require("../lib/reporterOutput")

describe("reporterOutput", () => {
  let mockLog

  beforeEach(() => {
    mockLog = sinon.stub(console, "log")
  })

  afterEach(() => {
    mockLog.restore()
  })

  describe("saveColorAndLocation", () => {
    it("saves the color and location", () => {
      //ANSI doesn't support just saving the color, which is what we want
      out.saveColorAndLocation()
      expect(mockLog.callCount).to.equal(1)
      expect(mockLog.firstCall.args[0]).to.equal("\033[7")
    })
  })

  describe("restoreColor", () => {
    it("restores only color, not location", () => {
      //ANSI doesn't support save/restore/query of current color, so can't save it at start
      //instead, save the location+color at start, then at end save location (at end), restore location+color, then restore location (at end)
      out.restoreColor()
      expect(mockLog.callCount).to.equal(1)
      expect(mockLog.firstCall.args[0]).to.equal("\033[s\033[8\033[u")
    })

  })

  describe("clearScreen", () => {
    it("clears the screen", () => {
      out.clearScreen()
      expect(mockLog.callCount).to.equal(1)
      expect(mockLog.firstCall.args[0]).to.equal("\033[2J\033[0;0f")
    })
  })

  describe("print", () => {
    it("prints in color", () => {
      const testColor1 = out.cyan
      const testColor2 = 44
      const testString1 = "Hello, world"
      const testString2 = "This is a test"

      out.print(testColor1, testString1)
      out.print(testColor2, testString2)
      expect(mockLog.callCount).to.equal(2)
      expect(mockLog.firstCall.args[0]).to.equal("\033" + `[${testColor1}m${testString1}`)
      expect(mockLog.secondCall.args[0]).to.equal("\033" + `[${testColor2}m${testString2}`)
    })

    it("prints in bold color", () => {
      const testColor = out.cyan
      const testString = "Hello, world"

      out.print(testColor, testString, true)
      expect(mockLog.callCount).to.equal(1)
      expect(mockLog.firstCall.args[0]).to.equal("\033" + `[1;${testColor}m${testString}`)
    })
  })

  xit("Need Tests", (done) => {
    done("Need TESTS")
  })
})