
/**
 * Module dependencies.
 */

 var express = require('express')
 , routes = require('./routes');
 var io = require('socket.io');
 var clients = [];
 var nb_players = 0;
 var app = module.exports = express.createServer();
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
	// var rdm=Math.floor(Math.random()*2;
		var pic = nb_players ? 1 : 2; //cross : circle
		nb_players++;
		toto("lol");
		console.log ("nb is now "+nb_players);
		socket.emit('init', { pic: pic, id: socket.id });
		clients.push = socket;
		socket.on('msg_me', function (data) {
			io.sockets.socket(data['id']).emit('recv', { ok: 'private msg' });
		});
		socket.on('play', function (data) {
			console.log("players "+nb_players);
			if (nb_players % 2 === 0){ // 1 seul joueur
				console.log("emiting not oK");
				io.sockets.socket(data['id']).emit('valid_play', { msg: 'Not enough players' });
			}

		});
	});

function toto(l){
	console.log(l);
}
