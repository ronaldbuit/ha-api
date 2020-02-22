let cors = require('cors');
let express = require('express'),
    app = express(),
    port = process.env.PORT || 3000,
    bodyParser = require('body-parser');

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.disable('x-powered-by');

let mqttService = require('./api/services/mqttService')
mqttService.init();
let schedulingService = require('./api/services/schedulingService');
schedulingService.init();

let deviceRoutes = require('./api/routes/deviceRoutes');
deviceRoutes(app);
let schedulingRoutes = require('./api/routes/schedulingRoutes');
schedulingRoutes(app);

const html = './dist/ha-angular/';
app.use(express.static(html));
app.use(function(req, res) {
   res.sendFile(html + 'index.html');
});

app.listen(port);

console.log('ha-webui API server started on: ' + port);


