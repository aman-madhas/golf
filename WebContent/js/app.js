(function() {
	
	"use strict";
	
	/**
	 * login module
	 */
	var loginModule = angular.module('login', ['ngRoute', 'socket-io']);

	loginModule.controller('LoginAndRegisterController', function($scope, $routeParams, socket, $location) {
		var self = this;
		self.message = "Login or Register";
	  
		$scope.login = function() {
			console.debug('GA - login:login()');
			
	        self.dataLoading = true;
	        
	        socket.emit('login:login', 
	        { 
	        	command: 'login:login',
	        	username: form.username.value,
	        	password: form.password.value
	        });
	        
	        socket.on('login:login', function(data) {
				console.debug('GA - login:login' + data);
				if (data.status == 'success') {
					self.dataLoading = false;
					sessionStorage.playerId = data.playerId;
					$location.path('/MainMenu');
				}			
			}).bindTo($scope);
	        
		};
	  
	});
	
	/**
	 * register module
	 */
	var registerModule = angular.module('register', ['ngRoute', 'socket-io']);
	
	registerModule.controller('RegisterController', function($scope, $routeParams, socket, $location) {
		var self = this;
		self.message = "Register";
		
		$scope.register = function() {
			console.debug('GA - register:createUser()');
			
	        self.dataLoading = true;        
	        
			socket.emit('register:createUser', 
			{ 
				command: 'register:createUser', 
				firstName: form.firstName.value,
				lastName: form.lastName.value,
				username: form.username.value,
				password: form.password.value
			});
			
			socket.on('register:userCreated', function(data) {
				console.debug('GA - register:userCreated' + data);
				if (data == 'success') {
					self.tableData = data;
					self.dataLoading = false;
				}			
			}).bindTo($scope);
		};  
	});
	
	/**
	 * player module
	 */
	var playerModule = angular.module('player', ['ngRoute', 'socket-io']);	

	playerModule.controller('EnterScoreController', function($scope, $routeParams, socket, $location) {
		var self = this;
		self.message = "Enter Score View";
		  
		$scope.tournamentId = $routeParams.tournamentId;
		$scope.tournamentName = $routeParams.tournamentName;
		
		// do request for available holes
		socket.emit('scorecard:getAvailableHoles', 
		{ 
			command: 'scorecard:getAvailableHoles', 
			playerId: sessionStorage.playerId,
			tournamentId: $scope.tournamentId
		});
		
		socket.on('scorecard:gotAvailableHoles', function(data) {
			console.debug('GA - scorecard:gotAvailableHoles');
			$scope.availableHoles = data;
		}).bindTo($scope);
		
		$scope.submit = function() {
			console.debug('GA - scorecard:addNewScore()');
			socket.emit('scorecard:addNewScore', 
			{ 
				command: 'scorecard:addNewScore', 
				tournamentId: $scope.tournamentId,
				tournamentName: $scope.tournamentName,
				hole: $scope.holeSelect,
				score: $scope.score,
				// should have playerId also
				playerId: sessionStorage.playerId
			});
		};
		
		socket.on('scorecard:addNewScoreSuccess', function(data) {
			console.debug('GA - scorecard:addNewScoreSuccess');
			
			$location.path('/JoinedTournamentView/' + data.tournamentId + '/true/' + data.tournamentName);
		}).bindTo($scope);
	});
	
	playerModule.controller('TableController', function($scope, $routeParams, socket) {
		console.debug('GA - getTable()');
		var self = this;
		self.message = "Table View";
	  
		$scope.tournamentId = $routeParams.tournamentId;
		$scope.liveScore = $routeParams.liveScore;
		$scope.tournamentName = $routeParams.tournamentName;
		
		socket.emit('tournaments:getTable', { command: 'tournaments:getTable', tournamentId : $scope.tournamentId });
	  
		socket.on('tournaments:getTableResult', function(data) {
			console.debug('GA - tournaments:getTableResult returned ' + data);
			self.tableData = data;
		}).bindTo($scope);
	});
	
	/**
	 * main app
	 */
	var app = angular.module('golfApp', ['ngRoute', 'socket-io', 'login', 'register', 'player']);
	
	/**
	 * notification service
	 */
	app.service('notificationService', function($timeout) {
	    this.newScoreAdded = function(data) {
	    	var msg = data.firstName + ' ' + data.lastName + ' has scored ' + data.score + ' at ' + data.tournamentName + ' hole ' + data.hole; 
	    	// check notifications supported
	    	if (!("Notification" in window)) {
	    		alert("This browser does not support desktop notification");
	  	  	}

	    	// check notification permissions 
	  	  	else if (Notification.permission === "granted") {	  	  		
	  	  		var notification = new Notification(msg);
	  	  		$timeout(function() {
	  	  			notification.close()
	  	  		}, 5000);	  	  		
	  	  	}

	    	// get permission
	  	  	else if (Notification.permission !== 'denied') {
	  	  		Notification.requestPermission(function (permission, msg) {
	  	  			// If the user accepts, let's create a notification
	  	  			if (permission === "granted") {
	  	  				var notification = new Notification(msg);
	  	  			}
	  	  		});
	  	  	}
	  	}
	});

	/**
	 * routes
	 */
	app.config(function($routeProvider, $locationProvider) {
		$routeProvider.when("/MainMenu",
			{
				templateUrl: "protected/mainMenu.html",
				controller: "MainMenuController",
				controllerAs: "app"
			}
		).when("/Register",
			{
				templateUrl: "register.html",
				controller: "RegisterController",
				controllerAs: "app"
			}
		).when("/TableView/:tournamentId/:liveScore/:tournamentName",
			{
				templateUrl: "protected/tableView.html",
				controller: "TableController",
				controllerAs: "app"
			}
		).when("/JoinedTournamentView/:tournamentId/:liveScore/:tournamentName",
			{
				templateUrl: "protected/joinedTournamentView.html",
				controller: "TableController",				
				controllerAs: "app"
			}
		).when("/EnterScoreView/:tournamentId/:tournamentName",
			{
				templateUrl: "protected/enterScoreView.html",
				controller: "EnterScoreController",
				controllerAs: "app"
			}
		).otherwise({
			//redirectTo: '/'
			templateUrl: "loginAndRegister.html",
			controller: "LoginAndRegisterController",
			controllerAs: "app"
		});
	});

	app.controller('MainMenuController', function($scope, $rootScope, socket, notificationService) {
		console.debug('GA - getAllTournaments()');
		var self = this;
		self.message = "Main Menu";
  
		socket.emit('tournaments:getAll', { command: 'tournaments:getAll' });
  
		socket.on('tournaments:getAllResult', function(data) {
			console.debug('GA - tournaments:getAllResult returned');
			self.tournaments = data;
		}).bindTo($scope);  
		
		/**
		 * subscribe to other user events
		 */
		socket.on('all:scorecard:addNewScoreSuccess', function(data) {
			console.debug('GA - ' + data);
			notificationService.newScoreAdded(data);
		}).bindTo($rootScope);
	});

}());