#!/usr/bin/env node

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import * as loginCommand from './commands/login.js';
import * as workerInitCommand from './commands/worker/init.js';
import * as workerDeployCommand from './commands/worker/deploy.js';

yargs(hideBin(process.argv))
  .scriptName('tianji')
  .usage('$0 <command> [options]')
  .command(loginCommand)
  .command('worker', 'Manage Tianji Workers', (yargs) => {
    return yargs
      .command(workerInitCommand)
      .command(workerDeployCommand)
      .demandCommand(1, 'You need to specify a subcommand (init or deploy)')
      .help();
  })
  .demandCommand(1, 'You need to specify a command')
  .help()
  .alias('h', 'help')
  .version()
  .alias('v', 'version')
  .strict()
  .parse();
