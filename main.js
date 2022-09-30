"use strict";

/*
 * Created with @iobroker/create-adapter v2.3.0
 */

const utils = require("@iobroker/adapter-core");
const axios = require("axios").default;
const qs = require("qs");
const Json2iob = require("./lib/json2iob");
const tough = require("tough-cookie");
const { HttpsCookieAgent } = require("http-cookie-agent/http");
const { v4: uuidv4 } = require("uuid");
const crypto = require("crypto");
const mqtt = require("mqtt");
const objects = require(`./lib/objects`);

class Worx extends utils.Adapter {
    /**
     * @param {Partial<utils.AdapterOptions>} [options={}]
     */
    constructor(options) {
        super({
            ...options,
            name: "worx",
        });
        this.on("ready", this.onReady.bind(this));
        this.on("stateChange", this.onStateChange.bind(this));
        this.on("unload", this.onUnload.bind(this));
        this.deviceArray = [];
        this.week = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
        this.userAgent = "ioBroker 1.6.7";
        this.reLoginTimeout = null;
        this.refreshTokenTimeout = null;
        this.session = {};
        this.mqttC = {};
        this.json2iob = new Json2iob(this);
        this.cookieJar = new tough.CookieJar();
        this.requestClient = axios.create({
            withCredentials: true,
            httpsAgent: new HttpsCookieAgent({
                cookies: {
                    jar: this.cookieJar,
                },
            }),
        });
        this.modules = {};
        this.clouds = {
            worx: {
                url: "api.worxlandroid.com",
                loginUrl: "https://id.eu.worx.com/",
                clientId: "013132A8-DB34-4101-B993-3C8348EA0EBC",
                redirectUri: "com.worxlandroid.landroid://oauth-callback/",
            },
            kress: {
                url: "api.kress-robotik.com",
                loginUrl: "https://id.eu.kress.com/",
                clientId: "62FA25FB-3509-4778-A835-D5C50F4E5D88",
                redirectUri: "com.kress-robotik.mission://oauth-callback/",
            },
            landxcape: {
                url: "api.landxcape-services.com",
                loginUrl: "https://id.landxcape-services.com/",
                clientId: "4F1B89F0-230F-410A-8436-D9610103A2A4",
                redirectUri: "com.landxcape-robotics.landxcape://oauth-callback/",
            },
        };
    }

    /**
     * Is called when databases are connected and adapter received configuration.
     */
    async onReady() {
        // Reset the connection indicator during startup
        this.setState("info.connection", false, true);

        if (!this.config.mail || !this.config.password) {
            this.log.error("Please set username and password in the instance settings");
            return;
        }
        // eslint-disable-next-line no-control-regex
        if (/[\x00-\x08\x0E-\x1F\x80-\xFF]/.test(this.config.password)) {
            this.log.error("Password is now encrypted: Please re-enter the password in the instance settings");
            return;
        }

        this.subscribeStates("*");

        this.log.info("Login to " + this.config.server);
        await this.login();
        if (this.session.access_token) {
            await this.getDeviceList();
            await this.updateDevices();
            this.log.info("Start MQTT connection");
            for (const mower of this.deviceArray) {
                await this.start_mqtt(mower);
            }

            this.updateInterval = setInterval(async () => {
                await this.updateDevices();
            }, 60 * 1000); // 60 seconds
        }
        this.refreshTokenInterval = setInterval(() => {
            this.refreshToken();
        }, (this.session.expires_in - 100) * 1000);
    }
    async login() {
        const [code_verifier, codeChallenge] = this.getCodeChallenge();
        const loginForm = await this.requestClient({
            method: "get",
            url:
                this.clouds[this.config.server].loginUrl +
                "oauth/authorize?response_type=code&client_id=" +
                this.clouds[this.config.server].clientId +
                "&redirect_uri=" +
                this.clouds[this.config.server].redirectUri +
                "&scope=user:manage%20data:products%20mower:pair%20mower:update%20mower:lawn%20mower:view%20user:certificate%20user:profile%20mower:unpair%20mobile:notifications%20mower:warranty%20mower:firmware%20mower:activity_log&state=-u8vt3mPPBuugVgUpr4CD53MkzsyTeKP-x528sQ8&code_challenge=" +
                codeChallenge +
                "&code_challenge_method=S256&suggested_authentication_flow=login",
            headers: {
                accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "user-agent": this.userAgent,
                "accept-language": "de-de",
            },
        })
            .then((response) => {
                this.log.info("Login form loaded");
                return response.data;
            })
            .catch((error) => {
                this.log.error(error);
                error.response && this.log.error(JSON.stringify(error.response.data));
            });
        const form = this.extractHidden(loginForm);
        form.email = this.config.mail;
        form.password = this.config.password;
        const codeResponse = await this.requestClient({
            method: "post",
            url: this.clouds[this.config.server].loginUrl + "login",
            headers: {
                accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "content-type": "application/x-www-form-urlencoded",
                "accept-language": "de-de",
                "user-agent": this.userAgent,
            },
            data: qs.stringify(form),
        })
            .then((response) => {
                this.log.error("Login form submission failed");
                const errorText = response.data.match('help is-danger">(.*)<');
                errorText && this.log.error(errorText[1]);
                return;
            })
            .catch((error) => {
                if (error && error.message.includes("Unsupported protocol")) {
                    this.log.info("Received Code");
                    return qs.parse(error.request._options.path.split("?")[1]);
                }
                this.log.error(error);
                error.response && this.log.error(JSON.stringify(error.response.data));
            });
        if (!codeResponse) {
            this.log.warn("Could not get code response");
            return;
        }

        const data = await this.requestClient({
            url: this.clouds[this.config.server].loginUrl + "oauth/token?",
            method: "post",
            headers: {
                accept: "application/json",
                "content-type": "application/json",
                "user-agent": this.userAgent,
                "accept-language": "de-de",
            },
            data: JSON.stringify({
                client_id: this.clouds[this.config.server].clientId,
                code: codeResponse.code,
                redirect_uri: this.clouds[this.config.server].redirectUri,
                code_verifier: code_verifier,
                grant_type: "authorization_code",
            }),
        })
            .then((response) => {
                this.log.debug(JSON.stringify(response.data));
                this.session = response.data;
                this.setState("info.connection", true, true);
                this.log.info(`Connected to ${this.config.server} server`);
            })
            .catch((error) => {
                this.log.error(error);
                error.response && this.log.error(JSON.stringify(error.response.data));
            });
        return data;
    }

