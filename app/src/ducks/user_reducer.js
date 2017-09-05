import axios from 'axios';

//SET INITIAL STATE
const initialState = {
    user: {}
};

//ACTION TYPES
const GET_USER_INFO = 'GET_USER_INFO';

//ACTION CREATORS
export function getUserInfo() {
    const userInfo = axios.get('/auth/me').then( res => {
        return res.data
    })
    return {
        type: GET_USER_INFO,
        payload: userInfo
    }
}

//REDUCER FUNCTION
export default function reducer(state = initialState, action) {
    switch (action.type) {
        case GET_USER_INFO + '_FULFILLED':
            return Object.assign({}, state, { user: action.payload });
        default:
            return state;
    }

}

