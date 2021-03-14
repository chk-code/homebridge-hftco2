'use strict';

const Logger = require('./logger.js');
const packageVer = require('./package.json');

//Accessories
const CO2AmpelAccessory = require('./CO2AmpelAccessory.js')

//Custom Types

const PLUGIN_NAME = 'homebridge-hftco2';
const PLATFORM_NAME = 'CO2AmpelPlatform';

var Accessory, UUIDGen, FakeGatoHistoryService;

module.exports = function (homebridge) {

  Accessory = homebridge.platformAccessory;
  UUIDGen = homebridge.hap.uuid;
  
  return CO2AmpelPlatform;

};

function CO2AmpelPlatform (log, config, api) {
  
  if (!api||!config) 
    return;

  Logger.init(log, true);
  FakeGatoHistoryService = require('fakegato-history')(api);

  this.api = api;
  this.accessories = [];
  this.config = config;
  
  this.devices = new Map();

  if(this.config.co2sensor && this.config.co2sensor.length) {
  
    this.config.co2sensor.forEach(co2sensor => {
    
      let error = false;

      if (!co2sensor.name) {
        Logger.warn('One of the CO2 Ampeln has no name configured. This device will be skipped.');
        error = true;
      } else if (!co2sensor.json_url) {
        Logger.warn('There is no JSON URL configured for this CO2 Ampel. This device will be skipped.', co2sensor.name);
        error = true;
      }

      if (!error) {
        
        let options = {
          charset: 'utf-8',
          language: 'en-us',
          version: '2.0'
        };
      
        const uuidCO2Ampel = UUIDGen.generate(co2sensor.name);
        
        if (this.devices.has(uuidCO2Ampel)) {
     
          Logger.warn('Multiple devices are configured with this name. Duplicate devices will be skipped.', co2sensor.name);
     
        } else {
          
          co2sensor.type = 'CarbonDioxideSensor';
          co2sensor.update_interval = Number.isInteger(co2sensor.update_interval) 
            ?  co2sensor.update_interval < 1 
                 ? 1 
                 : co2sensor.update_interval
            :  60;
          co2sensor.co2warnlevel = Number.isInteger(co2sensor.co2warnlevel) 
            ?  co2sensor.co2warnlevel < 1 
                 ? 1 
                 : co2sensor.co2warnlevel
            :  800;
          this.devices.set(uuidCO2Ampel, co2sensor);
          
        }
    
      }
      
    });
    
  }

  this.api.on('didFinishLaunching', this.didFinishLaunching.bind(this));
  
}

CO2AmpelPlatform.prototype = {

  didFinishLaunching: async function(){

    for (const entry of this.devices.entries()) {
    
      let uuid = entry[0];
      let device = entry[1];
      
      const cachedAccessory = this.accessories.find(curAcc => curAcc.UUID === uuid);
      
      if (!cachedAccessory) {
      
        const accessory = new Accessory(device.name, uuid);

        Logger.info('Configuring accessory...', accessory.displayName); 
        
        this.setupAccessory(accessory, device);
        
        Logger.info('Configured!', accessory.displayName);
        
        this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
        
        this.accessories.push(accessory);
        
      }
      
    }

    this.accessories.forEach(accessory => {
    
      const device = this.devices.get(accessory.UUID);
      
      try {
      
        if (!device)
          this.removeAccessory(accessory);
    
      } catch(err) {

        Logger.info('Device already removed? Skip removing.');
        Logger.debug(err);
     
      }
      
    });
  
  },
  
  setupAccessory: function(accessory, device){
    
    accessory.on('identify', () => {
      Logger.info('Identify requested.', accessory.displayName);
    });
    
    const manufacturer = 'HFT Stuttgart';
      
    const model = 'CO2 Ampel';
    
    const sensorID = device.sensorID
      ? device.sensorID 
      : 'SerialNumber';
    
    const AccessoryInformation = accessory.getService(this.api.hap.Service.AccessoryInformation);
    
    AccessoryInformation
      .setCharacteristic(this.api.hap.Characteristic.Manufacturer, manufacturer)
      .setCharacteristic(this.api.hap.Characteristic.Model, model)
      .setCharacteristic(this.api.hap.Characteristic.SerialNumber, sensorID)
      .setCharacteristic(this.api.hap.Characteristic.FirmwareRevision, packageVer.version);
      
    let co2sensor = device.co2sensor;
    
    delete device.co2sensor;
    
    accessory.context.config = device;
    
    new CO2AmpelAccessory(this.api, accessory, this.accessories, FakeGatoHistoryService, co2sensor);
    
    return;

  },

  configureAccessory: async function(accessory){

    const device = this.devices.get(accessory.UUID);

    if (device){
      Logger.info('Configuring accessory...', accessory.displayName);                                                                                            
      this.setupAccessory(accessory, device);
    }
    
    this.accessories.push(accessory);
  
  },
  
  removeAccessory: function(accessory) {
  
    Logger.info('Removing accessory...', accessory.displayName);
    
    let accessories = this.accessories.map( cachedAccessory => {
      if(cachedAccessory.displayName !== accessory.displayName){
        return cachedAccessory;
      }
    });
    
    this.accessories = accessories.filter(function (el) {
      return el != null;
    });

    this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
  
  }

};