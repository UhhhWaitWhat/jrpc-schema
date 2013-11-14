//Recurse through a schema and assign all schemas containing ids to the ids object. This object will then be returned
function createIdList(schema) {
	var ids = {};

	function recursive(schema) {
		if(schema.id) {
			ids[schema.id] = schema;
		}

		for(var x in schema) {
			if(isSchema(schema[x])) {
				recursive(schema[x]);
			}
		}
	}

	recursive(schema);
	return ids;
}

//Return a schema referenced by a $ref attribute
function getReference(schema, ids, ref) {
	var parts = ref.split('#');
	var id = parts[0];
	var path = parts[1] || '';
	var result = schema;
	var error, x;

	//Resolve the id path if neccessary
	if(id.length > 0) {
		if(ids[id]) {
			result = ids[id];
		} else {
			error = new Error('Invalid reference');
			error.ref = ref;
			error.ids = ids;
			error.schema = schema;
			throw error;
		}
	}

	//Resolve the path part if neccessary
	if(path.length > 0) {
		path = path.split('.');
		for( x = 0; x < path.length; x++) {
			if(result[path[x]]) {
				result = result[path[x]];			
			} else {
				error = new Error('Invalid reference (path)');
				error.ref = ref;
				error.ids = ids;
				error.schema = schema;
				throw error;
			}

		}
	}

	return result;
}


function resolveReferences(getReference, schema) {
	var previous = [];

	//Resolve only top-level
	function resolveOne(schema) {
		while(schema.$ref) {
			if(previous.indexOf(schema.$ref) === -1) {
				previous.push(schema.$ref);
				schema = getReference(schema.$ref);
			} else {
				throw new Error('Error resolving reference, loop detected');
			}
		}

		if(typeof schema.extends === 'string') {
			if(previous.indexOf(schema.extends) === -1) {
				previous.push(schema.extends);
				schema.extends = getReference(schema.extends);				
			} else {
				throw new Error('Error resolving reference, loop detected');
			}
		}

		return schema;
	}

	//Resolve all levels
	function resolveDeep(schema) {
		var x;
		schema = resolveOne(schema);

		for(x in schema) {
			if(isSchema(schema[x])) {
				schema[x] = resolveDeep(schema[x]);
			}
		}

		return schema;
	}

	//Run for our schema
	return resolveDeep(schema);
}

//Return a valid schema in object form, or throw if not possible
function standardiseSchema(schema) {
	var error;

	//If we get an object, transcribe it into a string so we do have a definitive json parsed schema later
	if(typeof schema === 'object') {
		try {
			schema = JSON.stringify(schema);
		} catch (e) {
			error = new Error('schema object is not convertible to json');
			error.schema = schema;

			throw error;
		}
	}

	//Now try parsing the string
	try {
		schema = JSON.parse(schema);
	} catch (e) {
		error = new Error('Invalid schema supplied');
		error.schema = schema;

		throw error;
	}

	return schema;
}

//Returns true if schema is an object and not null, false otherwise
function isSchema(schema) {
	return (typeof schema === 'object' && schema !== null && !(schema instanceof Array));
}

exports.isSchema = isSchema;
exports.standardiseSchema = standardiseSchema;
exports.createIdList = createIdList;
exports.getReference = getReference;
exports.resolveReferences = resolveReferences;