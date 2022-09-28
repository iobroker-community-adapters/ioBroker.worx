'use strict';

/*
 * Created with @iobroker/create-adapter v1.12.1
 */

// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
const utils = require('@iobroker/adapter-core');

// Load your modules here, e.g.:
const worxApi = require(`${__dirname}/lib/api`);
const JSON = require('circular-json');
const objects = require(`${__dirname}/lib/objects`);
const { extractKeys } = require('./lib/extractKeys');

const week = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const ERRORCODES = {
    0: 'No error',
    1: 'Trapped',
    2: 'Lifted',
    3: 'Wire missing',
    4: 'Outside wire',
    5: 'Raining',
    6: 'Close door to mow',
    7: 'Close door to go home',
    8: 'Blade motor blocked',
    9: 'Wheel motor blocked',
    10: 'Trapped timeout',
    11: 'Upside down',
    12: 'Battery low',
    13: 'Reverse wire',
    14: 'Charge error',
    15: 'Timeout finding home',
    16: 'Mower locked',
    17: 'Battery over temperature',
    18: 'dummy model',
    19: 'Battery trunk open timeout',
    20: 'wire sync',
    21: 'msg num',
};
const STATUSCODES = {
    0: 'IDLE',
    1: 'Home',
    2: 'Start sequence',
    3: 'Leaving home',
    4: 'Follow wire',
    5: 'Searching home',
    6: 'Searching wire',
    7: 'Mowing',
    8: 'Lifted',
    9: 'Trapped',
    10: 'Blade blocked',
    11: 'Debug',
    12: 'Remote control',
    13: 'escape from off limits',
    30: 'Going home',
    31: 'Zone training',
    32: 'Border Cut',
    33: 'Searching zone',
    34: 'Pause',
};
const COMMANDCODES = {
    1: 'Start',
    2: 'Stop',
    3: 'Home',
    4: 'Start Zone Taining',
    5: 'Lock',
    6: 'Unlock',
    7: 'Restart Robot',
    8: 'pause when follow wire',
    9: 'safe homing',
};
const WEATHERINTERVALL = 60000 * 60; // = 30 min.
let weatherTimeout = null;
let generic = 0;
let irrigation = 0;
let set_arr = 0;
let slots_save = [];

const modules = {};

class Worx extends utils.Adapter {
    /**
     * @param {Partial<ioBroker.AdapterOptions>} [options={}]
     */
    constructor(options) {
        super({
            ...options,
            name: 'worx',
        });
        this.on('ready', this.onReady.bind(this));
        this.on('objectChange', this.onObjectChange.bind(this));
        this.on('stateChange', this.onStateChange.bind(this));
        // this.on('message', this.onMessage.bind(this));
        this.on('unload', this.onUnload.bind(this));
    }

