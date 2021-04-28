let sun = require('sunrise-sunset-js');
let mqttService = require('../services/mqttService');
let schedule = require('node-schedule');
let moment = require('moment');

const long = 52.113773;
const lat = 5.081342;

let fromHome = false;

exports.init = function() {

}

exports.dateTimes = function() {
    const now = new Date();
    let sunset = sun.getSunset(long, lat);
    let sunrise = sun.getSunrise(long, lat);
    if (sunset < now) {
        const tomorrow = new Date(now)
        tomorrow.setDate(tomorrow.getDate() + 1)
        sunset = sun.getSunset(long, lat, tomorrow);
        sunrise = sun.getSunrise(long, lat, tomorrow);
    }

    return {
        current: new Date(),
        sunrise: sunrise,
        sunset: sunset
    };
}

exports.getFromHome = function() {
    return fromHome;
}

exports.setFromHome = function(setFromHome) {
    fromHome = setFromHome.fromHome;

    let devices = mqttService.getDevices();

    devices.forEach(function(device) {
        device.commands.forEach(function(command) {
            exports.scheduleDevice(device, command, false);
        });
    });
}

exports.scheduleDevice = function(device, command, planForNextDay) {
    if (command.canSchedule) {
        // first always remove running schedules for device
        exports.removeDeviceFromPlanning(device, command)
        if (fromHome) {
            const now = moment();
            let sunset = moment(sun.getSunset(long, lat));
            let offDateTime = getOffDateTime(false);
            if (planForNextDay || now > offDateTime) {
                // plan for next day
                const tomorrow = moment().add(1, 'd');
                sunset = moment(sun.getSunset(long, lat, tomorrow.toDate())).subtract(20, 'm');
                sunset.add(getRandom(0, 15), 'm');
                offDateTime = getOffDateTime(true).add(1, 'd');

                addJob('on', sunset.toDate(), device, command);
                addJob('off', offDateTime.toDate(), device, command);
            } else if (now > sunset) {
                // plan only off
                offDateTime = getOffDateTime(true);
                addJob('off', offDateTime.toDate(), device, command);
            } else {
                // plan for today
                sunset = moment(sun.getSunset(long, lat)).subtract(20, 'm');
                sunset.add(getRandom(0, 15), 'm');
                offDateTime = getOffDateTime(true);

                addJob('on', sunset.toDate(), device, command);
                addJob('off', offDateTime.toDate(), device, command);
            }
        }
    }
}

function getOffDateTime(random) {
    const hour = 23;
    const minutes = 0;
    if (random) {
        return moment().hour(hour).minute(minutes).subtract(5, 'm').add(getRandom(0, 15), 'm');
    } else {
        return moment().hour(hour).minute(minutes);
    }
}

function addJob(type, dateTime, device, command) {
    const jobId = device.topic + '-' + command.command;
    let job = schedule.scheduleJob(type + '-' + jobId, dateTime, function() {
        if (fromHome) {
            mqttService.updateDevice({topic: device.topic, command: command.command, value: type});
            if (type === 'off') {
                // plan for next day
                exports.scheduleDevice(device, command, true);
            }
        }
    });
    if (type === 'on') {
        command.nextOn = job.nextInvocation();
    }
    if (type === 'off') {
        command.nextOff = job.nextInvocation();
    }
}

function getRandom(min, max) {
    return Math.floor(Math.random() * (max - min) ) + min;
}

exports.removeDeviceFromPlanning = function(device, command) {
    if (command.nextOn) {
        command.nextOn = null;
    }
    if (command.nextOff) {
        command.nextOff = null;
    }

    const jobId = device.topic + '-' + command.command;
    if (schedule.scheduledJobs['off-' + jobId]) {
        schedule.scheduledJobs['off-' + jobId].cancel();
    }
    if (schedule.scheduledJobs['on-' + jobId]) {
        schedule.scheduledJobs['on-' + jobId].cancel();
    }
}
