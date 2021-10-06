const PLUGIN_NAME = "homebridge-plugin-personal";
const PLATFORM_NAME = "PersonalHomebridgePlugin";

let Accessory, HomebridgeAPI, PlatformAccessory, Service, Characteristic, UUIDGen;

module.exports = function (homebridge) {
    HomebridgeAPI = homebridge;
    Accessory = homebridge.hap.Accessory;
    PlatformAccessory = homebridge.platformAccessory;
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    UUIDGen = homebridge.hap.uuid;

    homebridge.registerPlatform(PLUGIN_NAME, PLATFORM_NAME, PersonalHomebridgePlatform, true);
    homebridge.registerAccessory(PLUGIN_NAME, PLATFORM_NAME + 'Accessory', PersonalHomebridgeAccessory);
};

function PersonalHomebridgePlatform(log, config, api) {
    this.log = log;
    this.debug = config['debug'] || true;
    this.devices = config['devices'];
}

PersonalHomebridgePlatform.prototype = {

    accessories: function (callback) {
        this.accessories = [];
        this.deviceAccessories = [];
        if (this.devices) {
            for (var i = 0; i < this.devices.length; i++) {
                var deviceAccessory = new PersonalHomebridgeAccessory(this.log, this.devices[i], this);
                this.accessories.push(deviceAccessory);
                this.deviceAccessories.push(deviceAccessory);
            }
        }
        callback(this.accessories);
    },
    removeAccessory: function (accessory) {
        if (accessory) {
            log('Removing', accessory.name)
            this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
        }
    }
}

function PersonalHomebridgeAccessory(log, config, platform) {
    log('Initializing', config.name, config.type, 'accessory...')
    this.log = log;
    this.name = config['name'];
    this.stateful = true;
    this.contact = config['contact'] || true;
    this.debug = config['debug'] || false;
    this.type = config['type'] || 'Light'

    switch (this.type) {
        case "Light":
            this._service = new Service.Lightbulb(this.name);
            break;
        case "Switch":
            this._service = new Service.Switch(this.name);
            break;
        default:
            log("Found Unknown Accessory Type:", this.type, this.name);
            break;
    }

    this._contact = new Service.ContactSensor(this.name);

    this.cacheDirectory = HomebridgeAPI.user.persistPath();
    this.storage = require('node-persist');
    this.storage.initSync({
        dir: this.cacheDirectory,
        forgiveParseErrors: true
    });

    this._service.getCharacteristic(Characteristic.On)
        .on('set', this._setOn.bind(this));

    if (this.stateful) {
        var cachedState = this.storage.getItemSync(this.name);
        if ((cachedState === undefined) || (cachedState === false)) {
            this._service.setCharacteristic(Characteristic.On, false);
            this.state = false;
        } else {
            this._service.setCharacteristic(Characteristic.On, true);
            this.state = true;
        }
    }
    this._info = new Service.AccessoryInformation();
    this._info.setCharacteristic(Characteristic.Manufacturer, PLATFORM_NAME)
    this._info.setCharacteristic(Characteristic.Model, PLATFORM_NAME + this.type + 'Accessory')
    this._info.setCharacteristic(Characteristic.SerialNumber, UUIDGen.generate(this.name + this.type))
}

PersonalHomebridgeAccessory.prototype.getServices = function () {
    if (this.contact) {
        return [this._service, this._contact, this._info];
    } else {
        return [this._service, this._info];
    }
};

PersonalHomebridgeAccessory.prototype._setOn = function (on, callback, context) {
    if (this.contact) {
        this._contact.setCharacteristic(Characteristic.ContactSensorState, (on ? 1 : 0));
    }

    if (this.state === on) {
        this._service.getCharacteristic(Characteristic.On)
            .emit('change', {
                oldValue: on,
                newValue: on,
                context: context
            });
    } else {
        if (this.debug) {
            this.log("Setting", this.type, this.name, on ? 'On' : 'Off');
        }
    }

    if (this.stateful) {
        this.storage.setItemSync(this.name, on);
    }

    this.state = on;
    callback();
};