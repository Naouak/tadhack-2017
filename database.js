const config = require('./config');
const retryer = require('./api-retryer');

const EVENT_NAME = 'qburny.tadhack.database';

module.exports = class Database{
	constructor(client, type){
		this.type = type;
		this.data = null;
		this.client = client;
		this.ready = this.findRoom(type).then(this.listenToEvents.bind(this));
	}

	listenToEvents(){
		this.client.on('event', (event) => {
			if(event.getRoomId() !== this.room_id && event.getRoomId() !== this.room_id+':matrix.org' || event.getType() !== EVENT_NAME){
				return;
			}

			this.data = event.getContent();
			console.log("DATA", this.data);
		})
	}

	findRoom(){
		this.room_name = '#'+config.room_prefix+'_'+this.type+':matrix.org';

		const promise = retryer(() => this.client.resolveRoomAlias(this.room_name)
			.then(({room_id}) => room_id)
			.catch(() => {
				return retryer(() => this.client.createRoom({
					room_alias_name: this.room_name,
					visibility: 'private',
					name: this.room_name,
					topic: 'DATABASE DATABASE OH OH'
				})).then(({room_id}) => room_id);
			}));

		promise.then((room_id) => this.room_id = room_id);
		return promise;
	}

	storeItem(item){
		return this.findRoom(this.type).then((room_id) => retryer(() => this.client.sendEvent(room_id, EVENT_NAME, item)));
	}

	getItem(){
		return this.data;
	}
};
