console.log('golfAppServer started');

var io = require('socket.io')(8080);

var MongoClient = require('mongodb').MongoClient
    , format = require('util').format;  
  
var myDB;

MongoClient.connect('mongodb://127.0.0.1:27017/GOLF_DB', function(err, db) {
	if(err) throw err;
    console.log('database connection established');
	myDB = db;
});
    
io.sockets.on('connection', function(socket) {	
	
	socket.on('tournaments:getAll', function (msg) {
        console.log('tournaments:getAll: ', msg);
        
		var collection = myDB.collection('tournament');					
		collection.find().toArray(function(err, results) {
			socket.emit('tournaments:getAllResult', results );
		});
    });
	
	socket.on('tournaments:getTable', function (msg) {
        console.log('tournaments:getTable: ', msg);
        getTableScore(parseInt(msg.tournamentId), function(result)
        {
        	socket.emit('tournaments:getTableResult', result);
        });
    });
	
	socket.on('scorecard:addNewScore', function (msg) {
        console.log('scorecard:addNewScore: ', msg);

		myDB.collection('player').findAndModify(
			{"id": parseInt(msg.playerId)}, // query
			[],  // sort order  
			{	$push: {
					"scorecard": {
						"tournamentId": msg.tournamentId,
						"Hole": msg.hole.value,
						"score": msg.score
					}
				}},
			{upsert: true, new: true}, // options
			function(err, object) {
				if (err){
					console.log('error = ' + err.message);  // returns error if no matching object found
				} else {
					//console.log('object = ' + JSON.stringify(object));
					console.log('scorecard:addNewScoreSuccess', JSON.stringify(object));
					socket.emit('scorecard:addNewScoreSuccess', 
					{
						"tournamentId": msg.tournamentId,
						"tournamentName": msg.tournamentName
					});
					// perform publish of message to other users 
					socket.broadcast.emit('all:scorecard:addNewScoreSuccess', 
					{ 
						"firstName": object.value.firstName, 
						"lastName": object.value.lastName, 
						"score": msg.score,		
						// add tournament name
						"tournamentName": msg.tournamentName,
						"hole": msg.hole.value
					});
					getTableScore(parseInt(msg.tournamentId), function(result)
					{
						socket.broadcast.emit('tournaments:getTableResult', result);
					});
				}
			});		
    });
	
	socket.on('scorecard:getAvailableHoles', function (msg) {
        console.log('scorecard:getAvailableHoles: ', msg);
				
		// return all available holes for player and tournament
		var collection = myDB.collection('player');
		collection.find(
			{"id" : parseInt(msg.playerId), 
			"scorecard":{$elemMatch:{"tournamentId": parseInt(msg.tournamentId)}}},
			{"_id": 0, "id": 0, "scorecard.tournamentId": 0, "scorecard.score": 0, "firstName": 0, "lastName": 0, "username": 0, "password": 0})
			.toArray(function(err, results) {				
				if (err == null) {
					//console.log('results = ' + JSON.stringify(results[0].scorecard));
					// map operation to return just value from document
					if ((results.length == 0) || (typeof results[0].scorecard == 'undefined') || (results[0].scorecard.length == 0)) {						
						socket.emit('scorecard:gotAvailableHoles', getAllHoles());
					} else {
						getHoleValue = function(doc) { return doc.Hole; }
						var a = results[0].scorecard.map(getHoleValue);
						//console.log('results = ' + JSON.stringify(a));
						socket.emit('scorecard:gotAvailableHoles', getAvailableHoles(a));
					}					
				} else {
					console.log('err ' + err);
				}				
			});					
	});	
	
	socket.on('register:createUser', function (msg) {
        console.log('register:createUser: ', msg);		
		createUser = function(nextId) {
			console.log('nextId = ' + nextId);
			var result = myDB.collection('player').insert(
				{
					"id" : nextId,
					"firstName" : msg.firstName,
					"lastName" : msg.lastName,
					"scorecard" : [],
					"username": msg.username,
					"password": msg.password				
				},
				function(err, object) {
					if (err == null) {
						socket.emit('register:userCreated', 'success' );				
					} else {
						console.log(err);
						socket.emit('register:userCreated', 'failure' );
					}
				}
			);		
			
			
		}	
		getNextSequence("playerId", createUser);		
    });
	
	socket.on('login:login', function (msg) {
        console.log('login:login: ', msg);
		var result = myDB.collection('player').findOne(
			{username: msg.username}, 
			function(err, results) {
				if (err == null) {
					if (results.password == msg.password) {
						console.log('login:login: sucess');
						socket.emit('login:login', 
						{
							'status': 'success',
							'playerId': results.id
						});
					} else {
						console.log('login:login: failure');
						socket.emit('login:login', 'failure' );
					}
				} else {
					console.log(err);		
					socket.emit('login:login', 'failure' );					
				}				
			}
		);
	});
});
	
calculateScore = function(scorecards) {
	
	var result = [];
	// for each player
	for (i = 0; i < scorecards.length; i++) {
		
		var score = 0;
		var hole = 1;
		// go through each scorecard
		for (j = 0; j < scorecards[i].scorecard.length; j++) {			
			// increment score
			score = score + scorecards[i].scorecard[j].score;
			// find highest hole
			var holeRow = scorecards[i].scorecard[j].Hole;
			if (holeRow > hole) {
				hole = holeRow;
			}
		}		
		result.push({ 'firstName': scorecards[i].firstName, 'score': score, 'hole': hole});
		console.log('calculateScore - ', { 'firstName': scorecards[i].firstName, 'score': score, 'hole': hole});
	}
	
	return result;
}

getNextSequence = function(name, callback) {			
	
	myDB.collection('counters').findAndModify(
	{id: name}, // query
	[],  // sort order  
	{$inc: {seq: 1}},
	{upsert: true, new: true}, // options
	function(err, object) {
		if (err){
			console.log('error = ' + err.message);  // returns error if no matching object found
		} else {
          //console.log('object = ' + JSON.stringify(object));
		  //console.log('seq = ' + object.value.seq);	
			var result = object.value.seq;
			callback(result);
		}
	});
	
}

getAvailableHoles = function(unavailableHoles) {
	var result = [];
	for (var hole = 1; hole <= 18; hole++) {
		var unavailableHole = false;
		for (var j = 0; j < unavailableHoles.length; j++) {
			if (hole == unavailableHoles[j]) {
				unavailableHole = true;
			}
		}
		if (!unavailableHole) {
			result.push( { "name": "Hole " + hole, "value": hole});
		}
	}
	return result;
}

getAllHoles = function() {
	var result = [];
	for (var hole = 1; hole <= 18; hole++) {
		result.push( { "name": "Hole " + hole, "value": hole});
	}
	return result;
}

getTableScore = function(tournamentId, callback) {	
	var collection = myDB.collection('player');
	collection.find(
		{"scorecard":{$elemMatch:{"tournamentId": tournamentId}}}, 
		{"_id": 0}).toArray(function(err, results) {
			// calculate current scorecard
			var result = calculateScore(results);        
			callback(result);		
	});
}