var express = require('express'),
    app = express(),
    http = require('http'),
    bodyParser = require('body-parser'),
    socketIo = require('socket.io'),
    fs = require('fs');

// start webserver on port 8080
var server =  http.createServer(app);
var io = socketIo.listen(server);
server.listen(3000);
// add directory with our static files
app.use(express.static(__dirname));
console.log("Server running on 127.0.0.1:3000");


app.route('/draw')
 	.get(function (req, res) {
    console.log("am i herep0");
    palavra="";
    line_history = [];
		res.sendFile(__dirname+'/clientD.html');
	});

  app.route('/guess')
   	.get(function (req, res) {
      palavra="";
  		res.sendFile(__dirname+'/clientG.html');
  	});



app.route('/menu').get(function (req, res) {
   res.sendFile(__dirname+'/index.html');
});

let palavra;
var ready = false;
    //Insert Word FROM DRAW PERSPECTIVE =================================
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.get('/insert', function(req, res, next) {
   palavra = req.query.guess;
   ready=true;
   console.log("am i here?:"+palavra);
   // send line to all clients
   if(ready==true){
     io.emit('ready', { ready: true, palavra: palavra });
     ready = false;
   }
   return res.send({ valid: true });
    //console.log(util.inspect(req, false, null));


});



//Insert Word FROM GUESS PERSPECTIVE=================================
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.get('/word', function(req, res, next) {
  var guess = req.query.guess;
  console.log("hello:"+guess);
  if(guess == palavra){
    io.emit('gameWin', { game: true });
    return res.send({ valid: true });
  }
  else{
    return res.send({ valid: false });
  }
//console.log(util.inspect(req, false, null));


});


// array of all lines drawn
var line_history = [];

// event-handler for new incoming connections
io.on('connection', function (socket) {

     // first send the history to the new client
     for (var i in line_history) {
        socket.emit('draw_line', { line: line_history[i] } );
     }

     // add handler for message type "draw_line".
     socket.on('draw_line', function (data) {
        // add received line to history
        line_history.push(data.line);
        // send line to all clients
        io.emit('draw_line', { line: data.line });
     });

     // add handler for message type "clean_canvas".
     socket.on('clean_canvas', function (data) {
       if(data.cleanup==true){
         console.log("dentro do app-cleanup");
         io.emit('clean_canvas', { cleanup: data.cleanup });
       }
     });

     // add handler for message type "word_update".
    socket.on('game_over', function (data) {
      line_history=[];
      palavra="";
      console.log("Game Over");
       io.emit('game_over', { game: data.game });
    });

     // add handler for message type "word_update".
    socket.on('word_update', function (data) {
       // add received line to history
       //line_history.push(data.line);
       // send line to all clients
       //console.log("receveing letters:"+data.letter[1]);
       io.emit('word_update', { letter: data.letter });
    });
  });
