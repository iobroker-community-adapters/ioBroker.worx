module.exports = [
    {
        "_id": "info.firmware",
        "type": "state",
        "common": {
          "name": "Firmware Version",
          "type": "string",
          "role": "text",
          "read": true,
          "desc": "Firmware Version"
        },
        "native": {}
      },
      {
        "_id": "mower",
        "type": "channel",
        "common": {
          "name": "mower"
        },
        "native": {}
      },
      {
        "_id": "mower.batteryState",
        "type": "state",
        "common": {
          "name": "mower battery state",
          "type": "number",
          "role": "value.battery",
          "unit": "%",
          "read": true,
          "desc": "mower mower battery state in %"
        },
        "native": {}
      },
      {
        "_id": "mower.waitRain",
        "type": "state",
        "common": {
          "name": "Wait after rain",
          "type": "number",
          "role": "value",
          "unit": "min",
          "read": true,
          "desc": "Time to wait after rain, in minutes"
        },
        "native": {}
      },
      {
        "_id": "calendar",
        "type": "channel",
        "common": {
          "name": "calendar"
        },
        "native": {}
      },
      {
        "_id": "calendar.monday",
        "type": "channel",
        "common": {
          "name": "Monday"
        },
        "native": {}
      },
      {
        "_id": "calendar.monday.startTime",
        "type": "state",
        "common": {
          "name": "Start time",
          "role": "text",
          "type": "string",
          "read": true,
          "desc": "Hour:Minutes on the day (monday) that the mower should start mowing"
        },
        "native": {}
      },
      {
        "_id": "calendar.monday.workTime",
        "type": "state",
        "common": {
          "name": "Work time",
          "type": "number",
          "role": "value",
          "unit": "min",
          "read": true,
          "desc": "Decides for how long the mower will work each day"
        },
        "native": {}
      },
      {
        "_id": "calendar.monday.borderCut",
        "type": "state",
        "common": {
          "name": "Border cut",
          "type": "boolean",
          "role": "switch",
          "read": true,
          "desc": "The mower cut border today"
        },
        "native": {}
      },
      {
        "_id": "calendar.tuesday",
        "type": "channel",
        "common": {
          "name": "Tuesday"
        },
        "native": {}
      },
      {
        "_id": "calendar.tuesday.startTime",
        "type": "state",
        "common": {
          "name": "Start time",
          "type": "string",
          "role": "text",
          "read": true,
          "desc": "Hour:Minutes on the day (tuesday) that the mower should start mowing"
        },
        "native": {}
      },
      {
        "_id": "calendar.tuesday.workTime",
        "type": "state",
        "common": {
          "name": "Work time",
          "type": "number",
          "role": "value",
          "unit": "min.",
          "read": true,
          "desc": "Decides for how long the mower will work each day"
        },
        "native": {}
      },
      {
        "_id": "calendar.tuesday.borderCut",
        "type": "state",
        "common": {
          "name": "Border cut",
          "type": "boolean",
          "role": "switch",
          "read": true,
          "desc": "The mower cut border today"
        },
        "native": {}
      },
      {
        "_id": "calendar.wednesday",
        "type": "channel",
        "common": {
          "name": "Wednesday"
        },
        "native": {}
      },
      {
        "_id": "calendar.wednesday.startTime",
        "type": "state",
        "common": {
          "name": "Start time",
          "type": "string",
          "role": "text",
          "read": true,
          "desc": "Hour:Minutes on the day (wednesday) that the mower should start mowing"
        },
        "native": {}
      },
      {
        "_id": "calendar.wednesday.workTime",
        "type": "state",
        "common": {
          "name": "Work time",
          "type": "number",
          "role": "value",
          "unit": "min.",
          "read": true,
          "desc": "Decides for how long the mower will work each day"
        },
        "native": {}
      },
      {
        "_id": "calendar.wednesday.borderCut",
        "type": "state",
        "common": {
          "name": "Border cut",
          "type": "boolean",
          "role": "switch",
          "read": true,
          "desc": "The mower cut border today"
        },
        "native": {}
      },
      {
        "_id": "calendar.thursday",
        "type": "channel",
        "common": {
          "name": "Thursday"
        },
        "native": {}
      },
      {
        "_id": "calendar.thursday.startTime",
        "type": "state",
        "common": {
          "name": "Start time",
          "type": "string",
          "role": "text",
          "read": true,
          "desc": "Hour:Minutes on the day (thursday) that the mower should start mowing"
        },
        "native": {}
      },
      {
        "_id": "calendar.thursday.workTime",
        "type": "state",
        "common": {
          "name": "Work time",
          "type": "number",
          "role": "value",
          "unit": "min.",
          "read": true,
          "desc": "Decides for how long the mower will work each day"
        },
        "native": {}
      },
      {
        "_id": "calendar.thursday.borderCut",
        "type": "state",
        "common": {
          "name": "Border cut",
          "type": "boolean",
          "role": "switch",
          "read": true,
          "desc": "The mower cut border today"
        },
        "native": {}
      },
      {
        "_id": "calendar.friday",
        "type": "channel",
        "common": {
          "name": "Friday"
        },
        "native": {}
      },
      {
        "_id": "calendar.friday.startTime",
        "type": "state",
        "common": {
          "name": "Start time",
          "type": "string",
          "role": "text",
          "read": true,
          "desc": "Hour:Minutes on the day (friday) that the mower should start mowing"
        },
        "native": {}
      },
      {
        "_id": "calendar.friday.workTime",
        "type": "state",
        "common": {
          "name": "Work time",
          "type": "number",
          "role": "value",
          "unit": "min.",
          "read": true,
          "desc": "Decides for how long the mower will work each day"
        },
        "native": {}
      },
      {
        "_id": "calendar.friday.borderCut",
        "type": "state",
        "common": {
          "name": "Border cut",
          "type": "boolean",
          "role": "switch",
          "read": true,
          "desc": "The mower cut border today"
        },
        "native": {}
      },
      {
        "_id": "calendar.saturday",
        "type": "channel",
        "common": {
          "name": "Saturday"
        },
        "native": {}
      },
      {
        "_id": "calendar.saturday.startTime",
        "type": "state",
        "common": {
          "name": "Start time",
          "type": "string",
          "role": "text",
          "read": true,
          "desc": "Hour:Minutes on the day (saturday) that the mower should start mowing"
        },
        "native": {}
      },
      {
        "_id": "calendar.saturday.workTime",
        "type": "state",
        "common": {
          "name": "Work time",
          "type": "number",
          "role": "value",
          "unit": "min.",
          "read": true,
          "desc": "Decides for how long the mower will work each day"
        },
        "native": {}
      },
      {
        "_id": "calendar.saturday.borderCut",
        "type": "state",
        "common": {
          "name": "Border cut",
          "type": "boolean",
          "role": "switch",
          "read": true,
          "desc": "The mower cut border today"
        },
        "native": {}
      },
      {
        "_id": "calendar.sunday",
        "type": "channel",
        "common": {
          "name": "Sunday"
        },
        "native": {}
      },
      {
        "_id": "calendar.sunday.startTime",
        "type": "state",
        "common": {
          "name": "Start time",
          "type": "string",
          "role": "text",
          "read": true,
          "desc": "Hour:Minutes on the day (sunday) that the mower should start mowing"
        },
        "native": {}
      },
      {
        "_id": "calendar.sunday.workTime",
        "type": "state",
        "common": {
          "name": "Work time",
          "type": "number",
          "role": "value",
          "unit": "min.",
          "read": true,
          "desc": "Decides for how long the mower will work each day"
        },
        "native": {}
      },
      {
        "_id": "calendar.sunday.borderCut",
        "type": "state",
        "common": {
          "name": "Border cut",
          "type": "boolean",
          "role": "switch",
          "read": true,
          "desc": "The mower cut border today"
        },
        "native": {}
      }
    ]