    /**
     * Is called when databases are connected and adapter received configuration.
     */
    async onReady() {
        // Initialize your adapter here

        // The adapters config (in the instance object everything under the attribute "native") is accessible via
        // this.config:
        //this.log.info('config e-mail: ' + this.config.mail);
        //this.log.info('config password: ' + this.config.password);

        this.setStateAsync('info.connection', {
            val: false,
            ack: true,
        });
        this.WorxCloud = new worxApi(this.config.mail, this.config.password, this);
        await this.WorxCloud.login();
        this.WorxCloud.on('connect', (worxc) => {
            this.log.debug('Sucess connect to Worx Server!');
            this.setStateAsync('info.connection', {
                val: true,
                ack: true,
            });
        });

        const that = this;
        this.WorxCloud.on('found', async function (mower) {
            //that.log.debug('found!' + JSON.stringify(mower));
            //delete unwanted instance information from object tree because of a 1.6.0 bug
            const instanceStates = await that.getObjectAsync(mower.serial + '.rawMqtt.worxInstance');

            if (instanceStates) {
                that.log.debug('clean instance states');
                that.delObject(mower.serial + '.rawMqtt.worxInstance', { recursive: true });
            }
            that.createDevices(mower).then((_) => {
                mower.status(that.WorxCloud).then((status) => {
                    // test
                    //status = testmsg;

                    //check if new FW functions
                    if (status && status.cfg && status.cfg.sc && status.cfg.sc.dd) {
                        that.log.info('found DoubleShedule, create states...');

                        // create States
                        week.forEach((day) => {
                            objects.calendar.map((o) =>
                                that.setObjectNotExistsAsync(`${mower.serial}.calendar.${day}2.${o._id}`, o)
                            );
                        });
                    }
                    if (
                        status &&
                        status.cfg &&
                        typeof status.cfg.sc !== 'undefined' &&
                        typeof status.cfg.sc.ots !== 'undefined'
                    ) {
                        that.log.info('found OneTimeShedule, create states...');

                        // create States
                        objects.oneTimeShedule.map((o) =>
                            that.setObjectNotExistsAsync(`${mower.serial}.mower.${o._id}`, o)
                        );
                    }

                    if (
                        status &&
                        status.cfg &&
                        status.cfg.sc &&
                        typeof status.cfg.sc.distm !== 'undefined' &&
                        typeof status.cfg.sc.m !== 'undefined'
                    ) {
                        that.log.info('found PartyModus, create states...');

                        // create States
                        objects.partyModus.map((o) =>
                            that.setObjectNotExistsAsync(`${mower.serial}.mower.${o._id}`, o)
                        );
                    }

                    //disable or enable weather
                    if (that.config.weather === true) {
                        objects.weather.map((o) => that.setObjectNotExistsAsync(`${mower.serial}.weather.${o._id}`, o));
                    } else if (that.config.weather === false) {
                        objects.weather.map((o) => that.delObj(`${mower.serial}.weather.${o._id}`));
                    }

                    // Json fpr weekmow
                    if (that.config.enableJson === true) {
                        that.setObjectNotExistsAsync(
                            `${mower.serial}.calendar.${objects.calJson[0]._id}`,
                            objects.calJson[0]
                        );
                        if (status && status.cfg && status.cfg.sc && status.cfg.sc.dd)
                            that.setObjectNotExistsAsync(
                                `${mower.serial}.calendar.${objects.calJson[0]._id}2`,
                                objects.calJson[0]
                            );
                    } else if (that.config.enableJson === false) {
                        that.delObj(`${mower.serial}.calendar.${objects.calJson[0]._id}`);
                        that.delObj(`${mower.serial}.calendar.${objects.calJson[0]._id}2`);
                    }

                    setTimeout(function () {
                        that.setStates(mower, status);
                        if (that.config.weather === true) that.UpdateWeather(mower);
                    }, 5000);

                    if (that.config.enableJson === true) {
                        that.log.debug(JSON.stringify(mower));
                        that.setObjectNotExistsAsync(`${mower.serial}.rawMqtt`, {
                            type: 'channel',
                            common: {
                                name: 'raw Mqtt response',
                            },
                            native: {},
                        })
                            .then(() => {
                                if (
                                    mower.raw &&
                                    mower.raw.auto_schedule_settings &&
                                    mower.raw.auto_schedule_settings.exclusion_scheduler
                                ) {
                                    Object.keys(mower.raw.auto_schedule_settings.exclusion_scheduler.days).forEach(
                                        async (key) => {
                                            if (
                                                Object.keys(
                                                    mower.raw.auto_schedule_settings.exclusion_scheduler.days[key][
                                                        'slots'
                                                    ]
                                                ).length < 4
                                            ) {
                                                generic = 0;
                                                irrigation = 0;
                                                slots_save =
                                                    mower.raw.auto_schedule_settings.exclusion_scheduler.days[key][
                                                        'slots'
                                                    ];
                                                mower.raw.auto_schedule_settings.exclusion_scheduler.days[key][
                                                    'slots'
                                                ] = [
                                                    { start_time: 0, duration: 0, reason: '' },
                                                    { start_time: 0, duration: 0, reason: '' },
                                                    { start_time: 0, duration: 0, reason: '' },
                                                    { start_time: 0, duration: 0, reason: '' },
                                                ];
                                                if (Object.keys(slots_save).length === 1) {
                                                    if (slots_save[0].reason === 'generic') {
                                                        set_arr = 0;
                                                    } else {
                                                        set_arr = 2;
                                                    }
                                                    mower.raw.auto_schedule_settings.exclusion_scheduler.days[key][
                                                        'slots'
                                                    ][set_arr].start_time = slots_save[0].start_time;
                                                    mower.raw.auto_schedule_settings.exclusion_scheduler.days[key][
                                                        'slots'
                                                    ][set_arr].duration = slots_save[0].duration;
                                                    mower.raw.auto_schedule_settings.exclusion_scheduler.days[key][
                                                        'slots'
                                                    ][set_arr].reason = slots_save[0].reason;
                                                } else if (Object.keys(slots_save).length > 1) {
                                                    Object.keys(slots_save).forEach(async (sl) => {
                                                        if (slots_save[sl].reason === 'generic' && generic === 0) {
                                                            set_arr = 0;
                                                            generic = 1;
                                                        } else if (
                                                            slots_save[sl].reason === 'generic' &&
                                                            generic === 1
                                                        ) {
                                                            set_arr = 1;
                                                        } else if (
                                                            slots_save[sl].reason === 'irrigation' &&
                                                            irrigation === 0
                                                        ) {
                                                            set_arr = 2;
                                                            irrigation = 2;
                                                        } else if (
                                                            slots_save[sl].reason === 'irrigation' &&
                                                            irrigation === 2
                                                        ) {
                                                            set_arr = 3;
                                                        }
                                                        mower.raw.auto_schedule_settings.exclusion_scheduler.days[key][
                                                            'slots'
                                                        ][set_arr].start_time = slots_save[sl].start_time;
                                                        mower.raw.auto_schedule_settings.exclusion_scheduler.days[key][
                                                            'slots'
                                                        ][set_arr].duration = slots_save[sl].duration;
                                                        mower.raw.auto_schedule_settings.exclusion_scheduler.days[key][
                                                            'slots'
                                                        ][set_arr].reason = slots_save[sl].reason;
                                                    });
                                                }
                                            }
                                        }
                                    );
                                }

                                extractKeys(that, `${mower.serial}.rawMqtt`, mower, null, true);
                            })
                            .catch((error) => {
                                that.log.error('Error while creating rawMqtt channel: ' + error);
                            });
                    } else {
                        that.getStates(`${mower.serial}.rawMqtt.*`, (err, states) => {
                            if (err || !states) {
                                that.log.error(`Can not get States: ${err.message}`);
                                return;
                            }
                            const allIds = Object.keys(states);
                            allIds.forEach((keyName) => {
                                that.delObject(keyName.split('.').slice(2).join('.'));
                            });
                            that.delObject(`${mower.serial}.rawMqtt`);
                        });
                    }
                });
            });
        });

        this.WorxCloud.on('mqtt', function (mower, data) {
            that.setStates(mower, data);
            if (that.config.enableJson === true) {
                if (
                    mower.raw.auto_schedule_settings &&
                    mower.raw.auto_schedule_settings.exclusion_scheduler &&
                    mower.raw.auto_schedule_settings.exclusion_scheduler.days &&
                    typeof mower.raw.auto_schedule_settings.exclusion_scheduler.days === 'object'
                ) {
                    Object.keys(mower.raw.auto_schedule_settings.exclusion_scheduler.days).forEach(async (key) => {
                        if (
                            Object.keys(mower.raw.auto_schedule_settings.exclusion_scheduler.days[key]['slots'])
                                .length < 4
                        ) {
                            generic = 0;
                            irrigation = 0;
                            slots_save = mower.raw.auto_schedule_settings.exclusion_scheduler.days[key]['slots'];
                            mower.raw.auto_schedule_settings.exclusion_scheduler.days[key]['slots'] = [
                                { start_time: 0, duration: 0, reason: '' },
                                { start_time: 0, duration: 0, reason: '' },
                                { start_time: 0, duration: 0, reason: '' },
                                { start_time: 0, duration: 0, reason: '' },
                            ];
                            if (Object.keys(slots_save).length === 1) {
                                if (slots_save[0].reason === 'generic') {
                                    set_arr = 0;
                                } else {
                                    set_arr = 2;
                                }
                                mower.raw.auto_schedule_settings.exclusion_scheduler.days[key]['slots'][
                                    set_arr
                                ].start_time = slots_save[0].start_time;
                                mower.raw.auto_schedule_settings.exclusion_scheduler.days[key]['slots'][
                                    set_arr
                                ].duration = slots_save[0].duration;
                                mower.raw.auto_schedule_settings.exclusion_scheduler.days[key]['slots'][
                                    set_arr
                                ].reason = slots_save[0].reason;
                            } else if (Object.keys(slots_save).length > 1) {
                                Object.keys(slots_save).forEach(async (sl) => {
                                    if (slots_save[sl].reason === 'generic' && generic === 0) {
                                        set_arr = 0;
                                        generic = 1;
                                    } else if (slots_save[sl].reason === 'generic' && generic === 1) {
                                        set_arr = 1;
                                    } else if (slots_save[sl].reason === 'irrigation' && irrigation === 0) {
                                        set_arr = 2;
                                        irrigation = 2;
                                    } else if (slots_save[sl].reason === 'irrigation' && irrigation === 2) {
                                        set_arr = 3;
                                    }
                                    mower.raw.auto_schedule_settings.exclusion_scheduler.days[key]['slots'][
                                        set_arr
                                    ].start_time = slots_save[sl].start_time;
                                    mower.raw.auto_schedule_settings.exclusion_scheduler.days[key]['slots'][
                                        set_arr
                                    ].duration = slots_save[sl].duration;
                                    mower.raw.auto_schedule_settings.exclusion_scheduler.days[key]['slots'][
                                        set_arr
                                    ].reason = slots_save[sl].reason;
                                });
                            }
                        }
                    });
                }
                extractKeys(that, `${mower.serial}.rawMqtt`, mower, null, true);
            }
        });

        this.WorxCloud.on('online', function (mower, state) {
            that.setStateAsync(`${mower.serial}.mower.online`, {
                val: true,
                ack: true,
            });
        });
        this.WorxCloud.on('offline', function (mower, state) {
            that.setStateAsync(`${mower.serial}.mower.online`, {
                val: false,
                ack: true,
            });
        });

        this.WorxCloud.on('error', (err) => {
            this.log.error(`ERROR: ${err}`);
            this.setStateAsync('info.connection', {
                val: false,
                ack: true,
            });
        });

        // in this template all states changes inside the adapters namespace are subscribed
        this.subscribeStates('*');
    }

    /**
     *
     * @param {string} id
     */
    async delObj(id) {
        try {
            await this.delObjectAsync(id);
        } catch (error) {
            //... do nothing
        }
    }

