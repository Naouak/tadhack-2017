const client = require('./matrix-client')();
const moment = require('moment');

const Database = require('./database');

const score = new Database(client, 'score');
const lastClick = new Database(client, 'last_click');
const clickStatus = new Database(client, 'click_status');

const eventDispatcher = require('./event-dispatcher')(client);
const EVENT_TYPES = require('./event-types');
const retryer = require('./api-retryer');
const config = require('./config');

eventDispatcher.on(EVENT_TYPES.CLICK, (event) => {
	if(moment().unix() - moment(event.getDate()).unix() > 10){
		return;
	}

	const content = event.getContent();

	const lastClickData = lastClick.getItem();
	const scoreData = score.getItem();
	const clickStatusData = clickStatus.getItem();

	const clicker = content.clickedBy;
	const clickDate = content.clickedAt;

	if(clicker === lastClickData.clickedBy){
		console.log("DROP CLICK");
		return;
	}

	lastClick.storeItem(content);
	clickStatusData[clicker] = clickDate;
	clickStatus.storeItem(clickStatusData);

	const pointsGiven = calculateScore(clickDate, lastClickData.clickedAt);
	const newScores = applyScore(scoreData, pointsGiven, lastClickData.clickedBy, clicker);
	score.storeItem(newScores);

	retryer(() => client.sendEvent(config.data_room, EVENT_TYPES.LAST_CLICKER, content))
		.then(() => retryer(() => client.sendEvent(config.data_room, EVENT_TYPES.SCORE, newScores)));
});

function calculateScore(clickDate, lastClickDate){
	return (moment(clickDate).unix() - moment(lastClickDate).unix()) || 0;
}

function applyScore(scores, points, source, dest){
	scores[source] = (scores[source] || 0) - points;
	scores[dest] = (scores[dest] || 0) + points;
	return scores;
}

// score.storeItem({});

Promise.all([score.ready, lastClick.ready, clickStatus.ready]).then(() => {
	client.startClient();
});
