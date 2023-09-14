![Logo](../../admin/worx.png)

# ioBroker.worx Adapter

## Description

### Instance settings

-   `App Email`: Your APP Username (eMail)
-   `App Password`: Your APP Password
-   `App Name`: Choose your device
-   `Delay for EdgeCut`: When should EdgeCut start (example 5 seconds to lawn)

![Instance Settings img/instance_1.png](img/instance_1.png)

-   `Distance and time in min and m`: Default h and km
-   `Ping MQTT Connection every 10 minutes.`: Just to test. Please no longer than 1 hour!
-   `Updating MQTT data after token update.`: Loads the Worx data after the refresh token. 24 additional queries per day/devices.

![Instance Settings img/instance_2.png](img/instance_2.png)

### Folder

-   `activityLog`: Your activity log (control possible)
-   `areas`: Areas (control possible)
-   `calendar`: Time schedule (control possible)
-   `Modules`: Your module(s) (control possible)
-   `mower`: Your mower (control possible)
-   `product`: All properties of your devices (readonly)
-   `rawMqtt`: All data from the cloud (readonly)

![Folder img/all_folders.png](img/all_folders.png)

### activityLog (Wire and Vision)

-   `last_update`: Last update as timestamp
-   `manuell_update`: Loads the current activity log (automatically after status changes)
-   `payload`: Activity log as JSON Table (for VIS or Blockly)

![Activity img/activity.png](img/activity.png)

### areas (without Vision)

-   `actualArea`: Current
-   `actualAreaIndicator`: Next array zone start
-   `area_0`: Start of zone 1 in meters (array=0) (changeable)
-   `area_1`: Start of zone 2 in meters (array=1) (changeable)
-   `area_2`: Start of zone 3 in meters (array=2) (changeable)
-   `area_3`: Start of zone 4 in meters (array=3) (changeable)
-   `startSequence`: Array zone start (0-9 events) e.g. Start in Zone 3 only [2,2,2,2,2,2,2,2,2,2] (changeable)
-   `zoneKeeper`: Safe driving in narrow zone crossings (Areas must be created) (as of Firmware 3.30) (changeable)

![Area img/areas.png](img/areas.png)

### calendar (Wire and Vision)

-   E.g. time setting for wednesday

    -   `wednesday.borderCut`: With or without bordercut (Change value without delay) (changeable)
    -   `wednesday.startTime`: Starttime hh:mm (0-23/0-59) e.g. 09:00 (Change value without delay) (changeable)
    -   `wednesday.workTime`: Working time in minutes (180 min = 3h) e.g. 30 = Endzeit 09:30 (Change value without delay) (changeable)
    -   `calJson_sendto`: If all datapoints are set, then press button to send (with a 1,1 second delay). The mower will now mow for 30 minutes (changeable)
    -   `calJson_tosend`: This data is sent to Mqtt (Both mowing schedule/is set automatically). You can also create this JSON yourself. (changeable)
    -   `calendar.calJson`: Array for the weekly mowing plan. You can also create this ARRAY yourself. (mowing schedule 1/is set automatically - for wire only) (changeable)
    -   `calendar.calJson2`: Array for the weekly mowing plan. You can also create this ARRAY yourself. (mowing schedule 2/is set automatically - for wire only) (changeable)

![Folder img/calendar.png](img/calendar.png)

### modules (Wire and Vision)

-   Off Limit Module (Wire and Vision)

    -   `DF.OLMSwitch_Cutting`: Prevents magnetic tape from being run over - true-on/false-off
    -   `DF.OLMSwitch_FastHoming`: Fast return to the charging station - true-on/false-off

-   ACS Module (Wire only)
    -   `US.ACS`: Enable or disable ACS - 1-on/0-off

![Module img/module.png](img/module.png)

### mower (Wire and Vision)

-   `AutoLock`: Auto lock true-on/false-off (wire & Vision/changeable)
-   `AutoLockTimer`: Timer auto lock max. 10 minutes in 30 second steps (wire & Vision/changeable)
-   `batteryChargeCycle`: Battery charge cycle (wire & Vision/readonly)
-   `batteryCharging`: Battery charging false->no/true->yes (wire & Vision/readonly)
-   `batteryState`: Battery state in % (wire & Vision/readonly)
-   `batteryTemperature`: Battery temperature in celsius (wire & Vision/readonly)
-   `batteryVoltage`: Battery voltage in Volt (wire & Vision/readonly)
-   `direction`: Direction in grad (wire & Vision/readonly)
-   `edgecut`: Start EdgeCut (wire & Vision/changeable)
-   `error`: Error message from mower (wire & Vision/readonly)