    /**
     * @param {object} mower Serialnumber of mower
     * @param {object} data JSON from mqtt
     */
    async setStates(mower, data) {
        const that = this;
        const mowerSerial = mower.serial;
        //mower set states
        const sequence = [];
        //data = testmsg
        that.log.debug(`GET MQTT DATA from API: ${JSON.stringify(data)}`);

        //catch error if onj is empty
        if (Object.keys(data).length === 0 && data.constructor === Object) {
            that.log.debug('GET Empty MQTT DATA from API');
            return;
        }

        // catch if JSON contain other data e.g. {"ota":"ota fail","mac":"XXXXXXXXXXXX"}"
        if (typeof data.dat === 'undefined' || typeof data.cfg === 'undefined') {
            that.log.info(`No data Message: ${JSON.stringify(data)}`);
            return;
        }
        try {
            if (that.config.meterMin) {
                that.setStateAsync(`${mowerSerial}.mower.totalTime`, {
                    val: data.dat.st && data.dat.st.wt ? parseFloat(data.dat.st.wt.toFixed(2)) : null,
                    ack: true,
                });
                that.setStateAsync(`${mowerSerial}.mower.totalDistance`, {
                    val: data.dat.st && data.dat.st.d ? parseFloat(data.dat.st.d.toFixed(2)) : null,
                    ack: true,
                });
                that.setStateAsync(`${mowerSerial}.mower.totalBladeTime`, {
                    val: data.dat.st && data.dat.st.b ? parseFloat(data.dat.st.b.toFixed(2)) : null,
                    ack: true,
                });
            } else {
                that.setStateAsync(`${mowerSerial}.mower.totalTime`, {
                    val: data.dat.st && data.dat.st.wt ? parseFloat((data.dat.st.wt / 6 / 10).toFixed(2)) : null,
                    ack: true,
                });
                that.setStateAsync(`${mowerSerial}.mower.totalDistance`, {
                    val: data.dat.st && data.dat.st.d ? parseFloat((data.dat.st.d / 100 / 10).toFixed(2)) : null,
                    ack: true,
                });
                that.setStateAsync(`${mowerSerial}.mower.totalBladeTime`, {
                    val: data.dat.st && data.dat.st.b ? parseFloat((data.dat.st.b / 6 / 10).toFixed(2)) : null,
                    ack: true,
                });
            }
            that.setStateAsync(`${mowerSerial}.mower.gradient`, {
                val: data.dat.dmp && data.dat.dmp[0] ? data.dat.dmp[0] : 0,
                ack: true,
            });
            that.setStateAsync(`${mowerSerial}.mower.inclination`, {
                val: data.dat.dmp && data.dat.dmp[1] ? data.dat.dmp[1] : 0,
                ack: true,
            });
            that.setStateAsync(`${mowerSerial}.mower.direction`, {
                val: data.dat.dmp && data.dat.dmp[2] ? data.dat.dmp[2] : 0,
                ack: true,
            });

            that.setStateAsync(`${mowerSerial}.mower.batteryChargeCycle`, {
                val: data.dat.bt && data.dat.bt.nr ? data.dat.bt.nr : null,
                ack: true,
            });
            that.setStateAsync(`${mowerSerial}.mower.batteryCharging`, {
                val: data.dat.bt && data.dat.bt.c ? true : false,
                ack: true,
            });
            that.setStateAsync(`${mowerSerial}.mower.batteryVoltage`, {
                val: data.dat.bt && data.dat.bt.v ? data.dat.bt.v : null,
                ack: true,
            });
            that.setStateAsync(`${mowerSerial}.mower.batteryTemperature`, {
                val: data.dat.bt && data.dat.bt.t ? data.dat.bt.t : null,
                ack: true,
            });
            that.setStateAsync(`${mowerSerial}.mower.error`, {
                val: data.dat && data.dat.le ? data.dat.le : 0,
                ack: true,
            });
            that.log.debug(`Test Status: ${data.dat && data.dat.ls ? data.dat.ls : 0}`);
            that.setStateAsync(`${mowerSerial}.mower.status`, {
                val: data.dat && data.dat.ls ? data.dat.ls : 0,
                ack: true,
            });

            that.setStateAsync(`${mowerSerial}.mower.wifiQuality`, {
                val: data.dat && data.dat.rsi ? data.dat.rsi : 0,
                ack: true,
            });
            that.setStateAsync(`${mowerSerial}.mower.mowerActive`, {
                val: data.cfg.sc && data.cfg.sc.m ? true : false,
                ack: true,
            });
            that.setStateAsync(`${mowerSerial}.mower.mowTimeExtend`, {
                val: data.cfg.sc && data.cfg.sc.p ? data.cfg.sc.p : 0,
                ack: true,
            });

            // sort Areas
            that.setStateAsync(`${mowerSerial}.areas.area_0`, {
                val: data.cfg.mz && data.cfg.mz[0] ? data.cfg.mz[0] : 0,
                ack: true,
            });
            that.setStateAsync(`${mowerSerial}.areas.area_1`, {
                val: data.cfg.mz && data.cfg.mz[1] ? data.cfg.mz[1] : 0,
                ack: true,
            });
            that.setStateAsync(`${mowerSerial}.areas.area_2`, {
                val: data.cfg.mz && data.cfg.mz[2] ? data.cfg.mz[2] : 0,
                ack: true,
            });
            that.setStateAsync(`${mowerSerial}.areas.area_3`, {
                val: data.cfg.mz && data.cfg.mz[3] ? data.cfg.mz[3] : 0,
                ack: true,
            });
            that.setStateAsync(`${mowerSerial}.areas.actualArea`, {
                val: data.dat && data.cfg && data.cfg.mzv ? data.cfg.mzv[data.dat.lz] : null,
                ack: true,
            });
            that.setStateAsync(`${mowerSerial}.areas.actualAreaIndicator`, {
                val: data.dat && data.dat.lz ? data.dat.lz : null,
                ack: true,
            });

            that.setStateAsync(`${mowerSerial}.mower.firmware`, {
                val: data.dat && data.dat.fw ? data.dat.fw.toString() : '-',
                ack: true,
            });
            that.setStateAsync(`${mowerSerial}.mower.waitRain`, {
                val: data.cfg.rd,
                ack: true,
            });
            data.dat.bt &&
                that.setStateAsync(`${mowerSerial}.mower.batteryState`, {
                    val: data.dat.bt.p,
                    ack: true,
                });

            if (data.cfg.mzv) {
                for (let i = 0; i < data.cfg.mzv.length; i++) {
                    //  adapter.setState("areas.startSequence", { val: data.cfg.mzv[i], ack: true });
                    sequence.push(data.cfg.mzv[i]);
                }
                that.setStateAsync(`${mowerSerial}.areas.startSequence`, {
                    val: JSON.stringify(sequence),
                    ack: true,
                });
            }

            const state = data.dat && data.dat.ls ? data.dat.ls : 0;
            const error = data.dat && data.dat.le ? data.dat.le : 0;

            if ((state === 7 || state === 9) && error === 0) {
                that.setStateAsync(`${mowerSerial}.mower.state`, {
                    val: true,
                    ack: true,
                });
            } else {
                that.setStateAsync(`${mowerSerial}.mower.state`, {
                    val: false,
                    ack: true,
                });
            }
            if (data.cfg.sc && data.cfg.sc.d) {
                evaluateCalendar(data.cfg.sc.d, false);
            }
            // Second Mowtime
            if (data.cfg.sc && data.cfg.sc.dd) {
                evaluateCalendar(data.cfg.sc.dd, true);
            }

            // 1TimeShedule
            if (data.cfg.sc && data.cfg.sc.ots) {
                that.setStateAsync(`${mowerSerial}.mower.oneTimeWithBorder`, {
                    val: data.cfg.sc.ots.bc ? true : false,
                    ack: true,
                });
                that.setStateAsync(`${mowerSerial}.mower.oneTimeWorkTime`, {
                    val: data.cfg.sc.ots.wtm,
                    ack: true,
                });
                that.setStateAsync(`${mowerSerial}.mower.oneTimeJson`, {
                    val: JSON.stringify(data.cfg.sc.ots),
                    ack: true,
                });
            }

            // PartyModus
            if (data.cfg.sc && typeof data.cfg.sc.distm !== 'undefined' && typeof data.cfg.sc.m !== 'undefined') {
                that.setStateAsync(`${mowerSerial}.mower.partyModus`, {
                    val: data.cfg.sc.m === 2 ? true : false,
                    ack: true,
                });
            }

            //JSON week
            if (that.config.enableJson === true) {
                that.setStateAsync(`${mowerSerial}.calendar.calJson`, {
                    val: JSON.stringify(data.cfg.sc.d),
                    ack: true,
                });
                if (data.cfg.sc && data.cfg.sc.dd) {
                    that.setStateAsync(`${mowerSerial}.calendar.calJson2`, {
                        val: JSON.stringify(data.cfg.sc.dd),
                        ack: true,
                    });
                }
            }

            // edgecutting
            if (mower.edgeCut && (state === 1 || state === 3)) {
                that.log.debug(`Edgecut Start section :${state}`);
            } else if (state === 31 && mower.edgeCut) {
                setTimeout(function () {
                    that.log.debug('Edgecut send cmd:2');
                    that.WorxCloud.sendMessage('{"cmd":2}', mowerSerial);
                }, that.config.edgeCutDelay);
            } else if (state === 34 && mower.edgeCut) {
                that.log.debug('Edgecut send cmd:3');
                that.WorxCloud.sendMessage('{"cmd":3}', mowerSerial);
                mower.edgeCut = false;
            } else if (mower.edgeCut === true && state !== 31 && state !== 34) {
                mower.edgeCut = false;
                that.log.warn('Something went wrong at edgeCut');
            }

            //
            //torque control found
            if (data && data.cfg && typeof data.cfg.tq !== 'undefined') {
                if (typeof modules['tq'] === 'undefined') {
                    that.log.info('found torque control, create states...');
                    await Promise.all(
                        objects.module_tq.map(async (o) => {
                            await this.setObjectNotExistsAsync(`${mower.serial}.mower.${o._id}`, o);
                        })
                    );
                }
                modules['tq'] = data.cfg.tq;
                that.setStateAsync(`${mowerSerial}.mower.torque`, {
                    val: parseInt(data.cfg.tq),
                    ack: true,
                });
            }

            //modules
            if (data.cfg.modules && !modules.channel) {
                await that.setObjectNotExistsAsync(`${mowerSerial}.modules`, {
                    type: 'channel',
                    common: {
                        name: 'mower modules',
                    },
                    native: {},
                });
                modules.channel = true;
            }

            //4G Module
            if (data.cfg.modules && data.cfg.modules['4G'] && data.cfg.modules['4G']['geo']) {
                if (!modules['4G']) {
                    await Promise.all(
                        objects.module_4g.map(async (o) => {
                            await this.setObjectNotExistsAsync(`${mowerSerial}.modules.4G.${o._id}`, o);
                            this.log.info(`GSP Module found! Create State : ${o._id}`);
                        })
                    );
                }
                modules['4G'] = data.cfg.modules['4G'];
                await this.setStateAsync(`${mowerSerial}.modules.4G.longitude`, {
                    val: data.cfg.modules['4G']['geo']['coo'][1],
                    ack: true,
                });
                await this.setStateAsync(`${mowerSerial}.modules.4G.latitude`, {
                    val: data.cfg.modules['4G']['geo']['coo'][0],
                    ack: true,
                });
            }
            //US Module
            if (data.cfg.modules && data.cfg.modules['US']) {
                if (!modules['US']) {
                    await Promise.all(
                        objects.US.map(async (o) => {
                            await this.setObjectNotExistsAsync(mowerSerial + '.modules.US.' + o._id, o);
                            this.log.info('ACS Module found! Create State : ' + o._id);
                        })
                    );
                }
                modules['US'] = data.cfg.modules['US'];
                await this.setStateAsync(mowerSerial + '.modules.US.ACS', {
                    val: data.cfg.modules['US']['enabled'],
                    ack: true,
                });
                await this.setStateAsync(mowerSerial + '.modules.US.ACS_Status', {
                    val: data.dat.modules['US']['stat'],
                    ack: true,
                });
            }
            // Df Module
            if (data.cfg.modules && data.cfg.modules.DF) {
                if (!modules.DF) {
                    await Promise.all(
                        objects.module_df.map(async (o) => {
                            await this.setObjectNotExistsAsync(`${mowerSerial}.modules.DF.${o._id}`, o);
                            this.log.info(`OffLimits Module found! Create State : ${o._id}`);
                        })
                    );
                }
                modules.DF = data.cfg.modules.DF;
                await this.setStateAsync(`${mowerSerial}.modules.DF.OLMSwitch_Cutting`, {
                    val: data.cfg.modules && data.cfg.modules.DF ? !!data.cfg.modules.DF.cut : false,
                    ack: true,
                });
                await this.setStateAsync(`${mowerSerial}.modules.DF.OLMSwitch_FastHoming`, {
                    val: data.cfg.modules && data.cfg.modules.DF ? !!data.cfg.modules.DF.fh : false,
                    ack: true,
                });
            }
            //Autolock feture
            if (data.cfg && data.cfg.al) {
                if (!modules.al) {
                    await Promise.all(
                        objects.al.map(async (o) => {
                            await this.setObjectNotExistsAsync(`${mowerSerial}.mower.${o._id}`, o);
                            this.log.info(`Autolock found! Create State : ${o._id}`);
                        })
                    );
                }
                modules.al = data.cfg.al;
                // save last positive Value
                if (data.cfg.al.t > 0) modules.al_last = data.cfg.al.t;

                await this.setStateAsync(`${mowerSerial}.mower.AutoLock`, {
                    val: !!data.cfg.al.lvl,
                    ack: true,
                });
                await this.setStateAsync(`${mowerSerial}.mower.AutoLockTimer`, {
                    val: data.cfg.al.t,
                    ack: true,
                });
            }
        } catch (error) {
            if (this.supportsFeature && this.supportsFeature('PLUGINS')) {
                const sentryInstance = this.getPluginInstance('sentry');
                if (sentryInstance) {
                    sentryInstance.getSentryObject().captureException(error, {
                        extra: {
                            'data:': JSON.stringify(data),
                        },
                    });
                }
            }
        }

        //Calendar
        /**
         * @param {Array} arr
         * @param {boolean} sec if sec is true, use second mowtime
         */
        function evaluateCalendar(arr, sec) {
            if (arr) {
                const secString = sec ? '2' : '';

                for (let i = 0; i < week.length; i++) {
                    that.setStateAsync(`${mowerSerial}.calendar.${week[i]}${secString}.startTime`, {
                        val: arr[i][0],
                        ack: true,
                    });
                    that.setStateAsync(`${mowerSerial}.calendar.${week[i]}${secString}.workTime`, {
                        val: arr[i][1],
                        ack: true,
                    });
                    that.setStateAsync(`${mowerSerial}.calendar.${week[i]}${secString}.borderCut`, {
                        val: arr[i][2] && arr[i][2] === 1 ? true : false,
                        ack: true,
                    });
                }
            }
        }
    }

