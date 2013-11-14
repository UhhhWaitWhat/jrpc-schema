require('must');

var request = require('../request');

describe('.request', function() {
	it('generates a correct request given correct input', function() {
		var obj = {
			jsonrpc: '2.0',
			method: 'method_name',
			params: ['test', 2]
		}

		var result = request(obj.method, obj.params);

		JSON.parse(result).must.eql(obj);
	});

	it('does so if an id is supplied', function() {
		var obj = {
			jsonrpc: '2.0',
			method: 'method_name',
			params: ['test', 2],
			id: 'wysywysywyg'
		}

		var result = request(obj.method, obj.params, obj.id);

		JSON.parse(result).must.eql(obj);
	});

	it('throws a TypeError on invalid method name', function() {
		request.bind(null, 23).must.throw(TypeError);
	});

	it('throws a TypeError on invalid parameters', function() {
		request.bind(null, 'name', 23).must.throw(TypeError);
		request.bind(null, 'name', 'invalid').must.throw(TypeError);
		request.bind(null, 'name').must.throw(TypeError);
	});

	it('throws a TypeError on invalid id', function() {
		request.bind(null, 'name', [], []).must.throw(TypeError);
		request.bind(null, 'name', [], {}).must.throw(TypeError);
	});
});