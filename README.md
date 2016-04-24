Parse JSON-Schemas with support for JSON-RPC Service Descriptors
================================================================
This module allows you to parse a json schema and then provides you an object to validate a javascript value against.
In addition it supplies a simple way to call JSON-RPC methods and subscribe to notifications described by this spec:
http://www.simple-is-better.org/json-rpc/jsonrpc20-schema-service-descriptor.html

Protocol-Agnosticism
--------------------
This library is not bound to a specific method for transmitting data back and forth between your app and the queried server.
Therefore you have to provide the facilities for this on your own. For all examples below, we use a WebSocket instance:

```js
var jrpc = require('jrpc-schema');
var Schema = jrpc.Schema;
var socket = new WebSocket('ws://localhost/');
```

API
---
### jrpc.Schema(schemaObject, transmitterFunction)
The main "meat" of the library. The `Schema` constructor should be invoked with a JSON Schema object (not a JSON string). The second parameter should be a transmitter function, which takes a json string as its first argument and sends it to the server.

```js
var schema = new jrpc.Schema(someSchema, socket.send.bind(socket));
```

You will then have to pass your servers responses into the schemas `handleResponse` method:
```js
socket.on('message', schema.handleResponse.bind(schema));
```

#### Handling errors
To handle any errors while e.g. parsing JSON, you can attach a handler to the schema object:
```js
schema.onerror = e => console.error(e);
```

If no handler is attached, the error **will** be thrown.

#### Validator Functions
A validator function is a function, which takes a javascript value and validates it against a specific schema. It simply returns `true` if the value is valid and `false` otherwise.
In addition, if the validators schema had any other schemas assigned to it as properties (this will be the case for almost all top-level json-schemas), it has a validator function for each of those sub-schemas assigned to it as a property (as functions are objects in js).

**Schema**
```js
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
```

**Usage**
```js
var root = new Schema(schema, someTransmitter);

//Returns true if `value` is an object
root.schema(value)

//Returns true if `value` is a string
root.schema.name(value)

//Returns true if `value` is an integer larger then 125
root.schema.age(value)
```

#### RSON-RPC Methods
If a json-schema describes a JSON-RPC method, we do not create a validator function. Instead we generate a wrapper for that method. This wrapper takes arguments either by order as an array, or as one object by name. The method will return a promise, which will be fulfilled with the methods return value once it becomes available.

**Schema**
```js
var schema = {
	"square": {
		"type": "method",
		"returns": "number",
		"params": [
			{
				"type": "number",
				"name": "square",
				"required": true,
				"minimum": 0,
		    },
				"description": "Number to find the square root of"
		    {
		    	"type": "number",
		    	"name": "nth",
		    	"default": 2
		    	"minimum": 2,
		    	"description": "The degree of the root"
			}
		]
	}
}
```

**Usage**
```js
var root = new Schema(schema, someTransmitter);

root.schema.square({
	square: 27,
	nth: 3
}).then(function(result) {
	//Result should be 3, given a sane server
	console.log(result);
});

//By order
root.schema.square(27, 3).then(function(result) {
	console.log(result);
})
```

##### Batch Requests
If you need to send multiple requests in a batch, you can use a batch object:

```js
var root = new Schema(schema, transmitter);
var batch = root.batch();

var res = batch.schema.someMethod();
var res2 = batch.schema.someOtherMethod();

batch.send();
```

The batch object will have all the methods of the main schema. But they will all be queued until you call `.send()` on the batch object.

The methods still return promises which will be resolved with the methods result.

#### JSON-RPC Notifications
JSON RPC notifications are treated similarly to methods.

**Schema**
```js
var schema = {
	"notify": {
		"params": [
			{
				"name": "data",
				"required": true,
				"type": number
			}
		],
		"returns": null,
		"type": "notification"
	}
}
```

**Usage**
```js
var root = new Schema(schema, someTransmitter);

//May be called multiple times
root.schema.notify(function(data) {
	console.log(data);
});

//Alternative without the need to have been defined in the schema
root.notifications.on('notify', function(data) {
	console.log(data);
})
```

### jrpc.run(method, params, transmitter)
Call a single json-rpc method and return a Promise.
`method` should be the method name, `params` should be a parameter object and the `transmitter` should be a function which takes a json string as its only argument. This string should then be send to the server.

The returned Promise has a `.handle(json)` which you should call with all of your servers responses. The promise will then be resolved with the correct value as soon as it is available.

```js
//Run the request
var playerInfo = jrpc.run('Player.GetInfo', {
	'playerid': 1
}, socket.send.bind(socket));

//Log the result
playerInfo.then(function(info) {
	console.log(info);
}
});

//Ensure the library gets the servers data
socket.on('message', playerInfo.handle);
```

As you can see, this is slightly convoluted and does not utilize json-schemas at all.
You should use an instance of `jrpc.Schema` wherever possible.
