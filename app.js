var express = require('express');
var app = express();
// Enable reverse proxy support in Express. This causes the
// the "X-Forwarded-Proto" header field to be trusted so its
// value can be used to determine the protocol. See 
// http://expressjs.com/api#app-settings for more details.
app.enable('trust proxy');

var cfenv = require('cfenv');
var appEnv = cfenv.getAppEnv();
var port = appEnv.port || '8000';
var routeUrl =  appEnv.bind || 'localhost';
var appName = appEnv.name || 'cdts-eureka-client';
var serverdomain = process.env.serverdomain || 'mybluemix.net';
var hostName = appName + '.' + serverdomain;
var vipAddress = process.env.vipAddress || 'cdts-eureka-client';
var eurekaServer = process.env.eurekaServer || 'localhost';
var eurekaPort = process.env.eurekaPort || 80;
var statusUrl = process.env.statusUrl  || 'http://cdts-eureka-client.mybluemix.net:8003';

//console.log('port:'+port);
//console.log('routeUrl:'+routeUrl);
//console.log('appName:'+appName);
//console.log('vipAddr:'+vipAddr);
//console.log('eurekaServer:'+eurekaServer);
//console.log('eurekaPort:'+eurekaPort);
//console.log('statusUrl:'+statusUrl);

//eureka 
const Eureka = require('eureka-js-client').Eureka;

// example configuration 
const client = new Eureka({
  instance: {
    app: appName,
    hostName: hostName,
    ipAddr: '127.0.0.1',
    port: {
      '$': process.env.PORT || '8003',
      '@enabled': true,
    },
    vipAddress: vipAddress,
    dataCenterInfo: {
      '@class': 'com.netflix.appinfo.InstanceInfo$DefaultDataCenterInfo',
      name: 'MyOwn',
    },
	statusPageUrl: statusUrl,
  },
  eureka: {
    host: eurekaServer,
    port: eurekaPort,
    servicePath: '/eureka/apps/',
  },
});

client.logger.level('debug');

client.start((error) => {
    console.log(error || 'complete');
});

var cors = require("cors");
// enables CORS on preflight requests
app.options("*", cors());
// enables CORS on all other requests
app.use("/", cors());

// Add a handler to inspect the req.secure flag (see 
// http://expressjs.com/api#req.secure). This allows us 
// to know whether the request was via http or https.
app.use (function (req, res, next) {
        if (req.secure) {
                // request was via https, so do no special handling
                next();
        } else {
                // request was via http, so redirect to https
                res.redirect('https://' + req.headers.host + req.url);
        }
});

//eureka code
app.get('/info', function (req, res) {
  res.status(200).send('Response from cdts-eureka-client microservice at '+getDateTime());
});

//expose as service
app.get('/service-instances/:applicationName', function (req, res) {
  res.status(200).send(client.getInstancesByAppId(req.params.applicationName));
});

// start server on the specified port and binding host
app.listen(port, routeUrl, function() {
  console.log("Gulp server starting on " + routeUrl + ":" + port);
});

function getDateTime() {
    var date = new Date();
    var hour = date.getHours();
    hour = (hour < 10 ? "0" : "") + hour;
    var min  = date.getMinutes();
    min = (min < 10 ? "0" : "") + min;
    var sec  = date.getSeconds();
    sec = (sec < 10 ? "0" : "") + sec;
    var year = date.getFullYear();
    var month = date.getMonth() + 1;
    month = (month < 10 ? "0" : "") + month;
    var day  = date.getDate();
    day = (day < 10 ? "0" : "") + day;
    return year + ":" + month + ":" + day + ":" + hour + ":" + min + ":" + sec;
}

//export app for supertest 
module.exports = app;
