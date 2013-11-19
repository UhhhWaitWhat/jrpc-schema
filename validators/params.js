var validateInstance = require('./instance');

//Returns true if the params array contains the coorect parameters for the method
//(schema is the schema for the methods parameters)
//Params should either contain the parameters in order or it should contain one object describing the parameters by name
function validateParams(schema, resolveReferences, params) {
	var names = {};

	//Loop through all schema properties and list them by name
	for(x in schema) {
		if(schema[x].name) {
			names[schema[x].name] = schema[x];
		}
	}

	
	//Do we have to try validating by order?
	if(Object.prototype.toString.call(params) === '[object Array]') {
		return validateByOrder(params)
	} else {
		return validateByName(params);
	}

	//Validate our parameters assuming they are supplied in the correct order
	function validateByOrder(params) {
		var x;

		//Loop through all properties in schema and check if required ones exist
		for(x = 0; x < schema.length; x++) {
			if(schema[x].required) {
				if(!params.hasOwnProperty(x)) {
					return false
				}
			}
		}

		//Loop through all existing params and check if they are valid
		for(x = 0; x < params.length; x++) {
			if(schema.length >= x) {
				if(!validateInstance(schema[x], resolveReferences, params[x])) {
					return false;
				}
			} else {
				if(names.hasOwnProperty('*')) {
					if(!validateInstance(names['*'], resolveReferences, params[x])) {
						return false;
					}
				}
			}
		}

		return true;
	}

	//Validate our parameters assuming they are supplied as an object by name
	function validateByName(params) {
		var x;

		//Loop through all named params and see if they exist if required
		for(x in names) {
			if(names[x].required) {
				if(!params.hasOwnProperty(x)) {
					return false;
				}
			}
		}

		//Loop through all params to see if they are valid
		for(x in params) {
			if(names.hasOwnProperty(x)) {
				if(!validateInstance(names[x], resolveReferences, params[x])) {
					return false;
				}
			} else {
				if(names.hasOwnProperty('*')) {
					if(!validateInstance(names['*'], resolveReferences, params[x])) {
						return false;
					}
				}
			}
		}

		return true;
	}
}

module.exports = validateParams;