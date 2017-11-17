import _ from 'underscore';
import * as types from 'mgmt/ERTaskTable/constants';


const defaultState = {
    isFetching: false,
    isLoaded: false,
    isSubmitting: false,
    list: [],
};

function ertasks(state=defaultState, action) {
    let index, list;
    switch (action.type) {
    case types.REQUEST_ERTASKS:
        return Object.assign({}, state, {
            isFetching: true,
            isLoaded: false,
        });

    case types.RECEIVE_ERTASKS:
        return Object.assign({}, state, {
            isFetching: false,
            isLoaded: true,
            list: action.ertasks,
        });

    case types.PATCH_ERTASK:
        index = state.list.indexOf(
            _.findWhere(state.list, {id: action.ertask.id})
        );
        if (index >= 0){
            list = [
                ...state.list.slice(0, index),
                {...state.list[index], ..._.omit(action.ertask, 'csrfmiddlewaretoken')},
                ...state.list.slice(index + 1),
            ];
        }
        return Object.assign({}, state, {list});

    case types.SUBMIT_ERTASKS:
        return Object.assign({}, state, {
            isSubmitting: true,
        });

    case types.SUBMIT_FINISHED:
        return Object.assign({}, state, {
            isSubmitting: false,
        });

    default:
        return state;
    }
}

export default ertasks;
