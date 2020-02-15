'use strict';
module.exports = function(app) {
    let devices = require('../controllers/deviceController');

    // device Routes
    app.route('/api/device')
        .get(devices.list);

    app.route('/api/device/:switchId')
        .get(devices.read)
        .post(devices.update);
};
