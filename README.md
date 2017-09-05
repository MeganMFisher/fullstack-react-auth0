# Full-stack Auth Demo

## Front end

- React
- Redux
- Axios

## Back end

- Express
- Express-session
- Passport
- Auth0
- Massive

## Let's get started:

1. Run `create-react-app app` from the route of your project and cd into app. Clean up app.js and app.css.

2. Setup folder structure. db, server folders added as siblings to src and public folders that are included with create-react-app. Add server.js file in server folder.

3. Add a .env file to your route as a sibling to your server folder. This will hold what we used to put into our config but we will no use .env instead.

4. In your terminal run:  
    ``` 
    npm install dotenv 
    ```

5. Require dotenv in your server.js file and be sure to put it into your .gitignore as well. 
    ```
    server: require('dotenv').config()

    .gitignore: .env
    ```

    ```
    Example of .env file

    .env file
    REACT_APP_LOGIN=http://localhost:3005/auth
    SECRET=my-session-secret
    AUTH_DOMAIN=my-auth-domain
    AUTH_CLIENT_ID=my_auth_client_id
    AUTH_CLIENT_SECRET=client-secret
    AUTH_CALLBACK=http://localhost:3005/auth/callback
    DB_HOST=db-host
    DB_PORT=db-port
    DB_DATABASE=database
    DB_USER=user
    DB_PASSWORD=db-password
    ```

## Let's setup our server and get it running:

6. Server Setup: 
    - Go to your package.json and create a main property and have the value point to your server.js file and set up your proxy.
    ```
    "main": "server/server.js"

     "proxy": "http://localhost:3005"
    ```
    - In your terminal run: 
    ```
    npm install express body-parser passport passport-auth0 massive express-session
    ```
    - Require all the above dependencies into your project and invoke express.
    ```
    const express = require('express')
    , bodyParser = require('body-parser')
    , passport = require('passport')
    , Auth0Strategy = require('passport-auth0')
    , massive = require('massive')
    , session = require('express-session')

    const app = express();

    ``` 
    - Set up your app.listen on your desired port. 
    ```
    let PORT = 3005;
    app.listen(PORT, () => {
        console.log(`Listening on port: ${PORT}`);
    })   
    ```

7. Let's test the .env file. Put in a `TEST=ENVworking` into the .env file then `console.log(process.env.TEST)` in your server.js. You should see ENVworking in your terminal. Remove the test before moving on now that we know it works. 

## Let's use our .env file to connect our server to our database: 

8. We need to now set up our database so we can use massive to connect to it. 

    - Open up posgres and pgAdmin4 and set up a database for this project. 

    - Add your postgres connectionstring into your .env file as follows: 

    ```
    CONNECTIONSTRING=postgres://postgres:@localhost/authDemo

    postgres://[username]:[password]@[host]:[port]/[database]
    ```

9. Set up your massive connection and pass in the connection string you created in your .env file.

    ```
    massive(process.env.CONNECTIONSTRING).then( db => {
        app.set('db', db);
    })
    ```

## We need to setup our db table and the calls we will need for auth0

- In your db folder create a users_table_create.sql file where we will create our users table. The table will need to store an id, user_name, email, img, and the auth_id.

```
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    user_name VARCHAR(180),
    email VARCHAR(180),
    img TEXT,
    auth_id TEXT
)
```

- Create a find_user.sql file that will return the user if the id matches. 

```
SELECT * 
FROM users
WHERE users.auth_id = $1;
```

- Create a create_user.sql file that will create a user. 

```
INSERT INTO users
(user_name, email, img, auth_id)
VALUES
( $1, $2, $3, $4 )
RETURNING *;
```

- Create a find_session_user.sql file that will find the user based off of their id. 

```
SELECT *
FROM users
WHERE id = $1;
```


## Setup sessions and passport:

10. In your server.js file we need to setup our session so we can use it. Be sure to create a secret in your .env file for your session. 

    ```
    app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true
    }));

    .env: SECRET=lajlfkejdlkfjalkjdflkajdklfjadlf
    ```


11. We need to initialize passport and configure passport to use sessions.

    ```
    app.use(passport.initialize());
    app.use(passport.session());
    ```

## Setup Auth0: 

12. We need to use passport's new Auth0Strategy and set up our domain, clientID, clientSecret, and callbackURL. Login to your auth0.com account to find all the necessary information we need to get started. 

    ```
    passport.use(new Auth0Strategy({
        domain: process.env.AUTH_DOMAIN,
        clientID: process.env.AUTH_CLIENT_ID,
        clientSecret: process.env.AUTH_CLIENT_SECRET,
        callbackURL: process.env.AUTH_CALLBACK
    }

    .env: 
    AUTH_DOMAIN=my-auth-domain
    AUTH_CLIENT_ID=my_auth_client_id
    AUTH_CLIENT_SECRET=client-secret
    AUTH_CALLBACK=http://localhost:3005/auth/callback
    ```

- The first parameter new Auth0Strategy takes is an object with the domain, clientID, clientSecret, and callback url. The second parameter it takes is a callback function with the parameters of accessToke, refreshToken, extramParams, profile, and done.

    ```
    function(accessToken, refreshToken, extraParams, profile, done) {
    
    }))
    ```

    - Inside the function set the app.get('db') to a const variable of db. 

        ```
        const db = app.get('db');
        ```

    - Then make a db call to our user table using the find_user query. We will need to pass in information from the profile parameter. In the promise if there will need to be a if statement. If the user is found then return the user. Else we will need to create the user.

        ```
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
      ``` 

- We need to invoke passort.serializeUser and pass in a callback function as the parameter, the callback function will take in two parameters, user and done. Inside the callback function we need to invoke done by passing in null as the first parameter and user as the second. 

    ```
    passport.serializeUser(function(user, done) {
        done(null, user);
    });
    ```