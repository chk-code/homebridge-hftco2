'use strict';

const Logger = require('./logger.js');
const DataCache = require('./data_cache.js');

class CO2AmpelAccessory {

  constructor (api, accessory, accessories, FakeGatoHistoryService, co2sensor) {

    this.api = api;
    this.accessory = accessory;
    this.accessories = accessories;
    this.FakeGatoHistoryService = FakeGatoHistoryService;

    this.co2sensor = co2sensor;

    this.dataCache = new DataCache();
    this.isUpdating = false;

    this.isCO2Detected = 0;

  // Update CO2 value by interval
	setInterval(() => {
		this.updateCache();
	}, this.co2sensor.update_interval * 1000);

  this.getService();

  }

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
  // Services
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//

  async getService () {

    let service = this.accessory.getService(this.api.hap.Service.CarbonDioxideSensor);
    this.historyService = new this.FakeGatoHistoryService('room', this.accessory, {storage:'fs', path: this.api.user.storagePath(), disableTimer:true});

    if(!service){
      Logger.info('Adding CarbonDioxideSensor service', this.accessory.displayName);
      service = this.accessory.addService(this.api.hap.Service.CarbonDioxideSensor, this.accessory.displayName, this.accessory.context.config.type);
    }

    service
      .getCharacteristic(this.api.hap.Characteristic.CarbonDioxideDetected)
      .on('get', this.getCo2Detected.bind(this));
    service
      .getCharacteristic(Characteristic.CarbonDioxideLevel)
      .on('get', this.getCo2Level.bind(this));
  	// Set init CO2 value
    this.getCo2Level((err, value) => this
      .service
      .setCharacteristic(this.api.hap.Characteristic.CarbonDioxideLevel, value),
    );
    // Set init CO2 threshold
    this.service.setCharacteristic(this.api.hap.Characteristic.CarbonDioxideDetected, this.isCO2Detected);
  };

   refreshHistory = (callback) => { 
    
    await timeout(5000);
    
    this.historyService.addEntry({
      time: moment().unix(), 
      temp: this.dataCache.temperature, 
      humidity: this.dataCache.humidity, 
      ppm: this.dataCache.co2
    });
    
    setTimeout(() => {
      this.refreshHistory();
    }, 10 * 60 * 1000);

  };

  setCo2Detected = function (value) {
    if (value >= this.co2sensor.co2warnlevel) {
      this.isCO2Detected = 1;
    } else {
      this.isCO2Detected = 0;
    }
    this.service.getCharacteristic(this.api.hap.Characteristic.CarbonDioxideDetected).updateValue(this.isCO2Detected);
  };

  getCo2Detected = function (callback) {
    Logger.info(`CO2 detected: ${this.isCO2Detected}.`);
    callback(null, this.isCO2Detected);
  };
  getCo2Level = function (callback) {
    let co2level = this.co2sensor.co2
    callback(null, co2level);
  };

  updateCache = (callback) => {
    if (this.isUpdating) {
      if (callback) {
        callback(null);
      }
      return;
    }
    this.isUpdating = true;
    const updateCallback = (error) => {
      this.isUpdating = false;
      if (error) {
        Logger.error(`Could not get sensor data: ${error}`);
      }
      else {
        this.updateServices(this.dataCache);
      }
      if (callback) {
        callback(error);
      }
    };
    if (this.co2sensor.jsonURL) {
      this.dataCache.updateFromURLSensor(this.co2sensor.jsonURL, updateCallback);
      this.refreshHistory();
    }
  };
  updateServices = (dataCache) => {
    this.dataCache = dataCache;
    const { 
      co2,
      temperature, 
      humidity,
      timestamp,
    } = dataCache;
    this.setCo2Detected(co2);
    this.service.setCharacteristic(this.api.hap.Characteristic.CarbonDioxideLevel, co2);
  };
}

module.exports = CO2AmpelAccessory;