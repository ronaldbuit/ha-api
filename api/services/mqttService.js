let mqtt = require('mqtt')
let client  = mqtt.connect('mqtt://192.168.178.14')

let devices = [
    {id: 'switch1', label: 'Lamp kast', isAll: false, visible: true, commands: ['POWER'], status: ['OFF'], canSchedule: true},
    {id: 'switch2', label: 'Switch voor', isAll: false, visible: false, commands: ['POWER'], status: ['OFF'],
        forward: { to: 'tasmotas', command: 'POWER' }, canSchedule: false},
    {id: 'switch3', label: 'Lampje tv', isAll: false, visible: true, commands: ['POWER'], status: ['OFF'], canSchedule: true},
    {id: 'lampvoor', label: 'Lamp voor', isAll: false, visible: true, commands: ['POWER', 'Dimmer', 'Color'], status: ['OFF', '100', 'FFFF'], canSchedule: true},
    {id: 'tasmotas', label: 'Alle lampen', isAll: true, visible: true, commands: ['POWER'], status: ['OFF'], canSchedule: false},
];

exports.init = function() {
    client.on('connect', function () {
        devices.forEach(function(s) {
            client.subscribe('stat/' + s.id + '/RESULT', function (err) {
                if (err) {
                    console.log('error: ' + err);
                } else {
                    console.log('connected: ' + s.id);
                }
            });
        });
    });

    client.on('message', function (topic, message) {
        devices.forEach(function(s) {
            if (topic.indexOf(s.id) > 0) {
                let status = JSON.parse(message.toString());
                let forward = undefined;
                Object.getOwnPropertyNames(status).forEach(function(p) {
                    let pIndex = s.commands.indexOf(p);
                    if (pIndex >= 0) {
                       if (s.forward && s.forward.command === p && s.status[pIndex] !== status[p]) {
                           forward = s.forward;
                           forward.value = status[p];
                       }
                       s.status[pIndex] = status[p];
                   }
                });
                if (forward) {
                    client.publish('cmnd/' + forward.to + '/' + forward.command, forward.value);
                }
            }
        });
    });

    devices.forEach(function(s) {
        s.commands.forEach(function(c) {
            client.publish('cmnd/' + s.id + '/' + c, '');
        })
    });
}

exports.getDevices = function() {
    return devices;
}

exports.getDevice = function(deviceId) {
    return devices.find(function(s) {
        return s.id == deviceId;
    });
}

exports.updateDevice= function(deviceToUpdate) {
    client.publish('cmnd/' + deviceToUpdate.id + '/' + deviceToUpdate.command, deviceToUpdate.value);
    return deviceToUpdate;
}
