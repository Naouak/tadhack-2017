const client = require('./matrix-client')();
const eventDispatcher = require('./event-dispatcher')(client);
const EVENT_TYPES = require('./event-types');
const config = require('./config.js');
const retryer = require('./api-retryer');
const moment = require('moment');

let lastClick = null;
let lastClicker = '';
let score = {};

eventDispatcher.on('m.room.message', (event) => {
	if(moment().unix() - moment(event.getDate()).unix() > 10){
		return;
	}

	const message = event.getContent().body;
	if(message === 'click'){
		if(event.getSender() === lastClicker){
			return retryer(() => client.sendTextMessage(`You can't click on the button ${event.getSender()}, you already are the last person who clicked on it.`));
		}

		retryer(() => client.sendEvent(config.data_room, EVENT_TYPES.CLICK, {
			clickedBy: event.getSender(),
			clickedAt: event.getDate()
		}))
	} else if(message === 'status' && lastClicker){
		const messageToSend = `${lastClicker} was the last person to click on the button at (${lastClick}). The counter is now : ${formatCounter(moment().unix() - (moment(lastClick).unix() || 0))}`;
		retryer(() => client.sendTextMessage(event.getRoomId(), messageToSend))
	} else if(message === 'scores'){
		const messageToSend = Object.keys(score).map((user) => user+': '+score[user]).join('\n');
		retryer(() => client.sendTextMessage(event.getRoomId(), messageToSend))
	}
});

function formatCounter(count){
	const seconds = count % 60;
	const minutes = (((count) / 60) | 0) % 60;
	const hours = (count / 3600) | 0;

	return [hours, minutes, seconds].map(t => ('00'+t).substr(-2)).join(':');
}

eventDispatcher.on(EVENT_TYPES.SCORE, (event) => {
	score = event.getContent();

	if(moment().unix() - moment(event.getDate()).unix() > 10){
		return;
	}

	const [winner, winnerScore] = getMaxScore(score);
	const message = `Current winner is ${winner} with ${winnerScore} points.`;

	retryer(() => client.sendTextMessage(config.room, message));
});

eventDispatcher.on(EVENT_TYPES.LAST_CLICKER, (event) => {
	const content = event.getContent();
	lastClick = moment(content.clickedAt);
	lastClicker = content.clickedBy;

	if(moment().unix() - moment(event.getDate()).unix() > 10){
		return;
	}

	retryer(() => client.sendTextMessage(
		config.room,
		`${event.getContent().clickedBy} clicked on the button! The counter has been reset.`
	));
});

client.startClient();


function getMaxScore(score){
	const first = Object.keys(score).reduce((maxUser, user) => score[user]>score[maxUser]?user:maxUser);
	return [first, score[first]];
}