'use strict';
/**
 * Load the TypeScript compiler, then load the TypeScript gulpfile which simply loads all
 * the tasks. The tasks are really inside tools/gulp/tasks.
 */
const ts_node = require('ts-node');
ts_node.register({project: './tools/gulp/tsconfig.json'});

require('./tools/gulp/gulpfile');
