var notification_handlers = {
	source: [],
	method: []
};

//Assigns a handler to a notification
function assignToNotification(method, source, cb) {
	if(typeof source !== 'function') {
		if(!notification_handlers.source[source]) {
			notification_handlers.source[source] = [];
		}

		if(!notification_handlers.source[source][method]) {
			notification_handlers.source[source][method] = [];
		}

		notification_handlers.source[source][method].push(cb);
	} else {
		cb = source;
		if(!notification_handlers.method[method]) {
			notification_handlers.method[method] = [];
		}
		
		notification_handlers.method[method].push(cb);		
	}
}

//This dispatches a notification
function dispatchNotification(method, source, params) {
	var x;

	//Call all handlers assigned to only the function
	if(notification_handlers.method[method]) {
		for(x = 0; x < notification_handlers.method[method].length; x++) {
			notification_handlers.method[method][x](params);
		}
	}

	//Call all handlers assigned to the function for a specific source
	if(source && notification_handlers.source[source]) {
		if(notification_handlers.source[source][method]) {
			for(x = 0; x < notification_handlers.source[source][method].length; x++) {
				notification_handlers.source[source][method][x](params);
			}
		}
	}
}

exports.dispatch = dispatchNotification;
exports.assign = assignToNotification;