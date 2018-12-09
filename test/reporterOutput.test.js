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

  describe("resetColor", () => {
    it("resets screen attributes", () => {
      //ANSI doesn't support saving/restoring color so doing what we can
      out.resetColor()
      expect(mockLog.callCount).to.equal(1)
      expect(mockLog.firstCall.args[0]).to.equal("\033[0m")
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
      const testColor2 = "44"
      const testString1 = "Hello, world"
      const testString2 = "This is a test"

      out.print(testColor1, testString1)
      out.print(testColor2, testString2)
      expect(mockLog.callCount).to.equal(2)
      expect(mockLog.firstCall.args[0]).to.equal("\033" + `[${testColor1}m${testString1}`)
      expect(mockLog.secondCall.args[0]).to.equal("\033" + `[${testColor2}m${testString2}`)
    })
  })

  describe("colorIndicator", () => {
    it("prints in the correct color", () => {
      const testColor = "49"
      out.colorIndicator(testColor)
      expect(mockLog.callCount).to.equal(1)
      expect(mockLog.firstCall.args[0]).contains.string("\033" + `[${testColor}m`)
      expect(mockLog.firstCall.args[0]).contains.string("\033" + `[40m` + "\033" + `[37m`)
    })
  })
})