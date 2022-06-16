//Xu ly luu tru va update bang doi thu

import { updateOpponentWidth } from "./ui";

const opponents = new Map();

let numOpponents = 0;

export function playerJoin(player) {
    opponents.set(player.id, player);
    numOpponents++;
    updateOpponentWidth();
}

export function playerLeave(id) {
    opponents.delete(id);
    numOpponents--;
    updateOpponentWidth();
}

export function playerUpdate(player) {
    opponents.set(player.id, player);
    console.log("update from " + player.name);
}

export function getOpponentTables() {
    return opponents.values();
}

export function getNumOpponents() {
    return numOpponents;
}
