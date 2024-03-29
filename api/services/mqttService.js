let mqtt = require('mqtt')
let client  = mqtt.connect('mqtt://192.168.178.14')

let devices = [
    {
        topic: 'switch1', commands: [
            {
                label: 'Lamp kast old',
                isAll: true,
                visible: false,
                command: 'POWER',
                status: 'OFF',
                canSchedule: true
            }]
    },
    {
        topic: 'switch2', commands: [
            {
                label: 'Lamp kast',
                isAll: true,
                visible: true,
                command: 'POWER',
                status: 'OFF',
                canSchedule: true
            }]
    },
    {
        topic: 'switch3', commands: [
            {
                label: 'Lampje tv',
                isAll: true,
                visible: true,
                command: 'POWER',
                status: 'OFF',
                canSchedule: true
            }]
    },
    {
        topic: 'switchmain', commands: [
            {
                label: 'Lamp tafel',
                isAll: false,
                visible: true,
                command: 'POWER2',
                status: 'OFF',
                canSchedule: false
            },
            {
                label: 'Alle lampen',
                isAll: false,
                visible: false,
                command: 'POWER1',
                status: 'OFF',
                canSchedule: false,
                forward: {action: 'all', excludes: [{topic: 'switchmain', command: 'POWER2'}]},
            }]
    },
    {
        topic: 'lampvoor', commands: [
            {
                label: 'Lamp voor',
                isAll: true,
                visible: true,
                command: 'POWER',
                status: 'OFF',
                canSchedule: true
            },
            {
                label: 'Lamp voor Dimmer',
                isAll: false,
                visible: true,
                command: 'Dimmer',
                status: '100',
                canSchedule: false
            },
            {
                label: 'Lamp voor Color',
                isAll: false,
                visible: true,
                command: 'Color',
                status: 'FFFF',
                canSchedule: false
            }]
    },
    {
        topic: 'lampachter', commands: [
            {
                label: 'Lampje achter',
                isAll: true,
                visible: true,
                command: 'POWER',
                status: 'OFF',
                canSchedule: true
            }]
    },
    {
        topic: 'lampaanrecht', commands :[
            {
                label: 'Lamp aanrecht',
                isAll: false,
                visible: true,
                command: 'POWER',
                multi: ['POWER1', 'POWER2', 'POWER3', 'POWER4'],
                status: 'OFF',
                canSchedule: false
            }
        ], sensor: { id: 'Switch1', status: 'OFF' }
    }
];

let party = false;
let switchAllOnOff = false;

exports.init = function() {
    client.on('connect', function () {
        devices.forEach(function(s) {
            client.subscribe('stat/' + s.topic + '/RESULT', function (err) {
                if (err) {
                    console.log('error: ' + err);
                } else {
                    console.log('connected: ' + s.topic);
                }
            });
            if (s.sensor) {
                client.subscribe('tele/' + s.topic + '/SENSOR', function (err) {
                    if (err) {
                        console.log('error sensor: ' + err);
                    } else {
                        console.log('connected sensor: ' + s.topic);
                    }
                });
            }
        });
    });

    client.on('message', function (topic, message) {
        devices.forEach(function(s) {
            if (topic.indexOf('/' + s.topic + '/') > 0) {
                let status = JSON.parse(message.toString());
                if (topic.indexOf('tele/') === 0 && s.sensor && message.indexOf(s.sensor.id) > 0) {
                    s.commands.forEach(function (command) {
                        if (s.sensor.status !== status[s.sensor.id]) {
                            s.sensor.status = status[s.sensor.id];
                            exports.updateDevice({
                                topic: s.topic,
                                command: command.command,
                                value: s.sensor.status
                            });
                        }
                    });
                } else {
                    Object.getOwnPropertyNames(status).forEach(function (p) {
                        s.commands.forEach(function (command) {
                            if (command.command === p) {
                                command.status = status[p];
                                if (command.forward && command.forward.action === 'all' && !switchAllOnOff) {
                                    exports.all({value: command.status}, true, command.forward.excludes);
                                }
                                switchAllOnOff = false;
                            } else if (command.multi && Array.isArray(command.multi)) {
                                command.multi.forEach(function(m) {
                                   if (m === p) {
                                       command.status = status[p];
                                   }
                                });
                            }
                        });
                    });
                }
            }
        });
    });

    devices.forEach(function(s) {
        s.commands.forEach(function(c) {
            client.publish('cmnd/' + s.topic + '/' + c.command, '');
        })
    });

    checkAllOnStatus();

    function checkAllOnStatus() {
        let oneOn = false;
        let forwardCommand = null;
        let forwardDevice = null;
        devices.forEach(function(s) {
            s.commands.forEach(function(command) {
                if (command.isAll && command.command.indexOf('POWER') === 0 && command.status === 'ON') {
                    oneOn = true;
                }
                if (command.forward && command.forward.action === 'all') {
                    forwardCommand = command;
                    forwardDevice = s;
                }
            });
        });

        if (forwardCommand && forwardDevice) {
            if (oneOn && forwardCommand.status === 'OFF') {
                switchAllOnOff = true;
                client.publish('cmnd/' + forwardDevice.topic + '/' + forwardCommand.command, 'ON');
            } else if (!oneOn && forwardCommand.status === 'ON') {
                switchAllOnOff = true;
                client.publish('cmnd/' + forwardDevice.topic + '/' + forwardCommand.command, 'OFF');
            }
        }

        setTimeout(checkAllOnStatus, 1000);
    }
}

exports.getDevices = function() {
    return devices;
}

exports.getDevice = function(topic) {
    return devices.find(function(s) {
        return s.topic == topic;
    });
}

exports.all = function(action, forwarded, excludes) {
    devices.forEach(function(device) {
        device.commands.forEach(function(command) {
            if ((command.isAll || (!forwarded && command.forward && command.forward.action === 'all')) &&
                (!excludes || !excludes.some(function(c) { return c.command === command.command} ))) {
                exports.updateDevice({
                    topic: device.topic,
                    command: command.command,
                    value: action.value
                });
            }
        });
    });

    return '';
}

exports.updateDevice= function(deviceToUpdate) {
    devices.forEach(function(device) {
        if (device.topic === deviceToUpdate.topic) {
            device.commands.forEach(function(command) {
               if (command.command == deviceToUpdate.command) {
                   if (command.multi && Array.isArray(command.multi)) {
                       command.multi.forEach(function (m) {
                           client.publish('cmnd/' + deviceToUpdate.topic + '/' + m, deviceToUpdate.value);
                       });
                   } else {
                       client.publish('cmnd/' + deviceToUpdate.topic + '/' + deviceToUpdate.command, deviceToUpdate.value);
                   }
               }
            });
        }
    });
    return deviceToUpdate;
}

exports.party = function()
{
    if (!party) {
        party = true;
        devices.forEach(function(device) {
            device.commands.forEach(function (command) {
                if (command.command.indexOf('POWER') === 0 && !command.forward) {
                    changeStatus(device, command, 'on');
                }
            });
        });
    } else {
        party = false;
    }
    return '';
}

function changeStatus(device, command, status) {
    let r = Math.floor(Math.random() * 1000) + 100;
    setTimeout(function () {
        if (party) {
            exports.updateDevice({
                topic: device.topic,
                command: command.command,
                value: status
            });

            if (status === 'on') {
                changeStatus(device, command, 'off');
            } else {
                changeStatus(device, command, 'on');
            }
        }
    }, r)
}
