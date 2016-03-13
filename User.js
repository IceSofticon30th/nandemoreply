var Twit = require('twit');
var EventEmitter = require('events').EventEmitter;

function User(consumerKey, consumerSecret, accessToken, accessTokenSecret, screenName, userId) {
    EventEmitter.call(this);
    var self = this;
    
	var client = new Twit({
		consumer_key: consumerKey,
		consumer_secret: consumerSecret,
		access_token: accessToken,
		access_token_secret:accessTokenSecret
	});
    
	var stream = client.stream('user');
    
	stream.on('tweet', function (tweet) {
        self.emit('tweet', tweet);
    });
    
    stream.on('connected', function () {
        self.emit('connected', screenName, userId);
    });
    
    stream.on('disconnect', function (message) {
        self.emit('disconnect', message, screenName, userId);
    });
    
    stream.on('error', function (error) {
        self.emit('erorr', error);
    });
}

User.prototype = Object.create(EventEmitter.prototype);

module.exports = User;