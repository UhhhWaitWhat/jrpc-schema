var standardiseSchema = require('../utils').standardiseSchema;
var isSchema = require('../utils').isSchema;
var validateParams = require('../validators/params');
var generateRequest = require('../request');
var parseResult = require('./result');

//Our id, which we increase to get unique ids per request
var id = 0;

//Parses a schema of type method
function parseMethod(schema, resolveReferences, cbs, path, handler) {
	var method = executeMethod.bind(null, schema, resolveReferences, cbs, path, handler);
	method.isMethod = true;

	return method;
}

//Validates our parameters according to our schema and if valid, passes path and params to the handler
function executeMethod(schema, resolveReferences, cbs, path, handler) {
	var cb, error, json, result_parser, valid, cur_id;

	//If our last argument is a function, use it as our callback
	if(typeof arguments[arguments.length-1] === 'function') {
		cb = arguments[arguments.length-1];
		cur_id = id++;

		//Then slice our arguments into an array
		params = Array.prototype.slice.call(arguments, 5, arguments.length-1)
	} else {
		params = Array.prototype.slice.call(arguments, 5)
	}

	//Do we have to try validating by name?
	if(params.length === 1 && isSchema(params[0])) {
		if(validateParams(schema.params, resolveReferences, params[0])) {
			valid = true;
			params = params[0];
		} else if (validateParams(schema.params, resolveReferences, params)) {
			valid = true;
		} 
	} else {
		valid = validateParams(schema.params, resolveReferences, params)
	}

	if(valid) {
		if(typeof cur_id !== 'undefined') {
			//We have to save our callback
			cbs[cur_id] = cb;
		}

		//Generate our json request and then execute our handler function
		//This handler should pass its result back into our result parser if it is supplied
		json = generateRequest(path[path.length-1], params, cur_id);
		
		//Now call our handler to send the request
		handler(json);
	} else {
		error = new Error('Invalid parameters');
		error.params = params;
		error.schema = schema;

		throw error;
	}
}

module.exports = parseMethod;