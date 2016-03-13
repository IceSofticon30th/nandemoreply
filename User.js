var Twit = require('twit');
var EventEmitter = require('events').EventEmitter;

function User(consumerKey, consumerSecret, accessToken, accessTokenSecret, screenName, userId) {
    EventEmitter.call(this);
    
	var client = new Twit({
		consumer_key: consumerKey,
		consumer_secret: consumerSecret,
		access_token: accessToken,
		access_token_secret:accessTokenSecret
	});
    
	var stream = client.stream('user');
    
	stream.on('tweet', function (tweet) {
        this.emit('tweet', tweet);
    });
    
    stream.on('connected', function () {
        this.emit('connected', screenName, userId);
    });
    
    stream.on('disconnect', function (message) {
        this.emit('disconnect', message, screenName, userId);
    });
}

User.prototype = Object.create(EventEmitter.prototype);

module.exports = User;