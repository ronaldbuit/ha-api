'use strict';
let schedulingService = require('../services/schedulingService')

exports.getDateTimes = function(req, res) {
    res.json(schedulingService.dateTimes());
};

exports.setFromHome = function(req, res) {
    schedulingService.setFromHome(req.body);
    res.json('success');
};

exports.getFromHome = function(req, res) {
    res.json(schedulingService.getFromHome());
}
