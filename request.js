function generateRequest(method, params, id) {
	var result,
		error,
		obj = {	jsonrpc: '2.0' };

	//Check if method name is parsable and assign them
	if(typeof method === 'string') {
		try {
			JSON.stringify(method);
			obj.method = method;
		} catch(e) {
			error = new Error('Method name could not be parsed');
			error.method = method;

			throw error;
		}
	} else {
		error = new TypeError('Method name is not a string');
		error.method = method;

		throw error;
	}

	//Check if params are parsable and assign them
	if( typeof params === 'object' ) {
		try {
			JSON.stringify(params);
			obj.params = params;
		} catch(e) {
			error = new Error('Parameters could not be parsed');
			error.params = params;

			throw error;
		}
	} else {
		error = new TypeError('Parameters are not supplied as an array or object');
		error.params = params;

		throw error;
	}

	//Id supplied?
	if(typeof id !== 'undefined') {

		//Valid type?
		if(id === null || typeof id === 'string' || typeof id === 'number') {
			try {
				JSON.stringify(method);
				obj.id = id;
			} catch(e) {
				error = new Error('ID could not be parsed');
				error.id = id;

				throw error;
			}
		} else {
			error = new TypeError('ID has the wrong type');
			error.id = id;

			throw error;
		}
	}

	return JSON.stringify(obj);
}

module.exports = generateRequest;