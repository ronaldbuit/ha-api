let mqtt = require('mqtt')
let client  = mqtt.connect('mqtt://192.168.178.14')

let devices = [
    {id: 'switch1', label: 'Lamp kast', isAll: false, commands: ['POWER'], status: ['OFF']},
    {id: 'switch2', label: 'Switch voor', isAll: false, commands: ['POWER'], status: ['OFF']},
    {id: 'switch3', label: 'Lampje tv', isAll: false, commands: ['POWER'], status: ['OFF']},
    {id: 'lampvoor', label: 'Lamp voor', isAll: false, commands: ['POWER', 'Dimmer', 'CT'], status: ['OFF', '100', '153']},
    {id: 'tasmotas', label: 'Alle lampen', isAll: true, commands: ['POWER'], status: ['OFF']},
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
                Object.getOwnPropertyNames(status).forEach(function(p) {
                    let pIndex = s.commands.indexOf(p);
                    if (pIndex >= 0) {
                       s.status[pIndex] = status[p];
                   }
                });
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
