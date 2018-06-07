const startup = function(cb) {
    import('./index.js').then(
        (evidenceProfile) => {
            // After importing the configuration from the index file, then use an empty (default) evidenceProfile as the argument
            // for the function that was passed into this function call
            cb(evidenceProfile.default);
        }
    );
}

export default startup;
