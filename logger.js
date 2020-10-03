const chalk = require('chalk');

class Logger {
  constructor(name) {
    this.name = name;
  }

  log(str) {
    console.log(chalk.bold(`${this.name}: `) + str);
  }
}

exports.Logger = Logger;
