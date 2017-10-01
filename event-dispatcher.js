const config = require('./config');

module.exports = (client) => {
	const eventDispatcher = new (require('events').EventEmitter)();

	client.on('event', (event) => {
		if(event.getRoomId() !== config.room && event.getRoomId() !== config.data_room){
			return;
		}

		eventDispatcher.emit(event.getType(), event);
	});

	return eventDispatcher;
};
