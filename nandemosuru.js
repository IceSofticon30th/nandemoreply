var ConsumerKey = require('./ConsumerKey.json');
var User = require('./User.js');
var Datastore = require('nedb');

var clients = [];
var userTokens = new Datastore({filename: 'userTokens.db', autoload: true});

userTokens.find({}, function(err, tokens) {
	tokens.forEach(function(token, i) {
        setTimeout(function () {
		    clients.push(new User(ConsumerKey.consumer_key, ConsumerKey.consumer_secret, token.access_token, token.access_token_secret));
        }, i * 1000);
	});
});

function registerUser(token, secret) {
	var auth = {
		access_token: token,
		access_token_secret: secret
	};

	userTokens.update({access_token: token}, auth, {upsert: true});
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

		registerUser(oauth_access_token, oauth_access_token_secret);

		res.end("worked. nice one.");
      }
    });
  } else {
    next(new Error("you're not supposed to be here."));
  }
});

app.listen(3016);