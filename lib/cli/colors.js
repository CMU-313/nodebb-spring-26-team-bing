'use strict';

const chalk = require('chalk');
module.exports = {
  styleTitle: str => chalk.bold(str),
  styleCommandText: str => chalk.cyan(str),
  styleCommandDescription: str => chalk.magenta(str),
  styleDescriptionText: str => chalk.italic(str),
  styleOptionText: str => chalk.green(str),
  styleArgumentText: str => chalk.yellow(str),
  styleSubcommandText: str => chalk.blue(str)
};