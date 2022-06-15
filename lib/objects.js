module.exports = {
    'calendar': [{
        _id: 'borderCut',
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
    },
    {
        _id: 'startTime',
        type: 'state',
        common: {
            name: 'Start time',
            type: 'string',
            role: 'value.datetime',
            read: true,
            write: true,
            desc: 'Hour:Minutes on this day that the Landroid should start mowing'
        },
        native: {}
    },
    {
        _id: 'workTime',
        type: 'state',
        common: {
            name: 'Work time',
            type: 'number',
            role: 'value.interval',
            unit: 'min.',
            read: true,
            write: true,
            desc: 'Decides for how long the mower will work on this day'
        },
        native: {}
    }
    ],
    'calJson':[{
        _id: 'calJson',
        type: 'state',
        common: {
            name: 'week Json',
            type: 'string',
            role: 'value',
            read: true,
            write: true,
            desc: 'set one time shedule via script with a json'
        },
        native: {}
    }],
    'oneTimeShedule': [{
        _id: 'oneTimeWorkTime',
        type: 'state',
        common: {
            name: 'Work time in minutes',
            type: 'number',
            role: 'value',
            read: true,
            write: true,
            Unit: 'min.',
            desc: 'Minutes the mower shoud mow'
        },
        native: {}
    },
    {
        _id: 'oneTimeWithBorder',
        type: 'state',
        common: {
            name: 'With border',
            type: 'boolean',
            role: 'switch',
            read: true,
            write: true,
            desc: 'One time with border'
        },
        native: {}
    },
    {
        _id: 'oneTimeStart',
        type: 'state',
        common: {
            name: 'start one time shedule',
            type: 'boolean',
            role: 'button',
            read: true,
            write: true,
            Unit: 'min.',
            desc: 'start one time shedule'
        },
        native: {}
    },
    {
        _id: 'oneTimeJson',
        type: 'state',
        common: {
            name: 'One time Json',
            type: 'string',
            role: 'value',
            read: true,
            write: true,
            Unit: 'min.',
            desc: 'set one time shedule via script with a json'
        },
        native: {}
    }
    ],
    'partyModus': [{
        _id: 'partyModus',
        type: 'state',
        common: {
            name: 'Party mode',
            type: 'boolean',
            role: 'switch',
            read: true,
            write: true,
            desc: 'Disabel mowtimes'
        },
        native: {}
    }],
    'weather': [{
        _id: 'temp',
        type: 'state',
        common: {
            name: 'temperature',
            type: 'number',
            role: 'value.temperature',
            read: true,
            write: false,
            unit: '°C',
            desc: 'actual temperature'
        },
        native: {}
    },
    {
        _id: 'icon',
        type: 'state',
        common: {
            name: 'icon',
            type: 'string',
            role: 'weather.icon.name',
            read: true,
            write: false,
            desc: 'icon'
        },
        native: {}
    },
    {
        _id: 'main',
        type: 'state',
        common: {
            name: 'main',
            type: 'string',
            role: 'weather.name',
            read: true,
            write: false,
            desc: 'Weather string'
        },
        native: {}
    },
    {
        _id: 'description',
        type: 'state',
        common: {
            name: 'description',
            type: 'string',
            role: 'weather.description',
            read: true,
            write: false,
            desc: 'Weather description'
        },
        native: {}
    },
    {
        _id:'pressure',
        type: 'state',
        common: {
            name: 'pressure',
            type: 'number',
            role: 'value.pressure',
            read: true,
            write: false,
            desc: 'Weather pressure'
        },
        native: {}
    },
    {
        _id:'humidity',
        type: 'state',
        common: {
            name: 'humidity',
            type: 'number',
            role: 'value.humidity',
            read: true,
            write: false,
            unit: '%',
            desc: 'Weather humidity'
        },
        native: {}
    },
    {
        _id:'temp_min',
        type: 'state',
        common: {
            name: 'temp_min',
            type: 'number',
            role: 'value.temperature.min',
            read: true,
            write: false,
            unit: '°C',
            desc: 'Temperature min'
        },
        native: {}
    },
    {
        _id: 'temp_max',
        type: 'state',
        common: {
            name: 'temp_max',
            type: 'number',
            role: 'value.temperature.max',
            read: true,
            write: false,
            unit: '°C',
            desc: 'Temperature max'
        },
        native: {}
    },
    {
        _id: 'wind_speed',
        type: 'state',
        common: {
            name: 'wind speed ',
            type: 'number',
            role: 'value.windspeed',
            read: true,
            write: false,
            unit: 'KmH',
            desc: 'Wind Speed'
        },
        native: {}
    },
    {
        _id:'wind_deg',
        type: 'state',
        common: {
            name: 'wind degrees ',
            type: 'number',
            role: 'value.winddegrees',
            read: true,
            write: false,
            unit: '°',
            desc: 'Wind degrees'
        },
        native: {}
    },
    {
        _id:'clouds',
        type: 'state',
        common: {
            name: 'clouds',
            type: 'number',
            role: 'value.clouds',
            read: true,
            write: false,
            unit: '%',
            desc: 'Clouds'
        },
        native: {}
    },
    {
        _id:'lastUpdate',
        type: 'state',
        common: {
            name: 'lastUpdate',
            type: 'number',
            role: 'date',
            read: true,
            write: false,
            desc: 'Last update on server side'
        },
        native: {}
    }

    ],
    'al':[
        {
            _id: 'AutoLock',
            type: 'state',
            common: {
                name: 'AutoLock',
                type: 'boolean',
                role: 'switch',
                read: true,
                write: true,
                desc: 'AutoLock aus/ein'
            },
            native: {}
        },
        {
            _id: 'AutoLockTimer',
            type: 'state',
            common: {
                name: 'AutoLockTimer',
                type: 'number',
                role: 'value',
                unit: 'sec',
                read: true,
                write: true,
                min: 0,
                max: 600,
                steps: 1,
                desc: 'Time between last key and lock'
            },
            native: {}
        }
    ],
    'module_4g':[
        {
            _id:'longitude',
            type: 'state',
            common: {
                name: 'longitude',
                type: 'number',
                role: 'value.gps.longitude',
                read: true,
                write: false,
                desc: 'longitude position'
            },
            native: {}
        },
        {
            _id:'latitude',
            type: 'state',
            common: {
                name: 'latitude',
                type: 'number',
                role: 'value.gps.latitude',
                read: true,
                write: false,
                desc: 'longitude position'
            },
            native: {}
        }],
    'module_df':[
        {
            _id: 'OLMSwitch_Cutting',
            type: 'state',
            common: {
                name: 'OLMSwitch_Cutting',
                type: 'boolean',
                role: 'switch',
                read: true,
                write: true,
                desc: 'if active mower turn when hit magnet stripe while cutting'
            },
            native: {}
        },
        {
            _id: 'OLMSwitch_FastHoming',
            type: 'state',
            common: {
                name: 'OLMSwitch_FastHoming',
                type: 'boolean',
                role: 'switch',
                read: true,
                write: true,
                desc: 'if active mower turn when hit magnet stripe while driving home'
            },
            native: {}
        },
    ],
    'module_tq':[
        {
            _id: 'torque',
            type: 'state',
            common: {
                name: 'torque',
                type: 'number',
                role: 'value',
                read: true,
                write: true,
                min: -50,
                max: 50,
                steps: 1,
                desc: 'torque control'
            },
            native: {}
        },
    ],
    'US':[
        {
            _id: 'ACS',
            type: 'state',
            common: {
                name: 'ACS Module',
                type: 'number',
                role: 'value',
                read: true,
                write: true,
                desc: 'ACS Module',
                states: {
                    "0": "disabled",
                    "1": "enabled"
                }
            },
            native: {}
        },
        {
            _id: 'ACS_Status',
            type: 'state',
            common: {
                name: 'ACS Module Status',
                type: 'string',
                role: 'value',
                read: true,
                write: false,
                desc: 'ACS Module Status'
            },
            native: {}
        },
    ]
};
