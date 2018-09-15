const path = require('path');
const express = require('express');
const hbs = require('hbs');  //templating engine handlebar
const bodyParser = require('body-parser');
const {ObjectId} = require('mongodb');
const _ = require('lodash');
const http = require("http");
const socketIO = require("socket.io");

require('./config/config');
const {mongoose} = require('./db/mongoose');
const {Todo} = require('./models/todo');
const {User} = require('./models/user');
const fileSystem = require(path.join(__dirname,'../public/js/fileSystem.js'));  //Class to read from local file
const publicPath = path.join(__dirname,'../public');
const viewsPath = path.join(__dirname,'../views');

//Util Functions (socketio)
const {generateMessage} = require('./utils/message');


const port = process.env.PORT;      //port: heroku or local express app


//--- SETUP  APP ---
var app = express();
var server = http.createServer(app);    //use http server not express server
app.use( express.static( publicPath ) );    //static directory
app.use( bodyParser.json() );     //parse client's json before giving to request
app.set( 'view engine', 'hbs');              //setup Handlebar: view template engine and partials
hbs.registerPartials( viewsPath + '/partials' );
hbs.registerPartials( viewsPath + '/pageContent' )
server.listen( port, ()=>{console.log(`Server up on port ${port}`)});  //port

//--- SETUP DB --

//-- Socket.io ---
var io = socketIO(server); //web socket
//new connection event
io.on('connection', (socket)=>{     //receives socket from client side
    console.log("New User COnnected!");

    socket.on("disconnect", ()=>{
        console.log("User disconnected");
    })

    socket.on("createMessage", (msg, callback)=>{
        console.log("create message", msg);
        io.emit('newMessage',  //broadcast
            generateMessage( msg.from, msg.text)
        );
    }) //listen to client

    //welcome other sockets when connected
    socket.broadcast.emit('newMessage', 
        generateMessage('Admin', "New User Joined")
    )

    //welcome message by admin
    socket.emit("newMessage", 
        generateMessage('Admin', "Welcome to the chat!")
    );
})

//--- Request Handler ---
app.get('/', (req, res)=>{
    res.render('index.hbs', {
        pageTitle: "Home",
        pageBlurb: "Bootstrap Playground",
        whichPartial: function() {
            return "homepage";
        }
    });
});

app.get('/fileSystem', (req, res)=>{
    let allContents = fileSystem.getAll();

    res.render('index.hbs', {
        pageTitle: "File System",
        pageBlurb: "Dynamically reads data from local file and displaying them",
        whichPartial: function() {
            return "fileSystemPage";
        },
        fileArray : allContents
    });
});

app.get('/database', (req, res)=>{
    let allContents = fileSystem.getAll();

    res.render('index.hbs', {
        pageTitle: "Database Storage",
        pageBlurb: "Keep track of progress and store it in the database",
        whichPartial: function() {
            return "databasePage";
        }
    });
});

//REST API
app.post('/todos', (req, res)=>{
    let todo = new Todo({
        text: req.body.text
    })
    todo.save().then((doc)=>{
        res.send(doc);
    },(e)=>{
        res.status(400).send(e);
    })
});

app.get('/todos', (req, res)=>{
    Todo.find().then((todos)=>{
        res.send({
            todos
        });
    }, (err) =>{
        res.status(400).send(e);
    });
});

app.get('/todos/:id', (req, res)=>{

    var id = req.params.id
    //handle incorrect object id format
    if(!ObjectId.isValid(id)){
        res.status(404).send();
    }

    Todo.findById(id).then((todo)=>{
        //handle incorrect id (return [] or null)
        if(!todo){
            res.status(404).send();
        }
        res.send({todo});
        
    }).catch((e)=>{
        res.status(404).send();
    });
});

app.delete('/todos/:id', (req, res)=>{
    var id = req.params.id;
    //handle incorrect object id format
    if(!ObjectId.isValid(id)){
        res.status(404).send();
    }

    Todo.findByIdAndRemove(id).then((todo)=>{
        //handle incorrect id (return [] or null)
        if(!todo){
            res.status(404).send();
        }
        res.send({todo});
        
    }).catch((e)=>{
        res.status(404).send();
    });
    
});

app.patch('/todos/:id', (req, res)=>{
    var id = req.params.id;
    //handle incorrect object id format
    if(!ObjectId.isValid(id)){
        res.status(404).send();
    }

    //pick only 'updatable' properties from request
    let body = _.pick(req.body, ['text','completed']);
    if(_.isBoolean(body.completed) && body.completed){  //user just set completed
        body.completedAt = new Date().getTime();    //timestamp
    } else{
        body.completed = false;         //set to default
        body.completedAt = null;
    }

    //Update to DB
    Todo.findByIdAndUpdate(id, {
        $set: body
    }, {
        new: true   //returned modified  rather than the original
    }).then((todo) => {
        //handle incorrect id (return [] or null)
        if(!todo){
            res.status(404).send();
        }
        res.send({todo});
    }).catch((e) => {
        res.status(404).send();
    })
    
});

//User REST API
app.post('/users', (req, res) => {
    let body = _.pick(req.body, ['email','password']);
    let user = new User(body);

    user.save().then((user)=>{
        res.send(user);
    }).catch((e)=>{
        res.status(400).send(e);
    });
})


module.exports = {app};