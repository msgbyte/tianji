import { start } from './';
import fs from 'fs';

var config = JSON.parse(String(fs.readFileSync('./config.json')));
start(config);
