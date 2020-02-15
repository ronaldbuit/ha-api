'use strict';
let mqttService = require('../services/mqttService')

exports.list = function(req, res) {
    res.json(mqttService.getDevices());
};

exports.read = function(req, res) {
    res.json(mqttService.getDevice(req.params.deviceId));
};

exports.update = function (req, res) {
    res.json(mqttService.updateDevice(req.body));
};
