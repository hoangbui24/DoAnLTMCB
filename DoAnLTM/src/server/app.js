const app = require('express')();

const webpack = require('webpack');
const webpackConfig = require('../../webpack.config.js');
const middleware = require('webpack-dev-middleware');

// webserver setup
const compiler = webpack(webpackConfig);
app.use(middleware(compiler));
const server = app.listen(4000, () => console.log("running"));

// game controller setup
const io = require('socket.io')(server);

const gamedata = new Map();
let host = undefined;
let players = 0;

io.on('connection', (socket) => {
    console.log("connected: " + socket.id + ", host is " + host);

    const client = new Client(socket.id);
    gamedata.set(socket.id, client);

    if(host == undefined) {
        host = socket.id;
        client.isHost = true;
        socket.emit("HOST", true);
    } else {
        for(const id of gamedata.keys()) {
            if(id == socket.id) continue;

            const cl = gamedata.get(id);
            if(cl.currState != State.JOIN) socket.emit("JOIN", cl);
        }
    }

    socket.on('disconnect', () => {
        console.log("disconnected: " + socket.id);
        gamedata.delete(socket.id);

        if(client.isHost) {
            // must replace host
            if(gamedata.size == 0) {
                host = undefined;
            } else {
                host = gamedata.keys().next().value;
                gamedata.get(host).isHost = true;
                io.to(host).emit("HOST", true);
            }
        }

        if(client.currState != State.JOIN) 
            socket.broadcast.emit("LEAVE", socket.id);

        if(client.currState == State.PLAYING) {
            players--;
            if(players <= 1) endGame();
        }
    });

    socket.on("NAME", (name) => {
        //properties of client change in the map too
        client.name = name;
        client.currState = State.START;

        socket.broadcast.emit("JOIN", client);
        socket.join("playingRoom");
        console.log(name + " joined");
    });

    socket.on("HOST_START", () => {
        io.to("playingRoom").emit("START", Math.random());
        console.log("game started");

        players = 0;
        for(const cl of gamedata.values()) {
            if(cl.currState != State.START) continue;
            cl.currState = State.PLAYING;
            players++;
        }
    });

    socket.on("CL_UPDATE", (data) => {
        client.data = data;

        // check to see if the client got knocked out
        if(data[4][0] != 0 || data[5][0] != 0) {
            client.currState = State.LOST;
            players--;
            console.log(players + " players left");

            if(players <= 1) endGame();
        }

        socket.broadcast.emit("UPDATE", client);
    });
});

function endGame() {
    let winner;
    for(const cl of gamedata.values()) {
        if(cl.currState == State.PLAYING) {
            winner = cl.name;
            break;
        }
    }

    io.to("playingRoom").emit("END", winner);
    console.log(winner + " won");
};

const State = {
    JOIN: 1,
    START: 2,
    PLAYING: 3,
    LOST: 4,
};

class Client {
    constructor(id) {
        this.id = id;
        this.name = undefined;
        this.currState = State.JOIN;
        this.isHost = false;
        this.data = this.emptyTable();
    }

    emptyTable() {
        let table = new Array(10);
        for(let x = 0; x < 10; x++) {
            table[x] = new Array(20).fill(0);
        }
        return table;
    }
}
