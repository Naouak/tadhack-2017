# The Button Game AKA using [Matrix] as a database

This is a hackathon project, DO NOT USE THIS CODE IN PRODUCTION.

The aim of this project is to try to build a bot with persistent data 
that are not stored in a database.

The bot use Matrix channels as repository for objects.
Each event of the channel is a stored object.

Currently only the last event is used but it could be extended 
to use event_id to get more events.

There is 3 files to launch :
- agent.js
- bot.js
- webserver/server.js

Agent.js contains the database agent that is used to store and retrieve data into matrix.

Bot.js and webserver.js push events into a communication channel.
Agent.js listens to that channel and process click events and 
store data in a score and last_click channel.

It then messages back in the communication channel the score and last click 
so that webservers and bot can use them.
