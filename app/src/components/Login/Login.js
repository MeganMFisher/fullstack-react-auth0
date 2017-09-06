import React, { Component } from 'react';
import logo from './communityBank.svg';
import './Login.css';


export default class Login extends Component {
    render() {
        console.log(process.env.REACT_APP_LOGIN)
        return (
            <div> 
                <div className='App'>  
                    <img src={logo} alt=""/>
                    <a href='http://localhost:3005/auth'><button>Login</button></a> 
                </div> 
            </div> 
        )
    }
}

//Login button hits the middleware it creates a session, initializes passport, uses passport sessions, then hits the passport.use which takes in two parameters 1. new Auth0Strategy which will take your creditials if those are correct it will run the callback function which is the second parameter. 

//This callback function will make a db call with the user_id given to us from passport for this unique user and see if it is already in our db if not then it creates a user with their information. 

//Then passport will run serializeUser which will serialize the user to the session. 

//Then passport will run deserializeUser which we are having it make another db call to find the session user and return that user. 

//If all of that is done successfully then it will call our get request to /auth and authentication was successful. The req.user now contains the authenticated user. 

//Auth will then run the callback url we entered into auth0.com and if that is successful and the user was fully authenticated then it will successfully return them to our private page with their login information. If their information was not authenticated then it will redirect them to the login page. 