    UpdateWeather(mower) {
        const that = this;

        that.log.debug(`Weather_ ${JSON.stringify(mower)}`);
        getWeather();
        weatherTimeout = setTimeout(getWeather, WEATHERINTERVALL);

        function getWeather() {
            mower
                .weather(that.WorxCloud)
                .then((weather) => {
                    clearTimeout(weatherTimeout);

                    that.log.debug(`Weather_ ${JSON.stringify(weather)}`);
                    that.log.debug(`Weather_d ${new Date(weather.dt * 1000)}`);

                    if (typeof weather === 'undefined') return;

                    that.setStateAsync(`${mower.serial}.weather.clouds`, {
                        val: weather.clouds.all | 0,
                        ack: true,
                    });
                    that.setStateAsync(`${mower.serial}.weather.description`, {
                        val: weather.weather[0].description || 'no data',
                        ack: true,
                    });
                    that.setStateAsync(`${mower.serial}.weather.main`, {
                        val: weather.weather[0].main || 'no data',
                        ack: true,
                    });
                    that.setStateAsync(`${mower.serial}.weather.icon`, {
                        val: weather.weather[0].icon || '',
                        ack: true,
                    });
                    that.setStateAsync(`${mower.serial}.weather.humidity`, {
                        val: parseInt(weather.main.humidity) | 0,
                        ack: true,
                    });
                    that.setStateAsync(`${mower.serial}.weather.temp`, {
                        val: weather.main.temp | 0,
                        ack: true,
                    });
                    that.setStateAsync(`${mower.serial}.weather.temp_min`, {
                        val: weather.main.temp_min | 0,
                        ack: true,
                    });
                    that.setStateAsync(`${mower.serial}.weather.temp_max`, {
                        val: weather.main.temp_max | 0,
                        ack: true,
                    });
                    that.setStateAsync(`${mower.serial}.weather.pressure`, {
                        val: weather.main.pressure | 0,
                        ack: true,
                    });
                    that.setStateAsync(`${mower.serial}.weather.wind_speed`, {
                        val: weather.wind.speed | 0,
                        ack: true,
                    });
                    that.setStateAsync(`${mower.serial}.weather.wind_deg`, {
                        val: weather.wind.deg | 0,
                        ack: true,
                    });
                    that.setStateAsync(`${mower.serial}.weather.lastUpdate`, {
                        val: weather.dt * 1000,
                        ack: true,
                    });

                    weatherTimeout = setTimeout(getWeather, WEATHERINTERVALL);
                })
                .catch((error) => {
                    that.log.debug(`Error while get Weather: ${error}`);

                    clearTimeout(weatherTimeout);
                    weatherTimeout = setTimeout(getWeather, WEATHERINTERVALL);
                });
        }
    }
    /**
     * @param {{ serial: string; raw: { name: string; }; }} mower
     */
    async createDevices(mower) {
        const that = this;
        await that.setObjectNotExistsAsync(mower.serial, {
            type: 'device',
            common: {
                name: mower.raw.name,
            },
            native: {},
        });
        await that.setObjectNotExistsAsync(`${mower.serial}.areas`, {
            type: 'channel',
            common: {
                name: 'mower areas',
            },
            native: {},
        });
        await that.setObjectNotExistsAsync(`${mower.serial}.calendar`, {
            type: 'channel',
            common: {
                name: 'mower calendar',
            },
            native: {},
        });
        await that.setObjectNotExistsAsync(`${mower.serial}.mower`, {
            type: 'channel',
            common: {
                name: 'mower control',
            },
            native: {},
        });
        await that.setObjectNotExistsAsync(`${mower.serial}.weather`, {
            type: 'channel',
            common: {
                name: 'mower control',
            },
            native: {},
        });

        for (let a = 0; a <= 3; a++) {
            await that.setObjectNotExistsAsync(`${mower.serial}.areas.area_${a}`, {
                type: 'state',
                common: {
                    name: `Area${a}`,
                    type: 'number',
                    role: 'value',
                    unit: 'm',
                    read: true,
                    write: true,
                    desc: `Distance from Start point for area ${a}`,
                },
                native: {},
            });
        }

        await that.setObjectNotExistsAsync(`${mower.serial}.areas.actualArea`, {
            type: 'state',
            common: {
                name: 'Actual area',
                type: 'number',
                role: 'value',
                read: true,
                write: false,
                desc: 'Show the current area',
            },
            native: {},
        });
        await that.setObjectNotExistsAsync(`${mower.serial}.areas.actualAreaIndicator`, {
            type: 'state',
            common: {
                name: 'Actual area',
                type: 'number',
                role: 'value',
                read: true,
                write: false,
                desc: 'Show the current area',
            },
            native: {},
        });
        await that.setObjectNotExistsAsync(`${mower.serial}.areas.startSequence`, {
            type: 'state',
            common: {
                name: 'Start sequence',
                type: 'object',
                role: 'value',
                read: true,
                write: true,
                desc: 'Sequence of area to start from',
            },
            native: {},
        });

        //calendar
        week.forEach(function (day) {
            objects.calendar.map((o) => that.setObjectNotExistsAsync(`${mower.serial}.calendar.${day}.${o._id}`, o));
        });
        // mower
        await that.setObjectNotExistsAsync(`${mower.serial}.mower.online`, {
            type: 'state',
            common: {
                name: 'Online',
                type: 'boolean',
                role: 'indicator.connected',
                read: true,
                write: false,
                desc: 'If mower connected to cloud',
            },
            native: {},
        });
        await that.setObjectNotExistsAsync(`${mower.serial}.mower.firmware`, {
            type: 'state',
            common: {
                name: 'Firmware Version',
                type: 'string',
                role: 'meta.version',
                read: true,
                write: false,
                desc: 'Firmware Version',
            },
            native: {},
        });
        await that.setObjectNotExistsAsync(`${mower.serial}.mower.wifiQuality`, {
            type: 'state',
            common: {
                name: 'Wifi quality',
                type: 'number',
                role: 'value',
                read: true,
                write: false,
                unit: 'dBm',
                desc: 'Prozent of Wifi quality',
            },
            native: {},
        });
        await that.setObjectNotExistsAsync(`${mower.serial}.mower.batteryChargeCycle`, {
            type: 'state',
            common: {
                name: 'Battery charge cycle',
                type: 'number',
                role: 'indicator',
                read: true,
                write: false,
                desc: 'Show the number of charging cycles',
            },
            native: {},
        });
        await that.setObjectNotExistsAsync(`${mower.serial}.mower.batteryCharging`, {
            type: 'state',
            common: {
                name: 'Battery charger state',
                type: 'boolean',
                role: 'indicator',
                read: true,
                write: false,
                desc: 'Battery charger state',
            },
            native: {},
        });
        await that.setObjectNotExistsAsync(`${mower.serial}.mower.batteryState`, {
            type: 'state',
            common: {
                name: 'Landroid battery state',
                type: 'number',
                role: 'value.battery',
                read: true,
                write: false,
                unit: '%',
                desc: 'Landroid mower battery state in %',
            },
            native: {},
        });
        await that.setObjectNotExistsAsync(`${mower.serial}.mower.batteryTemperature`, {
            type: 'state',
            common: {
                name: 'Battery temperature',
                type: 'number',
                role: 'value.temperature',
                read: true,
                write: false,
                unit: '°C',
                desc: 'Temperature of movers battery',
            },
            native: {},
        });
        await that.setObjectNotExistsAsync(`${mower.serial}.mower.batteryVoltage`, {
            type: 'state',
            common: {
                name: 'Battery voltage',
                type: 'number',
                role: 'value.voltage',
                read: true,
                write: false,
                unit: 'V',
                desc: 'Voltage of movers battery',
            },
            native: {},
        });
        await that.setObjectNotExistsAsync(`${mower.serial}.mower.error`, {
            type: 'state',
            common: {
                name: 'Error code',
                type: 'number',
                role: 'value.error',
                read: true,
                write: false,
                desc: 'Error code',
                states: ERRORCODES,
            },
            native: {},
        });
        await that.setObjectNotExistsAsync(`${mower.serial}.mower.pause`, {
            type: 'state',
            common: {
                name: 'Pause',
                type: 'boolean',
                role: 'button.stop',
                read: true,
                write: true,
                desc: 'Pause the mover',
            },
            native: {},
        });
        await that.setObjectNotExistsAsync(`${mower.serial}.mower.edgecut`, {
            type: 'state',
            common: {
                name: 'Edge cut',
                type: 'boolean',
                role: 'button.edgecut',
                read: true,
                write: true,
                desc: 'start edge cutting',
            },
            native: {},
        });
        await that.setObjectNotExistsAsync(`${mower.serial}.mower.state`, {
            type: 'state',
            common: {
                name: 'Start/Stop',
                type: 'boolean',
                role: 'switch',
                read: true,
                write: true,
                desc: 'Start and stop the mover',
            },
            native: {},
        });
        await that.setObjectNotExistsAsync(`${mower.serial}.mower.status`, {
            type: 'state',
            common: {
                name: 'Landroid status',
                type: 'number',
                role: 'indicator.status',
                read: true,
                write: false,
                desc: 'Current status of lawn mower',
                states: STATUSCODES,
            },
            native: {},
        });
        await that.setObjectNotExistsAsync(`${mower.serial}.mower.totalBladeTime`, {
            type: 'state',
            common: {
                name: 'Runtime of the blades',
                type: 'number',
                role: 'value.interval',
                read: true,
                write: false,
                unit: 'h',
                desc: 'Total blade is running',
            },
            native: {},
        });
        await that.setObjectNotExistsAsync(`${mower.serial}.mower.totalDistance`, {
            type: 'state',
            common: {
                name: 'Total mower distance',
                type: 'number',
                role: 'value.interval',
                read: true,
                write: false,
                unit: 'km',
                desc: 'Total distance the mower has been mowing in km',
            },
            native: {},
        });
        await that.setObjectNotExistsAsync(`${mower.serial}.mower.totalTime`, {
            type: 'state',
            common: {
                name: 'Total mower time',
                type: 'number',
                role: 'value.interval',
                read: true,
                write: false,
                unit: 'h',
                desc: 'Total distance the mower has been mowing in hours',
            },
            native: {},
        });
        await that.setObjectNotExistsAsync(`${mower.serial}.mower.waitRain`, {
            type: 'state',
            common: {
                name: 'Wait after rain',
                type: 'number',
                role: 'value.interval',
                read: true,
                write: true,
                unit: 'min',
                desc: 'Time to wait after rain, in minutes',
            },
            native: {},
        });
        await that.setObjectNotExistsAsync(`${mower.serial}.mower.mowTimeExtend`, {
            type: 'state',
            common: {
                name: 'Mowing times exceed',
                type: 'number',
                role: 'value',
                read: true,
                write: true,
                unit: '%',
                desc: 'Extend the mowing time',
            },
            native: {},
        });
        await that.setObjectNotExistsAsync(`${mower.serial}.mower.mowerActive`, {
            type: 'state',
            common: {
                name: 'Time-controlled mowing',
                type: 'boolean',
                role: 'switch',
                read: true,
                write: true,
                desc: 'Time-controlled mowing',
            },
            native: {},
        });
        await that.setObjectNotExistsAsync(`${mower.serial}.mower.sendCommand`, {
            type: 'state',
            common: {
                name: 'send Command',
                type: 'number',
                role: 'value',
                read: true,
                write: true,
                desc: 'send Command to Landroid',
                states: COMMANDCODES,
            },
            native: {},
        });
        await that.setObjectNotExistsAsync(`${mower.serial}.mower.gradient`, {
            type: 'state',
            common: {
                name: 'Gradient',
                type: 'number',
                role: 'value.interval',
                read: true,
                write: false,
                unit: '°',
                desc: 'Gradient from the mower',
            },
            native: {},
        });
        await that.setObjectNotExistsAsync(`${mower.serial}.mower.inclination`, {
            type: 'state',
            common: {
                name: 'Inclination',
                type: 'number',
                role: 'value.interval',
                read: true,
                write: false,
                unit: '°',
                desc: 'Inclination from the mower',
            },
            native: {},
        });
        await that.setObjectNotExistsAsync(`${mower.serial}.mower.direction`, {
            type: 'state',
            common: {
                name: 'Direction',
                type: 'number',
                role: 'value.interval',
                read: true,
                write: false,
                unit: '°',
                desc: 'Direction from the mower',
            },
            native: {},
        });

        this.extendObject(`${mower.serial}.mower.totalTime`, {
            common: {
                unit: that.config.meterMin ? 'min.' : 'h',
            },
        });
        this.extendObject(`${mower.serial}.mower.totalDistance`, {
            common: {
                unit: that.config.meterMin ? 'm' : 'Km',
            },
        });
        this.extendObject(`${mower.serial}.mower.totalBladeTime`, {
            common: {
                unit: that.config.meterMin ? 'min.' : 'h',
            },
        });

        return 'ready';
    }

