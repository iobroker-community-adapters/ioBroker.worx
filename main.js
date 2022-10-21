"use strict";

/*
 * Created with @iobroker/create-adapter v2.3.0
 */

const utils = require("@iobroker/adapter-core");
const axios = require("axios").default;
const awsIot = require("aws-iot-device-sdk");
// const qs = require("qs");
const Json2iob = require("./lib/json2iob");
const tough = require("tough-cookie");
const { HttpsCookieAgent } = require("http-cookie-agent/http");
const { v4: uuidv4 } = require("uuid");
const crypto = require("crypto");
const objects = require(`./lib/objects`);
const helper = require(`./lib/helper`);
const not_allowed = 60000 * 10;
const ping_interval = 1000 * 60 * 10; //10 Minutes
const pingMqtt = false;

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
        this.fw_available = {};
        this.laststatus = {};
        this.lasterror = {};
        this.week = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
        this.userAgent = "ioBroker ";
        this.reLoginTimeout = null;
        this.refreshActivity = null;
        this.loadActivity = {};
        this.refreshTokenTimeout = null;
        this.pingInterval = {};
        this.session = {};
        this.mqttC = {};
        this.createDevices = helper.createDevices;
        this.setStates = helper.setStates;
        this.cleanupRaw = helper.cleanupRaw;
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
                clientId: "150da4d2-bb44-433b-9429-3773adc70a2a",
                redirectUri: "com.worxlandroid.landroid://oauth-callback/",
                mqttPrefix: "WX",
            },
            kress: {
                url: "api.kress-robotik.com",
                loginUrl: "https://id.eu.kress.com/",
                clientId: "931d4bc4-3192-405a-be78-98e43486dc59",
                redirectUri: "com.kress-robotik.mission://oauth-callback/",
                mqttPrefix: "KR",
            },
            landxcape: {
                url: "api.landxcape-services.com",
                loginUrl: "https://id.landxcape-services.com/",
                clientId: "dec998a9-066f-433b-987a-f5fc54d3af7c",
                redirectUri: "com.landxcape-robotics.landxcape://oauth-callback/",
                mqttPrefix: "LX",
            },
            ferrex: {
                url: "api.watermelon.smartmower.cloud",
                loginUrl: "https://id.watermelon.smartmower.cloud/",
                clientId: "10078D10-3840-474A-848A-5EED949AB0FC",
                redirectUri: "cloud.smartmower.watermelon://oauth-callback/",
                mqttPrefix: "FE",
            },
        };
    }

    /**
     * Is called when databases are connected and adapter received configuration.
     */
    async onReady() {
        // Reset the connection indicator during startup
        this.setState("info.connection", false, true);
        this.userAgent += this.version;

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
            await this.start_mqtt();

            this.updateFW = setInterval(async () => {
                await this.updateFirmware();
            }, 24 * 60 * 1000 * 60); // 24 hour

            this.updateInterval = setInterval(async () => {
                await this.updateDevices();
            }, 10 * 60 * 1000); // 10 minutes

            this.refreshTokenInterval = setInterval(() => {
                this.refreshToken();
            }, (this.session.expires_in - 100) * 1000);

            this.refreshActivity = setInterval(() => {
                this.createActivityLogStates();
            }, 60 * 1000); // 1 minutes
        }
    }
    async login() {
        //Simple login
        const data = await this.requestClient({
            url: this.clouds[this.config.server].loginUrl + "oauth/token",
            method: "post",
            headers: {
                accept: "application/json",
                "content-type": "application/json",
                "user-agent": this.userAgent,
                "accept-language": "de-de",
            },
            data: JSON.stringify({
                client_id: this.clouds[this.config.server].clientId,
                username: this.config.mail,
                password: this.config.password,
                scope: "*",
                grant_type: "password",
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

        /* App login simulation
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
                accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*\/*;q=0.8",
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
                accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*\/*;q=0.8",
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
        */
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
                    this.fw_available[device.serial_number] = false;
                    this.log.info(`Found device ${name} with id ${id}`);

                    await this.cleanOldVersion(id);
                    this.deviceArray.push(device);
                    await this.createDevices(device);
                    const fw_id = await this.apiRequest(`product-items/${id}/firmwares`, false);
                    await this.createAdditionalDeviceStates(device, fw_id);
                    if (
                        device &&
                        device.last_status &&
                        device.last_status.payload &&
                        device.last_status.payload.dat &&
                        device.last_status.payload.dat.ls != null &&
                        device.last_status.payload.dat.le != null
                    ) {
                        this.laststatus[id] = device.last_status.payload.dat.ls;
                        this.lasterror[id] = device.last_status.payload.dat.le;
                        this.loadActivity[id] = false;
                    }
                    await this.createActivityLogStates(device, true);
                    await this.createProductStates(device);
                    // this.json2iob.parse(`${id}.rawMqtt`, await this.cleanupRaw(device), {
                    //     forceIndex: true,
                    // });
                }
            })
            .catch((error) => {
                this.log.error(error);
                error.response && this.log.error(JSON.stringify(error.response.data));
            });
    }

    async createProductStates(mower) {
        if (mower && mower.serial_number) {
            const products = await this.apiRequest("products", true);
            this.log.debug(JSON.stringify(products));
            const productID = mower && mower.product_id ? mower.product_id : 0;
            let boardID = 0;
            if (products && products[0] && products[0].id) {
                for (const sl of products) {
                    if (sl && sl.id && sl.id === productID) {
                        this.log.info(`Create product folder and states for ${sl.code}`);
                        boardID = sl.board_id;
                        this.json2iob.parse(`${mower.serial_number}.product`, sl, {
                            write: false,
                            forceIndex: true,
                            channelName: "Mower product and board Info",
                            autoCast: true,
                        });
                        break;
                    }
                }
            }
            if (boardID > 0) {
                const boards = await this.apiRequest("boards", true);
                this.log.debug(JSON.stringify(boards));
                if (boards && boards[0] && boards[0].id) {
                    for (const sl of boards) {
                        if (sl && sl.id && sl.id === boardID) {
                            this.log.info(`Create board folder and states for ${sl.code} in product folder`);
                            this.json2iob.parse(`${mower.serial_number}.product.board`, sl, {
                                write: false,
                                forceIndex: true,
                                channelName: "Board Info",
                                autoCast: true,
                            });
                            break;
                        }
                    }
                }
            }
        }
    }
    async createActivityLogStates(mower, firstStart) {
        if (mower && mower.serial_number) {
            //first start while get devices
            const activity_log = await this.apiRequest(`product-items/${mower.serial_number}/activity-log`, false);
            if (activity_log && Object.keys(activity_log).length > 0 && activity_log[0] && activity_log[0]._id) {
                if (firstStart) {
                    this.log.info("Create folder activityLog and set states.");
                    await this.setObjectNotExistsAsync(`${mower.serial_number}.activityLog`, {
                        type: "channel",
                        common: {
                            name: "Mower activity logs",
                        },
                        native: {},
                    });
                    await this.setObjectNotExistsAsync(`${mower.serial_number}.activityLog.payload`, {
                        type: "state",
                        common: {
                            name: "Activity Logs",
                            type: "string",
                            role: "json",
                            read: true,
                            write: false,
                            desc: "Activity Logs",
                        },
                        native: {},
                    });
                    await this.setObjectNotExistsAsync(`${mower.serial_number}.activityLog.manuell_update`, {
                        type: "state",
                        common: {
                            name: "Update Activity",
                            type: "boolean",
                            role: "button",
                            read: true,
                            write: true,
                            def: false,
                            desc: "Manuell Update Activity Logs",
                        },
                        native: {},
                    });
                    await this.setObjectNotExistsAsync(`${mower.serial_number}.activityLog.last_update`, {
                        type: "state",
                        common: {
                            name: "Last Update Activity-Log",
                            type: "number",
                            role: "meta.datetime",
                            read: true,
                            write: false,
                            def: 0,
                            desc: "Last Update Activity-Log",
                        },
                        native: {},
                    });
                }
                await this.setStateAsync(`${mower.serial_number}.activityLog.payload`, {
                    val: JSON.stringify(activity_log),
                    ack: true,
                });
                await this.setStateAsync(`${mower.serial_number}.activityLog.last_update`, {
                    val: Date.now(),
                    ack: true,
                });
            }
            return;
        }
        for (const device of this.deviceArray) {
            //check if setState set loadActivity on true because of changed lasterror or laststatus
            if (
                device &&
                device.serial_number &&
                this.loadActivity[device.serial_number] != null &&
                this.loadActivity[device.serial_number]
            ) {
                this.log.debug("START UPDATE CHANGE");
                await this.sleep(10000); //Wait 10s because it takes some time for the last log item available at the API endpoint
                const activity_log = await this.apiRequest(`product-items/${device.serial_number}/activity-log`, false);
                if (activity_log && Object.keys(activity_log).length > 0 && activity_log[0] && activity_log[0]._id) {
                    this.log.debug("UPDATE CHANGE");
                    await this.setStateAsync(`${device.serial_number}.activityLog.payload`, {
                        val: JSON.stringify(activity_log),
                        ack: true,
                    });
                    await this.setStateAsync(`${device.serial_number}.activityLog.last_update`, {
                        val: Date.now(),
                        ack: true,
                    });
                }
                this.loadActivity[device.serial_number] = false;
            } else {
                this.loadActivity[device.serial_number] = false;
            }
        }
    }

    async updateFirmware() {
        for (const mower of this.deviceArray) {
            if (this.fw_available[mower.serial_number] === true) {
                const fw_json = await this.apiRequest(`product-items/${mower.serial_number}/firmwares`, false);
                if (
                    fw_json &&
                    Object.keys(fw_json).length > 0 &&
                    fw_json[0] &&
                    fw_json[0].version &&
                    fw_json[0].updated_at
                ) {
                    this.log.info(`Update Firmware ${mower.serial_number}`);
                    await this.setStateAsync(`${mower.serial_number}.mower.firmware_available`, {
                        val: fw_json[0].version,
                        ack: true,
                    });
                    await this.setStateAsync(`${mower.serial_number}.mower.firmware_available_date`, {
                        val: fw_json[0].updated_at,
                        ack: true,
                    });
                    await this.setStateAsync(`${mower.serial_number}.mower.firmware_available_all`, {
                        val: JSON.stringify(fw_json),
                        ack: true,
                    });
                }
            }
        }
    }

    async updateDevices() {
        const statusArray = [
            {
                path: "rawMqtt",
                url: `https://${this.clouds[this.config.server].url}/api/v2/product-items/$id/?status=1&gps_status=1`,
                desc: "All raw data of the mower",
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
                        try{
                            if (!data || !data.last_status || !data.last_status.payload) {
                                this.log.debug("No last_status found");
                                delete data.last_status
                                this.log.debug("Delete last_status");
                            }
                        } catch (error) {
                            this.log.debug("Delete last_status: " + error);
                        }
                        const new_data = await this.cleanupRaw(data);
                        if (new_data.last_status && new_data.last_status.timestamp != null) {
                            delete new_data.last_status.timestamp;
                        }
                        this.json2iob.parse(`${device.serial_number}.${element.path}`, new_data, {
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
                this.mqttC.updateCustomAuthHeaders(this.createWebsocketHeader());
            })
            .catch((error) => {
                this.log.error(error);
                error.response && this.log.error(JSON.stringify(error.response.data));
            });
    }

    async createAdditionalDeviceStates(mower, fw_json) {
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
        if (status && status.cfg && status.cfg.sc != null && status.cfg.sc.ots != null) {
            this.log.info("found OneTimeShedule, create states...");

            // create States
            for (const o of objects.oneTimeShedule) {
                // @ts-ignore
                this.setObjectNotExistsAsync(`${mower.serial_number}.mower.${o._id}`, o);
            }
        }

        if (fw_json && Object.keys(fw_json).length > 0 && fw_json[0] && fw_json[0].version && fw_json[0].updated_at) {
            this.fw_available[mower.serial_number] = true;
            this.log.info("found available firmware, create states...");
            for (const o of objects.firmware_available) {
                // @ts-ignore
                await this.setObjectNotExistsAsync(`${mower.serial_number}.mower.${o._id}`, o);
            }
            await this.setStateAsync(`${mower.serial_number}.mower.firmware_available`, {
                val: fw_json[0].version,
                ack: true,
            });
            await this.setStateAsync(`${mower.serial_number}.mower.firmware_available_date`, {
                val: fw_json[0].updated_at,
                ack: true,
            });
            await this.setStateAsync(`${mower.serial_number}.mower.firmware_available_all`, {
                val: JSON.stringify(fw_json),
                ack: true,
            });
        }

        if (status && status.cfg && status.cfg.sc && status.cfg.sc.distm != null && status.cfg.sc.m != null) {
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

    async apiRequest(path, withoutToken, method, data) {
        const headers = {
            accept: "application/json",
            "content-type": "application/json",
            "user-agent": this.userAgent,
            "accept-language": "de-de",
        };
        if (!withoutToken) {
            headers["authorization"] = "Bearer " + this.session.access_token;
        }
        return await this.requestClient({
            method: method || "get",
            url: `https://${this.clouds[this.config.server].url}/api/v2/${path}`,
            headers: headers,
            data: data || null,
        })
            .then(async (res) => {
                this.log.debug(JSON.stringify(res.data));
                if (method === "PUT") {
                    this.log.info(JSON.stringify(res.data));
                }
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

    async start_mqtt() {
        if (this.deviceArray.length === 0) {
            this.log.warn("No mower found to start mqtt");
            return;
        }

        this.userData = await this.apiRequest("users/me", false);
        this.connectMqtt();
    }
    connectMqtt() {
        try {
            const uuid = this.deviceArray[0].uuid || uuidv4();
            const mqttEndpoint = this.deviceArray[0].mqtt_endpoint || "iot.eu-west-1.worxlandroid.com";
            if (this.deviceArray[0].mqtt_endpoint == null) {
                this.log.warn(`Cannot read mqtt_endpoint use default`);
            }
            const headers = this.createWebsocketHeader();
            let region = "eu-west-1";

            const split_mqtt = mqttEndpoint.split(".");
            if (split_mqtt.length === 3) {
                region = split_mqtt[2];
            }
            this.userData["mqtt_endpoint"] = mqttEndpoint;
            this.mqttC = awsIot.device({
                clientId: `${this.clouds[this.config.server].mqttPrefix}/USER/${this.userData.id}/iobroker/${uuid}`,
                username: "iobroker",
                protocol: "wss-custom-auth",
                host: mqttEndpoint,
                region: region,
                customAuthHeaders: headers,
            });

            this.mqttC.on("offline", () => {
                this.log.info("Worxcloud MQTT offline");
            });

            this.mqttC.on("disconnect", (packet) => {
                this.log.debug("MQTT disconnect" + packet);
            });

            this.mqttC.on("connect", () => {
                this.log.info("MQTT connected to: " + this.userData.mqtt_endpoint);
                for (const mower of this.deviceArray) {
                    this.log.debug("Worxcloud MQTT subscribe to " + mower.mqtt_topics.command_out);
                    this.mqttC.subscribe(mower.mqtt_topics.command_out, { qos: 1 });
                    this.mqttC.publish(mower.mqtt_topics.command_in, "{}", { qos: 1 });
                    if (pingMqtt) {
                        this.pingToMqtt(mower);
                    }
                }
            });

            this.mqttC.on("reconnect", () => {
                this.log.debug("MQTT reconnect");
            });

            this.mqttC.on("message", async (topic, message) => {
                const data = JSON.parse(message);
                const mower = this.deviceArray.find((mower) => mower.mqtt_topics.command_out === topic);

                if (mower) {
                    this.log.debug(
                        "Worxcloud MQTT get Message for mower " + mower.name + " (" + mower.serial_number + ")",
                    );
                    try{
                        if (!mower || !mower.last_status || !mower.last_status.payload) {
                            this.log.debug("No last_status found");
                            delete mower.last_status
                            this.log.debug("Delete last_status");
                        } else {
                            this.log.debug("Set new timestamp");
                            mower.last_status.payload = data;
                            mower.last_status.timestamp = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
                                .toISOString()
                                .replace("T", " ")
                                .replace("Z", "");
                        }
                    } catch (error) {
                        this.log.info("Mqtt Delete last_status: " + error);
                    }
                    if (pingMqtt) {
                        this.pingToMqtt(mower);
                    }
                    await this.setStates(mower);
                    const new_mower = await this.cleanupRaw(mower);
                    this.json2iob.parse(`${mower.serial_number}.rawMqtt`, new_mower, {
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
        } catch (error) {
            this.log.error("MQTT ERROR: " + error);
            this.mqttC = undefined;
        }
    }

    /**
     * @param {object} actual mower
     */
    pingToMqtt(mower) {
        const language = (
            mower.last_status &&
            mower.last_status.payload &&
            mower.last_status.payload.cfg &&
            mower.last_status.payload.cfg.lg
        ) ? mower.last_status.payload.cfg.lg : "de";
        const mowerSN = mower.serial_number ? mower.serial_number : "";
        this.pingInterval[mowerSN] && clearTimeout(this.pingInterval[mowerSN]);
        this.log.info("Reset ping");
        this.pingInterval[mowerSN] = setInterval(() => {
            this.log.debug("Worxcloud MQTT ping");
            const now = new Date();
            const message = {
                id: 1024 + Math.floor(Math.random() * (65535 - 1025)),
                cmd: 0,
                lg: language,
                sn: mowerSN,
                // Important: Send the time in your local timezone, otherwise mowers clock will be wrong.
                tm: `${("0" + now.getHours()).slice(-2)}:${("0" + now.getMinutes()).slice(-2)}:${(
                    "0" + now.getSeconds()
                ).slice(-2)}`,
                dt: `${("0" + now.getDate()).slice(-2)}/${("0" + (now.getMonth() + 1)).slice(
                    -2,
                )}/${now.getFullYear()}`,
            };
            this.log.debug("Worxcloud MQTT ping: " + JSON.stringify(message));
            this.sendMessage(JSON.stringify(message), mowerSN);
        }, ping_interval);
    }

    createWebsocketHeader() {
        const accessTokenParts = this.session.access_token.replace(/_/g, "/").replace(/-/g, "+").split(".");
        const headers = {
            "x-amz-customauthorizer-name": "com-worxlandroid-customer",
            "x-amz-customauthorizer-signature": accessTokenParts[2],
            jwt: `${accessTokenParts[0]}.${accessTokenParts[1]}`,
        };
        return headers;
    }

    /**
     * @param {string} message JSON stringify example : '{"cmd":3}'
     */
    sendMessage(message, serial) {
        this.log.debug("Worxcloud MQTT sendMessage to " + serial + " Message: " + message);

        if (serial == null) {
            this.log.error("please give a serial number!");
        }

        const mower = this.deviceArray.find((mower) => mower.serial_number === serial);

        if (mower) {
            if (this.mqttC) {
                this.mqttC.publish(mower.mqtt_topics.command_in, message, { qos: 1 });
            } else {
                //  this.log.debug("Send via API");
                //this.apiRequest("product-items", false, "PUT", message);
            }
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
     * @param {number} ms
     */
    sleep(ms) {
        return new Promise((resolve) => {
            this.sleepTimer = setTimeout(resolve, ms);
        });
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
            this.refreshActivity && clearTimeout(this.refreshActivity);
            this.sleepTimer && clearTimeout(this.sleepTimer);
            this.updateFW && clearInterval(this.updateFW);
            for (const mower of this.deviceArray) {
                this.pingInterval[mower.serial_number] && clearTimeout(this.pingInterval[mower.serial_number]);
            }
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
    async onStateChange(id, state) {
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
                } else if (command === "manuell_update") {
                    const lastTime = await this.getStateAsync(`${mower.serial_number}.activityLog.last_update`);
                    if (state.val && lastTime && lastTime.val && Date.now() - lastTime.val > not_allowed) {
                        this.createActivityLogStates(mower);
                    } else {
                        const nextTime = not_allowed / 1000;
                        this.log.info(`Manuell update < ${nextTime} sec. is not allowed`);
                    }
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
            this.setStateAsync(`${mower.serial_number}.mower.state`, {
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
            this.setStateAsync(`${mower.serial_number}.mower.state`, {
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
            const bc = await this.getStateAsync(`${mower.serial_number}.mower.oneTimeWithBorder`);
            const wtm = await this.getStateAsync(`${mower.serial_number}.mower.oneTimeWorkTime`);
            if (bc && wtm) {
                msgJson = {
                    bc: bc.val ? 1 : 0,
                    wtm: wtm.val,
                };
            }
        } else if (idType === "oneTimeJson") {
            try {
                msgJson = JSON.parse(value);

                if (msgJson.bc == null || msgJson.wtm == null) {
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
        if (
            !mower.last_status ||
            !mower.last_status.payload ||
            !mower.last_status.payload.cfg ||
            !mower.last_status.payload.cfg.sc
        ) {
            // check if config exist
            this.log.warn(
                `Cant send command because cfg.sc is missing from cloud exist please try again later. last message: ${JSON.stringify(
                    mower.last_status,
                )}`,
            );
            return;
        }
        const message = mower.last_status.payload.cfg.sc;

        message.ots && delete message.ots;
        message.distm && delete message.distm;

        try {
            msgJson = JSON.parse(value);
            if (msgJson.length !== 7) {
                this.log.error("CALJSON: Json length not correct must be 7 Days");
                fail = true;
            }

            for (const element of msgJson) {
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
            }

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

        if (!mower.last_status.payload || mower.last_status.payload.cfg == null) {
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

        if (message == null) {
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
                message[sheduleSel] == null ||
                message[sheduleSel][dayID] == null ||
                message[sheduleSel][dayID][valID] == null
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

        if ((mower.last_status.payload && mower.last_status.payload.cfg == null) || mower.last_status.payload == null) {
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
        if (mower.last_status.payload.cfg == null) {
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

        if (
            !mower.last_status ||
            !mower.last_status.payload ||
            !mower.last_status.payload.cfg ||
            !mower.last_status.payload.cfg.sc
        ) {
            // check if config exist
            this.log.warn(
                `Cant send command because cfg.sc is missing from cloud exist please try again later. last message: ${JSON.stringify(
                    mower.last_status,
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

        if (
            !mower.last_status ||
            !mower.last_status.payload ||
            !mower.last_status.payload.cfg ||
            !mower.last_status.payload.cfg.sc
        ) {
            // check if config exist
            this.log.warn(
                `Cant send command because cfg.sc is missing from cloud exist please try again later. last message: ${JSON.stringify(
                    mower.last_status,
                )}`,
            );
            return;
        }

        if (
            val === true &&
            mower.last_status.payload &&
            mower.last_status.payload.cfg &&
            mower.last_status.payload.cfg.sc &&
            mower.last_status.payload.cfg.sc.ots == null
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
            await this.delForeignObjectAsync(this.name + "." + this.instance + "." + serial + ".weather", {
                recursive: true,
            });

            await this.setObjectNotExistsAsync(this.name + "." + this.instance + "." + serial + ".oldVersionCleaned", {
                type: "state",
                common: {
                    name: "Version check",
                    type: "string",
                    role: "meta.version",
                    write: false,
                    read: true,
                },
                native: {},
            });

            this.log.info("Done with cleaning");
        } else {
            try {
                //Preparation for next Version
                let oldVer = {"val":"2.0.1"};
                if (cleanOldVersion.common && cleanOldVersion.common.type && cleanOldVersion.common.type !== "string") {
                    cleanOldVersion.common.type = "string";
                    cleanOldVersion.common.name = "Version check";
                    cleanOldVersion.common.role = "meta.version";
                    await this.setForeignObjectAsync(this.name + "." + this.instance + "." + serial + ".oldVersionCleaned", cleanOldVersion);
                    this.log.debug(`Object ${serial}.oldVersionCleaned change boolean to number`);
                } else {
                    oldVer = await this.getStateAsync(serial + ".oldVersionCleaned");
                }
                if (this.version > oldVer.val && oldVer.val <= "2.0.2") {
                    const obj_fw = await this.getObjectAsync(this.name + "." + this.instance + "." + serial + ".mower.firmware");
                    if (obj_fw) {
                        if (obj_fw.common && obj_fw.common.type && obj_fw.common.type === "string") {
                            obj_fw.common.type = "number";
                            obj_fw.common.role = "meta.version";
                            obj_fw.common['def'] = 0;
                            await this.setForeignObjectAsync(this.name + "." + this.instance + "." + serial + ".mower.firmware", obj_fw);
                            this.log.debug(`Object ${serial}.mower.firmware change string to number`);
                        }
                    }
                }
            }
            catch (e) {
                this.log.info("cleanOldVersion: " + e);
            }
        }
        await this.setStateAsync(serial + ".oldVersionCleaned", {
            val: this.version,
            ack: true,
        });
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
