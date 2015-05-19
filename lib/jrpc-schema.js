var uid = -1;
var Schema = require('./Schema');

module.exports = {
	Schema: Schema,
	run: function(name, args, run) {
		var id = uid--;
		run(Schema.methodToJSON(name, args, id));

		var resolver;
		var promise = new Promise(function(resolve) {
			resolver = resolve;
		});

		promise.handle = function(response) {
			var res = JSON.parse(response);

			if(res.id === id) resolver(res.result);
		};

		return promise;
	}
};
