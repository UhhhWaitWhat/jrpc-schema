var skeemas = require('skeemas');
var EventEmitter = require('events').EventEmitter;

function Schema(schema, handler, parent) {
	var id = 1;

	/* If we have a parent, use its ids */
	this.id = function() { return parent ? parent.id() : id++; };
	this.ids = parent ? parent.ids : new EventEmitter();
	this.cbs = [];

	/* If we have a parent, create a queue we run in batch mode */
	this.queue = parent ? [] : false;
	this.handler = handler;
	this.rawSchema = schema;
	this.validator = skeemas();
	this.validator.addRef(schema);
	this.notifications = new EventEmitter();

	this.schema = this.shortcutGenericSchema(schema);
}

/* Create a batch schema from ourself */
Schema.prototype.batch = function() {
	return new Schema(this.rawSchema, this.handler, this);
};

/* If we are a batch schema, this is used to send all queued requests at once */
Schema.prototype.send = function() {
	if(!this.queue) throw new Error('.send() can only be called in batch mode!');

	/* Send a batch of data */
	this.handler(JSON.stringify(this.queue));
	this.queue = [];
};

//Parses a schema regardless of type
Schema.prototype.shortcutSchema = function(schema, name) {
	if(schema.type) {
		switch(schema.type) {
			case 'method':
				//Return the created method
				return this.createMethod(name, schema);

			case 'notification':
				//Return a bound notification
				return this.notifications.on.bind(this.notifications, name);

			default:
				//Do not assume any type
				return this.shortcutGenericSchema(schema);
		}
	} else {
		return this.shortcutGenericSchema(schema);
	}
};

//Parses a schema with no type
Schema.prototype.shortcutGenericSchema = function(schema) {
	var self = this;

	//We want to return a validator function for our schema
	var result = function(data) {
		return self.validator.validate(data, schema).valid;
	};

	Object.keys(schema).forEach(function(prop) {
		var child = schema[prop];

		if(typeof child === 'object' && child !== null && !Array.isArray(child)) {
			result[prop] = self.shortcutSchema(child, prop);
		}
	});

	return result;
};

Schema.prototype.handleResponse = function(response) {
	try {
		var parsed = JSON.parse(response);

		/* If we have an array, we got a batch result, so normalize and iterate over all result objects */
		var results = Array.isArray(parsed) ? parsed : [parsed];

		results.forEach(function(result) {
			//Check if response contains an id
			if(result.id) {
				this.ids.emit(result.id, result);
				this.ids.removeAllListeners(result.id);
			} else {
				this.notifications.emit(result.method, result.params);
			}
		}, this);
	} catch (err) {
		if(this.onerror) {
			this.onerror(err);
		} else {
			throw err;
		}
	}
};

Schema.prototype.createMethod = function(name) {
	var self = this;

	return function(args) {
		if(arguments.length > 1) {
			args = Array.prototype.slice.call(arguments);
		} else if(typeof args === 'undefined') {
			args = {};
		} else if(typeof args !== 'object') {
			args = [args];
		}

		//Return a promise
		return new Promise(function(resolve, reject) {
			//Get a unique id
			var id = self.id();

			//Resolve the promise once we get a response with the correct id
			self.ids.on(id, function(result) {
				if(result.error) {
					var error = new Error('Server responded with error: ' + result.error.message);
					error.response = result.error;

					reject(error);
				} else {
					resolve(result.result);
				}
			});

			//Run or queue the method
			if(self.queue) {
				self.queue.push(Schema.methodToObject(name, args, id));
			} else {
				self.handler(Schema.methodToJSON(name, args, id));
			}
		});
	};
};

Schema.methodToObject = function(name, args, id) {
	return {
		id: id,
		jsonrpc: '2.0',
		method: name,
		params: args
	};
};

Schema.methodToJSON = function(name, args, id) {
	return JSON.stringify(Schema.methodToObject(name, args, id));
};

module.exports = Schema;
