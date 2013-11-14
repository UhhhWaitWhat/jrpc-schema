var id_handlers = {
	source: [],
	id: []
};

//Assigns a handler to a Id
function assignToId(id, source, cb) {
	if(typeof source !== 'function') {
		if(!id_handlers.source[source]) {
			id_handlers.source[source] = [];
		}

		if(!id_handlers.source[source][id]) {
			id_handlers.source[source][id] = [];
		}

		id_handlers.source[source][id].push(cb);
	} else {
		cb = source;
		if(!id_handlers.id[id]) {
			id_handlers.id[id] = [];
		}
		
		id_handlers.id[id].push(cb);		
	}
}

//This dispatches a Id
function dispatchId(id, source, params) {
	var x;

	//Call all handlers assigned to only the function
	if(id_handlers.id[id]) {
		for(x = 0; x < id_handlers.id[id].length; x++) {
			id_handlers.id[id][x](params);
		}
	}

	//Call all handlers assigned to the function for a specific source
	if(source && id_handlers.source[source]) {
		if(id_handlers.source[source][id]) {
			for(x = 0; x < id_handlers.source[source][id].length; x++) {
				id_handlers.source[source][id][x](params);
			}
		}
	}
}

exports.dispatch = dispatchId;
exports.assign = assignToId;