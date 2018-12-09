describe("Example Tests", () => {
  describe("Subheading", () => {
    it("Instant Passing Test", (done) => {
      done()
    })

    it("Fast Passing Test", (done) => {
      setTimeout(done, 10)
    })

    it("Moderately Slow Passing Test", (done) => {
      setTimeout(done, 40)
    })

    it("Slow Passing Test", (done) => {
      setTimeout(done, 100)
    })

    xit("Disabled Test", (done) => {
      ////
      done("This test isn't ran")
    })

    it("Failing Test", (done) => {
      done("This is a failure")
    })
  })
})