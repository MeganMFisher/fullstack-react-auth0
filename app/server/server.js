require('dotenv').config()

const express = require('express')
, bodyParser = require('body-parser')
, passport = require('passport')
, Auth0Strategy = require('passport-auth0')
, massive = require('massive')
, session = require('express-session')


const app = express();

app.use(session({
    secret: process.env.SECRET, //**Required** This is the secret used to sign the session ID cookie. The secret is used to encrypt the session ID, session data is stored server side always, the ID is how its matched up. 
    resave: false, //When true it forces the session to be saved back to the session store, even if the session was never modified during the request.
    saveUninitialized: true //When true it forces a session that is "uninitialized" to be saved to the store. A session is uninitialized when it is new but not modified.
    }));
//Be sure to use express.session() before passport.session() to ensure that the login session is restored in the correct order.
app.use(passport.initialize()); //This middleware is required to initialize Passport. 
app.use(passport.session()); //If your application uses persistent login sessions, passport.session() middleware must also be used.


massive(process.env.CONNECTIONSTRING).then( db => {
    app.set('db', db);
  }) //


passport.use(new Auth0Strategy({
    domain: process.env.AUTH_DOMAIN,
    clientID: process.env.AUTH_CLIENT_ID,
    clientSecret: process.env.AUTH_CLIENT_SECRET,
    callbackURL: process.env.AUTH_CALLBACK

}, function(accessToken, refreshToken, extraParams, profile, done) {
    // accessToken is the token to call Auth0 API (not needed in the most cases)
    // extraParams.id_token has the JSON Web Token
    // profile has all the information from the user
    //A Refresh Token is a special kind of token that can be used to obtain a renewed access token —that allows accessing a protected resource— at any time. You can request new access tokens until the refresh token is blacklisted. Refresh tokens must be stored securely by an application because they essentially allow a user to remain authenticated forever.

      const db = app.get('db') //setting app database connection to the db to a variable that is easier to use. On app there is a get property we are trying to access which has our db on it. 

      // console.log(app.get('db')) //Will show you your queries and everything else regarding your db.

      console.log(profile.identities[0].user_id) //To see the individual user id. //Will get you the id that will look like this: 1121...... Doesn't have google-0auth2 in front of it. 

      console.log(profile.id) //Will get you the id but it will look like this: google-oauth2|1121.....
    
      db.find_user([ profile.identities[0].user_id ])
      .then( user => {
       if ( user[0] ) {
         return done( null, { id: user[0].id } );
          //Sends the user_id given to us by Auth0 to our find_user query which selects the user with that same id if they are already in the db. If the user is there and the sql query returns it then return done(). 


       } else {
    
         db.create_user([profile.displayName, profile.emails[0].value, profile.picture, profile.identities[0].user_id])
         .then( user => {
            return done( null, { id: user[0].id } );
         })
    
       }
      })

    
}));

//Passport will maintain persistent login sessions. In order for persistent sessions to work, the authenticated user must be serialized to the session, and deserialized when subsequent requests are made.

passport.serializeUser(function(user, done) {
  done(null, user);
});

//Passport does not impose any restrictions on how your user records are stored. Instead, you provide functions to Passport which implements the necessary serialization and deserialization logic. In a typical application, this will be as simple as serializing the user, and finding the user by ID when deserializing.

passport.deserializeUser(function(user, done) {
  app.get('db').find_session_user([user.id])
  .then( user => {
    console.log(user)
    return done(null, user[0]);
  })
});

//if you just do user and not user[0] you receive the following: 
//[ anonymous {
  // id: 1,
  // user_name: 'name',
  // email: 'email',
  // img: 'url',
  // auth_id: 'id' } ]

// Passport provides an authenticate() function, which is used as route middleware to authenticate requests.

app.get('/auth', passport.authenticate('auth0')); //If this function gets called, authentication was successful. `req.user` contains the authenticated user.

app.get('/auth/callback', passport.authenticate('auth0', {
  successRedirect: 'http://localhost:3000/#/private',
  failureRedirect: 'http://localhost:3000/#/'
})) //A redirect is commonly issued after authenticating a request. In this case, the redirect options override the default behavior. Upon successful authentication, the user will be redirected to the Private page with their account information. If authentication fails, the user will be redirected back to the login page for another attempt.

app.get('/auth/me', (req, res, next) => {
  if (!req.user) {
    return res.status(404).send('User not found');
  } else {
    return res.status(200).send(req.user);
  }
}) //If there is not a req.user return a 404 if there is send the req.user to the frontend. 

app.get('/auth/logout', (req, res) => {
  req.logOut();
  return res.redirect(302, 'http://localhost:3000/#/');
}) //req.logOut() Is what Passport gives us to terminates a login session. Invoking logout() will remove the req.user property and clear the login session (if any. 

//res.redirect Is what Express gives us to redirects the requesting user to the given url. 

let PORT = 3005;
app.listen(PORT, () => {
    console.log(`Listening on port: ${PORT}`);
})   


//Strategies
// Passport uses the concept of strategies to authenticate requests. Strategies can range from verifying username and password credentials, delegated authentication using OAuth (for example, via Facebook or Twitter), or federated authentication using OpenID.

// done() 

// Strategies require what is known as a verify callback. The purpose of a verify callback is to find the user that possesses a set of credentials.

// When Passport authenticates a request, it parses the credentials contained in the request. It then invokes the verify callback with those credentials as arguments. If the credentials are valid, the verify callback invokes done to supply Passport with the user that authenticated.

// If the credentials are not valid (for example, if the password is incorrect), done should be invoked with false instead of a user to indicate an authentication failure.