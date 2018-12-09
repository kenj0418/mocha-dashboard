const ansi = (code) => {
   return "\033[" + code
}

module.exports = {
  red : "31",
  green : "32",
  yellow : "33",
  cyan : "36",

  clearScreen : () => {
    console.log(ansi("2J") + ansi("0;0f"))
  },

  print : (color, text, bold) => {
    let format = (bold) ? `1;${color}` : color
    console.log(ansi(`${format}m`) + text)
  }
}