/* eslint-disable no-undef */
/* eslint-disable no-console */

const EventEmitter = require('events');
const rp = require('request-promise');
const mqtt = require('mqtt');
//const JSON = require('circular-json');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios').default;
const qs = require('qs');
const tough = require('tough-cookie');
const crypto = require('crypto');
const { HttpsCookieAgent } = require('http-cookie-agent/http');

const ident = (salt) => {
    const tTC = (text) => text.split('').map((c) => c.charCodeAt(0));
    const aSTC = (code) => tTC(salt).reduce((a, b) => a ^ b, code);
    return (encoded) =>
        encoded
            .match(/.{1,2}/g)
            .map((hex) => parseInt(hex, 16))
            .map(aSTC)
            .map((charCode) => String.fromCharCode(charCode))
            .join('');
};

const clouds = {
    worx: {
        url: 'api.worxlandroid.com',
        loginUrl: 'https://id.eu.worx.com/',
        clientId: '013132A8-DB34-4101-B993-3C8348EA0EBC',
        redirectUri: 'com.worxlandroid.landroid://oauth-callback/',
        path: '337d6c75336a2e33',
        key: '725f542f5d2c4b6a5145722a2a6a5b736e764f6e725b462e4568764d4b58755f6a767b2b76526457',
    },
    kress: {
        url: 'api.kress-robotik.com',
        loginUrl: 'https://id.eu.kress.com/',
        clientId: '62FA25FB-3509-4778-A835-D5C50F4E5D88',
        redirectUri: 'com.kress-robotik.mission://oauth-callback/',
        path: '014f5e4701581c01',
        key: '5a1c6f60645658795b78416f747d7a591a494a5c6a1c4d571d194a6b595f5a7f7d7b5656771e1c5f',
    },
    landxcape: {
        url: 'api.landxcape-services.com',
        loginUrl: 'https://id.landxcape-services.com/',
        clientId: '4F1B89F0-230F-410A-8436-D9610103A2A4',
        redirectUri: 'com.landxcape-robotics.landxcape://oauth-callback/',
        path: '7d33223b7d24607d',
        key: '071916003330192318141c080b10131a056115181634352016310817031c0b25391c1a176a0a0102',
    },
};

let trys = 0;
let p12 = '';
let MqttServer = '';
let URL = 'api.worxlandroid.com';
let PATH = ident(URL)('337d6c75336a2e33');
let SEC = '725f542f5d2c4b6a5145722a2a6a5b736e764f6e725b462e4568764d4b58755f6a767b2b76526457';
const UUID = uuidv4();
const USERAGENT = 'ioBroker 1.6.7';
let ACCESS_TOKEN = '';
let REFRESH_TOKEN = '';
let ACCESS_TYPE = '';
let EXPIRES_IN = '';
const cookieJar = new tough.CookieJar();
const requestClient = axios.create({
    withCredentials: true,
    httpsAgent: new HttpsCookieAgent({
        cookies: {
            jar: cookieJar,
        },
    }),
});

