# golf
AngularJS web app to demonstrate websockets with MongoDB backend via nodejs

Project consists of web app frontend using socket.io to make connection with a nodejs script performing MongoDB database actions.

DB Schema
_________

player - collection of player details and player scores

tournament - collection of golf tournaments

> db.player.find().pretty()
{
        "_id" : ObjectId("556b4cae8f84f779ad49685f"),
        "id" : 2,
        "scorecard" : [
                {
                        "tournamentId" : 1,
                        "Hole" : 1,
                        "score" : -3
                },
                {
                        "tournamentId" : 1,
                        "Hole" : 2,
                        "score" : -2
                },
                {
                        "tournamentId" : 1,
                        "Hole" : 3,
                        "score" : 0
                },
                {
                        "tournamentId" : 1,
                        "Hole" : 4,
                        "score" : -2
                }
        ],
        "firstName" : "Two",
        "lastName" : "Player",
        "username" : "two",
        "password" : "two"
}

> db.tournament.find().pretty()
{
        "_id" : ObjectId("556b4d758f84f779ad496862"),
        "id" : "1",
        "name" : "TOWIE",
        "status" : "STARTED"
}
{
        "_id" : ObjectId("556b4da08f84f779ad496863"),
        "id" : "2",
        "name" : "Made In Chelsea",
        "status" : "CREATED"
}
{
        "_id" : ObjectId("556b4dd58f84f779ad496864"),
        "id" : "3",
        "name" : "Geordie Shore",
        "status" : "FINISHED"
}
