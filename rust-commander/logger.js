const colors = require('colors');

module.exports = {
  log(log) {
    console.log(log);
  },
  error(log) {
    console.log(colors.red(log));
  },
  success(log) {
    console.log(`✔ ${colors.green(log)}`);
  },
  title(title) {
    const length = title.length;
    const lineLength = Math.floor((30 - (length + 2)) / 2);

    console.log('');
    console.log(`═> ${colors.yellow(title)}`);
    console.log('');

  },
  splashScreen() {
    console.log(colors.magenta('═══════════════════════════════════════════════════════════════'));
    console.log(colors.cyan(' ______               __'));
    console.log(colors.cyan('|   __ \\.--.--.-----.|  |_'));
    console.log(colors.cyan('|      <|  |  |__ --||   _|'));
    console.log(colors.cyan('|___|__||_____|_____||____|'));
    console.log(colors.cyan(''));
    console.log(colors.cyan(' ______                                         __'));
    console.log(colors.cyan('|      |.-----.--------.--------.---.-.-----.--|  |.-----.----.'));
    console.log(colors.cyan('|   ---||  _  |        |        |  _  |     |  _  ||  -__|   _|'));
    console.log(colors.cyan('|______||_____|__|__|__|__|__|__|___._|__|__|_____||_____|__|'));
    console.log('');
    console.log(colors.magenta('═══════════════════════════════════════════════════════════════'));
    console.log(colors.white('version:'), colors.blue('alpha 1.0'));
    console.log(colors.white('author:'), colors.blue('MarlburroW'));
    console.log(colors.white('Contributors:'), colors.blue('Marzu'));
    console.log(colors.magenta('═══════════════════════════════════════════════════════════════'));
    console.log('');
  }
};
