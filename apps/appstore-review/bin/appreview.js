#! /usr/bin/env node
var fs = require('fs');
var path = require('path');
var reviewer = require('../lib/index');
var program = require('commander');

var configFile;
var version = JSON.parse(fs.readFileSync(path.resolve(__dirname, './../package.json'), 'utf8')).version;

program
  .version(version, '-v, --version')
  .arguments('<file>')
  .action(function (file) {
    configFile = file;
  })
  .parse(process.argv);

if (typeof configFile === 'undefined') {
  console.error('No config file specified');
  process.exit(1);
}

console.log('Loading config:', configFile)
var config = JSON.parse(fs.readFileSync(configFile));
reviewer.start(config);
