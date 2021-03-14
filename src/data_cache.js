const http = require('http');

class DataCache {
  constructor() {
    this.timestamp = null;
    this.temperature = null;
    this.humidity = null;
    this.co2 = null;;
  }

  updateFromURLSensor(url, callback) {
    this._loadCurrentSensorData(url, (error, json) => {
      if (error) {
        callback(error);
        return;
      }
      this._updateHumidity(json);
      this._updateTemperature(json);
      this._updateTimestamp(json);
      this._updateCO2(json);
      callback(null);
    })
  }

  _updateHumidity(json) {
    const humidityKeys = ['humidity'];
    for (let key of humidityKeys) {
      const value = this._findValue(json, key);
      if (value) {
        this.humidity = parseFloat(value);
        break;
      }
    }
  }
  _updateTimestamp(json) {
    const tsKeys = ['timestamp'];
    for (let key of tsKeys) {
      const value = this._findValue(json, key);
      if (value) {
        this.timestamp = parseFloat(value);
        break;
      }
    }
  }
  _updateTemperature(json) {
    const tempKeys = ['temperature'];
    for (let key of tempKeys) {
      const value = this._findValue(json, key);
      if (value) {
        this.temperature = value;
        break;
      }
    }
  }

  _updateCO2(json) {
    const co2Keys = ['co2'];
    for (let key of co2Keys) {
      const value = this._findValue(json, key);
      if (value) {
        this.co2 = parseFloat(value);
        break;
      }
    }
  }

  _findValue(json, key) {
    let basedata = json;
    // If loading data from API the result sometimes is
    // an array
    if (Array.isArray(basedata)) {
      basedata = basedata[0];
    }
    if (!basedata) {
      return null;
    }
    const sensorValues = basedata["sensordatavalues"];
    if (!sensorValues) {
      return null;
    }
    for (let valueSet of sensorValues) {
      if (key == valueSet["value_type"]) {
        return valueSet["value"];
      }
    }
    return null;
  }

  _loadCurrentSensorData(jsonURL, callback) {
    http.get(jsonURL, (res) => {
      const { statusCode } = res;
      const contentType = res.headers['content-type'];

      let error;
      if (statusCode !== 200) {
        error = new Error('Request Failed.\n' +
                          `Status Code: ${statusCode}`);
      } else if (!/^application\/json/.test(contentType)) {
        error = new Error('Invalid content-type.\n' +
                          `Expected application/json but received ${contentType}`);
      }
      if (error) {
        res.resume();
        callback(error, null);
        return;
      }

      res.setEncoding('utf8');
      let rawData = '';
      res.on('data', (chunk) => { rawData += chunk; });
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(rawData);
          callback(null, parsedData);
        } catch (error) {
          callback(error, null);
        }
      });
    }).on('error', (error) => {
      callback(error, null);
    });
  }
}

module.exports = DataCache;