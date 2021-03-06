
/**
 * Module dependencies.
 */

 var express = require('express'),
 routes = require('./routes');
 var io = require('socket.io');
 var $ = require('jquery');
 var clients = [];
 var nb_players = 0;
 var app = module.exports = express.createServer();

//Tile positions on board

var positions = [
{x:0, y:0}, {x:148, y:0}, {x:296, y:0},
{x:0, y:148}, {x:148, y:148}, {x:296, y:148},
{x:0, y:296}, {x:148, y:296}, {x:296, y:296}
];
//Initiaizing the board
var board = ['-', '-', '-', '-', '-', '-', '-', '-', '-'];

io = io.listen(app);
// Configuration
io.configure(function() {
	io.set('log level', 1);
});
app.configure(function(){
	app.set('views', __dirname + '/views');
	app.set('view engine', 'ejs');
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(app.router);
	app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
	app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
	app.use(express.errorHandler());
});

// Routes

app.get('/', routes.index);

app.listen(3000, function(){
	console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
});

//socket treatement
io.sockets.on('connection', function (socket) {
		var pic = nb_players ? 1 : 2; //cross : circle
		nb_players++;
		var availableGame = lookForAvailableGame(); //looking if a game is available, completing one or creating a new one
		if (!clients[availableGame]){
			clients.push({turn: 0, board: board, players: [{id: socket.id, nick:'', socket: socket}]});
			io.sockets.socket(clients[clients.length - 1].players[0].id).emit('init', { pic: 1, id: socket.id });
			//notifying the client he's alone for the moment
			io.sockets.socket(clients[clients.length - 1].players[0].id).emit('info', { info: 'Waiting for an opponent', color:'red' });
		}
		else { // a game has one player only we can complete this one
			clients[availableGame].players.push({id: socket.id, nick:''});
			io.sockets.socket(clients[availableGame].players[1].id).emit('init', { pic: 2, id: socket.id });
			//inform the 1st player it's his turn to play
			io.sockets.socket(clients[availableGame].players[0].id).emit('info', { info: "It's your turn to play", color:'green' });
		}

		socket.on('play', function (data) { //received a move from a player
			var id;
				//which game is the player playing in
				for (var i = 0, j = clients.length; i < j; i++){
					if (data['id'] == clients[i].players[0].id || data['id'] == clients[i].players[1].id){
						id = i;
						break;
					}
				}
				//who's who ?
				var players = clients[id].players; //getting players list on this game
				var enemy = (clients[id].turn === 0) ? 1 : 0; //if the player who has turn is 0, enemy is therefore 1, ...

				//dealing with errors
				//you're the only player, you have to wait
				if (players.length < 2)
					io.sockets.socket(data['id']).emit('valid_play', { info: 'Not enough players, waiting for an opponent', color:'red' });
				//it's not your turn
				if (players[clients[id].turn].id != data['id'])
					io.sockets.socket(data['id']).emit('valid_play', { info: "It's not your turn", color:'red' });

				//no error, display the player's move on the other player's screen
				io.sockets.socket(players[enemy].id).emit('enemyMove', { index: data['index'] });
				//informing the players about who's turn it is
				io.sockets.socket(data['id']).emit('valid_play', { info: "Waiting for your opponent's move", color:'green', move: "ok" });
				io.sockets.socket(players[enemy].id).emit('info', { info: "It's your turn", color:'green' });
				//filling in our board
				clients[id].board[data['index']] = clients[id].turn;
				clients[id].turn = clients[id].turn === 0 ? 1 : 0;
				//check if somebody won
				var win = checkWin(id);
				switch(win) {
					case 0:
					io.sockets.socket(players[0].id).emit('info', { info: "YOU WON !", color:'green' });
					io.sockets.socket(players[1].id).emit('info', { info: "YOU LOST :(", color:'red' });
						break;
						case 1:
						io.sockets.socket(players[1].id).emit('info', { info: "YOU WON !", color:'green' });
						io.sockets.socket(players[0].id).emit('info', { info: "YOU LOST :(", color:'red' });
							break;
						}
						if (win === 0 || win ==1){
							io.sockets.socket(players[0].id).emit('countdown');
							io.sockets.socket(players[1].id).emit('countdown');
						setTimeout(function() {
							restartGame(id);
						}, 10000);
						}
					});

});

function restartGame(id){
	console.log("GONNA RESTART GAME "+ id);
	clients[id].board = board;
	var enemy = clients[id].turn;
	clients[id].turn = clients[id].turn === 0 ? 1 : 0;
	io.sockets.socket(clients[id].players[enemy].id).emit('info', { info: "Waiting for your opponent's move", color:'green', move: "ok" });
	io.sockets.socket(clients[id].players[clients[id].turn].id).emit('info', { info: "It's your turn", color:'green' });

}

function checkWin(id)
{
	var h1, h2, h3, v1, v2, v3, dr, dl;
	//h = horizontal
	//v = vertical
	//dl = left diag, dr = right diag

	h1 = clients[id].board[0]+clients[id].board[1]+clients[id].board[2];
	h2 = clients[id].board[3]+clients[id].board[4]+clients[id].board[5];
	h3 = clients[id].board[6]+clients[id].board[7]+clients[id].board[8];

	v1 = clients[id].board[0]+clients[id].board[3]+clients[id].board[6];
	v2 = clients[id].board[1]+clients[id].board[4]+clients[id].board[7];
	v3 = clients[id].board[2]+clients[id].board[5]+clients[id].board[8];

	dl = clients[id].board[2]+clients[id].board[4]+clients[id].board[6];
	dr = clients[id].board[0]+clients[id].board[4]+clients[id].board[8];

	//if all the line is 0 (0+0+0), player 0 has won
	if (h1 === 0 || h2 === 0 || h3 === 0 || v1=== 0 || v2 === 0 || v3 === 0 || dl === 0 || dr === 0)
		return 0;
	//if all the line is 1 (1+1+1), player 1 has won
	if (h1 === 3 || h2 === 3 || h3 === 3 || v1 === 3 || v2 === 3 || v3 === 3 || dl === 3 || dr ===3)
		return 1;
	//nobody's winning atm
	return (-1);
}

function lookForAvailableGame(){
	for (var i = 0, j = clients.length; i < j; i++){
		//if a game has only one player, returning the id of the game
		if (clients[i].players.length == 1){
			console.log("filling in game "+i);
			return i;
		}
	}
	//else creating a new one, with clients.length as id
	return clients.length;
}
