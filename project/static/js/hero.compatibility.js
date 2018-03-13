//Fix for IE (Oh, IE, it had to be you...)
if (typeof(String.prototype.trim) !== "function") {
	String.prototype.trim = function() {
		return this.replace(/^\s+|\s+$/g, "");
	}
}

if (!window.console) {
	(function() {
		var names = ["log", "debug", "info", "warn", "error", "assert", "dir", "dirxml",
					"group", "groupEnd", "time", "timeEnd", "count", "trace", "profile", "profileEnd"];
		window.console = {};
		for (var i = 0; i < names.length; ++i) {
			window.console[names[i]] = function() {};
		}
	}());
}