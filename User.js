var Twit = require('twit');

var regExpNandemoii = /(なん|何)でも(良|い)い/g;
var regExpNandemosuru = /(なん|何)でも((する)|(します)|(やる)|(やります))/g;
var regExpNandemonai = /(なん|何)でも((ない)|(ありません)|(ございませ))/g;

function User(consumerKey, consumerSecret, accessToken, accessTokenSecret) {
	var client = new Twit({
		consumer_key: consumerKey,
		consumer_secret: consumerSecret,
		access_token: accessToken,
		access_token_secret:accessTokenSecret
	});
	var stream = client.stream('user');
	stream.on('tweet', function(tweet) {
		if (/\?|？/g.test(tweet.text)) return;
        if (/(い|言)ったよね/g.test(tweet.text)) return;
        
        function reply(message) {
            var messagePrefix = '@' + tweet.user.screen_name + ' ';
			client.post('statuses/update', {
				status: messagePrefix + message,
                in_reply_to_status_id: tweet.id_str
			});
        }
        
		if (regExpNandemoii.test(tweet.text)) {
            reply('ん？今なんでもいいって言ったよね');
		} else if (regExpNandemosuru.test(tweet.text)) {
            reply('ん？今なんでもするって言ったよね');
		} else if (regExpNandemonai.test(tweet.text)) {
            reply('ん？今なんでもないって言ったよね');
		}
        
	});
}

module.exports = User;