```json
{
    "states": {
        "0": "No error", //(wire & Vision)
        "1": "Trapped", //(wire & Vision unknown)
        "2": "Lifted", //(wire & Vision)
        "3": "Wire missing", //(wire & Vision unknown)
        "4": "Outside wire", //(wire & Vision unknown)
        "5": "Raining", //(wire & Vision)
        "6": "Close door to mow", //(wire & Vision)
        "7": "Close door to go home", //(wire & Vision)
        "8": "Blade motor blocked", //(wire & Vision)
        "9": "Wheel motor blocked", //(wire & Vision)
        "10": "Trapped timeout", //(wire & Vision)
        "11": "Upside down", //(wire & Vision)
        "12": "Battery low", //(wire & Vision)
        "13": "Reverse wire", //(wire & Vision unknown)
        "14": "Charge error", //(wire & Vision)
        "15": "Timeout finding home", //(wire & Vision)
        "16": "Mower locked", //(wire & Vision)
        "17": "Battery over temperature", //(wire & Vision)
        "18": "dummy model", //(wire & Vision)
        "19": "Battery trunk open timeout", //(wire & Vision)
        "20": "wire sync", //(wire & Vision unknown)
        "21": "msg num", //(wire & Vision)
        "110": "Camera error" //(Vision)
    }
}
```

![Mower img/mower_1.png](img/mower_1.png)

-   `firmware`: Current installed firmware (wire & Vision/readonly)
-   `firmware_available`: Available firmware (wire & Vision/readonly)
-   `firmware_available_all`: Last available firmware as JSON - This JSON will be updated when a new update is available (wire & Vision/readonly)

```json
{
    "mandatory": false,
    "product": {
        "uuid": "1236ll8d-0000-0000-9999-07ff6690003f",
        "version": "3.30.0+1",
        "released_at": "2023-05-24",
        "changelog": "•\tSupport for new models \tWR166E and WR184E\n•\tImproved Grass cutting coverage\n•\tImproved ACS\n•\tAdded Zone Keeper function (need to be enabled by app)\n•\tImproved wheel torque algorithm\n• \tNew FML firmware\n•\tFixed \"FML\" and \"Radiolink\" Activation problem\n•\tFixed some translations error\n•\tRain delay can now be cleared pressing START / HOME button, (1 minute after countdown has started)\n•\tImproved PRO Battery management\n• \tImproved boundary wire recognition\n• \tFixed border cut when zones are active\n• \tNew wifi firmware for board HW REV > 7\n\nThe Worx Landroid team would like to thank our amazing beta testers, with hundreds of hours of their own free time to make this firmware possible."
    }
}
```

-   `firmware_available_date`: Date available firmware - Dummy 1970-01-01 when the adapter is reinstalled and no update is available (wire & Vision/readonly)
-   `firmware_update_start`: Start firmware update in 2 steps (wire & Vision/changeable)
-   `firmware_update_start_approved`: Start firmware update - `firmware_update_start` must be set to true (wire & Vision/changeable)
-   `gradient`: Gradient in grad (wire & Vision/readonly)
-   `inclination`: Inclination in grad (wire & Vision/readonly)
-   `last_command`: Last Request from iobroker or APP as JSON Table (wire & Vision/readonly)
-   `mowTimeExtend`: Mow time extend in % Range: -100%->100% (wire/changeable)
-   `mowerActive`: Pause mowing plan (wire/changeable)
-   `mqtt_update`: Update Mqtt data max. 150/day (wire & Vision/changeable)
-   `mqtt_update_count`: Counter Update Mqtt data (wire & Vision/readonly)

![Mower img/mower_2.png](img/mower_2.png)

-   `oneTimeJson`: One-time mowing as JSON (wire & Vision/changeable)

```json
{
    "wtm": 60, //Minutes
    "bc": 0 //0=w/o bordercut 1=with bordercut or use the next datapoints
}
```

-   `oneTimeStart`: One-time mowing start "first fill oneTimeWithBorder and oneTimeWorkTime" - with a 1,1 second delay (wire & Vision/changeable)
-   `oneTimeWithBorder`: With bordercut - Change value without delay (wire & Vision/changeable)
-   `oneTimeWorkTime`: Worktime max. 8h in 30 minute steps - Change value without delay (wire & Vision/changeable)
-   `online`: Mower online (wire & Vision/readonly)
-   `partyModus`: Partymodus turn on/off (wire & Vision/changeable)
-   `pause`: Mower break turn on/off (wire & Vision/changeable)
-   `reset_battery_time`: reset battery charges in 2 steps (wire & vision/changeable)
-   `reset_battery_time_approved`: Confirm reset battery charges - `reset_battery_time` must be set to true (wire & vision/modifiable)
-   `reset_blade_time`: reset blade working time in 2 steps (wire & vision/changeable)
-   `reset_blade_time_approved`: confirm reset blade working time - `reset_battery_time` must be set to true (wire & vision/changeable)

![Mower img/mower_3.png](img/mower_3.png)

-   `sendCommand`: Send cmd command (wire & Vision/changeable)

