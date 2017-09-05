import React, { Component } from 'react';
import './App.css';

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

export default App;
