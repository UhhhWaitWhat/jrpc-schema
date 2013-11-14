var parseMethod = require('./method');
var isSchema = require('../utils').isSchema;
var validateInstance = require('../validators/instance');

//Parses a schema regardless of type
function parseSchema(schema, resolveReferences, cbs, path_arg, handler_arg) {
	//Setup our path if we did not get one passed to us
	path = arguments[4] ? arguments[3] : [];

	//Set our handler to the correct argument if we only got passed two
	handler = arguments[4] ? arguments[4] : arguments[3];

	if(schema.type) {
		switch(schema.type) {
			case 'method':
				//Return the created method
				return parseMethod(schema, resolveReferences, cbs, path, handler);
				break;

			default:
				//Do not assume any type
				return parseGenericSchema(schema, resolveReferences, cbs, path, handler)
				break;
		}
	} else {
		return parseGenericSchema(schema, resolveReferences, cbs, path, handler);
	}
}

//Parses a schema with no type
function parseGenericSchema(schema, resolveReferences, cbs, path, handler) {
	//We want to return a validator function for our schema
	var result = validateInstance.bind(null, schema, resolveReferences);

	for(var x in schema) {
		if(isSchema(schema[x])) {
			result[x] = parseSchema(schema[x], resolveReferences, cbs, path.concat(x), handler);
		}
	}

	return result;
}


module.exports = parseSchema;