```json
{
    "states": {
        "1": "Start", //(wire & Vision)
        "2": "Stop", //(wire & Vision)
        "3": "Home", //(wire & Vision)
        "4": "Start Zone Taining", //(wire & Vision unknown)
        "5": "Lock", //(wire & Vision unknown)
        "6": "Unlock", //(wire & Vision unknown)
        "7": "Restart Robot", //(wire & Vision unknown)
        "8": "pause when follow wire", //(wire & Vision unknown)
        "9": "safe homing" //(wire & Vision unknown)
    }
}
```

-   `state`: True for start mower and False for stop mower (wire & Vision/changeable)
-   `status`: Status mower (wire & Vision/readonly)

```json
{
    "states": {
        "0": "IDLE", //(wire & Vision)
        "1": "Home", //(wire & Vision)
        "2": "Start sequence", //(wire & Vision)
        "3": "Leaving home", //(wire & Vision)
        "4": "Follow wire", //(wire & Vision unknown)
        "5": "Searching home", //(wire & Vision)
        "6": "Searching wire", //(wire & Vision unknown)
        "7": "Mowing", //(wire & Vision)
        "8": "Lifted", //(wire & Vision)
        "9": "Trapped", //(wire & Vision)
        "10": "Blade blocked", //(wire & Vision)
        "11": "Debug", //(wire & Vision)
        "12": "Remote control", //(wire & Vision)
        "13": "escape from off limits", //(wire & Vision)
        "30": "Going home", //(wire & Vision)
        "31": "Zone training", //(wire & Vision)
        "32": "Border Cut", //(wire & Vision)
        "33": "Searching zone", //(wire & Vision)
        "34": "Pause" //(wire & Vision)
    }
}
```

-   `torque`: Wheel torque Range -50->50 (wire & Vision/changeable)
-   `totalBladeTime`: Total blade time (wire & Vision/readonly)
-   `totalDistance`: Total distance (wire & Vision/readonly)
-   `totalTime`: Total working time (wire & Vision/readonly)
-   `waitRain`: Rain delay max. 12h in 30 minute steps (wire & Vision/changeable)
-   `wifiQuality`: Wifi quality (wire & Vision/readonly)

![Mower img/mower_4.png](img/mower_4.png)

### Additionally for vision

-   Area
    -   `rfid`: Total Areas (readonly)
    -   `startSequence`: Multizone JSON (Vision/changeable)

Example:

```json
{
    "mz": {
        "p": [
            // Passages between zones
            {
                "z1": 1, // Zone from (must z1 < z2)
                "z2": 2, // Zone to (must z2 > z1)
                "t1": "E000000000000000", // RFID id from z1
                "t2": "E0000000KKKKKKKK" // RFID id from z2
            }
        ],
        "s": [
            // The zones themselves
            {
                "id": 1, // Numbering - Start with 1
                "c": 1, // 1 if the charging station is in this zone. 0 for no charging station.
                "cfg": {
                    "cut": {
                        "bd": 100, // bordercut in mm
                        "ob": 0 // 1 for driving over slabs if they are detected, otherwise 0.
                    }
                }
            },
            {
                "id": 2, // Numbering
                "c": 0, // 1 if the charging station is in this zone. 0 for no charging station.
                "cfg": {
                    "cut": {
                        "bd": 100, // bordercut in mm
                        "ob": 0 // 1 for driving over slabs if they are detected, otherwise 0.
                    }
                }
            }
        ]
    }
}
```

Default without zone:

```json
{
    "mz": {
        "p": [],
        "s": [
            {
                "id": 1,
                "c": 1,
                "cfg": {
                    "cut": {
                        "bd": 150,
                        "ob": 0
                    }
                }
            }
        ]
    }
}
```

![Vision img/areas_vision.png](img/areas_vision.png)

-   Mower
    -   `log_improvement`: Send improvement log to worx disable/enable (changeable)
    -   `log_troubleshooting`: Send troubleshooting log to worx disable/enable (changeable)

![Vision img/logs_vision.png](img/logs_vision.png)

-   Mower
    -   `paused`: Paused schedule in minutes (changeable)

![Vision img/paused_vision.png](img/paused_vision.png)

### info_mqtt (Wire and Vision)

-   `incompleteOperationCount`: Total number of operations submitted to the connection that have not yet been completed. Unacked operations are a subset of this.
-   `incompleteOperationSize`: Total packet size of operations submitted to the connection that have not yet been completed. Unacked operations are a subset of this.
-   `unackedOperationCount`: Total number of operations that have been sent to the server and are waiting for a corresponding ACK before they can be completed.
-   `unackedOperationSize`: Total packet size of operations that have been sent to the server and are waiting for a corresponding ACK before they can be completed.
-   `last_update`: Last update from token
-   `next_update`: Next update from token
-   `online`: Status MQTT Connection (false=offline/true=online)

![Vision img/mqtt_info.png](img/mqtt_info.png)
