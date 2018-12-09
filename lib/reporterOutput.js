const ansi = (code) => {
   return "\033[" + code
}

module.exports = {
  white : "37",
  red : "31",
  redBackground : "41",
  green : "32",
  greenBackground : "42",
  yellow : "33",
  yellowBackground: "43",
  cyan : "36",
  cyanBackground : "46",

  clearScreen : () => {
    console.log(ansi("2J") + ansi("0;0f"))
  },

  print : (color, text) => {
    console.log(ansi(`${color}m`) + text)
  },

  resetColor : () => {
    console.log(ansi("0m"))
  },

  colorIndicator : (color) => {
    const spaces = "         "
    const indicator = `${spaces}\n${spaces}\n${spaces}\n${spaces}`
    console.log(ansi(`${color}m`) + indicator + ansi("40m") + ansi("37m") + "\n")
  }
}