'use strict';


const utils = require('@iobroker/adapter-core');
const worx = require(__dirname + '/lib/api');

/**
 * The adapter instance
 * @type {ioBroker.Adapter}
 */
let adapter;

const week = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
/**
 * Starts the adapter instance
 * @param {Partial<ioBroker.AdapterOptions>} [options]
 */
function startAdapter(options) {
    // Create the adapter and define its methods
    return adapter = utils.adapter(Object.assign({}, options, {
        name: 'worx',

        // The ready callback is called when databases are connected and adapter received configuration.
        // start here!
        ready: main, // Main method defined below for readability

        // is called when adapter shuts down - callback has to be called under any circumstances!
        unload: (callback) => {
            try {
                adapter.log.info('cleaned everything up...');
                callback();
            } catch (e) {
                callback();
            }
        },

        // is called if a subscribed object changes
        objectChange: (id, obj) => {
            if (obj) {
                // The object was changed
                adapter.log.info(`object ${id} changed: ${JSON.stringify(obj)}`);
            } else {
                // The object was deleted
                adapter.log.info(`object ${id} deleted`);
            }
        },

        // is called if a subscribed state changes
        stateChange: (id, state) => {
            if (state) {
                // The state was changed
                adapter.log.info(`state ${id} changed: ${state.val} (ack = ${state.ack})`);
            } else {
                // The state was deleted
                adapter.log.info(`state ${id} deleted`);
            }
        },

        // Some message was sent to adapter instance over message box. Used by email, pushover, text2speech, ...
        // requires "common.message" property to be set to true in io-package.json
        // message: (obj) => {
        // 	if (typeof obj === "object" && obj.message) {
        // 		if (obj.command === "send") {
        // 			// e.g. send email or pushover or whatever
        // 			adapter.log.info("send command");

        // 			// Send response in callback if required
        // 			if (obj.callback) adapter.sendTo(obj.from, obj.command, "Message received", obj.callback);
        // 		}
        // 	}
        // },
    }));
}

function main() {

    // The adapters config (in the instance object everything under the attribute "native") is accessible via
    // adapter.config:
    adapter.log.info('config e-mail: ' + adapter.config.mail);
    adapter.log.info('config password: ' + adapter.config.password);
    adapter.log.info('config mower: ' + adapter.config.mower);

    adapter.setState('info.connection', false, true);
    const WorxCloud = new worx(adapter.config.mail, adapter.config.password);

    WorxCloud.on('connect', worxc => {
        adapter.log.info('sucess conect!');
        adapter.setState('info.connection', true, true);


    });
    WorxCloud.on('found', mower => {
        adapter.log.info('found!' + JSON.stringify(mower));
        createDevices(mower);
    });

    WorxCloud.on('error', err => {
        adapter.log.error('ERROR: ' + err);
        adapter.setState('info.connection', false, true);
    });

    // Reset connection state at start
    adapter.setState('info.connection', false, true);

    /*
        For every state in the system there has to be also an object of type state
        Here a simple template for a boolean variable named "testVariable"
        Because every adapter instance uses its own unique namespace variable names can't collide with other adapters variables
    */
    adapter.setObject('testVariable', {
        type: 'state',
        common: {
            name: 'testVariable',
            type: 'boolean',
            role: 'indicator',
            read: true,
            write: true,
        },
        native: {},
    });

    // in this template all states changes inside the adapters namespace are subscribed
    adapter.subscribeStates('*');

    /*
        setState examples
        you will notice that each setState will cause the stateChange event to fire (because of above subscribeStates cmd)
    */
    // the variable testVariable is set to true as command (ack=false)
    adapter.setState('testVariable', true);

    // same thing, but the value is flagged "ack"
    // ack should be always set to true if the value is received from or acknowledged from the target system
    adapter.setState('testVariable', {
        val: true,
        ack: true
    });

    // same thing, but the state is deleted after 30s (getState will return null afterwards)
    adapter.setState('testVariable', {
        val: true,
        ack: true,
        expire: 30
    });

    // examples for the checkPassword/checkGroup functions
    adapter.checkPassword('admin', 'iobroker', (res) => {
        adapter.log.info('check user admin pw ioboker: ' + res);
    });

    adapter.checkGroup('admin', 'admin', (res) => {
        adapter.log.info('check group user admin group admin: ' + res);
    });
}
/**
 * @param {Object} mower
 */
