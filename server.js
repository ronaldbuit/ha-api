var cors = require('cors');
var express = require('express'),
    app = express(),
    port = process.env.PORT || 3000,
    bodyParser = require('body-parser');

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var mqttService = require('./api/services/mqttService')
mqttService.init();

var routes = require('./api/routes/deviceRoutes'); //importing route
routes(app); //register the route

const html = './dist/ha-angular/';
// Static content
app.use(express.static(html));
// Default route
app.use(function(req, res) {
   res.sendFile(html + 'index.html');
});

app.listen(port);

console.log('ha-webui API server started on: ' + port);


