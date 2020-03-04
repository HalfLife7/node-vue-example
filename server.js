// start server.js then generator.js to run the project

// Create a NodeJS script called server.js that subscribes to the mashing, boiling and fermentation channels of your Redis database. 
// This script should receive and store the messages it receives from these channels (they can be stored in memory, there's no need for a database).

// The server script should also listen for status updates sent via your SMS FaaS bot and from your Slackbot, 
// and these messages should be stored in memory as well. 
// Assume that the user will send messages with a status of either valid, warning or error. 
// Any message received via the Slackbot should be considered a mashing message, 
// and any message received via the SMS FaaS bot should be considered a boiling message. 

// The server script should also serve your single page application (SPA) at the URL http://localhost:3000/.

// imports
var app = require('express')();
var Bot = require('slackbots');
var redis = require("redis");
var http = require('http').Server(app);
var io = require('socket.io')(http);

// You must also create a file called server.js which runs an Express web server that makes a webpage accessible at http://localhost:3000/dashboard. 
app.get('/', function (req, res) {
    res.sendFile(__dirname + '/home.html');
});

// connect to redis database
// first client to subscribe to keyspace events
clientSub = redis.createClient({
    url: "redis://redis-11537.c10.us-east-1-4.ec2.cloud.redislabs.com:11537",
    password: "OQZ1vPzSmgQ9za5lXZG5Q2eYgGX3YsJG"
});

// second client used to get the key that was published
// error occurs if client used for subscribing is also used to get the key
clientPub = redis.createClient({
    url: "redis://redis-11537.c10.us-east-1-4.ec2.cloud.redislabs.com:11537",
    password: "OQZ1vPzSmgQ9za5lXZG5Q2eYgGX3YsJG"
});


// what to do if error when connecting to server 
clientPub.on("error", function (err) {
    console.log("Error " + err);
});

// what to do if error when connecting to server 
clientSub.on("error", function (err) {
    console.log("Error " + err);
});

// create a bot
var settings = {
    token: 'xoxb-778504367382-778224973607-1Vv2SGpSxen4BzT1KKyXx5UU',
    name: 'yelphelp'
};
var bot = new Bot(settings);

// slank channel instructions
// syntax StatusUpdate Status Message - Ex: StatusUpdate tired worked 12 hours today
// what to do when a message is received from the slackbot
bot.on('message', function (data) {
    if (data.text != null) {

        // Set any parameters, if applicable (see API documentation for allowed params)
        var splitString = data.text.split(" ");
        var params = [];

        // date timestamp
        // https://stackoverflow.com/questions/5129624/convert-js-date-time-to-mysql-datetime
        let timeStamp = new Date().toISOString().slice(0, 19).replace('T', ' ');

        // console.log(splitString);
        if (splitString[0].toLowerCase() == "statusupdate") {
            // console.log("statusupdate");
            var statusText = splitString[1];
            var messageText = "";

            for (i = 2; i < splitString.length; i++) {
                messageText += splitString[i];
                // if last word in array do not a space
                if (i == splitString.length - 1) {
                    // do nothing
                } else {
                    messageText += " ";
                }
            }

            // build json message
            let message = {
                status: statusText,
                message: messageText,
                timestamp: timeStamp
            }

            let channel = "mashing";

            clientPub.publish(channel, JSON.stringify(message));

        };
    }
})


// use redis notification channels to check if new keys have been added
// set the client to subscribe to notifications - https://redis.io/topics/notifications
// KEA sets it to receive all keyspace/keyevent events
clientSub.config('set', 'notify-keyspace-events', 'KEA')


// subscribe to channels
clientSub.subscribe("mashing");
clientSub.subscribe("boiling");
clientSub.subscribe("fermentation");
// set it to subscribe only to 'set' events only (new keys) - for twilio
clientSub.subscribe('__keyevent@0__:set')

// When we successfully subcribe to a channel...
clientSub.on("subscribe", function (channel, count) {
    console.log("Subscribed to " + channel + ". Now subscribed to " + count + " channel(s).");
});

// // When we receive a message from a channel
// clientSub.on("message", function(channel, message) {
//     console.log("Message from channel " + channel + ": " + message);
// });

var storedMessages = [];


// twilio number - +1-289-204-7708
// texting the twilio number with the syntax "update status text" will show up in the microbrewery updates
// ex: update error sleepy

clientSub.on('message', function (channel, message) {
    // when receiving a twilio message
    if (channel == "__keyevent@0__:set") {
        console.log("MESSAGE");
        console.log(message);
        let status = message;
        // message contains the 'key' value that triggered the notification
        // get the value for that key using the other client
        clientPub.get(message, function (err, reply) {
            console.log("REPLY");
            console.log(reply);
            let messageText = reply;

            // date timestamp
            // https://stackoverflow.com/questions/5129624/convert-js-date-time-to-mysql-datetime
            let timeStamp = new Date().toISOString().slice(0, 19).replace('T', ' ');

            // build json message
            let message = {
                status: status,
                message: messageText,
                timestamp: timeStamp
            }

            let channel = "boiling";
            // TODO: what to do with slackbot status message
            clientPub.publish(channel, JSON.stringify(message));


        });
    } else if (channel == "mashing") {
        var mashingMessage = message;
        console.log("mashing: " + mashingMessage);
        io.emit('mashing', mashingMessage);

        // add what channel it came from when adding it to the queue of initial data
        var mashingMessageModified = JSON.parse(mashingMessage);
        mashingMessageModified.channel = "mashing";
        storedMessages.push(JSON.stringify(mashingMessageModified));
    } else if (channel == "boiling") {
        var boilingMessage = message;
        console.log("boiling: " + boilingMessage);
        io.emit('boiling', boilingMessage);

        // add what channel it came from when adding it to the queue of initial data
        var boilingMessageModified = JSON.parse(boilingMessage);
        boilingMessageModified.channel = "boiling";
        storedMessages.push(JSON.stringify(boilingMessageModified));
    } else if (channel == "fermentation") {
        var fermentationMessage = message;
        console.log("fermentation: " + fermentationMessage);
        io.emit('fermentation', fermentationMessage);

        // add what channel it came from when adding it to the queue of initial data
        var fermentationMessageModified = JSON.parse(fermentationMessage);
        fermentationMessageModified.channel = "fermentation";
        storedMessages.push(JSON.stringify(fermentationMessageModified));
    }
})

io.on('connection', function (socket) {
    // on connecting, emit the all stored messages since server started
    io.emit('initialMessages', storedMessages);
})

http.listen(3000, function () {
    console.log('listening on localhost:3000');
});

// When the application is first loaded by the user, any messages that the server has received since it has been running 
// should be sent to the SPA and made available in the relevant pages. Any additional messages that the server receives 
// should be immediately sent to the SPA and then immediately be made available in the relevant pages 
// (how you do this is up to you, but WebSockets would make sense).