    /**
     * Is called when adapter shuts down - callback has to be called under any circumstances!
     * @param {() => void} callback
     */
    onUnload(callback) {
        try {
            this.log.info('cleaned everything up...');
            this.WorxCloud.disconnect();
            callback();
        } catch (e) {
            callback();
        }
    }

    /**
     * Is called if a subscribed object changes
     * @param {string} id
     * @param {ioBroker.Object | null | undefined} obj
     */
    onObjectChange(id, obj) {
        if (obj) {
            // The object was changed
            this.log.debug(`object ${id} changed: ${JSON.stringify(obj)}`);
        } else {
            // The object was deleted
            this.log.debug(`object ${id} deleted`);
        }
    }

    /**
     * Is called if a subscribed state changes
     * @param {string} id
     * @param {ioBroker.State | null | undefined} state
     */
    onStateChange(id, state) {
        const that = this;

        if (state && !state.ack) {
            const command = id.split('.').pop();
            const mower_id = id.split('.')[2];
            const mower = that.WorxCloud.mower.find((device) => device.serial === mower_id);

            this.log.debug(
                `state change: id_____ ${id} Mower ${mower_id}_____${command}______${JSON.stringify(mower)}`
            );

            if (mower) {
                if (command == 'state') {
                    if (state.val === true) {
                        that.startMower(mower);
                    } else {
                        that.stopMower(mower);
                    }
                } else if (command == 'waitRain') {
                    const val = isNaN(state.val) || state.val < 0 ? 100 : parseInt(state.val);
                    that.WorxCloud.sendMessage(`{"rd":${val}}`, mower.serial);
                    this.log.debug(`Changed time wait after rain to:${val}`);
                } else if (command === 'borderCut' || command === 'startTime' || command === 'workTime') {
                    that.changeMowerCfg(id, state.val, mower);
                } else if (
                    command === 'area_0' ||
                    command === 'area_1' ||
                    command === 'area_2' ||
                    command === 'area_3'
                ) {
                    that.changeMowerArea(id, parseInt(state.val), mower);
                } else if (command === 'startSequence') {
                    that.startSequences(id, state.val, mower);
                } else if (command === 'pause') {
                    if (state.val === true) {
                        that.WorxCloud.sendMessage('{"cmd":2}', mower.serial);
                    }
                } else if (command === 'mowTimeExtend') {
                    that.mowTimeEx(id, parseInt(state.val), mower);
                } else if (command === 'mowerActive' && mower.message && mower.message.cfg && mower.message.cfg.sc) {
                    const val = state.val ? 1 : 0;
                    const message = mower.message.cfg.sc;

                    //hotfix 030620
                    delete message.ots;
                    delete message.distm;

                    message.m = val;
                    that.WorxCloud.sendMessage(`{"sc":${JSON.stringify(message)}}`, mower.serial);
                    that.log.debug(`Mow times disabled: ${message.m}`);
                } else if (command === 'edgecut') {
                    that.edgeCutting(id, state.val, mower);
                } else if (command === 'sendCommand') {
                    that.sendCommand(state.val, mower);
                } else if (command === 'oneTimeStart' || command === 'oneTimeJson') {
                    that.startOneShedule(id, state.val, mower);
                } else if (command === 'partyModus') {
                    that.sendPartyModus(id, state.val, mower);
                } else if (command === 'calJson' || command === 'calJson2') {
                    that.changeWeekJson(id, state.val, mower);
                } else if (command === 'AutoLock') {
                    const msg = modules.al;
                    msg.lvl = state.val | 0;
                    that.WorxCloud.sendMessage(`{"al":${JSON.stringify(msg)}}`, mower.serial);
                } else if (command === 'AutoLockTimer') {
                    if (state.val < 0 || state.val > 600) {
                        this.log.warn('Please use value between 0 and 600 for Autolocktimer');
                        return;
                    }
                    const msg = modules.al;
                    msg.t = parseInt(state.val);
                    that.WorxCloud.sendMessage(`{"al":${JSON.stringify(msg)}}`, mower.serial);
                } else if (command === 'OLMSwitch_Cutting' && modules.DF) {
                    const msg = modules.DF;
                    msg.cut = state.val | 0;
                    that.WorxCloud.sendMessage(`{"modules":{"DF":${JSON.stringify(msg)}}}`, mower.serial);
                } else if (command === 'OLMSwitch_FastHoming' && modules.DF) {
                    const msg = modules.DF;
                    msg.fh = state.val | 0;
                    that.WorxCloud.sendMessage(`{"modules":{"DF":${JSON.stringify(msg)}}}`, mower.serial);
                } else if (command === 'ACS' && modules.US) {
                    const msg = modules.US;
                    msg.enabled = state.val | 0;
                    that.WorxCloud.sendMessage('{"modules":{"US":' + JSON.stringify(msg) + '}}', mower.serial);
                } else if (command === 'torque') {
                    if (state.val < -50 || state.val > 50) return;
                    const tqval = parseInt(state.val);
                    that.WorxCloud.sendMessage(`{"tq":${tqval}}`, mower.serial);
                }
            } else that.log.error(`No mower found!  ${JSON.stringify(that.WorxCloud)}`);
        }
    }