// just for testing
//-----------------------------------
const adapter_helper = {
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
        },
    },
    config: {
        server: 'worx',
    },
    msg: {
        info: [],
        error: [],
        debug: [],
        warn: [],
    },
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
    weather(worxInstance) {
        console.log('<run weather' + this.serial);
        const that = this;

        return new Promise(function (fulfill, reject) {
            worxInstance._get2('GET', `product-items/${that.serial}/weather/current`, null, function (err, data) {
                if (err) reject(err);
                that.weatherdata = data;

                fulfill(data);
            });
        });
    }

    async status(worxInstance) {
        const response = await requestClient({
            method: 'get',
            url: `https://${URL}/api/v2/product-items/${this.serial}?status=1&gps_status=1`,
            headers: {
                accept: 'application/json',
                'content-type': 'application/json',
                'user-agent': USERAGENT,
                authorization: 'Bearer ' + ACCESS_TOKEN,
                'accept-language': 'de-de',
            },
        })
            .then((response) => {
                return response.data;
            })
            .catch((error) => {
                worxInstance.adapter.log.error(error);
            });

        return response;
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
        if (typeof adapter === 'undefined') adapter = adapter_helper;

        this.USER = username;
        this.PASS = password;
        this.adapter = adapter;
        this.mower = [];
        this.interval = 5000; //3600000;

        this.server = adapter.config.server;

        if (clouds[this.server]) {
            URL = clouds[this.server].url;
            PATH = ident(clouds[this.server].url)(clouds[this.server].path);
            SEC = clouds[this.server].key;
            this.adapter.log.info(this.server + ' is selected');
        }
    }
    async login() {
        this.adapter.log.info('Connect to ' + this.server);
        const data = await this._getTocken();
        const that = this;
        if (!ACCESS_TOKEN) {
            return;
        }
        if (REFRESH_TOKEN === '' || EXPIRES_IN === '') {
            that.adapter.log.error('REFRESH_TOKEN is empty');
        } else {
            that.adapter.log.debug('REFRESH_TOKEN: ' + REFRESH_TOKEN);
            that.adapter.log.debug('EXPIRES_IN: ' + EXPIRES_IN);
            setInterval(() => {
                that._refreshTocken();
            }, (EXPIRES_IN - 125) * 1000);
        }
        that.getUserData()
            .then((data) => {
                that.adapter.log.debug('0 Recieve MqttServer Endpoint: ' + data.mqtt_endpoint);
                that.UserData = data;
                MqttServer = data.mqtt_endpoint;

                that.getUserCert()
                    .then((data) => {
                        that.UserCert = data;
                        that.adapter.log.debug('1 Recieve User Certificate ');

                        //buffer cert in p12
                        if (typeof Buffer.from === 'function') {
                            // Node 6+
                            try {
                                p12 = Buffer.from(data.pkcs12, 'base64');
                            } catch (e) {
                                console.log('Warning Buffer function  is empty, try new Buffer');
                                p12 = new Buffer(data.pkcs12, 'base64');
                            }
                        } else {
                            p12 = new Buffer(data.pkcs12, 'base64');
                        }

                        that.getUserDevices()
                            .then((data) => {
                                that.adapter.log.debug('2 Recieve User Devices: ' + JSON.stringify(data));
                                that.UserDevices = data;

                                data.forEach(function (element, index) {
                                    const mow = new mower(element);
                                    that.mower.push(mow);
                                    that.emit('found', mow);
                                });

                                // check if Connection is blocked
                                if (that.UserCert.active === true) {
                                    that._connectMqtt();
                                } else {
                                    that.adapter.log.warn(
                                        'maybe your connection is blocked from Worx, please test start button, if not working, try again in 24h'
                                    );
                                    that.adapter.log.warn(
                                        'DON`T CONTACT THE OFFICIAL WORX SUPPORT BECAUSE THIS IS AN INOFFICAL APP !!!!!!!!!!!'
                                    );
                                    that._connectMqtt();
                                }

                                that.interval = setInterval(that._ckeckOnline.bind(that), 60000);
                            })
                            .catch((err) => {
                                that.adapter.log.error(err);
                            });
                    })
                    .catch((err) => {
                        that.adapter.log.error(err);
                    });
            })
            .catch((err) => {
                that.adapter.log.error(err);
            });
    }
    _connectMqtt() {
        const that = this;

        const options = {
            pfx: p12,
            clientId: 'android-' + UUID,
            reconnectPeriod: 30000,
            clear: true,
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
            const data = JSON.parse(message);
            const mower = that.mower.find((mower) => mower.mqtt_command_out === topic);

            if (mower) {
                that.adapter.log.debug(
                    'Worxcloud MQTT get Message for mower ' + mower.raw.name + ' (' + mower.serial + ')'
                );

                that.mower.forEach((element, index) => {
                    if (element.serial === mower.serial) {
                        that.mower[index].message = data;
                    }
                });

                that.emit('mqtt', mower, data);
            } else {
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

    disconnect() {
        const that = this;
        that.mqttC.end();
        clearInterval(that.interval);
    }

    /**
     * @param {string} message JSON stringify example : '{"cmd":3}'
     */
    sendMessage(message, serial) {
        const that = this;

        that.adapter.log.debug('Worxcloud MQTT sendMessage to ' + serial + ' Message: ' + message);

        if (typeof serial === 'undefined') {
            that.adapter.log.error('please give a serial number!');
        }

        const mower = that.mower.find((mower) => mower.serial === serial);

        if (mower && that.mqttC) that.mqttC.publish(mower.mqtt_command_in, message);
        else that.adapter.log.error('Try to send a message but could not find the mower');
    }

    _ckeckOnline() {
        const that = this;
        that._get2('GET', 'product-items', null, function (err, data) {
            if (err) {
                that.adapter.log.debug('Onlinecheck: could not get data ' + err);
                return;
            }

            data.forEach(function (element, index) {
                that.adapter.log.debug(
                    'Mower ' + element.name + ' (' + element.serial_number + ') online status = ' + element.online
                );

                const akt_mower = that.mower.find((mower) => mower.serial === element.serial_number);

                that.mower.forEach((element2, index2) => {
                    if (element.serial_number === element2.serial) {
                        that.mower[index2].online = element.online;
                    }
                });

                if (element.online === true) {
                    that.emit('online', akt_mower, true);
                } else that.emit('offline', akt_mower, false);
            });
        });
    }

    getUserCert() {
        const that = this;
        return new Promise(function (fulfill, reject) {
            that._get2('GET', 'users/certificate', null, function (err, data) {
                if (err) reject(err);
                fulfill(data);
            });
        });
    }
    getUserData() {
        const that = this;
        return new Promise(function (fulfill, reject) {
            that._get2('GET', 'users/me', null, function (err, data) {
                if (err) reject(err);
                fulfill(data);
            });
        });
    }
    getUserDevices() {
        const that = this;
        return new Promise(function (fulfill, reject) {
            that._get2('GET', 'product-items', null, function (err, data) {
                if (err) reject(err);
                fulfill(data);
            });
        });
    }
    getDevices() {
        const that = this;
        return new Promise(function (fulfill, reject) {
            that._get2('GET', 'products', null, function (err, data) {
                if (err) reject(err);
                fulfill(data);
            });
        });
    }

    async _getTocken() {
        const [code_verifier, codeChallenge] = this._getCodeChallenge();
        const loginForm = await requestClient({
            method: 'get',
            url:
                clouds[this.server].loginUrl +
                'oauth/authorize?response_type=code&client_id=' +
                clouds[this.server].clientId +
                '&redirect_uri=' +
                clouds[this.server].redirectUri +
                '&scope=user:manage%20data:products%20mower:pair%20mower:update%20mower:lawn%20mower:view%20user:certificate%20user:profile%20mower:unpair%20mobile:notifications%20mower:warranty%20mower:firmware%20mower:activity_log&state=-u8vt3mPPBuugVgUpr4CD53MkzsyTeKP-x528sQ8&code_challenge=' +
                codeChallenge +
                '&code_challenge_method=S256&suggested_authentication_flow=login',
            headers: {
                accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'user-agent': USERAGENT,
                'accept-language': 'de-de',
            },
        })
            .then( (response) =>{
                this.adapter.log.info("Login form loaded");
                return response.data;
            })
            .catch((error) => {
                this.adapter.log.error(error);
                error.response && this.adapter.log.error(JSON.stringify(error.response.data));
            });
        const form = this._extractHidden(loginForm);
        const codeResponse = await requestClient({
            method: 'post',
            url: clouds[this.server].loginUrl + 'login',
            headers: {
                accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'content-type': 'application/x-www-form-urlencoded',
                'accept-language': 'de-de',
                'user-agent':
                    'Mozilla/5.0 (iPhone; CPU iPhone OS 14_8 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1',
            },
            data: '_token=' + form._token + '&remember=1&email=' + this.USER + '&password=' + this.PASS,
        })
            .then( (response)=> {
                this.adapter.log.error("Login form submission failed");
                return response.data;
            })
            .catch((error) => {
                if (error && error.message.includes('Unsupported protocol')) {
                    this.adapter.log.info("Received Code");
                    return qs.parse(error.request._options.path.split('?')[1]);
                }
                this.adapter.log.error(error);
                error.response && this.adapter.log.error(JSON.stringify(error.response.data));
            });
        if (!codeResponse) {
            this.adapter.log.warn('Could not get code response');
            return;
        }

        const data = await requestClient({
            url: clouds[this.server].loginUrl + 'oauth/token?',
            method: 'post',
            headers: {
                accept: 'application/json',
                'content-type': 'application/json',
                'user-agent': USERAGENT,
                'accept-language': 'de-de',
            },
            data: JSON.stringify({
                client_id: clouds[this.server].clientId,
                code: codeResponse.code,
                redirect_uri: clouds[this.server].redirectUri,
                code_verifier: code_verifier,
                grant_type: 'authorization_code',
            }),
        })
            .then((response) => {
                this.adapter.log.debug(JSON.stringify(response.data));
                const data = response.data;
                ACCESS_TOKEN = data['access_token'];
                ACCESS_TYPE = data['token_type'];
                REFRESH_TOKEN = data['refresh_token'];
                EXPIRES_IN = data['expires_in'];
                this.adapter.setStateAsync('info.connection', {
                    val: true,
                    ack: true,
                });
                this.adapter.log.info(`Connected to ${this.server} server`);
                return data;
            })
            .catch((error) => {
                this.adapter.log.error(error);
                error.response && this.adapter.log.error(JSON.stringify(error.response.data));
                this.emit('error', error);
            });
        return data;
    }

    async _refreshTocken() {
        const data = await requestClient({
            url: clouds[this.server].loginUrl + 'oauth/token?',
            method: 'post',
            headers: {
                accept: 'application/json',
                'content-type': 'application/json',
                'user-agent': USERAGENT,
                'accept-language': 'de-de',
            },
            data: JSON.stringify({
                client_id: clouds[this.server].clientId,
                scope: 'user:profile mower:firmware mower:view mower:pair user:manage mower:update mower:activity_log user:certificate data:products mower:unpair mower:warranty mobile:notifications mower:lawn',
                refresh_token: REFRESH_TOKEN,
                grant_type: 'refresh_token',
            }),
        })
            .then((response) => {
                this.adapter.log.debug(JSON.stringify(response.data));
                const data = response.data;
                ACCESS_TOKEN = data['access_token'];
                ACCESS_TYPE = data['token_type'];
                REFRESH_TOKEN = data['refresh_token'];
                EXPIRES_IN = data['expires_in'];
                return data;
            })
            .catch((error) => {
                this.adapter.log.error(error);
                this.emit('error', error);
            });
        return data;
    }

    _get2(method, path, dat, cb) {
        const that = this;
        if ((ACCESS_TOKEN === '' || ACCESS_TYPE === '') && trys === 0) {
            that._getTocken(function (err, data) {
                if (err && typeof cb === 'function') {
                    cb(err);
                    return;
                }
                that._get2(method, path, cb);
            });
            trys = 1;
            return;
        } else if ((ACCESS_TOKEN === '' || ACCESS_TYPE === '') && trys === 1) {
            console.error('Cant connect!!'); // API call failed...
            return;
        }

        const headers = {
            'Content-Type': 'application/json',
            Authorization: ACCESS_TYPE + ' ' + ACCESS_TOKEN,
        };

        const options = {
            method: method,
            uri: 'https://' + URL + PATH + path,
            headers: headers,
            json: true,
        };

        rp(options)
            .then((data) => {
                //console.log('data %s repos', JSON.stringify(data));
                if (typeof cb === 'function') cb(null, data);
            })
            .catch(function (err) {
                if (typeof cb === 'function') cb(err);
            });
    }
    _extractHidden(body) {
        const returnObject = {};
        if (body) {
            const matches = body.matchAll(/<input (?=[^>]* name=["']([^'"]*)|)(?=[^>]* value=["']([^'"]*)|)/g);
            for (const match of matches) {
                returnObject[match[1]] = match[2];
            }
        }
        return returnObject;
    }
    _getCodeChallenge() {
        let hash = '';
        let result = '';
        const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
        result = '';
        for (let i = 64; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
        result = Buffer.from(result).toString('base64');
        result = result.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
        hash = crypto.createHash('sha256').update(result).digest('base64');
        hash = hash.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

        return [result, hash];
    }
}

module.exports = Worx;
