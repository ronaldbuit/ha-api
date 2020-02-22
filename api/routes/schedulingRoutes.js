'use strict';
module.exports = function(app) {
    let scheduling = require('../controllers/schedulingController');

    app.route('/api/scheduling/datetime')
        .get(scheduling.getDateTimes);

    app.route('/api/scheduling/fromhome')
        .get(scheduling.getFromHome)
        .post(scheduling.setFromHome);
};