    /**
     * @param {object} mower
     */
    async startMower(mower) {
        const that = this;

        that.log.debug(`Start mower ${JSON.stringify(mower)}`);
        that.log.debug(`Start mowerff ${JSON.stringify(that.WorxCloud.mower)}`);

        if (
            mower.message &&
            mower.message.dat &&
            (mower.message.dat.ls === 1 || mower.message.dat.ls === 34) &&
            mower.message.dat.le === 0
        ) {
            that.WorxCloud.sendMessage('{"cmd":1}', mower.serial); //start code for mower
            that.log.debug('Start mower');
        } else {
            that.log.warn(
                'Can not start mower because he is not at home or there is an error please verify mower state'
            );
            that.setStateAsync(`${mower.serial}.mower.state`, {
                val: false,
                ack: true,
            });
        }
    }

    /**
     * @param {object} mower
     */
    stopMower(mower) {
        if (mower.message && mower.message.dat && mower.message.dat.ls === 7 && mower.message.dat.le === 0) {
            this.WorxCloud.sendMessage('{"cmd":3}', mower.serial); //"Back to home" code for mower
            this.log.debug('mower going back home');
        } else {
            this.log.warn('Can not stop mower because he did not mow or there is an error');
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
        const idType = id.split('.')[4];

        if (idType === 'oneTimeStart') {
            const bc = await this.getStateAsync(`${mower.serial}.mower.oneTimeWithBorder`);
            const wtm = await this.getStateAsync(`${mower.serial}.mower.oneTimeWorkTime`);
            if (bc && wtm) {
                msgJson = {
                    bc: bc.val ? 1 : 0,
                    wtm: wtm.val,
                };
            }
        } else if (idType === 'oneTimeJson') {
            try {
                msgJson = JSON.parse(value);

                if (typeof msgJson.bc === 'undefined' || typeof msgJson.wtm === 'undefined') {
                    this.log.error('ONETIMESHEDULE: NO vailed format. must contain "bc" and "wtm"');
                    return;
                }
            } catch (error) {
                this.log.error('ONETIMESHEDULE: NO vailed JSON format');
                return;
            }
        }

        this.log.debug(`ONETIMESHEDULE: ${JSON.stringify(msgJson)}`);
        this.WorxCloud.sendMessage(`{"sc":{"ots":${JSON.stringify(msgJson)}}}`, mower.serial);
    }

    /**
     * @param {string} id id of state
     * @param {object} mower object of mower that changed
     * @param {any} value string of Json
     */
    async changeWeekJson(id, value, mower) {
        const that = this;
        let msgJson;
        const sheduleSel = id.split('.')[4].search('2') === -1 ? 'd' : 'dd';
        let fail = false;
        const idType = id.split('.')[4];
        const message = mower.message.cfg.sc;

        message.ots && delete message.ots;
        message.distm && delete message.distm;

        try {
            msgJson = JSON.parse(value);
            if (msgJson.length !== 7) {
                this.log.error('CALJSON: Json length not correct must be 7 Days');
                fail = true;
            }
            msgJson.forEach((element) => {
                this.log.debug(`CALJSON: ${JSON.stringify(element)}`);
                if (element.length !== 3) {
                    that.log.error('CALJSON: Arguments missing!!');
                    fail = true;
                }
                if (element[2] === 0 || element[2] === 1) {
                    // no vailed border value
                } else {
                    that.log.error('CALJSON: Bordercut shoulg be 0 or 1!!');
                    fail = true;
                }
                const h = element[0].split(':')[0];
                const m = element[0].split(':')[1];
                that.log.debug(`h: ${h} m: ${m}`);
                if (h < 0 || h > 23 || m < 0 || m > 59) {
                    that.log.error('CALJSON: Start time is not correct!!');
                    fail = true;
                }

                if (element[1] < 0 || element[1] > 1440) {
                    that.log.error('Time out of range 0 min < time < 1440 min.');
                    fail = true;
                }
            });

            this.log.debug(`CALJSON length: ${msgJson.length}`);
        } catch (error) {
            this.log.error('CALJSON: NO vailed JSON format');
            fail = true;
        }

        fail && this.log.debug(`FAIL: ${fail} CALJSON: ${JSON.stringify(msgJson)}`);
        message[sheduleSel] = msgJson;
        if (!fail) that.WorxCloud.sendMessage(`{"sc":${JSON.stringify(message)}}`, mower.serial);
    }

    /**
     * @param {string} id id of state
     * @param {any} value value that changed
     * @param {object} mower object of mower that changed
     */
    changeMowerCfg(id, value, mower) {
        const that = this;

        const val = value;
        let sval, dayID;

        if (!mower.message || typeof mower.message.cfg === 'undefined') {
            // check if config exist
            that.log.warn(
                `Cant send command because no Configdata from cloud exist please try again later. last message: ${JSON.stringify(
                    mower.message
                )}`
            );
            return;
        }

        //find number 2 for second shedule
        const sheduleSel = id.split('.')[4].search('2') === -1 ? 'd' : 'dd';
        const message = mower.message.cfg.sc; // set actual values
        //let fullMessage = mower.message.cfg.sc;

        if (typeof message === 'undefined') {
            that.log.warn('try again later!');
            return;
        }
        message.ots && delete message.ots;
        message.distm && delete message.distm;

        const valID = ['startTime', 'workTime', 'borderCut'].indexOf(id.split('.')[5]);

        if (sheduleSel === 'd') {
            dayID = week.indexOf(id.split('.')[4]);
        } else {
            const modWeekday = id.split('.')[4];

            //erase the number 2
            dayID = week.indexOf(modWeekday.substring(0, modWeekday.length - 1));
        }

        try {
            if (valID === 2) {
                // changed the border cut
                sval = valID === 2 && val === true ? 1 : 0;
            } else if (valID === 0) {
                // changed the start time
                const h = val.split(':')[0];
                const m = val.split(':')[1];
                that.log.debug(`h: ${h} m: ${m}`);
                if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
                    sval = val;
                } else that.log.error('Time out of range: e.g "10:00"');
            } else if (valID === 1) {
                // changed the worktime
                if (val >= 0 && val <= 1440) {
                    sval = parseInt(val);
                } else that.log.error('Time out of range 0 min < time < 1440 min.');
            } else that.log.error('Something went wrong while setting new mower times');
        } catch (e) {
            that.log.error(`Error while setting mower config: ${e}`);
        }
        if (sval !== undefined) {
            if (
                typeof message[sheduleSel] === 'undefined' ||
                typeof message[sheduleSel][dayID] === 'undefined' ||
                typeof message[sheduleSel][dayID][valID] === 'undefined'
            ) {
                that.log.warn('Something went wrong, plese try again later');
                return;
            }
            message[sheduleSel][dayID][valID] = sval;
            that.log.debug(`Mowing time change at ${sheduleSel} to: ${JSON.stringify(message)}`);
            that.WorxCloud.sendMessage(`{"sc":${JSON.stringify(message)}}`, mower.serial);
        }
        that.log.debug(`test cfg: ${dayID} valID: ${valID} val: ${val} sval: ${sval}`);
    }
    /**
     * @param {string} id
     * @param {any} value
     * @param {{ message: any; sendMessage: (arg0: string) => void; }} mower
     */
    changeMowerArea(id, value, mower) {
        const that = this;
        const val = value;

        if ((mower.message && typeof mower.message.cfg === 'undefined') || typeof mower.message === 'undefined') {
            // check if config exist
            that.log.warn(
                `Cant send command because no Configdata from cloud exist please try again later. last message: ${JSON.stringify(
                    mower.message
                )}`
            );
            return;
        }

        const message = mower.message.cfg.mz; // set actual values
        const areaID = Number(id.split('_').pop());

        try {
            if (!isNaN(val) && val >= 0 && val <= 500) {
                message[areaID] = val;
                that.WorxCloud.sendMessage(`{"mz":${JSON.stringify(message)}}`, mower.serial);
                that.log.debug(`Change Area ${areaID} : ${JSON.stringify(message)}`);
            } else {
                that.log.error('Area Value ist not correct, please type in a val between 0 and 500');
                that.setState(`areas.area_${areaID}`, {
                    val: mower.message.cfg.mz && mower.message.cfg.mz[areaID] ? mower.message.cfg.mz[areaID] : 0,
                    ack: true,
                });
            }
        } catch (e) {
            that.log.error(`Error while setting mower areas: ${e}`);
        }
    }

