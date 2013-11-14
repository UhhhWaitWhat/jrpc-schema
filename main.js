var utils = require('./utils');
var parseSchema = require('./parsers/schema');
var parseResult = require('./parsers/result');
var notifications = require('./notifications');
var ids = require('./ids');
var generateRequest = require('./request');

var cbs = [];

function parse(schema, handler) {
	var ids_plain, get_ref;

	//First standardise our schema into object form
	schema = utils.standardiseSchema(schema);

	//Get our id list
	ids_plain = utils.createIdList(schema);

	//Set up our reference getting function
	getReference = utils.getReference.bind(null, schema, ids_plain);

	//Set up our reference resolving function
	resolveReferences = utils.resolveReferences.bind(null, getReference);

	return parseSchema(schema, resolveReferences, cbs, handler);
};

exports.parse = parse;
exports.handleResponse = parseResult.bind(null, cbs, notifications.dispatch, ids.dispatch);
exports.onNotification = notifications.assign;
exports.onId = ids.assign;
exports.methodToJSON = generateRequest;