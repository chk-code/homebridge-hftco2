/**
 * v1.0
 *
 * @url https://github.com/chk-code/homebridge-hftco2
 * @author CK
 *
**/

'use strict';

module.exports = function (homebridge) {
  let CO2AmpelPlatform = require('./src/platform.js')(homebridge);
  homebridge.registerPlatform('homebridge-hftco2', 'CO2AmpelPlatform', CO2AmpelPlatform, true);
};