var webdriverio = require('webdriverio');
var options = {
    desiredCapabilities: {
        browserName: 'chrome'
    }
};

/*

enter a score
*/
webdriverio
    .remote(options)
    .init()
    .url('http://localhost:9090/GolfProject/index.html')
    .setValue('#username', 'aman')
	.setValue('#password', 'aman')
	.click('#login')
	.click('#liveTournament_1')
	//.click('#enterScore')
    //.end()
	//.selectByValue('#holeSelect', '2')
	//.setValue('#score', '3')
	//.click('#enterScoreButton')
	;
	

/*
 * table view
webdriverio
    .remote(options)
    .init()
    .url('http://localhost:9090/GolfProject/index.html')
    .setValue('#username', 'aman')
	.setValue('#password', 'aman')
	.click('#login')
	.click('#tableView_1')	
    //.end()
	;

*/