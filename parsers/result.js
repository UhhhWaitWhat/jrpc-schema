//Parses the result of a method call and then passes it to the callback
//cb is the first argument, so we can bind it easily
function parseResult(cbs, dispatchNotification, dispatchId, source, result) {
	var error;

	if(arguments.length === 4) {
		result = source;
		source = undefined;
	}

	//Parse our response
	try {
		result = JSON.parse(result);
	} catch (e) {
		error = new Error('Response was not a valid json string');
		error.result = result;

		throw error;
	}

	//Check if response contains an id
	if(typeof result.id !== 'undefined') {
		if(cbs[result.id]) {
			cbs[result.id](result.error, result.result);

			delete cbs[result.id];
		}

		dispatchId(result.id, source, result.result);
	} else {
		//TODO dispatchNotification a notification
		dispatchNotification(result.method, source, result.params);
	}
}

module.exports = parseResult;