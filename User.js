var Twit = require('twit');
var EventEmitter = require('events').EventEmitter;
var util = require('util');

util.inherits(Twit, EventEmitter);
var c = Twit.prototype.constructor;
Twit.prototype.constructor = function () {
    EventEmitter.call(this);
    c.apply(this, Array.prototype.slice.call(this, arguments));
}
util.inherits(User, Twit);

function User(consumerKey, consumerSecret, accessToken, accessTokenSecret, screenName, userId, stream) {
    var self = this;
    var auth = {
		consumer_key: consumerKey,
		consumer_secret: consumerSecret,
		access_token: accessToken,
		access_token_secret:accessTokenSecret
	};
    
    Twit.call(this, auth);
    
    if (!stream) return this;
    
	var stream = this.stream('user');
    
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
        console.error(error);
    });
}


module.exports = User;