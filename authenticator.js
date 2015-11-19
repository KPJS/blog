module.exports.setup = function(expressApp){
  if(!expressApp)
  {
    throw 'Missing express app';
  }

  var session = require('express-session');
  var FileStore = require('session-file-store')(session);
  var passport = require('passport');
  var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

  passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: 'http://' + (process.env.NODE_ENV === 'production' ? 'kpjs.azurewebsites.net' : 'localhost:1337') + '/login/google/callback'
    },
    function(token, tokenSecret, profile, done) {
      process.nextTick(function() {
        // To keep the example simple, the user's Google profile is returned to
        // represent the logged-in user.  In a typical application, you would want
        // to associate the Google account with a user record in your database,
        // and return that user instead.
        return done(null, profile);
      });
    }
  ));

  passport.serializeUser(function(user, done) {
    done(null, user);
  });

  passport.deserializeUser(function(obj, done) {
    done(null, obj);
  });

  expressApp.use(session({ secret: 'keyboard cat', name: 'kpjs.blog.session', resave: true, saveUninitialized: true, store: new FileStore() }));
	expressApp.use(passport.initialize());
	expressApp.use(passport.session());

  expressApp.get('/login/google', passport.authenticate('google', { scope: ['https://www.googleapis.com/auth/plus.login', 'https://www.googleapis.com/auth/userinfo.email'] }));
	expressApp.get('/logout', function(req, res){
		req.logout();
		req.session.regenerate(function(err){
			res.redirect('/');
		});
	});
	expressApp.get('/login/google/callback',
		passport.authenticate('google', { failureRedirect: '/googleFail', successRedirect: '/' })
  );
	expressApp.get('/googleFail', function(req, res){ res.end('google login failed'); });
};
