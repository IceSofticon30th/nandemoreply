var Twit = require('twit');

var regExpNandemoii = /(なん|何)でも(良|い)い/g;
var regExpNandemo = /(なん|何)でも((?!かんでも)|(?!ない))/g;

function User(consumerKey, consumerSecret, accessToken, accessTokenSecret) {
	var client = new Twit({
		consumer_key: consumerKey,
		consumer_secret: consumerSecret,
		access_token: accessToken,
		access_token_secret:accessTokenSecret
	});
	var stream = client.stream('user');
	stream.on('tweet', function(tweet) {
		if (/\?/g.test(tweet.text)) return;
		var messagePrefix = '@' + tweet.user.screen_name + ' ';
		if (regExpNandemoii.test(tweet.text)) {
			client.post('statuses/update', {
				status: messagePrefix + 'ん？今なんでもいいって言ったよね',
                in_reply_to_status_id: tweet.id_str
			});
		} else if (regExpNandemo.test(tweet.text)) {
			client.post('statuses/update', {
				status: messagePrefix + 'ん？今なんでもするって言ったよね',
                in_reply_to_status_id: tweet.id_str
			});
		}
	});
}

module.exports = User;