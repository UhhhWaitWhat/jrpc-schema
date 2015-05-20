var skeemas = require('skeemas');
var EventEmitter = require('events').EventEmitter;

function Schema(schema, handler) {
	this.id = 1;
	this.ids = new EventEmitter();
	this.cbs = [];
	this.handler = handler;
	this.validator = skeemas();
	this.validator.addRef(schema);
	this.notifications = new EventEmitter();

	this.schema = this.shortcutGenericSchema(schema);
}

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
	var res = JSON.parse(response);

	//Check if response contains an id
	if(res.id) {
		this.ids.emit(res.id, res);
		this.ids.removeAllListeners(res.id);
	} else {
		this.notifications.emit(res.method, res.params);
	}

	return res;
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
			//Keep our ids unique
			var id = self.id++;

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

			//Run the actual method
			self.handler(Schema.methodToJSON(name, args, id));
		});
	};
};

Schema.methodToJSON = function(name, args, id) {
	return JSON.stringify({
		id: id,
		jsonrpc: '2.0',
		method: name,
		params: args
	});
};

module.exports = Schema;