    /**
     * @param {string} id
     * @param {any} value
     * @param {{ message: any; sendMessage: (arg0: string) => void; }} mower
     */
    sendPartyModus(id, value, mower) {
        if (value) {
            this.WorxCloud.sendMessage('{"sc":{ "m":2, "distm": 0}}', mower.serial);
        } else {
            this.WorxCloud.sendMessage('{"sc":{ "m":1, "distm": 0}}', mower.serial);
        }
    }

    /**
     * @param {string} id
     * @param {any} value
     * @param {object} mower
     */
    startSequences(id, value, mower) {
        const that = this;

        if (typeof mower.message.cfg === 'undefined') {
            // check if config exist
            that.log.warn(
                `Cant send command because no Configdata from cloud exist please try again later. last message: ${JSON.stringify(
                    mower.message
                )}`
            );
            return;
        }

        const message = mower.message.cfg.mz; // set aktual values
        let seq = [];
        try {
            seq = JSON.parse(value);
        } catch (e) {
            try {
                seq = JSON.parse(`[${value}]`);
            } catch (e) {
                that.log.error(`Error while setting start sequence: ${e}`);
            }
        }

        try {
            for (let i = 0; i < 10; i++) {
                if (seq[i] != undefined) {
                    if (isNaN(seq[i]) || seq[i] < 0 || seq[i] > 3) {
                        seq[i] = 0;
                        that.log.error(`Wrong start sequence, set val ${i} to 0`);
                    }
                } else {
                    seq[i] = 0;
                    that.log.warn('Array ist too short, filling up with start point 0');
                }
            }
            that.WorxCloud.sendMessage(`{"mzv":${JSON.stringify(seq)}}`, mower.serial);
            that.log.debug(`new Array is: ${JSON.stringify(seq)}`);
        } catch (e) {
            that.log.error(`Error while setting start sequence: ${e}`);
        }
    }

