import io from "socket.io-client";
import { startPlaying, getTable } from "./game";
import { playerJoin, playerLeave, playerUpdate } from "./opponents";
import { setHost, endGame } from "./ui";

let socket;

export function initNetworking() {
    socket = io();
    console.log("connected to server");
    socket.on("HOST", setHost);
    socket.on("JOIN", playerJoin);
    socket.on("START", startPlaying);
    socket.on("UPDATE", playerUpdate);
    socket.on("LEAVE", playerLeave);
    socket.on("END", endGame);
}

export function joinGame(username) {
    socket.emit("NAME", username);
}

export function hostStartGame() {
    socket.emit("HOST_START", 0);
}

export function sendUpdate() {
    socket.emit("CL_UPDATE", getTable());
}
