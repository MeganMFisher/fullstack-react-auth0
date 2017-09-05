require('dotenv').config()

const express = require('express')
, bodyParser = require('body-parser')
, passport = require('passport')
, Auth0Strategy = require('passport-auth0')
, massive = require('massive')
, session = require('express-session')


const app = express();

app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true
    }));
app.use(passport.initialize());
app.use(passport.session());


massive(process.env.CONNECTIONSTRING).then( db => {
    app.set('db', db);
  })


passport.use(new Auth0Strategy({
    domain: process.env.AUTH_DOMAIN,
    clientID: process.env.AUTH_CLIENT_ID,
    clientSecret: process.env.AUTH_CLIENT_SECRET,
    callbackURL: process.env.AUTH_CALLBACK
}, function(accessToken, refreshToken, extraParams, profile, done) {
    
      const db = app.get('db')

      console.log(profile.identities[0].user_id)
    
      db.find_user([ profile.identities[0].user_id ])
      .then( user => {
       if ( user[0] ) {
    
         return done( null, { id: user[0].id } );
    
       } else {
    
         db.create_user([profile.displayName, profile.emails[0].value, profile.picture, profile.identities[0].user_id])
         .then( user => {
            return done( null, { id: user[0].id } );
         })
    
       }
      })
    
}));

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  app.get('db').find_session_user([obj.id])
  .then( user => {
    return done(null, user[0]);
  })
});

app.get('/auth', passport.authenticate('auth0'));

app.get('/auth/callback', passport.authenticate('auth0', {
  successRedirect: 'http://localhost:3000/#/private',
  failureRedirect: 'http://localhost:3000/#/'
}))

app.get('/auth/me', (req, res, next) => {
  if (!req.user) {
    return res.status(404).send('User not found');
  } else {
    return res.status(200).send(req.user);
  }
})

app.get('/auth/logout', (req, res) => {
  req.logOut();
  return res.redirect(302, 'http://localhost:3000/#/');
})


let PORT = 3005;
app.listen(PORT, () => {
    console.log(`Listening on port: ${PORT}`);
})   