    async getDeviceList() {
        await this.requestClient({
            method: "get",
            url: `https://${this.clouds[this.config.server].url}/api/v2/product-items?status=1&gps_status=1`,
            headers: {
                accept: "application/json",
                "content-type": "application/json",
                "user-agent": this.userAgent,
                authorization: "Bearer " + this.session.access_token,
                "accept-language": "de-de",
            },
        })
            .then(async (res) => {
                this.log.debug(JSON.stringify(res.data));
                this.log.info(`Found ${res.data.length} devices`);
                for (const device of res.data) {
                    const id = device.serial_number;
                    const name = device.name;
                    this.log.info(`Found device ${name} with id ${id}`);

                    await this.cleanOldVersion(id);
                    this.deviceArray.push(device);
                    await this.createDevices(device);
                    await this.createAdditionalDeviceStates(device);
                    // this.json2iob.parse(id, device, { forceIndex: true });
                }
            })
            .catch((error) => {
                this.log.error(error);
                error.response && this.log.error(JSON.stringify(error.response.data));
            });
    }
    async createDevices(mower) {
        await this.setObjectNotExistsAsync(mower.serial_number, {
            type: "device",
            common: {
                name: mower.name,
            },
            native: {},
        });
        await this.setObjectNotExistsAsync(`${mower.serial_number}.areas`, {
            type: "channel",
            common: {
                name: "mower areas",
            },
            native: {},
        });
        await this.setObjectNotExistsAsync(`${mower.serial_number}.calendar`, {
            type: "channel",
            common: {
                name: "mower calendar",
            },
            native: {},
        });
        await this.setObjectNotExistsAsync(`${mower.serial_number}.mower`, {
            type: "channel",
            common: {
                name: "mower control",
            },
            native: {},
        });
        await this.setObjectNotExistsAsync(`${mower.serial_number}.weather`, {
            type: "channel",
            common: {
                name: "mower control",
            },
            native: {},
        });

        for (let a = 0; a <= 3; a++) {
            await this.setObjectNotExistsAsync(`${mower.serial_number}.areas.area_${a}`, {
                type: "state",
                common: {
                    name: `Area${a}`,
                    type: "number",
                    role: "value",
                    unit: "m",
                    read: true,
                    write: true,
                    desc: `Distance from Start point for area ${a}`,
                },
                native: {},
            });
        }

        await this.setObjectNotExistsAsync(`${mower.serial_number}.areas.actualArea`, {
            type: "state",
            common: {
                name: "Actual area",
                type: "number",
                role: "value",
                read: true,
                write: false,
                desc: "Show the current area",
            },
            native: {},
        });
        await this.setObjectNotExistsAsync(`${mower.serial_number}.areas.actualAreaIndicator`, {
            type: "state",
            common: {
                name: "Actual area",
                type: "number",
                role: "value",
                read: true,
                write: false,
                desc: "Show the current area",
            },
            native: {},
        });
        await this.setObjectNotExistsAsync(`${mower.serial_number}.areas.startSequence`, {
            type: "state",
            common: {
                name: "Start sequence",
                type: "object",
                role: "value",
                read: true,
                write: true,
                desc: "Sequence of area to start from",
            },
            native: {},
        });

        //calendar
        for (const day of this.week) {
            for (const o of objects.calendar) {
                // @ts-ignore
                await this.setObjectNotExistsAsync(`${mower.serial_number}.calendar.${day}.${o._id}`, o);
            }
        }
        // mower
        await this.setObjectNotExistsAsync(`${mower.serial_number}.mower.online`, {
            type: "state",
            common: {
                name: "Online",
                type: "boolean",
                role: "indicator.connected",
                read: true,
                write: false,
                desc: "If mower connected to cloud",
            },
            native: {},
        });
        await this.setObjectNotExistsAsync(`${mower.serial_number}.mower.firmware`, {
            type: "state",
            common: {
                name: "Firmware Version",
                type: "string",
                role: "meta.version",
                read: true,
                write: false,
                desc: "Firmware Version",
            },
            native: {},
        });
        await this.setObjectNotExistsAsync(`${mower.serial_number}.mower.wifiQuality`, {
            type: "state",
            common: {
                name: "Wifi quality",
                type: "number",
                role: "value",
                read: true,
                write: false,
                unit: "dBm",
                desc: "Prozent of Wifi quality",
            },
            native: {},
        });
        await this.setObjectNotExistsAsync(`${mower.serial_number}.mower.batteryChargeCycle`, {
            type: "state",
            common: {
                name: "Battery charge cycle",
                type: "number",
                role: "indicator",
                read: true,
                write: false,
                desc: "Show the number of charging cycles",
            },
            native: {},
        });
        await this.setObjectNotExistsAsync(`${mower.serial_number}.mower.batteryCharging`, {
            type: "state",
            common: {
                name: "Battery charger state",
                type: "boolean",
                role: "indicator",
                read: true,
                write: false,
                desc: "Battery charger state",
            },
            native: {},
        });
        await this.setObjectNotExistsAsync(`${mower.serial_number}.mower.batteryState`, {
            type: "state",
            common: {
                name: "Landroid battery state",
                type: "number",
                role: "value.battery",
                read: true,
                write: false,
                unit: "%",
                desc: "Landroid mower battery state in %",
            },
            native: {},
        });
        await this.setObjectNotExistsAsync(`${mower.serial_number}.mower.batteryTemperature`, {
            type: "state",
            common: {
                name: "Battery temperature",
                type: "number",
                role: "value.temperature",
                read: true,
                write: false,
                unit: "°C",
                desc: "Temperature of movers battery",
            },
            native: {},
        });
        await this.setObjectNotExistsAsync(`${mower.serial_number}.mower.batteryVoltage`, {
            type: "state",
            common: {
                name: "Battery voltage",
                type: "number",
                role: "value.voltage",
                read: true,
                write: false,
                unit: "V",
                desc: "Voltage of movers battery",
            },
            native: {},
        });
        await this.setObjectNotExistsAsync(`${mower.serial_number}.mower.error`, {
            type: "state",
            common: {
                name: "Error code",
                type: "number",
                role: "value.error",
                read: true,
                write: false,
                desc: "Error code",
                states: {
                    0: "No error",
                    1: "Trapped",
                    2: "Lifted",
                    3: "Wire missing",
                    4: "Outside wire",
                    5: "Raining",
                    6: "Close door to mow",
                    7: "Close door to go home",
                    8: "Blade motor blocked",
                    9: "Wheel motor blocked",
                    10: "Trapped timeout",
                    11: "Upside down",
                    12: "Battery low",
                    13: "Reverse wire",
                    14: "Charge error",
                    15: "Timeout finding home",
                    16: "Mower locked",
                    17: "Battery over temperature",
                    18: "dummy model",
                    19: "Battery trunk open timeout",
                    20: "wire sync",
                    21: "msg num",
                },
            },
            native: {},
        });
        await this.setObjectNotExistsAsync(`${mower.serial_number}.mower.pause`, {
            type: "state",
            common: {
                name: "Pause",
                type: "boolean",
                role: "button.stop",
                read: true,
                write: true,
                desc: "Pause the mover",
            },
            native: {},
        });
        await this.setObjectNotExistsAsync(`${mower.serial_number}.mower.edgecut`, {
            type: "state",
            common: {
                name: "Edge cut",
                type: "boolean",
                role: "button.edgecut",
                read: true,
                write: true,
                desc: "start edge cutting",
            },
            native: {},
        });
        await this.setObjectNotExistsAsync(`${mower.serial_number}.mower.state`, {
            type: "state",
            common: {
                name: "Start/Stop",
                type: "boolean",
                role: "switch",
                read: true,
                write: true,
                desc: "Start and stop the mover",
            },
            native: {},
        });
        await this.setObjectNotExistsAsync(`${mower.serial_number}.mower.status`, {
            type: "state",
            common: {
                name: "Landroid status",
                type: "number",
                role: "indicator.status",
                read: true,
                write: false,
                desc: "Current status of lawn mower",
                states: {
                    0: "IDLE",
                    1: "Home",
                    2: "Start sequence",
                    3: "Leaving home",
                    4: "Follow wire",
                    5: "Searching home",
                    6: "Searching wire",
                    7: "Mowing",
                    8: "Lifted",
                    9: "Trapped",
                    10: "Blade blocked",
                    11: "Debug",
                    12: "Remote control",
                    13: "escape from off limits",
                    30: "Going home",
                    31: "Zone training",
                    32: "Border Cut",
                    33: "Searching zone",
                    34: "Pause",
                },
            },
            native: {},
        });
        await this.setObjectNotExistsAsync(`${mower.serial_number}.mower.totalBladeTime`, {
            type: "state",
            common: {
                name: "Runtime of the blades",
                type: "number",
                role: "value.interval",
                read: true,
                write: false,
                unit: "h",
                desc: "Total blade is running",
            },
            native: {},
        });
        await this.setObjectNotExistsAsync(`${mower.serial_number}.mower.totalDistance`, {
            type: "state",
            common: {
                name: "Total mower distance",
                type: "number",
                role: "value.interval",
                read: true,
                write: false,
                unit: "km",
                desc: "Total distance the mower has been mowing in km",
            },
            native: {},
        });
        await this.setObjectNotExistsAsync(`${mower.serial_number}.mower.totalTime`, {
            type: "state",
            common: {
                name: "Total mower time",
                type: "number",
                role: "value.interval",
                read: true,
                write: false,
                unit: "h",
                desc: "Total distance the mower has been mowing in hours",
            },
            native: {},
        });
        await this.setObjectNotExistsAsync(`${mower.serial_number}.mower.waitRain`, {
            type: "state",
            common: {
                name: "Wait after rain",
                type: "number",
                role: "value.interval",
                read: true,
                write: true,
                unit: "min",
                desc: "Time to wait after rain, in minutes",
            },
            native: {},
        });
        await this.setObjectNotExistsAsync(`${mower.serial_number}.mower.mowTimeExtend`, {
            type: "state",
            common: {
                name: "Mowing times exceed",
                type: "number",
                role: "value",
                read: true,
                write: true,
                unit: "%",
                desc: "Extend the mowing time",
            },
            native: {},
        });
        await this.setObjectNotExistsAsync(`${mower.serial_number}.mower.mowerActive`, {
            type: "state",
            common: {
                name: "Time-controlled mowing",
                type: "boolean",
                role: "switch",
                read: true,
                write: true,
                desc: "Time-controlled mowing",
            },
            native: {},
        });
        await this.setObjectNotExistsAsync(`${mower.serial_number}.mower.sendCommand`, {
            type: "state",
            common: {
                name: "send Command",
                type: "number",
                role: "value",
                read: true,
                write: true,
                desc: "send Command to Landroid",
                states: {
                    1: "Start",
                    2: "Stop",
                    3: "Home",
                    4: "Start Zone Taining",
                    5: "Lock",
                    6: "Unlock",
                    7: "Restart Robot",
                    8: "pause when follow wire",
                    9: "safe homing",
                },
            },
            native: {},
        });
        await this.setObjectNotExistsAsync(`${mower.serial_number}.mower.gradient`, {
            type: "state",
            common: {
                name: "Gradient",
                type: "number",
                role: "value.interval",
                read: true,
                write: false,
                unit: "°",
                desc: "Gradient from the mower",
            },
            native: {},
        });
        await this.setObjectNotExistsAsync(`${mower.serial_number}.mower.inclination`, {
            type: "state",
            common: {
                name: "Inclination",
                type: "number",
                role: "value.interval",
                read: true,
                write: false,
                unit: "°",
                desc: "Inclination from the mower",
            },
            native: {},
        });
        await this.setObjectNotExistsAsync(`${mower.serial_number}.mower.direction`, {
            type: "state",
            common: {
                name: "Direction",
                type: "number",
                role: "value.interval",
                read: true,
                write: false,
                unit: "°",
                desc: "Direction from the mower",
            },
            native: {},
        });

        await this.extendObjectAsync(`${mower.serial_number}.mower.totalTime`, {
            common: {
                unit: this.config.meterMin ? "min." : "h",
            },
        });
        await this.extendObjectAsync(`${mower.serial_number}.mower.totalDistance`, {
            common: {
                unit: this.config.meterMin ? "m" : "Km",
            },
        });
        await this.extendObjectAsync(`${mower.serial_number}.mower.totalBladeTime`, {
            common: {
                unit: this.config.meterMin ? "min." : "h",
            },
        });
    }
    async updateDevices() {
        const statusArray = [
            {
                path: "rawMqtt",
                url: `https://${this.clouds[this.config.server].url}/api/v2/product-items/$id/?status=1&gps_status=1`,
                desc: "raw Mqtt response",
            },
        ];
        for (let device of this.deviceArray) {
            for (const element of statusArray) {
                const url = element.url.replace("$id", device.serial_number);
                await this.requestClient({
                    method: "get",
                    url: url,
                    headers: {
                        accept: "application/json",
                        "content-type": "application/json",
                        "user-agent": this.userAgent,
                        authorization: "Bearer " + this.session.access_token,
                        "accept-language": "de-de",
                    },
                })
                    .then(async (res) => {
                        this.log.debug(JSON.stringify(res.data));
                        if (!res.data) {
                            return;
                        }
                        const data = res.data;
                        const forceIndex = true;
                        const preferedArrayName = null;
                        device = data;
                        await this.setStates(data);
                        this.json2iob.parse(`${device.serial_number}.${element.path}`, data, {
                            forceIndex: forceIndex,
                            preferedArrayName: preferedArrayName,
                            channelName: element.desc,
                        });

                        // await this.setObjectNotExistsAsync(element.path + ".json", {
                        //     type: "state",
                        //     common: {
                        //         name: "Raw JSON",
                        //         write: false,
                        //         read: true,
                        //         type: "string",
                        //         role: "json",
                        //     },
                        //     native: {},
                        // });
                        // this.setState(element.path + ".json", JSON.stringify(data), true);
                    })
                    .catch((error) => {
                        if (error.response) {
                            if (error.response.status === 401) {
                                error.response && this.log.debug(JSON.stringify(error.response.data));
                                this.log.info(element.path + " receive 401 error. Refresh Token in 60 seconds");
                                this.refreshTokenTimeout && clearTimeout(this.refreshTokenTimeout);
                                this.refreshTokenTimeout = setTimeout(() => {
                                    this.refreshToken();
                                }, 1000 * 60);
                                return;
                            }
                        }
                        this.log.error(element.url);
                        this.log.error(error);
                        error.response && this.log.error(JSON.stringify(error.response.data));
                    });
            }
        }
    }

