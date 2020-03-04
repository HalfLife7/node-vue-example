// Create a NodeJS script called generator.js. When the script is run, 
// every 1 second it should randomly generate and publish a message to your Redis database (using Pub/Sub). 
// The script should do this indefinitely (i.e. until it is terminated). 
// The messages should be published to one of three different channels, 
// determined as part of the random generation of the message: mashing, boiling, fermentation. 
// The messages should contain a JSON object structured as follows, populated with data as follows:

// {"status": randomly populate with either "valid", "warning", or "error"
// ,"message": some randomly generated text
// ,"timestamp": A timestamp, formatting of your choosing, that includes both DD/MM/YYYY and HH/MM data (not randomly generated, use the actual time the message occured)
// } 

var redis = require("redis");

// connection to the service using our url, password 
// change this to use your username and password
client = redis.createClient({
    url: "redis://redis-11537.c10.us-east-1-4.ec2.cloud.redislabs.com:11537",
    password: "OQZ1vPzSmgQ9za5lXZG5Q2eYgGX3YsJG"
});

// what to do if error when connecting to server 
client.on("error", function (err) {
    console.log("Error " + err);
});


// generate random string
// https://stackoverflow.com/questions/1349404/generate-random-string-characters-in-javascript
function randomMessage(length) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}



function generateMessage() {

    // date timestamp
    // https://stackoverflow.com/questions/5129624/convert-js-date-time-to-mysql-datetime
    let timeStamp = new Date().toISOString().slice(0, 19).replace('T', ' ');

    // randomly decide to generate
    // 1 - mashing, 2- boiling, 3 - fementation
    let randomChannel = Math.floor((Math.random() * 3) + 1);

    let channel
    if (randomChannel == 1) {
        channel = "mashing";
    } else if (randomChannel == 2) {
        channel = "boiling";
    } else {
        channel = "fermentation";
    }

    // randomly generate status
    // 1 - valid, 2 - warning, 3 - error
    var randomStatus = Math.floor((Math.random() * 3) + 1);

    let status;
    if (randomStatus == 1) {
        status = "valid";
    } else if (randomStatus == 2) {
        status = "warning";
    } else {
        status = "error";
    }

    // build json message
    let message = {
        status: status,
        message: randomMessage(10),
        timestamp: timeStamp
    }

    console.log(channel);
    console.log(message);
    client.publish(channel, JSON.stringify(message));
}



// every 1 second, run the generator
setInterval(generateMessage, 1000);