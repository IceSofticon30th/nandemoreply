var ConsumerKey = require('./ConsumerKey.json');
var User = require('./User.js');
var Datastore = require('nedb');

var clients = [];
var userTokens = new Datastore({filename: 'userTokens.db', autoload: true});

var regExpNandemoii = /(なん|何)でも(良|い)い/g;
var regExpNandemosuru = /(なん|何)でも((する)|(します)|(しよう)|(やる)|(やろう)|(やります))/g;
var regExpNandemonai = /(なん|何)でも((\)ない)|(なかっ)|(）ない)|(ない)|(ありません)|(ございませ))/g;
var regExpNandemojikkyou = /なん[JjＪｊ]/g;

function mainUser(token) {
    var main = new User(
            ConsumerKey.consumer_key,
            ConsumerKey.consumer_secret,
            token.access_token,
            token.access_token_secret,
            token.screen_name,
            token.user_id );
    
    main.on('tweet', function(tweet) {
        if (tweet.retweeted_status) return;
        if (/\?|？/g.test(tweet.text)) return;
        if (/(い|言)ったよね/g.test(tweet.text)) return;
        
        function reply(message) {
            var messagePrefix = '@' + tweet.user.screen_name + ' ';
            
            function recursiveReply(num) {
                if (!num) num = 0;
                if (num >= clients.length) return;
                var client = clients[num];
                client.post('statuses/update', {
                    status: messagePrefix + message,
                    in_reply_to_status_id: tweet.id_str
                }, function (err, data, response) {
                    if (!err) {
                        num++;
                        recursiveReply(num);
                    }
                });
            }
        }
        
        if (regExpNandemoii.test(tweet.text)) {
            reply('ん？今なんでもいいって言ったよね');
        } else if (regExpNandemosuru.test(tweet.text)) {
            reply('ん？今なんでもするって言ったよね');
        } else if (regExpNandemonai.test(tweet.text)) {
            reply('ん？今なんでもないって言ったよね');
        } else if (regExpNandemojikkyou.test(tweet.text)) {
            reply('ん？今なんでも実況するって言ったよね');
        }
        
    });
    
    main.on('disconnect', function(disconnect, screen_name, user_id) {
        console.log(disconnect, screen_name, user_id);
    });
    
    main.on('connected', function (screen_name, user_id) {
        console.log(screen_name, user_id);
    });
    
    main.on('error', function (error) {
        console.log(error);
    });
}

function addUser(token) {
    var client = new User(
            ConsumerKey.consumer_key,
            ConsumerKey.consumer_secret,
            token.access_token,
            token.access_token_secret,
            token.screen_name,
            token.user_id );
    clients.push(client);
    
    client.on('disconnect', function(disconnect, screen_name, user_id) {
        if (disconnect.disconnect.code === 6) {
            userTokens.remove({user_id: user_id});
            clients.splice(clients.indexOf(client), 1);
        }
    });
    
    client.on('connected', function (screen_name, user_id) {
        console.log(screen_name, user_id);
    });
    
    client.on('error', function (error) {
        console.log(error);
    });
    
}

userTokens.find({}, function(err, tokens) {
	tokens.forEach(function(token, i) {
        setTimeout(function () {
            if (token.user_id == 2274093522) {
                mainUser(token);
            } else {
                addUser(token);
            }
        }, i * 1000);
	});
});

function registerUser(name, id, token, secret) {
	var auth = {
        screen_name: name,
        user_id: id,
		access_token: token,
		access_token_secret: secret
	};
    userTokens.findOne({access_token: token}, function (err, doc) {
        if (doc) {
            userTokens.update({access_token: token}, auth, {});
        } else {
            userTokens.insert(auth);
            addUser(auth);
        }
    });
}

var express = require('express'),
    OAuth = require('oauth').OAuth;

var app = express();
app.use(require('body-parser')());
app.use(require('method-override')());
app.use(require('cookie-parser')(ConsumerKey.consumer_key));
app.use(require('express-session')());
app.use(express.static(__dirname + '/public'));

//aouth
var oa = new OAuth(
  "https://api.twitter.com/oauth/request_token",
  "https://api.twitter.com/oauth/access_token",
  ConsumerKey.consumer_key,
  ConsumerKey.consumer_secret,
  "1.0",
  "http://nandemosuru.ysfh.sexy/callback",
  "HMAC-SHA1"
);

//auth/twitterにアクセスするとTwitterアプリケーション認証画面に遷移します。
app.get('/auth', function(req, res){
  oa.getOAuthRequestToken(function(error, oauth_token, oauth_token_secret, results){
    if (error) {
      console.log(error);
      res.end("yeah no. didn't work.");
    } else {
      req.session.oauth = {};
      req.session.oauth.token = oauth_token;
      req.session.oauth.token_secret = oauth_token_secret;
      res.redirect('https://twitter.com/oauth/authenticate?oauth_token='+oauth_token);
    }
  });
});

app.get('/callback', function(req, res, next){
  if (req.session.oauth) {
    req.session.oauth.verifier = req.query.oauth_verifier;
    var oauth = req.session.oauth;
    oa.getOAuthAccessToken(oauth.token,oauth.token_secret,oauth.verifier, 
    function(error, oauth_access_token, oauth_access_token_secret, results){
      if (error){
        console.log(error);
        res.send("yeah something broke.");
      } else {
        req.session.oauth.access_token = oauth_access_token;
        req.session.oauth.access_token_secret = oauth_access_token_secret;

		registerUser(results.screen_name, results.user_id, oauth_access_token, oauth_access_token_secret);

		res.end("worked. nice one.");
      }
    });
  } else {
    next(new Error("you're not supposed to be here."));
  }
});

app.listen(3016);