    async refreshToken() {
        this.log.debug("Refresh token");
        await this.requestClient({
            url: this.clouds[this.config.server].loginUrl + "oauth/token?",
            method: "post",
            headers: {
                accept: "application/json",
                "content-type": "application/json",
                "user-agent": this.userAgent,
                "accept-language": "de-de",
            },
            data: JSON.stringify({
                client_id: this.clouds[this.config.server].clientId,
                scope: "user:profile mower:firmware mower:view mower:pair user:manage mower:update mower:activity_log user:certificate data:products mower:unpair mower:warranty mobile:notifications mower:lawn",
                refresh_token: this.session.refresh_token,
                grant_type: "refresh_token",
            }),
        })
            .then((response) => {
                this.log.debug(JSON.stringify(response.data));
                this.session = response.data;
            })
            .catch((error) => {
                this.log.error(error);
                error.response && this.log.error(JSON.stringify(error.response.data));
            });
    }

    async createAdditionalDeviceStates(mower) {
        if (!mower || !mower.last_status || !mower.last_status.payload) {
            this.log.debug("No payload found");
            return;
        }
        const status = mower.last_status.payload;
        if (status && status.cfg && status.cfg.sc && status.cfg.sc.dd) {
            this.log.info("found DoubleShedule, create states...");

            // create States
            for (const day of this.week) {
                for (const o of objects.calendar) {
                    // @ts-ignore
                    await this.setObjectNotExistsAsync(`${mower.serial_number}.calendar.${day}2.${o._id}`, o);
                }
            }
        }
        if (status && status.cfg && typeof status.cfg.sc !== "undefined" && typeof status.cfg.sc.ots !== "undefined") {
            this.log.info("found OneTimeShedule, create states...");

            // create States
            for (const o of objects.oneTimeShedule) {
                // @ts-ignore
                this.setObjectNotExistsAsync(`${mower.serial_number}.mower.${o._id}`, o);
            }
        }

        if (
            status &&
            status.cfg &&
            status.cfg.sc &&
            typeof status.cfg.sc.distm !== "undefined" &&
            typeof status.cfg.sc.m !== "undefined"
        ) {
            this.log.info("found PartyModus, create states...");

            // create States
            for (const o of objects.partyModus) {
                // @ts-ignore
                this.setObjectNotExistsAsync(`${mower.serial_number}.mower.${o._id}`, o);
            }
        }

        // @ts-ignore
        this.setObjectNotExistsAsync(`${mower.serial_number}.calendar.${objects.calJson[0]._id}`, objects.calJson[0]);
        if (status && status.cfg && status.cfg.sc && status.cfg.sc.dd)
            this.setObjectNotExistsAsync(
                `${mower.serial_number}.calendar.${objects.calJson[0]._id}2`,
                // @ts-ignore
                objects.calJson[0],
            );

        this.log.debug(JSON.stringify(mower));
    }

