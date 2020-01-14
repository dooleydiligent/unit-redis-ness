console.log(`This is worker.import.js`);
const path = require('path');
require('ts-node').register();
require(path.resolve(__dirname, './resp-worker.ts'));
console.log(`completed worker.import.js`);