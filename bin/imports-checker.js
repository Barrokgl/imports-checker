#!/usr/bin/env node

const makeCheck = require('../lib');

const args = Array.from(process.argv);
const rootPath = args[2] || process.cwd();

makeCheck(rootPath);