function createDevices(mower) {

    adapter.setObjectNotExists(mower.serial, {
        type: 'device',
        role: 'mower',
        common: {
            name: mower.raw.name
        },
        native: {}
    });
    adapter.setObjectNotExists(mower.serial + '.areas', {
        type: 'channel',
        role: 'mower.areas',
        common: {
            name: 'mower areas'
        },
        native: {}
    });
    adapter.setObjectNotExists(mower.serial + '.calendar', {
        type: 'channel',
        role: 'mower.calendar',
        common: {
            name: 'mower calendar'
        },
        native: {}
    });
    adapter.setObjectNotExists(mower.serial + '.mower', {
        type: 'channel',
        role: 'mower.control',
        common: {
            name: 'mower control'
        },
        native: {}
    });

    for (let a = 0; a <= 3; a++) {

        adapter.setObjectNotExists(mower.serial + '.areas.area_' + a, {
            type: 'state',
            common: {
                name: 'Area' + a,
                type: 'number',
                role: 'value',
                unit: 'm',
                read: true,
                write: true,
                desc: 'Distance from Start point for area ' + a
            },
            native: {}
        });
    }

    adapter.setObjectNotExists(mower.serial + '.areas.actualArea', {
        type: 'state',
        common: {
            name: 'Actual area',
            type: 'number',
            role: 'value',
            read: true,
            write: false,
            desc: 'Show the current area'
        },
        native: {}
    });
    adapter.setObjectNotExists(mower.serial + '.areas.startSequence', {
        type: 'state',
        common: {
            name: 'Start sequence',
            type: 'string',
            role: 'value',
            read: true,
            write: true,
            desc: 'Sequence of area to start from'
        },
        native: {}
    });

    //calendar
    week.forEach(function (day) {
        adapter.setObjectNotExists(mower.serial + '.calendar.' + day + '.borderCut', {
            type: 'state',
            common: {
                name: 'Border cut',
                type: 'boolean',
                role: 'switch',
                read: true,
                write: true,
                desc: 'The mower cut border today'
            },
            native: {}
        });
        adapter.setObjectNotExists(mower.serial + '.calendar.' + day + '.startTime', {
            type: 'state',
            common: {
                name: 'Start time',
                type: 'string',
                role: 'value.datetime',
                read: true,
                write: true,
                desc: 'Hour:Minutes on' + day + ' that the Landroid should start mowing'
            },
            native: {}
        });
        adapter.setObjectNotExists(mower.serial + '.calendar.' + day + '.workTime', {
            type: 'state',
            common: {
                name: 'Work time',
                type: 'number',
                role: 'value.interval',
                unit: 'min.',
                read: true,
                write: true,
                desc: 'Decides for how long the mower will work on ' + day
            },
            native: {}
        });
    });
    // info
    adapter.setObjectNotExists(mower.serial + '.mower.online', {
        type: 'state',
        common: {
            name: 'Online',
            type: 'boolean',
            role: 'indicator.connected',
            read: true,
            write: false,
            desc: 'If mower connected to cloud'
        },
        native: {}
    });
    adapter.setObjectNotExists(mower.serial + '.mower.firmware', {
        type: 'state',
        common: {
            name: 'Firmware Version',
            type: 'string',
            role: 'meta.version',
            read: true,
            write: false,
            desc: 'Firmware Version'
        },
        native: {}
    });
    adapter.setObjectNotExists(mower.serial + '.mower.wifiQuality', {
        type: 'state',
        common: {
            name: 'Wifi quality',
            type: 'number',
            role: 'value',
            read: true,
            write: false,
            unit : 'dBm',
            desc: 'Prozent of Wifi quality'
        },
        native: {}
    });
}

if (module.parent) {
    // Export startAdapter in compact mode
    module.exports = startAdapter;
} else {
    // otherwise start the instance directly
    startAdapter();
}