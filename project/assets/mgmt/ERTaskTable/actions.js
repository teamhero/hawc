import fetch from 'isomorphic-fetch';
import h from 'mgmt/utils/helpers';

import { setError, resetError } from 'shared/actions/Errors';
import * as types from './constants';

function makeERTaskRequest(){
    return {
        type: types.REQUEST_ERTASKS,
    };
}

function receiveERTasks(ertasks){
    return {
        type: types.RECEIVE_ERTASKS,
        ertasks,
    };
}

function patchERTask(ertask){
    return {
        type: types.PATCH_ERTASK,
        ertask,
    };
}

export function fetchERTasks(){
    return (dispatch, getState) => {
        dispatch(resetError());
        let state = getState();
        if (state.ertasks.isFetching) return;
        dispatch(makeERTaskRequest());
        let { host, ertasks } = state.config;
        const url = h.getUrlWithAssessment(h.getListUrl(host, ertasks.url), state.config.assessment_id);
        return fetch(url, h.fetchGet)
            .then((response) => response.json())
            .then((json) => dispatch(receiveERTasks(json)))
            .catch((error) => dispatch(setError(error)));
    };
}

export function submitERTaskEdit(ertask) {
    return (dispatch, getState) => {
        let state = getState();
        let { host, ertasks, csrf } = state.config;
        const url = h.getObjectUrl(host, ertasks.submit_url || ertasks.url, task.id),
            opts = h.fetchPost(csrf, ertask, 'PATCH');
        return fetch(url, opts)
            .then((response) => {
                if (response.ok){
                    response.json()
                        .then((json) => dispatch(patchERTask(json)));
                } else {
                    response.json()
                        .then((json) => dispatch(setError(json)));
                }
            });
    };
}

export function submitERTasks(ertasks){
    return (dispatch, getState) => {
        dispatch(resetError());
        let state = getState();
        if (state.ertasks.isSubmitting) return;
        Promise.all(
            tasks.map((task) => {return dispatch(submitTaskEdit(task));})
        ).then(() => window.location.href = state.config.cancelUrl);
    };
}

function makeEndpointRequest(){
    return {
        type: types.REQUEST_ENDPOINTS,
    };
}

function receiveEndpoints(endpoints){
    return {
        type: types.RECEIVE_ENDPOINTS,
        endpoints,
    };
}

function filterEndpointOnType(endpointTypes) {
    return {
        type: types.FILTER_ENDPOINT_ON_TYPE,
        types: endpointTypes,
    };
}

function sortEndpoints(sortOpts) {
    return {
        type: types.SORT_ENDPOINTS,
        opts: sortOpts,
    };
}

export function filterAndSortEndpoints(opts) {
    return (dispatch, getState) => {
        dispatch(sortEndpoints(opts.sortOpts));
        dispatch(filterEndpointOnType(opts.filterOpts));
    };
}

export function fetchEndpoints(){
    return (dispatch, getState) => {
        let state = getState();
        if (state.endpoints.isFetching) return;
        dispatch(makeEndpointRequest());
        let { host, endpoints } = state.config;
        const url = h.getListUrl(host, endpoints.url);
        return fetch(url, h.fetchGet)
            .then((response) => response.json())
            .then((json) => dispatch(receiveEndpoints(json)))
            .catch((error) => dispatch(setError(error)));
    };
}
