Parse JSON-Schemas with support for JSON-RPC Service Descriptors
================================================================

This module allows you, to parse a json schema and then provides you an object to validate a javascript value against any part of it.
In addition it supplies a simple way to call JSON-RPC methods described by this spec:
http://www.simple-is-better.org/json-rpc/jsonrpc20-schema-service-descriptor.html

This module currently follows the 3rd version of the json-schema draft found here:
http://tools.ietf.org/html/draft-zyp-json-schema-03

Usage
-----

`var jrpc = require('jrpc-schema');`

### .handleResponse([source], json) ###
The module does not provide a channel to communicate with any service you might want to query.
Therefore, you should pass any json your source sends you into the modules `.handleResponse()` method.
The optional `connection` parameter can be used, if json data from multiple sources is to be handled. Using `.onNotification()` or `.onId()` we can then attach to requests from specific sources only.

Throws a `TypeError` if `json` is not a valid json string.

### .onNotification(method, [source], handler)###
In case the server might send notifications to our client (e.g. via a websocket connection) we can attach a handler to specific notifications.
`method` should be a string containing a method name and if source is supplied, only notifications send from that source are handled. The `handler` function gets passed the notifications parameters as its only argument.

### .onId(id, [source], handler) ###
Very similar to `.onNotification()` except that it attaches to all responses sent with a specific id. Useful in conjunction with `.methodToJson()`.

### .methodToJson(method, params, [id])###
Simply takes a method name, a params object / array and an optional id and returns a json-rpc request string valid according to v2 of the specification:
http://www.jsonrpc.org/specification

Throws `TypeErrors` if any parameter does not adhere to the spec.

### .parse(schema, handler) ###
This function is probably the most useful, as it parses a supplied json schema and generates validator functions for all subschemas within it.
In addition, it generates wrappers for each json-rpc method it finds.

`schema` has to be a valid json-schema (either as a string or a javascript object) and `handler` should be a function which takes a json string and sends it to the server.

`.parse()` then returns either a validator function for the entire schema or, if the entire schema is of type `method`, a JSON-RPC wrapper for a specific method.

#### Validator Functions ####
A validator function is a function, which takes a javascript value and validates it against a specific schema. It simply returns `true` if the value is valid and `false` otherwise.
In addition, if the validators schema had any other schemas assigned to it as properties (this will be the case for almost all top-level json-schemas), it has a validator function for each of those sub-schemas assigned to it as a property (as functions are objects in js).

##### Example #####
###### Schema ######
	var schema = {
		"type":"object",

		"name": {
			"type": "string"
		},

		"age" :{
			"type": "integer",
			"maximum": 125
		}
	}

###### Parsing ######
	var parsed = parse(schema)

###### Functions ######
* `parsed(value)`: Returns true if `value` is an object
* `parsed.name(value)`: Returns true if `value` is a string
* `parsed.age(value)`: Returns true if `value` is an integer larger then 125

#### RSON-RPC Methods ####
If a json-schema describes a JSON-RPC method, we do not create a validator function. Instead we generate a wrapper for that method. This wrapper takes arguments either by order, or as one object by name. In addition it takes a callback to be called once a response is received. This callback always has to be the last argument and may be omitted. Remember that for the callback to be called, you still have to pass all response from your server into `jrpc.handleResponse()`.

##### Example #####
###### Schema ######
	var schema = {
	   "type": "method",
	   "returns": "number",
	   "params": [
			{
				"type": "number",
				"name": "square",
				"required": true,
				"minimum": 0,
				"description": "Number to find the square root of"
	        },
	        {
	        	"type": "number",
	        	"name": "nth",
	        	"default": 2
	        	"minimum": 2,
	        	"description": "The degree of the root" 
			}
		]
	}

###### Parsing ######
	var root = parse(schema)

###### Use Cases ######
	root(15625, 3, handleResult);
	root(25, handleResult);
	root({nth: 3, square: 15625}, handleResult)