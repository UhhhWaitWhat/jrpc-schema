var JSV = require('JSV').JSV;
var env = JSV.createEnvironment('json-schema-draft-03');

//Returns true if the instance is valid according to the schema
function validateInstance(schema, resolveReferences, instance) {
	schema = resolveReferences(schema);

	var report = env.validate(instance, schema);
	
	if(report.errors.length === 0) {
		return true;
	} else {
		return false;
	}
}

module.exports = validateInstance;