const startup = function(cb) {
    import('./index.js').then((evidenceProfile) => {
    	console.log("In Evidence Profile Startup");
        cb(evidenceProfile.default);
    });
}

export default startup;
