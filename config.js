require('dotenv').config();
var config = {
    REDIS_URL: process.env.REDIS_URL,
    REDIS_PASSWORD: process.env.REDIS_PASSWORD,
    YELP_TOKEN: process.env.YELP_TOKEN
}

module.exports = config;