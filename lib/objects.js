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
    }]
}