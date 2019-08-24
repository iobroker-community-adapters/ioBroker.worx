/* eslint-disable no-undef */
/* eslint-disable no-console */
/* eslint-disable ts-ignore */

const EventEmitter = require('events');
const rp = require('request-promise');
const mqtt = require('mqtt');
//const JSON = require('circular-json');
const uuidv1 = require('uuid/v1');

const ident = salt => {
    const tTC = text => text.split('').map(c => c.charCodeAt(0));
    const aSTC = code => tTC(salt).reduce((a, b) => a ^ b, code);
    return encoded => encoded.match(/.{1,2}/g).map(hex => parseInt(hex, 16)).map(aSTC).map(charCode => String.fromCharCode(charCode)).join('');
};

let trys = 0;
let p12 = '';
let MqttServer = '';
const URL = 'api.worxlandroid.com';
const PATH = ident(URL)('337d6c75336a2e33');
const UUID = uuidv1();
let ACCESS_TOKEN = '';
let ACCESS_TYPE = '';

// just for testing 
//-----------------------------------
let adapter_helper = {
    //config: Config.getInstance().get("landroid-s"),
    log: {
        info: function (msg) {
            console.log('INFO: ' + msg);
        },
        error: function (msg) {
            console.log('ERROR: ' + msg);
        },
        debug: function (msg) {
            console.log('DEBUG: ' + msg);
        },
        warn: function (msg) {
            console.log('WARN: ' + msg);
        }
    },
    msg: {
        info: [],
        error: [],
        debug: [],
        warn: []
    }
};
//------------------------------------
class mower extends EventEmitter {
    constructor(data) {
        super();

        if (typeof data === 'undefined' || typeof data !== 'object') {
            throw new Error('options are needed');
        }
        this.serial = data.serial_number;
        this.online = data.online;
        this.raw = data;
        this.edgeCut = false;
        this.mqtt_command_in = data.mqtt_topics.command_in;
        this.mqtt_command_out = data.mqtt_topics.command_out;

    }
    /**
     * returns The SN provided by WORX
     * @returns {string} SN of Mower
     */
    getSN() {
        return this.serial;
    }

    /**
     * returns the actual Weather of the mower
     * @returns {object} Example:
     * {"coord":{"lon":6.56,"lat":56.52},
     * "weather":[{"id":801,"main":"Clouds","description":"few clouds","icon":"02d"}],
     * "base":"stations",
     * "main":{"temp":10.24,"pressure":1005,"humidity":57,"temp_min":8.89,"temp_max":11.67},
     * "visibility":10000,
     * "wind":{"speed":5.7,"deg":90},
     * "clouds":{"all":20},"dt":1555995675,
     * "sys":{"type":1,"id":1871,"message":0.008,"country":"DE","sunrise":1555992974,"sunset":1556044897},
     * "id":2877088,
     * "name":"Maxburg","cod":201}
     */
    weather() {
        console.log('<run weather' + this.serial);
        let that = this;

        return new Promise(function (fulfill, reject) {
            _get2('GET', `product-items/${that.serial}/weather/current`, null, function (err, data) {
                if (err) reject(err);
                that.weatherdata = data;

                fulfill(data);
            });
        });
    }

    status() {
        let that = this;
        return new Promise(function (fulfill, reject) {
            _get2('GET', `product-items/${that.serial}/status`, null, function (err, data) {
                if (err) reject(err);
                that.message= data;
                fulfill(data);
            });
        });
    }
}

/**
 * 
 * Create a new instance of the WORX class
 * and start searching for new WORX
 * once a mower has been found it will create an mower instance
 * and emits the 'found' event.
 *
 * @extends EventEmitter
 */
