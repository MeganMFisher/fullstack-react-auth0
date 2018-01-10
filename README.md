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

1. Run `create-react-app app` from the route of your project and cd into app. Clean up app.js and app.css. Remove everything in the div and all the css and remove the logo import. 

2. Setup folder structure. db, server folders added as siblings to src and public folders that are included with create-react-app. Add server.js file in server folder.

3. Add a .env file to your route as a sibling to your server folder. This will hold what we used to put into our config but we will no use .env instead. A .env file will make hosting a ton easier. 

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

    - You will also need to go into the settings of your app in Auth0, scroll down to the bottom, select  `advanced settings` then `0Auth` and turn off the `OIDC Conformant` in order for your auth0 to work correctly. 

    - While we are here in the Allowed Callback URL box on auth0 go ahead and enter in the following: 

        ```
        http://localhost:3005/auth/callback
        ```

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
        db.find_user([ profile.identities[0].user_id ]).then( user => {
        if ( user[0] ) {
            return done( null, user );
    
        } else {
    
         
         db.create_user([profile.displayName, profile.emails[0].value, profile.picture, profile.identities[0].user_id]).then( user => {
            return done( null, user[0] ); 
    
       }
      })
      ``` 

- We need to invoke passport.serializeUser and pass in a callback function as the parameter, the callback function will take in two parameters, user and done. Inside the callback function we need to invoke done by passing in null as the first parameter and user as the second. The first argument is for errors if you aren't experiencing errors you can just put null. 

    ```
    passport.serializeUser(function(user, done) {
        done(null, user);
    });
    ```

- We need to now invoke passport.deserializeUser and pass in a callback function. The callback function will take two parameters, the first is an obj and the second is done. 


    ```
    passport.deserializeUser(function(user, done) {
        app.get('db').find_session_user([user[0].id]).then( user => {
            return done(null, user[0]);
        })
    });
    ```


- Now make the endpoints: 

    ```
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
    ```

## Set up Routing in our frontend. 

1. In your Index.js file in your src folder import HashRouter from react-router-dom. And surround your <App/> with HashRouter tags. Be sure to npm install react-router-dom;

    ```
    npm install react-router-dom

    import { HashRouter } from 'react-router-dom';


    ReactDOM.render(
        <HashRouter>
        <App />
        </HashRouter>
    , document.getElementById('root'));
    ```

2. Create our routes. Create a components folder in your src folder. Inside it create one folder called Login and one called Private. Inside Login create a Login.js file and a Login.css file. Inside Private create a Private.js file and a Private.css file. 


3. In your Login.js file set it up as a class component. Be sure to import your Login.css file.

    ```
    import React, { Component } from 'react';
    import './Login.css';


    export default class Login extends Component {
        render() {
            return (
                <div> 
                    <h1>Login</h1> 
                </div> 
            )
        }
    }
    ```

4. In your Private.js file set it up as a class component. Be suer to import your Private.css file. 


    ```
    import React, { Component } from 'react';
    import './Private.css';


    class Private extends Component {
        render() {
            return (
                <div> 
                    <h1>Private</h1> 
                </div> 
            )
        }
    }  

    export default Private; 
    ```

 5. In your app.js file import route from react-router-dom. Then import out Login and Private components and render them.

    ```
    import { Route } from 'react-router-dom';
    import Login from './components/Login/Login';
    import Private from './components/Private/Private';


    class App extends Component {
        render() {
            return (
                <div>
                <Route component={ Login } path='/' exact />
                <Route component={ Private } path='/private' />
                </div> 
            );
        }
    }


    ```



## Set up Redux. 

1. In your terminal run: 

    ``` 
    npm install redux react-redux 
    ```

2. Create a ducks folder in your src folder. Then create a user-reducer.js file in that folder. We need to set up the reducer. 

    ```
    const initialState = {}

    export default function reducer(state = initialState, action) {
        return state;
    }
    ```

3. Create a store.js file on the same level as your ducks folder. Import createStore from redux and the reducer. Then export the invocation of createStore with the reducer as the only argument. 

    ```
    import { createStore } from 'redux';

    import user_reducer from './ducks/user_reducer';

    export default createStore(user_reducer);
    ```

4. In your index.js import Provider from react-redux and the store. Then in the render method wrap the HashRouter tags with Provider and pass the stor as a prop to Provider. 

    ```
    import { Provider } from 'react-redux';
    import store from './store';

    ReactDOM.render(
        <Provider store={store}>
            <HashRouter>
                <App />
            </HashRouter>
        </Provider>, document.getElementById('root'));
    registerServiceWorker();
    ```

5. We need to add applyMiddleware to our store.js. Import it from Redux. Then import promiseMiddleware from react-promise-middleware. In the invocation of createStore we need to have the reducer, and empty object, and applyMiddleware invoked with invoked promiseMiddleware as its parameter. Be sure to npm install redux-promise-middleware in your command line. 

    ```
    npm install redux-promise-middleware

    import { createStore, applyMiddleware } from 'redux';
    
    import promiseMiddleware from 'redux-promise-middleware';

    export default createStore(user_reducer, {}, applyMiddleware(promiseMiddleware()));
    ```


6. Let's jump back to the user_reducer and finish setting it up. 
    - We will be using axios so import that and run the the following in your terminal: 
        ```
        npm install axios

        import axios from 'axios';
        ```

    - Give our initialState a property of user and the value of an empty object: 

        ```
        const initialState = {
            user: {}
        };

        ```
    
    - Set a const variable GET_USER_INFO equal to a string of itself. 

        ``` 
        const GET_USER_INFO = 'GET_USER_INFO';
        ```
    
    - Let's create our action creator which will get our user information. We will call it getUserInfo(). Set a variable userInfo equal to an axios get request to '/auth/me' then in the promise return the data from that response. Next from your getUserInfo action creator return the type as the variable above and the payload will be the userInfo variable we just made.  

        ```
        export function getUserInfo() {
            const userInfo = axios.get('/auth/me').then(res => {
                return res.data;
            })
            return {
                type: GET_USER_INFO,
                payload: userInfo
            }
        }
        ```

    - Create a switch statement inside your reducer function which takes in action.type as the parameter. Set the first case to be GET_USER_INFO + '_FULFILLED'. That case will return an Object.assign() with an empty object, state, and an object with the user being the action.payload. Don't forget to default your switch statement. 

        ```
        export default function reducer(state = initialState, action) {
            switch (action.type) {
                case GET_USER_INFO + '_FULFILLED':
                    return Object.assign({}, state, { user: action.payload });
                default:
                    return state;
            }

        }
        ```


## Auth Login page:

1. Add a REACT_APP_LOGIN property to your .env file with a value of http://localhost:3005/auth. We will put this on our login button to start the login process. 

    ```
    REACT_APP_LOGIN=http://localhost:3005/auth
    ```


2. In your Login.js file import the logo from communityBank.svg. 

    ```
    import logo from './communityBank.svg';

    ```

3. Create a div with a className of App. Inside the div add an img tag with the src of logo. Then add an a tag with an href directed to the REACT_APP_LOGIN in your .env file. The a tags will surround a Login button. **Be sure to restart your frontend so it will pick up your change to the .env file.**  

    ```
    <div className='App'>  
        <img src={logo} alt=""/>
        <a href={ process.env.REACT_APP_LOGIN }><button>Login</button></a>
    </div> 
    ```

4. Paste in the following css into your Login.css file. 

    ```
    @import url('https://fonts.googleapis.com/css?family=Overlock');

    .App {
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    }

    img {
    margin: 50px;
    width: 250px;
    }

    input {
    margin-top: 15px;
    width: 200px;
    height: 30px;
    border: none;
    border-bottom: solid 1px;
    font-size: 15px;
    padding-left: 5px;
    }

    button {
        margin-top: 15px;
        width: 175px;
        height: 40px;
        border-radius: 5px;
        background: white;
        font-size: 20px;
        font-family: 'Overlock', cursive;
    }
    
    button:focus {
        outline: none;
    }

    ```


## Hook up the Private.js file: 

1. In the Private.js file import connnect from react-redux and getUserInfo from the user_reducer. 

    ```
    import { connect } from 'react-redux';
    import { getUserInfo } from './../../ducks/user_reducer';
    ```

2. Private.js needs to watch for any changes on state to the user object. Right about the export default Private create your mapStateToProps function. Pass in state and return the user property with state.user as the value. 

    ```
    function mapStateToProps(state) {
        return {
            user: state.user
        }
    }
    ```

3. Below the mapStateToProps function we will create an outputActions object that will have the getUserInfo function from out reducer on it. 

    ```
    let outputActions = {
        getUserInfo, //getUserInfo = getUserInfo
     } 
    ```

4. We need to invoke connect and pass in the mapStateToProps function as the first parameter and then the outputActions object as the second parameter. 

    ```
    export default connect( mapStateToProps, outputActions)(Private);
    ```

5. Now we need to invoke our getUserInfo action creater in our reducer. We will be using the componentDidMount lifecycle. Inside we will need to invoke this.props.getUserInfo().

    ```
    componentDidMount() {
        this.props.getUserInfo();
        console.log(this.props.getUserInfo)
    }
    ```



    /////////////////////////////////


## Displaying user info on Private.js: 

1. Start by adding an h1 and h4 tag and a couple divs. 

    ```
    <div>
        <h1>Community Bank</h1><hr />
        <div className='accountInfoContainer'>
            <h4>Account information:</h4>
                <!-- User Image here -->
            <div>
                <!-- User Info here -->
            </div>
                <!-- Logout Button here -->
        </div>
    </div> 
    ```

2. We will need to use ternaries to display all the information. If there is a user return an image tag with a className of avatar and the src of this.props.user.img. If there is not an image return null.

        ```
        { this.props.user ? <img className='avatar' src={this.props.user.img} alt='account holder' /> : null }
        ```

3. Now for the username, same setup as about. If there is a user on props display the this.props.user.user_name if not return null. 

        ```
        <p>Username: { this.props.user ? this.props.user.user_name : null }</p>
        ```

4. Same for the email and id: 

        ```
        <p>Email: { this.props.user ? this.props.user.email : null }</p>

        <p>ID: { this.props.user ? this.props.user.auth_id : null }</p>
        ```


5. Now we need to give each user an available balance. Create an h4 tag. If there is a user on state return $ plus Math.floor((Math.random() + 1) * 100) plus '.00 else return null. 

        - The Math.floor() function returns the largest integer less than or equal to a given number. Rounds it for us. 

        - The Math.random() function returns a random number in the range (0 - 1) but not including 1. 

        - We will add 1 to it to make it a random number over 1. 

        - Then times it by 100 or 100000 if you want more fake money :)

        ```
        <h4>Available balance: { this.props.user ? '$' + Math.floor((Math.random() + 1) * 100) + '.00' : null } </h4>
        ```

6. Last we need a way to logout of our application. Create an a tag with an href to our logout endpoint that surrounds a logout button. The endpoint will use req.logout() to end the auth session then will redirect us back to the login page like we specified. 

        ```
        <a href='http://localhost:3005/auth/logout'><button>Log out</button></a>
        ```



7. Now lets do a little styling in Private.css:

        ```
        .avatar {
            width: 100px;
        }

        h1 {
            margin-left: 50px;
        }

        .accountInfoContainer {
            width: 40%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            border: 1px solid black;
            padding-top: 20px;
            padding-bottom: 40px;
            margin-top: 50px;
            margin-left: 30%;
        }
        ```

### All Done!!

If you check your db your login information will be stored there. 