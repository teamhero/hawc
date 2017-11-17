export const REQUEST_ERTASKS = 'REQUEST_ERTASKS';
export const RECEIVE_ERTASKS = 'RECEIVE_ERTASKS';
export const PATCH_ERTASK = 'PATCH_ERTASK';
export const SUBMIT_ERTASKS = 'SUBMIT_ERTASKS';
export const SUBMIT_FINISHED = 'SUBMIT_FINISHED';
export const REQUEST_ENDPOINTS = 'REQUEST_ENDPOINTS';
export const RECEIVE_ENDPOINTS = 'RECEIVE_ENDPOINTS';
export const FILTER_ENDPOINT_ON_TYPE = 'FILTER_ENDPOINT_ON_TYPE';
export const SORT_ENDPOINTS = 'SORT_ENDPOINTS';
export const STATUS = {
    10: { color: '#CFCFCF' /* grey */, type: 'not started' },
    20: { color: '#FFCC00' /* yellow */, type: 'started' },
    30: { color: '#00CC00' /* green */, type: 'completed' },
    40: { color: '#CC3333' /* red */, type: 'abandoned' },
};

export const STUDY_TYPES = {
    bioassay: 'Animal bioassay',
    epi: 'Epidemiology',
    epi_meta: 'Epidemiology meta-analysis',
    in_vitro: 'In vitro',
};
