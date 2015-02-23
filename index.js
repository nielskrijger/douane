'use strict';

var Douane = require('./lib/Douane');
require('./lib/validators'); // Validators are loaded on the Validation prototype
require('./lib/sanitizers'); // Sanitizers are loaded on the Validation prototype

module.exports = Douane;