    async getRequest(path) {
        return await this.requestClient({
            method: "get",
            url: `https://${this.clouds[this.config.server].url}/api/v2/${path}`,
            headers: {
                accept: "application/json",
                "content-type": "application/json",
                "user-agent": this.userAgent,
                authorization: "Bearer " + this.session.access_token,
                "accept-language": "de-de",
            },
        })
            .then(async (res) => {
                this.log.debug(JSON.stringify(res.data));
                return res.data;
            })
            .catch((error) => {
                this.log.error(error);
                if (error.response) {
                    if (error.response.status === 401) {
                        error.response && this.log.debug(JSON.stringify(error.response.data));
                        this.log.info(path + " receive 401 error. Refresh Token in 30 seconds");
                        this.refreshTokenTimeout && clearTimeout(this.refreshTokenTimeout);
                        this.refreshTokenTimeout = setTimeout(() => {
                            this.refreshToken();
                        }, 1000 * 30);
                        return;
                    }
                    this.log.error(JSON.stringify(error.response.data));
                }
            });
    }
    /**
     * @param {object} mower Mower json response object
     */
    async setStates(mower) {
        if (mower) {
            await this.setStateAsync(`${mower.serial_number}.mower.online`, mower.online, true);
        }
        if (!mower || !mower.last_status || !mower.last_status.payload) {
            this.log.info("No payload found");
            return;
        }

        const data = mower.last_status.payload;
        //mower set states
        const sequence = [];
        //data = testmsg
        this.log.debug(`GET MQTT DATA from API: ${JSON.stringify(data)}`);

        //catch error if onj is empty
        if (Object.keys(data).length === 0 && data.constructor === Object) {
            this.log.debug("GET Empty MQTT DATA from API");
            return;
        }

        // catch if JSON contain other data e.g. {"ota":"ota fail","mac":"XXXXXXXXXXXX"}"
        if (typeof data.dat === "undefined" || typeof data.cfg === "undefined") {
            this.log.info(`No data Message: ${JSON.stringify(data)}`);
            return;
        }
        try {
            if (this.config.meterMin) {
                this.setStateAsync(`${mower.serial_number}.mower.totalTime`, {
                    val: data.dat.st && data.dat.st.wt ? parseFloat(data.dat.st.wt.toFixed(2)) : null,
                    ack: true,
                });
                this.setStateAsync(`${mower.serial_number}.mower.totalDistance`, {
                    val: data.dat.st && data.dat.st.d ? parseFloat(data.dat.st.d.toFixed(2)) : null,
                    ack: true,
                });
                this.setStateAsync(`${mower.serial_number}.mower.totalBladeTime`, {
                    val: data.dat.st && data.dat.st.b ? parseFloat(data.dat.st.b.toFixed(2)) : null,
                    ack: true,
                });
            } else {
                this.setStateAsync(`${mower.serial_number}.mower.totalTime`, {
                    val: data.dat.st && data.dat.st.wt ? parseFloat((data.dat.st.wt / 6 / 10).toFixed(2)) : null,
                    ack: true,
                });
                this.setStateAsync(`${mower.serial_number}.mower.totalDistance`, {
                    val: data.dat.st && data.dat.st.d ? parseFloat((data.dat.st.d / 100 / 10).toFixed(2)) : null,
                    ack: true,
                });
                this.setStateAsync(`${mower.serial_number}.mower.totalBladeTime`, {
                    val: data.dat.st && data.dat.st.b ? parseFloat((data.dat.st.b / 6 / 10).toFixed(2)) : null,
                    ack: true,
                });
            }
            this.setStateAsync(`${mower.serial_number}.mower.gradient`, {
                val: data.dat.dmp && data.dat.dmp[0] ? data.dat.dmp[0] : 0,
                ack: true,
            });
            this.setStateAsync(`${mower.serial_number}.mower.inclination`, {
                val: data.dat.dmp && data.dat.dmp[1] ? data.dat.dmp[1] : 0,
                ack: true,
            });
            this.setStateAsync(`${mower.serial_number}.mower.direction`, {
                val: data.dat.dmp && data.dat.dmp[2] ? data.dat.dmp[2] : 0,
                ack: true,
            });

            this.setStateAsync(`${mower.serial_number}.mower.batteryChargeCycle`, {
                val: data.dat.bt && data.dat.bt.nr ? data.dat.bt.nr : null,
                ack: true,
            });
            this.setStateAsync(`${mower.serial_number}.mower.batteryCharging`, {
                val: data.dat.bt && data.dat.bt.c ? true : false,
                ack: true,
            });
            this.setStateAsync(`${mower.serial_number}.mower.batteryVoltage`, {
                val: data.dat.bt && data.dat.bt.v ? data.dat.bt.v : null,
                ack: true,
            });
            this.setStateAsync(`${mower.serial_number}.mower.batteryTemperature`, {
                val: data.dat.bt && data.dat.bt.t ? data.dat.bt.t : null,
                ack: true,
            });
            this.setStateAsync(`${mower.serial_number}.mower.error`, {
                val: data.dat && data.dat.le ? data.dat.le : 0,
                ack: true,
            });
            this.log.debug(`Test Status: ${data.dat && data.dat.ls ? data.dat.ls : 0}`);
            this.setStateAsync(`${mower.serial_number}.mower.status`, {
                val: data.dat && data.dat.ls ? data.dat.ls : 0,
                ack: true,
            });

            this.setStateAsync(`${mower.serial_number}.mower.wifiQuality`, {
                val: data.dat && data.dat.rsi ? data.dat.rsi : 0,
                ack: true,
            });
            this.setStateAsync(`${mower.serial_number}.mower.mowerActive`, {
                val: data.cfg.sc && data.cfg.sc.m ? true : false,
                ack: true,
            });
            this.setStateAsync(`${mower.serial_number}.mower.mowTimeExtend`, {
                val: data.cfg.sc && data.cfg.sc.p ? data.cfg.sc.p : 0,
                ack: true,
            });

            // sort Areas
            this.setStateAsync(`${mower.serial_number}.areas.area_0`, {
                val: data.cfg.mz && data.cfg.mz[0] ? data.cfg.mz[0] : 0,
                ack: true,
            });
            this.setStateAsync(`${mower.serial_number}.areas.area_1`, {
                val: data.cfg.mz && data.cfg.mz[1] ? data.cfg.mz[1] : 0,
                ack: true,
            });
            this.setStateAsync(`${mower.serial_number}.areas.area_2`, {
                val: data.cfg.mz && data.cfg.mz[2] ? data.cfg.mz[2] : 0,
                ack: true,
            });
            this.setStateAsync(`${mower.serial_number}.areas.area_3`, {
                val: data.cfg.mz && data.cfg.mz[3] ? data.cfg.mz[3] : 0,
                ack: true,
            });
            this.setStateAsync(`${mower.serial_number}.areas.actualArea`, {
                val: data.dat && data.cfg && data.cfg.mzv ? data.cfg.mzv[data.dat.lz] : null,
                ack: true,
            });
            this.setStateAsync(`${mower.serial_number}.areas.actualAreaIndicator`, {
                val: data.dat && data.dat.lz ? data.dat.lz : null,
                ack: true,
            });

            this.setStateAsync(`${mower.serial_number}.mower.firmware`, {
                val: data.dat && data.dat.fw ? data.dat.fw.toString() : "-",
                ack: true,
            });
            this.setStateAsync(`${mower.serial_number}.mower.waitRain`, {
                val: data.cfg.rd,
                ack: true,
            });
            data.dat.bt &&
                this.setStateAsync(`${mower.serial_number}.mower.batteryState`, {
                    val: data.dat.bt.p,
                    ack: true,
                });

            if (data.cfg.mzv) {
                for (let i = 0; i < data.cfg.mzv.length; i++) {
                    //  adapter.setState("areas.startSequence", { val: data.cfg.mzv[i], ack: true });
                    sequence.push(data.cfg.mzv[i]);
                }
                this.setStateAsync(`${mower.serial_number}.areas.startSequence`, {
                    val: JSON.stringify(sequence),
                    ack: true,
                });
            }

            const state = data.dat && data.dat.ls ? data.dat.ls : 0;
            const error = data.dat && data.dat.le ? data.dat.le : 0;

            if ((state === 7 || state === 9) && error === 0) {
                this.setStateAsync(`${mower.serial_number}.mower.state`, {
                    val: true,
                    ack: true,
                });
            } else {
                this.setStateAsync(`${mower.serial_number}.mower.state`, {
                    val: false,
                    ack: true,
                });
            }
            if (data.cfg.sc && data.cfg.sc.d) {
                this.evaluateCalendar(mower, data.cfg.sc.d, false);
            }
            // Second Mowtime
            if (data.cfg.sc && data.cfg.sc.dd) {
                this.evaluateCalendar(mower, data.cfg.sc.dd, true);
            }

            // 1TimeShedule
            if (data.cfg.sc && data.cfg.sc.ots) {
                this.setStateAsync(`${mower.serial_number}.mower.oneTimeWithBorder`, {
                    val: data.cfg.sc.ots.bc ? true : false,
                    ack: true,
                });
                this.setStateAsync(`${mower.serial_number}.mower.oneTimeWorkTime`, {
                    val: data.cfg.sc.ots.wtm,
                    ack: true,
                });
                this.setStateAsync(`${mower.serial_number}.mower.oneTimeJson`, {
                    val: JSON.stringify(data.cfg.sc.ots),
                    ack: true,
                });
            }

            // PartyModus
            if (data.cfg.sc && typeof data.cfg.sc.distm !== "undefined" && typeof data.cfg.sc.m !== "undefined") {
                this.setStateAsync(`${mower.serial_number}.mower.partyModus`, {
                    val: data.cfg.sc.m === 2 ? true : false,
                    ack: true,
                });
            }

            //JSON week
            await this.setStateAsync(`${mower.serial_number}.calendar.calJson`, {
                val: JSON.stringify(data.cfg.sc.d),
                ack: true,
            });
            if (data.cfg.sc && data.cfg.sc.dd) {
                await this.setStateAsync(`${mower.serial_number}.calendar.calJson2`, {
                    val: JSON.stringify(data.cfg.sc.dd),
                    ack: true,
                });
            }

            // edgecutting
            if (mower.edgeCut && (state === 1 || state === 3)) {
                this.log.debug(`Edgecut Start section :${state}`);
            } else if (state === 31 && mower.edgeCut) {
                setTimeout(() => {
                    this.log.debug("Edgecut send cmd:2");
                    this.sendMessage('{"cmd":2}', mower.serial_number);
                }, this.config.edgeCutDelay);
            } else if (state === 34 && mower.edgeCut) {
                this.log.debug("Edgecut send cmd:3");
                this.sendMessage('{"cmd":3}', mower.serial_number);
                mower.edgeCut = false;
            } else if (mower.edgeCut === true && state !== 31 && state !== 34) {
                mower.edgeCut = false;
                this.log.warn("Something went wrong at edgeCut");
            }

            //
            //torque control found
            if (data && data.cfg && typeof data.cfg.tq !== "undefined") {
                if (typeof this.modules["tq"] === "undefined") {
                    this.log.info("found torque control, create states...");
                    for (const o of objects.module_tq) {
                        // @ts-ignore
                        await this.setObjectNotExistsAsync(`${mower.serial_number}.mower.${o._id}`, o);
                    }
                }
                this.modules["tq"] = data.cfg.tq;
                this.setStateAsync(`${mower.serial_number}.mower.torque`, {
                    val: parseInt(data.cfg.tq),
                    ack: true,
                });
            }

            //modules
            if (data.cfg.modules && !this.modules.channel) {
                await this.setObjectNotExistsAsync(`${mower.serial_number}.modules`, {
                    type: "channel",
                    common: {
                        name: "mower this.modules",
                    },
                    native: {},
                });
                this.modules.channel = true;
            }

            //4G Module
            if (data.cfg.modules && data.cfg.modules["4G"] && data.cfg.modules["4G"]["geo"]) {
                if (!this.modules["4G"]) {
                    for (const o of objects.module_4g) {
                        // @ts-ignore
                        await this.setObjectNotExistsAsync(`${mower.serial_number}.modules.4G.${o._id}`, o);
                        this.log.info(`GSP Module found! Create State : ${o._id}`);
                    }
                }
                this.modules["4G"] = data.cfg.modules["4G"];
                await this.setStateAsync(`${mower.serial_number}.modules.4G.longitude`, {
                    val: data.cfg.modules["4G"]["geo"]["coo"][1],
                    ack: true,
                });
                await this.setStateAsync(`${mower.serial_number}.modules.4G.latitude`, {
                    val: data.cfg.modules["4G"]["geo"]["coo"][0],
                    ack: true,
                });
            }
            //US Module
            if (data.cfg.modules && data.cfg.modules["US"]) {
                if (!this.modules["US"]) {
                    for (const o of objects.US) {
                        // @ts-ignore
                        await this.setObjectNotExistsAsync(mower.serial_number + ".modules.US." + o._id, o);
                        this.log.info("ACS Module found! Create State : " + o._id);
                    }
                }
                this.modules["US"] = data.cfg.modules["US"];
                await this.setStateAsync(mower.serial_number + ".modules.US.ACS", {
                    val: data.cfg.modules["US"]["enabled"],
                    ack: true,
                });
                await this.setStateAsync(mower.serial_number + ".modules.US.ACS_Status", {
                    val: data.dat.modules["US"]["stat"],
                    ack: true,
                });
            }
            // Df Module
            if (data.cfg.modules && data.cfg.modules.DF) {
                if (!this.modules.DF) {
                    for (const o of objects.module_df) {
                        // @ts-ignore
                        await this.setObjectNotExistsAsync(`${mower.serial_number}.modules.DF.${o._id}`, o);
                        this.log.info(`OffLimits Module found! Create State : ${o._id}`);
                    }
                }

                this.modules.DF = data.cfg.modules.DF;
                await this.setStateAsync(`${mower.serial_number}.modules.DF.OLMSwitch_Cutting`, {
                    val: data.cfg.modules && data.cfg.modules.DF ? !!data.cfg.modules.DF.cut : false,
                    ack: true,
                });
                await this.setStateAsync(`${mower.serial_number}.modules.DF.OLMSwitch_FastHoming`, {
                    val: data.cfg.modules && data.cfg.modules.DF ? !!data.cfg.modules.DF.fh : false,
                    ack: true,
                });
            }
            //Autolock feture
            if (data.cfg && data.cfg.al) {
                if (!this.modules.al) {
                    for (const o of objects.al) {
                        // @ts-ignore
                        await this.setObjectNotExistsAsync(`${mower.serial_number}.mower.${o._id}`, o);
                        this.log.info(`Autolock found! Create State : ${o._id}`);
                    }
                }
                this.modules.al = data.cfg.al;
                // save last positive Value
                if (data.cfg.al.t > 0) this.modules.al_last = data.cfg.al.t;

                await this.setStateAsync(`${mower.serial_number}.mower.AutoLock`, {
                    val: !!data.cfg.al.lvl,
                    ack: true,
                });
                await this.setStateAsync(`${mower.serial_number}.mower.AutoLockTimer`, {
                    val: data.cfg.al.t,
                    ack: true,
                });
            }
        } catch (error) {
            if (this.supportsFeature && this.supportsFeature("PLUGINS")) {
                const sentryInstance = this.getPluginInstance("sentry");
                if (sentryInstance) {
                    sentryInstance.getSentryObject().captureException(error, {
                        extra: {
                            "data:": JSON.stringify(data),
                        },
                    });
                }
            }
        }
    }
    async start_mqtt(mower) {
        if (!mower) {
            this.log.warn("No mower found to start mqtt");
            return;
        }
        if (!mower.uuid) {
            mower.uuid = uuidv4();
        }
        this.userData = await this.getRequest("users/me");
        this.userCert = await this.getRequest("users/certificate");
        this.userCert.p12 = Buffer.from(this.userCert.pkcs12, "base64");
        if (this.userCert && this.userCert.active === true) {
            this.connectMqtt(mower);
        } else {
            this.log.warn(
                "maybe your connection is blocked from Worx, please test start button, if not working, try again in 24h",
            );
            this.log.warn("DON`T CONTACT THE OFFICIAL WORX SUPPORT BECAUSE THIS IS AN INOFFICAL APP !!!!!!!!!!!");
            this.connectMqtt(mower);
        }
    }
    connectMqtt(mower) {
        const options = {
            pfx: this.userCert.p12,
            clientId: "android-" + mower.uuid,
            reconnectPeriod: 30000,
            clear: true,
        };

        this.mqttC = mqtt.connect("mqtts://" + this.userData.mqtt_endpoint, options);

        this.mqttC.on("offline", () => {
            this.log.debug("Worxcloud MQTT offline");
        });

        this.mqttC.on("disconnect", (packet) => {
            this.log.debug("MQTT disconnect" + packet);
        });

        this.mqttC.on("connect", () => {
            this.log.info("MQTT connected to: " + this.userData.mqtt_endpoint);
            for (const mower of this.deviceArray) {
                this.log.debug("Worxcloud MQTT subscribe to " + mower.mqtt_topics.command_out);
                this.mqttC.subscribe(mower.mqtt_topics.command_out);
                this.mqttC.publish(mower.mqtt_topics.command_in, "{}");
            }
        });

        this.mqttC.on("message", async (topic, message) => {
            const data = JSON.parse(message);
            const mower = this.deviceArray.find((mower) => mower.mqtt_topics.command_out === topic);

            if (mower) {
                this.log.debug("Worxcloud MQTT get Message for mower " + mower.name + " (" + mower.serial_number + ")");
                mower.last_status.payload = data;
                mower.last_status.timestamp = new Date().toISOString().replace("T", " ").replace("Z", "");
                await this.setStates(mower);
                this.json2iob.parse(`${mower.serial_number}.rawMqtt`, mower, {
                    forceIndex: true,
                    preferedArrayName: null,
                });
            } else {
                this.log.debug("Worxcloud MQTT could not find mower topic in mowers");
            }
        });

        // this.mqttC.on("packetsend", (packet) => {
        //     //this.log.debug('Worxcloud MQTT packetsend: ' + JSON.stringify(packet));
        // });

        // this.mqttC.on("packetreceive", (packet) => {
        //     //this.log.debug('Worxcloud MQTT packetreceive: ' + JSON.stringify(packet));
        // });

        this.mqttC.on("error", (error) => {
            this.log.error("MQTT ERROR: " + error);
        });
    }
    /**
     * @param {string} message JSON stringify example : '{"cmd":3}'
     */
    sendMessage(message, serial) {
        this.log.debug("Worxcloud MQTT sendMessage to " + serial + " Message: " + message);

        if (typeof serial === "undefined") {
            this.log.error("please give a serial number!");
        }

        const mower = this.deviceArray.find((mower) => mower.serial_number === serial);

        if (mower && this.mqttC) {
            this.mqttC.publish(mower.command_in, message);
        } else {
            this.log.error("Try to send a message but could not find the mower");
        }
    }

