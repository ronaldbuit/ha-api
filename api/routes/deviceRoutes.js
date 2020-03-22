'use strict';
module.exports = function(app) {
    let devices = require('../controllers/deviceController');

    // device Routes
    app.route('/api/device')
        .get(devices.list);

    app.route('/api/device/:topic')
        .get(devices.read)
        .post(devices.update);

    app.route('/api/alldevices')
        .post(devices.all);

    app.route('/api/party')
        .post(devices.party);
};
