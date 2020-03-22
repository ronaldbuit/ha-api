'use strict';
let mqttService = require('../services/mqttService')

exports.list = function(req, res) {
    res.json(mqttService.getDevices());
};

exports.read = function(req, res) {
    res.json(mqttService.getDevice(req.params.topic));
};

exports.update = function (req, res) {
    res.json(mqttService.updateDevice(req.body));
};

exports.all = function (req, res) {
    res.json(mqttService.all(req.body));
}

exports.party = function (req, res) {
    res.json(mqttService.party());
}