    //Calendar
    /**
     * @param {Array} arr
     * @param {boolean} sec if sec is true, use second mowtime
     */
    async evaluateCalendar(mower, arr, sec) {
        if (arr) {
            const secString = sec ? "2" : "";

            for (let i = 0; i < this.week.length; i++) {
                await this.setStateAsync(`${mower.serial_number}.calendar.${this.week[i]}${secString}.startTime`, {
                    val: arr[i][0],
                    ack: true,
                });
                await this.setStateAsync(`${mower.serial_number}.calendar.${this.week[i]}${secString}.workTime`, {
                    val: arr[i][1],
                    ack: true,
                });
                await this.setStateAsync(`${mower.serial_number}.calendar.${this.week[i]}${secString}.borderCut`, {
                    val: arr[i][2] && arr[i][2] === 1 ? true : false,
                    ack: true,
                });
            }
        }
    }
    extractHidden(body) {
        const returnObject = {};
        if (body) {
            const matches = body.matchAll(/<input (?=[^>]* name=["']([^'"]*)|)(?=[^>]* value=["']([^'"]*)|)/g);
            for (const match of matches) {
                returnObject[match[1]] = match[2];
            }
        }
        return returnObject;
    }
    getCodeChallenge() {
        let hash = "";
        let result = "";
        const chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
        result = "";
        for (let i = 64; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
        result = Buffer.from(result).toString("base64");
        result = result.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
        hash = crypto.createHash("sha256").update(result).digest("base64");
        hash = hash.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");

        return [result, hash];
    }
    /**
     * Is called when adapter shuts down - callback has to be called under any circumstances!
     * @param {() => void} callback
     */
    onUnload(callback) {
        try {
            this.setState("info.connection", false, true);
            this.mqttC.end();
            this.refreshTokenTimeout && clearTimeout(this.refreshTokenTimeout);
            this.updateInterval && clearInterval(this.updateInterval);
            this.refreshTokenInterval && clearInterval(this.refreshTokenInterval);
            callback();
        } catch (e) {
            callback();
        }
    }
    /**
     * Is called if a subscribed state changes
     * @param {string} id
     * @param {ioBroker.State | null | undefined} state
     */
    onStateChange(id, state) {
        if (state && !state.ack && state.val !== null) {
            const command = id.split(".").pop();
            const mower_id = id.split(".")[2];
            const mower = this.deviceArray.find((device) => device.serial_number === mower_id);

            this.log.debug(
                `state change: id_____ ${id} Mower ${mower_id}_____${command}______${JSON.stringify(mower)}`,
            );

            if (mower) {
                if (command == "state") {
                    if (state.val === true) {
                        this.startMower(mower);
                    } else {
                        this.stopMower(mower);
                    }
                } else if (command == "waitRain") {
                    // @ts-ignore
                    const val = isNaN(state.val) || state.val < 0 ? 100 : parseInt(state.val);
                    this.sendMessage(`{"rd":${val}}`, mower.serial_number);
                    this.log.debug(`Changed time wait after rain to:${val}`);
                } else if (command === "borderCut" || command === "startTime" || command === "workTime") {
                    this.changeMowerCfg(id, state.val, mower);
                } else if (
                    command === "area_0" ||
                    command === "area_1" ||
                    command === "area_2" ||
                    command === "area_3"
                ) {
                    this.changeMowerArea(id, parseInt(state.val), mower);
                } else if (command === "startSequence") {
                    this.startSequences(id, state.val, mower);
                } else if (command === "pause") {
                    if (state.val === true) {
                        this.sendMessage('{"cmd":2}', mower.serial_number);
                    }
                } else if (command === "mowTimeExtend") {
                    this.mowTimeEx(id, parseInt(state.val), mower);
                } else if (
                    command === "mowerActive" &&
                    mower.last_status.payload &&
                    mower.last_status.payload.cfg &&
                    mower.last_status.payload.cfg.sc
                ) {
                    const val = state.val ? 1 : 0;
                    const message = mower.last_status.payload.cfg.sc;

                    //hotfix 030620
                    delete message.ots;
                    delete message.distm;

                    message.m = val;
                    this.sendMessage(`{"sc":${JSON.stringify(message)}}`, mower.serial_number);
                    this.log.debug(`Mow times disabled: ${message.m}`);
                } else if (command === "edgecut") {
                    this.edgeCutting(id, state.val, mower);
                } else if (command === "sendCommand") {
                    this.sendCommand(state.val, mower);
                } else if (command === "oneTimeStart" || command === "oneTimeJson") {
                    this.startOneShedule(id, state.val, mower);
                } else if (command === "partyModus") {
                    this.sendPartyModus(id, state.val, mower);
                } else if (command === "calJson" || command === "calJson2") {
                    this.changeWeekJson(id, state.val, mower);
                } else if (command === "AutoLock") {
                    const msg = this.modules.al;
                    // @ts-ignore
                    msg.lvl = state.val | 0;
                    this.sendMessage(`{"al":${JSON.stringify(msg)}}`, mower.serial_number);
                } else if (command === "AutoLockTimer") {
                    if (state.val < 0 || state.val > 600) {
                        this.log.warn("Please use value between 0 and 600 for Autolocktimer");
                        return;
                    }
                    const msg = this.modules.al;
                    // @ts-ignore
                    msg.t = parseInt(state.val);
                    this.sendMessage(`{"al":${JSON.stringify(msg)}}`, mower.serial_number);
                } else if (command === "OLMSwitch_Cutting" && this.modules.DF) {
                    const msg = this.modules.DF;
                    msg.cut = state.val || 0;
                    this.sendMessage(`{"modules":{"DF":${JSON.stringify(msg)}}}`, mower.serial_number);
                } else if (command === "OLMSwitch_FastHoming" && this.modules.DF) {
                    const msg = this.modules.DF;
                    msg.fh = state.val || 0;
                    this.sendMessage(`{"modules":{"DF":${JSON.stringify(msg)}}}`, mower.serial_number);
                } else if (command === "ACS" && this.modules.US) {
                    const msg = this.modules.US;
                    msg.enabled = state.val || 0;
                    this.sendMessage('{"modules":{"US":' + JSON.stringify(msg) + "}}", mower.serial_number);
                } else if (command === "torque") {
                    if (state.val < -50 || state.val > 50) return;
                    // @ts-ignore
                    const tqval = parseInt(state.val);
                    this.sendMessage(`{"tq":${tqval}}`, mower.serial_number);
                }
            } else this.log.error(`No mower found!  ${JSON.stringify(mower_id)}`);
        }
    }

    /**
     * @param {object} mower
     */
    async startMower(mower) {
        this.log.debug(`Start mower ${JSON.stringify(mower)}`);

        if (
            mower.last_status.payload &&
            mower.last_status.payload.dat &&
            (mower.last_status.payload.dat.ls === 1 || mower.last_status.payload.dat.ls === 34) &&
            mower.last_status.payload.dat.le === 0
        ) {
            this.sendMessage('{"cmd":1}', mower.serial_number); //start code for mower
            this.log.debug("Start mower");
        } else {
            this.log.warn(
                "Can not start mower because he is not at home or there is an error please verify mower state",
            );
            this.setStateAsync(`${mower.serial}.mower.state`, {
                val: false,
                ack: true,
            });
        }
    }

    /**
     * @param {object} mower
     */
    stopMower(mower) {
        if (
            mower.last_status.payload &&
            mower.last_status.payload.dat &&
            mower.last_status.payload.dat.ls === 7 &&
            mower.last_status.payload.dat.le === 0
        ) {
            this.sendMessage('{"cmd":3}', mower.serial_number); //"Back to home" code for mower
            this.log.debug("mower going back home");
        } else {
            this.log.warn("Can not stop mower because he did not mow or there is an error");
            this.setStateAsync(`${mower.serial}.mower.state`, {
                val: true,
                ack: true,
            });
        }
    }

    /**
     * @param {string} id id of state
     * @param {object} mower object of mower that changed
     * @param {any} value string of Json
     */
    async startOneShedule(id, value, mower) {
        let msgJson;
        const idType = id.split(".")[4];

        if (idType === "oneTimeStart") {
            const bc = await this.getStateAsync(`${mower.serial}.mower.oneTimeWithBorder`);
            const wtm = await this.getStateAsync(`${mower.serial}.mower.oneTimeWorkTime`);
            if (bc && wtm) {
                msgJson = {
                    bc: bc.val ? 1 : 0,
                    wtm: wtm.val,
                };
            }
        } else if (idType === "oneTimeJson") {
            try {
                msgJson = JSON.parse(value);

                if (typeof msgJson.bc === "undefined" || typeof msgJson.wtm === "undefined") {
                    this.log.error('ONETIMESHEDULE: NO vailed format. must contain "bc" and "wtm"');
                    return;
                }
            } catch (error) {
                this.log.error("ONETIMESHEDULE: NO vailed JSON format");
                return;
            }
        }

        this.log.debug(`ONETIMESHEDULE: ${JSON.stringify(msgJson)}`);
        this.sendMessage(`{"sc":{"ots":${JSON.stringify(msgJson)}}}`, mower.serial_number);
    }

    /**
     * @param {string} id id of state
     * @param {object} mower object of mower that changed
     * @param {any} value string of Json
     */
    async changeWeekJson(id, value, mower) {
        let msgJson;
        const sheduleSel = id.split(".")[4].search("2") === -1 ? "d" : "dd";
        let fail = false;
        // const idType = id.split(".")[4];
        const message = mower.last_status.payload.cfg.sc;

        message.ots && delete message.ots;
        message.distm && delete message.distm;

        try {
            msgJson = JSON.parse(value);
            if (msgJson.length !== 7) {
                this.log.error("CALJSON: Json length not correct must be 7 Days");
                fail = true;
            }
            msgJson.forEach((element) => {
                this.log.debug(`CALJSON: ${JSON.stringify(element)}`);
                if (element.length !== 3) {
                    this.log.error("CALJSON: Arguments missing!!");
                    fail = true;
                }
                if (element[2] === 0 || element[2] === 1) {
                    // no vailed border value
                } else {
                    this.log.error("CALJSON: Bordercut shoulg be 0 or 1!!");
                    fail = true;
                }
                const h = element[0].split(":")[0];
                const m = element[0].split(":")[1];
                this.log.debug(`h: ${h} m: ${m}`);
                if (h < 0 || h > 23 || m < 0 || m > 59) {
                    this.log.error("CALJSON: Start time is not correct!!");
                    fail = true;
                }

                if (element[1] < 0 || element[1] > 1440) {
                    this.log.error("Time out of range 0 min < time < 1440 min.");
                    fail = true;
                }
            });

            this.log.debug(`CALJSON length: ${msgJson.length}`);
        } catch (error) {
            this.log.error("CALJSON: NO vailed JSON format");
            fail = true;
        }

        fail && this.log.debug(`FAIL: ${fail} CALJSON: ${JSON.stringify(msgJson)}`);
        message[sheduleSel] = msgJson;
        if (!fail) this.sendMessage(`{"sc":${JSON.stringify(message)}}`, mower.serial_number);
    }

    /**
     * @param {string} id id of state
     * @param {any} value value that changed
     * @param {object} mower object of mower that changed
     */
    changeMowerCfg(id, value, mower) {
        const val = value;
        let sval, dayID;

        if (!mower.last_status.payload || typeof mower.last_status.payload.cfg === "undefined") {
            // check if config exist
            this.log.warn(
                `Cant send command because no Configdata from cloud exist please try again later. last message: ${JSON.stringify(
                    mower.last_status.payload,
                )}`,
            );
            return;
        }

        //find number 2 for second shedule
        const sheduleSel = id.split(".")[4].search("2") === -1 ? "d" : "dd";
        const message = mower.last_status.payload.cfg.sc; // set actual values
        //let fullMessage = mower.last_status.payload.cfg.sc;

        if (typeof message === "undefined") {
            this.log.warn("try again later!");
            return;
        }
        message.ots && delete message.ots;
        message.distm && delete message.distm;

        const valID = ["startTime", "workTime", "borderCut"].indexOf(id.split(".")[5]);

        if (sheduleSel === "d") {
            dayID = this.week.indexOf(id.split(".")[4]);
        } else {
            const modWeekday = id.split(".")[4];

            //erase the number 2
            dayID = this.week.indexOf(modWeekday.substring(0, modWeekday.length - 1));
        }

        try {
            if (valID === 2) {
                // changed the border cut
                sval = valID === 2 && val === true ? 1 : 0;
            } else if (valID === 0) {
                // changed the start time
                const h = val.split(":")[0];
                const m = val.split(":")[1];
                this.log.debug(`h: ${h} m: ${m}`);
                if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
                    sval = val;
                } else this.log.error('Time out of range: e.g "10:00"');
            } else if (valID === 1) {
                // changed the worktime
                if (val >= 0 && val <= 1440) {
                    sval = parseInt(val);
                } else this.log.error("Time out of range 0 min < time < 1440 min.");
            } else this.log.error("Something went wrong while setting new mower times");
        } catch (e) {
            this.log.error(`Error while setting mower config: ${e}`);
        }
        if (sval !== undefined) {
            if (
                typeof message[sheduleSel] === "undefined" ||
                typeof message[sheduleSel][dayID] === "undefined" ||
                typeof message[sheduleSel][dayID][valID] === "undefined"
            ) {
                this.log.warn("Something went wrong, plese try again later");
                return;
            }
            message[sheduleSel][dayID][valID] = sval;
            this.log.debug(`Mowing time change at ${sheduleSel} to: ${JSON.stringify(message)}`);
            this.sendMessage(`{"sc":${JSON.stringify(message)}}`, mower.serial_number);
        }
        this.log.debug(`test cfg: ${dayID} valID: ${valID} val: ${val} sval: ${sval}`);
    }
    /**
     * @param {string} id
     * @param {any} value
     * @param {any} mower
     */
    changeMowerArea(id, value, mower) {
        const val = value;

        if (
            (mower.last_status.payload && typeof mower.last_status.payload.cfg === "undefined") ||
            typeof mower.last_status.payload === "undefined"
        ) {
            // check if config exist
            this.log.warn(
                `Cant send command because no Configdata from cloud exist please try again later. last message: ${JSON.stringify(
                    mower.last_status.payload,
                )}`,
            );
            return;
        }

        const message = mower.last_status.payload.cfg.mz; // set actual values
        const areaID = Number(id.split("_").pop());

        try {
            if (!isNaN(val) && val >= 0 && val <= 500) {
                message[areaID] = val;
                this.sendMessage(`{"mz":${JSON.stringify(message)}}`, mower.serial_number);
                this.log.debug(`Change Area ${areaID} : ${JSON.stringify(message)}`);
            } else {
                this.log.error("Area Value ist not correct, please type in a val between 0 and 500");
                this.setState(`areas.area_${areaID}`, {
                    val:
                        mower.last_status.payload.cfg.mz && mower.last_status.payload.cfg.mz[areaID]
                            ? mower.last_status.payload.cfg.mz[areaID]
                            : 0,
                    ack: true,
                });
            }
        } catch (e) {
            this.log.error(`Error while setting mower areas: ${e}`);
        }
    }

    /**
     * @param {string} id
     * @param {any} value
     * @param {any} mower
     */
    sendPartyModus(id, value, mower) {
        if (value) {
            this.sendMessage('{"sc":{ "m":2, "distm": 0}}', mower.serial_number);
        } else {
            this.sendMessage('{"sc":{ "m":1, "distm": 0}}', mower.serial_number);
        }
    }

    /**
     * @param {string} id
     * @param {any} value
     * @param {object} mower
     */
    startSequences(id, value, mower) {
        if (typeof mower.last_status.payload.cfg === "undefined") {
            // check if config exist
            this.log.warn(
                `Cant send command because no Configdata from cloud exist please try again later. last message: ${JSON.stringify(
                    mower.last_status.payload,
                )}`,
            );
            return;
        }

        // const message = mower.last_status.payload.cfg.mz; // set aktual values
        let seq = [];
        try {
            seq = JSON.parse(value);
        } catch (e) {
            try {
                seq = JSON.parse(`[${value}]`);
            } catch (e) {
                this.log.error(`Error while setting start sequence: ${e}`);
            }
        }

        try {
            for (let i = 0; i < 10; i++) {
                if (seq[i] != undefined) {
                    if (isNaN(seq[i]) || seq[i] < 0 || seq[i] > 3) {
                        seq[i] = 0;
                        this.log.error(`Wrong start sequence, set val ${i} to 0`);
                    }
                } else {
                    seq[i] = 0;
                    this.log.warn("Array ist too short, filling up with start point 0");
                }
            }
            this.sendMessage(`{"mzv":${JSON.stringify(seq)}}`, mower.serial_number);
            this.log.debug(`new Array is: ${JSON.stringify(seq)}`);
        } catch (e) {
            this.log.error(`Error while setting start sequence: ${e}`);
        }
    }

    /**
     * @param {string} id
     * @param {any} value
     * @param {object} mower
     */
    mowTimeEx(id, value, mower) {
        const val = value;

        if (typeof mower.last_status.payload.cfg === "undefined") {
            // check if config exist
            this.log.warn(
                `Cant send command because no Configdata from cloud exist please try again later. last message: ${JSON.stringify(
                    mower.last_status.payload,
                )}`,
            );
            return;
        }

        const message = mower.last_status.payload.cfg.sc; // set aktual values

        this.log.debug(`MowerTimeExtend JSON : ${JSON.stringify(message)}`);

        //hotfix 030620
        message && delete message.ots;

        if (!isNaN(val) && val >= -100 && val <= 100) {
            message.p = val;
            this.sendMessage(`{"sc":${JSON.stringify(message)}}`, mower.serial_number);
            this.log.debug(`MowerTimeExtend set to : ${message.p}`);
        } else {
            this.log.error("MowerTimeExtend must be a value between -100 and 100");
        }
    }

    /**
     * @param {string} id
     * @param {any} value
     * @param {object} mower
     */
    edgeCutting(id, value, mower) {
        const val = value;

        if (typeof mower.last_status.payload.cfg === "undefined") {
            // check if config exist
            this.log.warn(
                `Cant send command because no Configdata from cloud exist please try again later. last message: ${JSON.stringify(
                    mower.last_status.payload,
                )}`,
            );
            return;
        }

        if (
            val === true &&
            mower.last_status.payload &&
            mower.last_status.payload.cfg &&
            mower.last_status.payload.cfg.sc &&
            typeof mower.last_status.payload.cfg.sc.ots === "undefined"
        ) {
            mower.edgeCut = true;
            this.sendMessage('{"cmd":4}', mower.serial_number); // starte ZoneTraining
        } else if (
            val === true &&
            mower.last_status.payload &&
            mower.last_status.payload.cfg &&
            mower.last_status.payload.cfg.sc &&
            mower.last_status.payload.cfg.sc.ots
        ) {
            this.sendMessage('{"sc":{"ots":{"bc":1,"wtm":0}}}', mower.serial_number);
        } else {
            this.log.warn("EdgeCutting is not possible");
        }
    }

    async sendCommand(value, mower) {
        const val = value;

        this.log.debug(`Send cmd:${val}`);
        this.sendMessage(`{"cmd":${val}}`, mower.serial_number);
    }
    async cleanOldVersion(serial) {
        const cleanOldVersion = await this.getObjectAsync(
            this.name + "." + this.instance + "." + serial + ".oldVersionCleaned",
        );
        if (!cleanOldVersion) {
            this.log.info("Please wait a few minutes.... clean old version");
            await this.delForeignObjectAsync(this.name + "." + this.instance + "." + serial + ".rawMqtt", {
                recursive: true,
            });
            await this.setObjectNotExistsAsync(this.name + "." + this.instance + "." + serial + ".oldVersionCleaned", {
                type: "state",
                common: {
                    type: "boolean",
                    role: "boolean",
                    write: false,
                    read: true,
                },
                native: {},
            });

            this.log.info("Done with cleaning");
            this.restart();
        }
    }
}

if (require.main !== module) {
    // Export the constructor in compact mode
    /**
     * @param {Partial<utils.AdapterOptions>} [options={}]
     */
    module.exports = (options) => new Worx(options);
} else {
    // otherwise start the instance directly
    new Worx();
}