class Worx extends EventEmitter {
    constructor(username, password, adapter) {
        super();
        if (typeof (adapter) === 'undefined') adapter = adapter_helper;

        this.USER = username;
        this.PASS = password;
        this.adapter = adapter;
        this.mower = [];
        this.interval = 5000; //3600000;

        this.adapter.log.debug('Connect to worx.... ');

        this._getticket((err, data) => {
            let that = this;
            if (err) {
                that.adapter.log.error('Could not Connect to Worx Server: ' + err);
                return;
            }
            that.adapter.log.debug('Connect to worx ok : ' + JSON.stringify(data));
            that.getUserData().then(data => {
                adapter.log.debug('0 Recieve MqttServer Endpoint: ' + data.mqtt_endpoint);
                that.UserData = data;
                MqttServer = data.mqtt_endpoint;

                that.getUserCert().then(data => {
                    that.UserCert = data;
                    adapter.log.debug('1 Recieve User Certificate ');

                    //buffer cert in p12
                    if (typeof Buffer.from === 'function') { // Node 6+
                        try {
                            p12 = Buffer.from(data.pkcs12, 'base64');
                        } catch (e) {
                            console.log('Warning Buffer function  is empty, try new Buffer');
                            p12 = new Buffer(data.pkcs12, 'base64');
                        }

                    } else {
                        p12 = new Buffer(data.pkcs12, 'base64');
                    }

                    that.getUserDevices().then(data => {
                        adapter.log.debug('2 Recieve User Devices: ' + JSON.stringify(data));
                        that.UserDevices = data;

                        data.forEach(function (element, index) {
                            const mow = new mower(element);
                            that.mower.push(mow);
                            that.emit('found', mow);

                        });

                        // check if Connection is blocked
                        if(that.UserCert.active === true){
                            that._connectMqtt();
                        }
                        else that.adapter.log.warn('Connection blocked from Worx, please try again in 24h');

                        that.interval = setInterval(that._ckeckOnline.bind(that), 60000);

                    }).catch(err => {
                        that.adapter.log.error(err);
                    });

                }).catch(err => {
                    that.adapter.log.error(err);
                });
            }).catch(err => {
                that.adapter.log.error(err);
            });
        });
    }

    _connectMqtt() {
        let that = this;

        const options = {
            pfx: p12,
            clientId: 'android-' + UUID,
            reconnectPeriod: 30000,
            clear: true
        };

        that.mqttC = mqtt.connect('mqtts://' + MqttServer, options);

        that.mqttC.on('offline', function () {
            that.adapter.log.debug('Worxcloud MQTT offline');
        });

        that.mqttC.on('disconnect', function (packet) {
            that.adapter.log.debug('Worxcloud MQTT disconnect' + packet);
        });

        that.mqttC.on('connect', function () {
            that.adapter.log.debug('Worxcloud MQTT connected to: ' + MqttServer);

            that.mower.forEach(function (mow, index) {
                that.adapter.log.debug('Worxcloud MQTT subscribe to ' + mow.mqtt_command_out);
                that.mqttC.subscribe(mow.mqtt_command_out);

                that.mqttC.publish(mow.mqtt_command_in, '{}');
            });
        });

        that.mqttC.on('message', function (topic, message) {
            let data = JSON.parse(message);    
            let mower = that.mower.find(mower => mower.mqtt_command_out === topic);

            if(mower){
                that.adapter.log.debug('Worxcloud MQTT get Message for mower ' + mower.raw.name +' ('+ mower.serial +')');

                that.mower.forEach((element, index) => {
                    if(element.serial === mower.serial) {
                        that.mower[index].message = data;
                    }
                });

                that.emit('mqtt', mower, data);
            }
            else{
                that.adapter.log.debug('Worxcloud MQTT could not find mower topic in mowers');
            }

        });

        that.mqttC.on('packetsend', function (packet) {
            //that.adapter.log.debug('Worxcloud MQTT packetsend: ' + JSON.stringify(packet));
        });

        that.mqttC.on('packetreceive', function (packet) {
            //that.adapter.log.debug('Worxcloud MQTT packetreceive: ' + JSON.stringify(packet));
        });

        that.mqttC.on('error', function (error) {
            that.adapter.log.error('MQTT ERROR: ' + error);
        });

    }
    
