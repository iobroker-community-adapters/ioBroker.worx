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


class mower extends EventEmitter {
    constructor(data) {
        super();

        if (typeof data === 'undefined' || typeof data !== 'object') {
            throw new Error('options are needed');
        }
        this.serial = data.serial_number;
        this.online = data.online;
        this.raw = data;
        this.mqtt_command_in = data.mqtt_topics.command_in;
        this.mqtt_command_out = data.mqtt_topics.command_out;
        //this.connectMqtt();
        console.log('CLASS mit ' + this.serial);

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
     * @returns {Obj} Example:
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

                fulfill(data);
            });
        });
    }

    connectMqtt() {
        let that = this;

        return new Promise(function (fulfill, reject) {

            const options = {
                pfx: p12,
                clientId: 'android-' + UUID
            };

            that.mqttC = mqtt.connect('mqtts://' + MqttServer, options);

            that.mqttC.on('connect', function () {
                that.mqttC.subscribe(that.mqtt_command_out);
                console.log('Mqtt connected!');
                fulfill('ready');
                

                that.mqttC.publish(that.mqtt_command_in, '{}');
            });

            that.mqttC.on('message', function (topic, message) {
                that.emit('mqtt', that.serial, JSON.parse(message));
            });

            that.mqttC.on('error', function () {
                reject(new Error('MQTT ERROR'));
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
    constructor(username, password) {
        super();
        //let mower = [];
        this.USER = username;
        this.PASS = password;
        this.mower = [];
        this.interval = 5000; //3600000;
        this._getticket((err, data) => {
            let that = this;
            if (err) return;

            that.UserData().then(data => {
                that.UserData = data;               
                MqttServer = data.mqtt_endpoint;

                that.UserCert().then(data => {
                    that.UserCert = data;
                    
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

                    that.UserDevices().then(data => {
                        that.UserDevices = data;

                        data.forEach(function (element, index) {
                            //console.log(JSON.stringify(element), index);
                            const mow = new mower(element);
                            that.mower.push(mow);
                            that.emit('found', mow); 
                        });


                        that.interval = setInterval(that.ckeckOnline.bind(that), 60000);

                    }).catch(err => {
                        console.log(err);
                    });

                }).catch(err => {
                    console.log(err);
                });
            }).catch(err => {
                console.log(err);
            });
        });
    }

    ckeckOnline() {
        //let that = this;
        _get2('GET', 'product-items', null, function (err, data) {
            if (err) return;

            data.forEach(function (element, index) {
                console.log(JSON.stringify(element), index);

            });
        });
    }
    UserCert() {
        return new Promise(function (fulfill, reject) {
            _get2('GET', 'users/certificate', null, function (err, data) {
                if (err) reject(err);
                fulfill(data);
            });
        });
    }
    UserData() {
        return new Promise(function (fulfill, reject) {
            _get2('GET', 'users/me', null, function (err, data) {
                if (err) reject(err);
                fulfill(data);

            });
        });
    }
    UserDevices() {
        return new Promise(function (fulfill, reject) {
            _get2('GET', 'product-items', null, function (err, data) {
                if (err) reject(err);
                fulfill(data);
            });
        });
    }
    Devices() {
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
                //console.log('User has %s repos', JSON.stringify(data));
                //that.emit('connect', data);
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