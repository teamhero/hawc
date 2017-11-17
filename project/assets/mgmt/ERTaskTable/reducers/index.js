import { combineReducers } from 'redux';

import config from 'shared/reducers/Config';
import error from 'shared/reducers/Errors';
import endpoints from 'mgmt/ERTaskTable/reducers/Endpoints';
import ertasks from 'mgmt/ERTaskTable/reducers/ERTasks';


const rootReducer = combineReducers({
    config,
    error,
    endpoints,
    ertasks,
});

export default rootReducer;