    /**
     * @param {string} id
     * @param {any} value
     * @param {object} mower
     */
    mowTimeEx(id, value, mower) {
        const that = this;
        const val = value;

        if (typeof mower.message.cfg === 'undefined') {
            // check if config exist
            that.log.warn(
                `Cant send command because no Configdata from cloud exist please try again later. last message: ${JSON.stringify(
                    mower.message
                )}`
            );
            return;
        }

        const message = mower.message.cfg.sc; // set aktual values

        that.log.debug(`MowerTimeExtend JSON : ${JSON.stringify(message)}`);

        //hotfix 030620
        message && delete message.ots;

        if (!isNaN(val) && val >= -100 && val <= 100) {
            message.p = val;
            that.WorxCloud.sendMessage(`{"sc":${JSON.stringify(message)}}`, mower.serial);
            that.log.debug(`MowerTimeExtend set to : ${message.p}`);
        } else {
            that.log.error('MowerTimeExtend must be a value between -100 and 100');
        }
    }

    /**
     * @param {string} id
     * @param {any} value
     * @param {object} mower
     */
    edgeCutting(id, value, mower) {
        const that = this;
        const val = value;

        if (typeof mower.message.cfg === 'undefined') {
            // check if config exist
            that.log.warn(
                `Cant send command because no Configdata from cloud exist please try again later. last message: ${JSON.stringify(
                    mower.message
                )}`
            );
            return;
        }

        if (
            val === true &&
            mower.message &&
            mower.message.cfg &&
            mower.message.cfg.sc &&
            typeof mower.message.cfg.sc.ots === 'undefined'
        ) {
            mower.edgeCut = true;
            that.WorxCloud.sendMessage('{"cmd":4}', mower.serial); // starte ZoneTraining
        } else if (
            val === true &&
            mower.message &&
            mower.message.cfg &&
            mower.message.cfg.sc &&
            mower.message.cfg.sc.ots
        ) {
            that.WorxCloud.sendMessage('{"sc":{"ots":{"bc":1,"wtm":0}}}', mower.serial);
        } else {
            that.log.warn('EdgeCutting is not possible');
        }
    }

    async sendCommand(value, mower) {
        const that = this;
        const val = value;

        that.log.debug(`Send cmd:${val}`);
        that.WorxCloud.sendMessage(`{"cmd":${val}}`, mower.serial);
    }

    // /**
    //  * Some message was sent to this instance over message box. Used by email, pushover, text2speech, ...
    //  * Using this method requires "common.message" property to be set to true in io-package.json
    //  * @param {ioBroker.Message} obj
    //  */
    // onMessage(obj) {
    // 	if (typeof obj === 'object' && obj.message) {
    // 		if (obj.command === 'send') {
    // 			// e.g. send email or pushover or whatever
    // 			this.log.info('send command');

    // 			// Send response in callback if required
    // 			if (obj.callback) this.sendTo(obj.from, obj.command, 'Message received', obj.callback);
    // 		}
    // 	}
    // }
}

if (module.parent) {
    // Export the constructor in compact mode
    /**
     * @param {Partial<ioBroker.AdapterOptions>} [options={}]
     */
    module.exports = (options) => new Worx(options);
} else {
    // otherwise start the instance directly
    new Worx();
}
