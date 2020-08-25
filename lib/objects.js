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

    ]
}