var uid = -1;
var Schema = require('./Schema');

module.exports = {
	Schema: Schema,
	run: function(name, args, run) {
		var id = uid--;
		run(Schema.methodToJSON(name, args, id));

		var resolver;
		var rejecter;
		var promise = new Promise(function(resolve, reject) {
			resolver = resolve;
			rejecter = reject;
		});

		promise.handle = function(response) {
			var res = JSON.parse(response);

			if(res.id === id) {
				if(res.error) {
					var error = new Error('Server responded with error: ' + res.error.message);
					error.resonse = res.error;

					rejecter(error);
				} else {
					resolver(res.result);
				}
			}
		};

		return promise;
	}
};
