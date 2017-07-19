'use strict'
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const secret = require('./config/secret');
const request = require('request');
const api_ai = require('apiai')(secret.api_ai_client_access_token);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const server = app.listen(process.env.PORT || 3000, () => {
  console.log('Express server listening on port %d in %s mode', server.address().port, app.settings.env);
});

/* For Facebook Validation */
app.get('/webhook', (req, res) => {
  if (req.query['hub.mode'] && req.query['hub.verify_token'] === secret.fb_token) {
    res.status(200).send(req.query['hub.challenge']);
  } else {
    res.status(403).end();
  }
});



function sendMessage(event) {
  let sender = event.sender.id;
  let text = event.message.text;
  console.log(`lat: ${lat} and lng: ${lng}`);

  let apiai = api_ai.textRequest(text, {
    sessionId: 'unique_id'
  });

  apiai.on('response', (response) => {

    let send_text = response.result.fulfillment.speech;

    request({
    url: 'https://graph.facebook.com/v2.6/me/messages',
    qs: {access_token: secret.PAGE_ACCESS_TOKEN},
    method: 'POST',
    json: {
      recipient: {id: sender},
      message: {text: send_text}
    }
  }, function (error, response) {
    if (error) {
        console.log('Error sending message: ', error);
    } else if (response.body.error) {
        console.log('Error: ', response.body.error);
    }
  });
  });

  apiai.on('error', (error) => {
    console.log(error);
  });

  apiai.end();
}

/* Handling Ticketmaster events */
app.post('/events/:location', (req, res) => {
  var http = require("https");
var address = req.params.location;
//console.log(address);

var options = {
  "method": "GET",
  "hostname": "maps.googleapis.com",
  "port": null,
  "path": `/maps/api/geocode/json?address=${address}&key=AIzaSyAZQQk3syacLr6w0SBG5vdFkfjmrNo-MBs`,
  "headers": {
    "cache-control": "no-cache",
    "postman-token": "1c77a22a-421d-44f9-2455-484f9194a704"
  }
};

var req = http.request(options, function (resu) {
console.log("________________");
   console.log(resu);
console.log("________________");
   var lat = (resu.results[0].geometry.viewport.northeast.lat + req.results[0].geometry.viewport.southwest.lat)/2;
   var lng = (resu.results[0].geometry.viewport.northeast.lng + req.results[0].geometry.viewport.southwest.lng)/2;

   res.send({"lat": lat, "lng": lng}); 
});

});

//Consumer Key	px1Lr03ZDH4cjwS0FAzqasNeQPqcf6YG
//Consumer Secret	SAhfHs1yp9HZa1ox
//Key Issued	Tue, 07/18/2017 - 10:19
//Key Expires	Never

/* Handling all messenges */
app.post('/webhook', (req, res) => {
  console.log(req.body);
  if (req.body.object === 'page') {
    req.body.entry.forEach((entry) => {
      entry.messaging.forEach((event) => {
        if (event.message && event.message.text) {
          sendMessage(event);
        }
      });
    });
    res.status(200).end();
  }
});


