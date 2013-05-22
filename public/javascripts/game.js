$(document).ready(function(){

	/* KINETIC VARS */

	var stage = new Kinetic.Stage({container: 'game', width: 640, height: 480});
	var layer = new Kinetic.Layer();
	var piecesGroup = new Kinetic.Group({x: 101, y: 21});
	var cross = new Image();
	var circle = new Image();
	var dummy = new Image();
	var my_id;

	/* GAME VARS */

	//TILES POSITIONS ON BOARD
	var positions = [
	{x:0, y:0}, {x:148, y:0}, {x:296, y:0},
	{x:0, y:148}, {x:148, y:148}, {x:296, y:148},
	{x:0, y:296}, {x:148, y:296}, {x:296, y:296}
	];

	/* SOCKETS FUNCTIONS */
	var socket = io.connect('http://localhost');

/*
** Socket (init): 1st treatement when I connect to the socket
** String id, int pic
**
*/
socket.on('init', function (data) {
	my_id = data['id'];

	switch(data['pic']) {
		case 1:
		chosen = cross;
		console.log("You're playing with Cross");
		break;
		case 2:
		chosen = circle;
		console.log("You're playing with Circle");
		break;
	}
});

/*
** Socket (info): treating the information messages
** String info, String color
**
*/
socket.on('info', function (data) {
	$('#infos').css({'color': data['color']});
	$('#infos').html(data['info']);
});
socket.on('enemyMove', function (data) {
	var tile = new Kinetic.Rect({
		x: positions[data['index']].x,
		y: positions[data['index']].y,
		width: 140,
		height: 140,
		stroke: "none",
		strokeWidth: 1
	});

  var pic = (chosen == cross) ? circle : cross; //displaying the enemy picture 
			tile.off('mouseover mouseout mousedown touchstart mouseup touchend'); // disable mouse event on tile
			tile.setOpacity(1);
			var pic = (chosen == cross) ? circle : cross;
			tile.setFillPatternImage( pic);
			piecesGroup.add(tile);
	  layer.draw(); // drawing enemy pic
	});



loadBG();

/* FUNCTIONS */

function loadBG(){

	var obj = new Image();

	obj.onload = function() {

		var img = new Kinetic.Image({x: 0, y: 0, image: obj, width: 640, height: 480});

		layer.add(img);

		layer.add( piecesGroup );

		loadCross();
		drawGamePieces();

		stage.add(layer);
	}

	obj.src = 'images/bg.jpg';
}

function loadCross(){

	cross.onload = function() {

		var img = new Kinetic.Image({x: 0, y: 0, image: cross, width: 140, height: 140});

		loadCircle();
	}

	cross.src = 'images/cross.png';
}

function loadCircle(){

	circle.onload = function() {

		var img = new Kinetic.Image({x: 0, y: 0, image: circle, width: 140, height: 140});

		drawGamePieces();

		stage.add(layer);
	}

	circle.src = 'images/circle.png';
}

function drawGamePieces(){
	var valid_play = false;
	$(positions).each(function(index, value){

		var tile = new Kinetic.Rect({
			x: value.x,
			y: value.y,
			width: 140,
			height: 140,
			stroke: "none",
			strokeWidth: 1
		});

		tile.setFillPatternImage( null );
		tile.setFillPatternOffset( 0 ,0 );

		tile.on('mouseover', function(){
			document.body.style.cursor = 'pointer';
			this.setOpacity(0.5);
		this.setFillPatternImage( chosen ); //filling with my picture
		this.setFillPatternOffset( 0 ,0 );
		layer.draw();
	});

		tile.on('mouseout', function(){
			document.body.style.cursor = 'default';
			this.setOpacity(1);
			this.setFillPatternImage( dummy );
			this.setFillPatternOffset( 0 ,0 );
			layer.draw();
		});

		tile.on('mousedown touchstart', function(){
			document.body.style.cursor = 'default';
			this.setFillPatternImage( chosen );
			this.setFillPatternOffset( 0 ,0 );
		});

		tile.on('mouseup touchend', function(){
			var self = this;
		socket.emit('play', { id: my_id, index: this.index - 9 }); //sending the tile position (0..8)
		socket.on('valid_play', function (data)
		{//received the server response, is my move correct ?

			$('#infos').css({'color': data['color']});
			$('#infos').html(data['info']);
			if ("ok" == data['move']) //my move is correct (it was my turn, we are 2 players...)
			{
				self.off('mouseover mouseout mousedown touchstart mouseup touchend');
				self.setOpacity(1);
				layer.draw();
				}//end if OK

			});//END SOCKET EMIT
	});//END MOUSE EVENT
		piecesGroup.add(tile);
	});//END POSITIONS_EACH
}//END DRAW_PIECES
});//END MAIN
