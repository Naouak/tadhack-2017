global.Olm = require('olm');
const config = require('./config');
const matrix = require('matrix-js-sdk');
module.exports = () => matrix.createClient(config.matrix);