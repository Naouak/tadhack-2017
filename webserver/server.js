const path = require('path');
const express = require('express');
const client = require('../matrix-client')();
const config = require('../config');
const eventDispatcher = require('../event-dispatcher')(client);
const EVENT_TYPES = require('../event-types');
const moment = require('moment');
const retryer = require('../api-retryer');

const app = express();

let score = {};
let lastClicker = null;
let lastClick = null;

app.use(express.static(path.join(__dirname,'public')));

app.get('/', function(req, res){
	res.send("tagada");
});

app.get('/push_button', function(req, res){
	retryer(() => client.sendEvent(config.data_room, EVENT_TYPES.CLICK, {
		clickedBy: req.query.clicker+'@web',
		clickedAt: moment().toISOString()
	})).then(() => {
		res.send('CLICKED!');
	})
});

app.get('/scores', function(req, res){
	res.json(score);
});

app.get('/status', function(req, res){
	res.json({
		lastClicker: lastClicker,
		lastClick: lastClick
	});
});

eventDispatcher.on(EVENT_TYPES.SCORE, (event) => {
	score = event.getContent();
});

eventDispatcher.on(EVENT_TYPES.LAST_CLICKER, (event) => {
	const content = event.getContent();
	lastClicker = content.clickedBy;
	lastClick = moment(content.clickedAt);
});

app.listen('8081');


client.startClient();
