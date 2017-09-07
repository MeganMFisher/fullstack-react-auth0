import { createStore, applyMiddleware } from 'redux'; //Lets us use middleware with Redux. Middleware provides a way to interact with actions that have been dispatched to the store before they reach the store's reducer. Examples of different uses for middleware include logging actions, reporting errors, making asynchronous requests, and dispatching new actions.
import user_reducer from './ducks/user_reducer';
import promiseMiddleware from 'redux-promise-middleware'; //Redux promise middleware enables handling of async code in Redux. 

export default createStore(user_reducer, {}, applyMiddleware(promiseMiddleware()));