    /**
     * @param {string} message JSON stringify example : '{"cmd":3}'
     */
    sendMessage(message , serial) { 
        let that = this;

        that.adapter.log.debug('Worxcloud MQTT sendMessage to '+serial+ ' Message: '+ message);

        if(typeof(serial) === 'undefined'){
            that.adapter.log.error('please give a serial number!');
        }

        let mower = that.mower.find(mower => mower.serial === serial);

        if(mower) that.mqttC.publish(mower.mqtt_command_in, message);
        else that.adapter.log.error('Try to send a message but could not find the mower');
        
    }

    _ckeckOnline() {
        let that = this;
        _get2('GET', 'product-items', null, function (err, data) {

            if (err) {
                that.adapter.log.error('Onlinecheck: couldnt get data ' + err);
                return;
            }  

            data.forEach(function (element, index) {
                that.adapter.log.debug('Mower ' + element.name + ' (' + element.serial_number + ') online status = ' + element.online);
                
                let akt_mower = that.mower.find(mower => element.serial_number);

                    that.mower.forEach((element2, index2) => {
                        if(element.serial_number === element2.serial) {
                            that.mower[index2].online = element.online;
                        }
                    });
                    
                    if(element.online === true){
                        that.emit('online',akt_mower, true);
                    }
                    else that.emit('offline', akt_mower, false);

            });
        });
    }

    getUserCert() {
        return new Promise(function (fulfill, reject) {
            _get2('GET', 'users/certificate', null, function (err, data) {
                if (err) reject(err);
                fulfill(data);
            });
        });
    }
    getUserData() {
        return new Promise(function (fulfill, reject) {
            _get2('GET', 'users/me', null, function (err, data) {
                if (err) reject(err);
                fulfill(data);

            });
        });
    }
    getUserDevices() {
        return new Promise(function (fulfill, reject) {
            _get2('GET', 'product-items', null, function (err, data) {
                if (err) reject(err);
                fulfill(data);
            });
        });
    }
    getDevices() {
        return new Promise(function (fulfill, reject) {
            _get2('GET', 'products', null, function (err, data) {
                if (err) reject(err);
                fulfill(data);
            });
        });
    }

    _getticket(cb) {
        var that = this;
        const post = {
            'username': this.USER,
            'password': this.PASS,
            'grant_type': 'password',
            'client_id': 1,
            'type': 'app',
            'client_secret': ident(URL)('725f542f5d2c4b6a5145722a2a6a5b736e764f6e725b462e4568764d4b58755f6a767b2b76526457'),
            'scope': '*'
        };

        const headers = {
            'Content-Type': 'application/json'
            //"Authorization": this.token_type + " " + TOKEN
        };

        const options = {
            method: 'POST',
            uri: 'https://' + URL + PATH + 'oauth/token',
            headers: headers,
            body: post,
            json: true
        };


        rp(options)
            .then(function (data) {
                //Access = data;
                ACCESS_TOKEN = data['access_token'];
                ACCESS_TYPE = data['token_type'];
                if (typeof cb === 'function') cb(null, data);
                //get all data
                that.emit('connect', data);

            })
            .catch(function (err) {
                if (typeof cb === 'function') cb(err); // API call failed... 
                that.emit('error', err);
            });

    }
}


function _get2(method, path, dat, cb) {
    if ((ACCESS_TOKEN === '' || ACCESS_TYPE === '') && trys === 0) {
        _getticket(function (err, data) {
            if (err && typeof cb === 'function') {
                cb(err);
                return;
            }
            _get2(method, path, cb);
        });
        trys = 1;
        return;
    } else if ((ACCESS_TOKEN === '' || ACCESS_TYPE === '') && trys === 1) {
        console.error('Cant connect!!'); // API call failed...
        return;
    }

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': ACCESS_TYPE + ' ' + ACCESS_TOKEN
    };

    const options = {
        method: method,
        uri: 'http://' + URL + PATH + path,
        headers: headers,
        json: true
    };

    rp(options)
        .then(function (data) {
            //console.log('data %s repos', JSON.stringify(data));
            if (typeof cb === 'function') cb(null, data);
        })
        .catch(function (err) {
            if (typeof cb === 'function') cb(err);
        });

}


module.exports = Worx;