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
        exports.scheduleDevice(device, false);
    });
}

exports.scheduleDevice = function(device, planForNextDay) {
    if (device.canSchedule) {
        // first always remove running schedules for device
        exports.removeDeviceFromPlanning(device)
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

                addJob('on', sunset.toDate(), device);
                addJob('off', offDateTime.toDate(), device);
            } else if (now > sunset) {
                // plan only off
                offDateTime = getOffDateTime(true);
                addJob('off', offDateTime.toDate(), device);
            } else {
                // plan for today
                sunset = moment(sun.getSunset(long, lat)).subtract(20, 'm');
                sunset.add(getRandom(0, 15), 'm');
                offDateTime = getOffDateTime(true);

                addJob('on', sunset.toDate(), device);
                addJob('off', offDateTime.toDate(), device);
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

function addJob(type, dateTime, device) {
    let job = schedule.scheduleJob(type + '-' + device.id, dateTime, function() {
        if (fromHome) {
            mqttService.updateDevice({id: device.id, command: 'POWER', value: type});
            if (type === 'off') {
                // plan for next day
                exports.scheduleDevice(device, true);
            }
        }
    });
    if (type === 'on') {
        device.nextOn = job.nextInvocation();
    }
    if (type === 'off') {
        device.nextOff = job.nextInvocation();
    }
}

function getRandom(min, max) {
    return Math.floor(Math.random() * (max - min) ) + min;
}

exports.removeDeviceFromPlanning = function(device) {
    if (device.nextOn) {
        device.nextOn = null;
    }
    if (device.nextOff) {
        device.nextOff = null;
    }
    if (schedule.scheduledJobs['off-' + device.id]) {
        schedule.scheduledJobs['off-' + device.id].cancel();
    }
    if (schedule.scheduledJobs['on-' + device.id]) {
        schedule.scheduledJobs['on-' + device.id].cancel();
    }
}
