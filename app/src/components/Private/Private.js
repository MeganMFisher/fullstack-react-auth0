import React, { Component } from 'react';
import './Private.css';

import axios from 'axios';
import { connect } from 'react-redux';
import { getUserInfo } from './../../ducks/user_reducer';


class Private extends Component {

    componentDidMount() {
        this.props.getUserInfo();
        console.log(this.props.user)
    }



    render() {
        return (
            <div>
                <h1>Community Bank</h1><hr />
                    <div className='accountInfoContainer'>
                    <h4>Account information:</h4>
                    { this.props.user ? <img className='avatar' src={this.props.user.img} /> : null }
                    <div>
                        <p>Username: { this.props.user ? this.props.user.user_name : null }</p>
                        <p>Email: { this.props.user ? this.props.user.email : null }</p>
                        <p>ID: { this.props.user ? this.props.user.auth_id : null }</p>
                        <h4>Available Balance: { this.props.user ? '$' + Math.floor((Math.random() + 1) * 1000000) + '.00' : null } </h4>
                     </div>
                    <a href='http://localhost:3005/auth/logout'><button>Log out</button></a>
                </div>
            </div> 
        )
    }
}  

function mapStateToProps(state) {
    return {
        user: state.user
    }
}

let outputActions = {
    getUserInfo, //getUserInfo = getUserInfo
  } 

export default connect( mapStateToProps, outputActions)(Private);
