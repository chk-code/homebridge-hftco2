# homebridge-hftco2

![Tavis CI build status](https://travis-ci.com/github/chk-code/homebridge-hftco2.svg?branch=master)

[HomeBridge](http://github.com/nfarina/homebridge) module for the DIY [HFT Stuttgart](https://www.hft-stuttgart.de/) [CO2 Ampel](https://www.hft-stuttgart.de/forschung/news/co2-ampel-lueften-gegen-covid-19).

It can be used to see the status of your own sensor in HomeKit.

## Features

- See Co2 sensor data (in ppm), temperature and humidity in HomeKit and the Home app
- Get the data from a sensor on your local network
- See history for temperature, etc. using the Elgato Eve app 
- Supported sensors / combinations : 
  - Sensirion SCD30

## Setup

First follow the instructions for [HomeBridge](http://github.com/nfarina/homebridge). 

Install `homebridge-hftco2` using `(sudo) npm install -g homebridge-hftco2`.

Configure your CO2 Ampel in the `homebridge` settings file. See [config.sample.json](config.sample.json). All settings except 'sensorID', `update_interval` (default 60 seconds) and `co2warnlevel` (default 800 ppm) are required.

See the documentation of the [fakegato-history](https://github.com/simont77/fakegato-history/blob/master/README.md#history-persistence) module for the list of supported options.

### The sensor & homebridge in your (home) network

To do this set `json_url` to

`http://<YOUR_CO2AMPEL_IP-ADDRESS>//data.json`

using the same local network as your sensor. 

*Note:* If you use a HomeKit hub (like a Apple TV or a iPad) you can still access your data from outside your home. See [Apple's documentation for details](https://support.apple.com/en-us/HT207057).


## Demo

![homebridge-hftco2 in apple home app](img/screenshot.jpeg)