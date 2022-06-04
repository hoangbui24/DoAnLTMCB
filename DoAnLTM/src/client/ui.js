import { joinGame, hostStartGame } from "./networking";
import { startPlaying, State } from "./game";
import { getNumOpponents } from "./opponents";
import { S_SIZE } from "./render";

let nameScreen;
let nameInput;
let nameSubmit;

let hostScreen;
let hostStart;

let waitScreen;
let lostScreen;

let endScreen;
let endText;
let hostRestart;

let opponentCanvas;

export function initUI() {
    nameScreen = document.getElementById("nameScreen");
    nameInput = document.getElementById("nameInput");
    nameSubmit = document.getElementById("nameSubmit");

    hostScreen = document.getElementById("hostScreen");
    hostStart = document.getElementById("hostStart");

    waitScreen = document.getElementById("waitScreen");
    lostScreen = document.getElementById("lostScreen");

    endScreen = document.getElementById("endScreen");
    endText = document.getElementById("endText");
    hostRestart = document.getElementById("hostRestart");

    opponentCanvas = document.getElementById("opponentCanvas");
    updateOpponentWidth();

    nameSubmit.addEventListener("click", nameSubmitClick);
    hostStart.addEventListener("click", hostStartClick);
    hostRestart.addEventListener("click", hostStartClick);
}

function nameSubmitClick() {
    nameScreen.classList.add("invisible");
    joinGame(nameInput.value);

    State.currState = State.START;
    if(State.isHost) showHostScreen();
    else showWaitScreen();
}

export function setHost() {
    console.log("You are now the host");
    State.isHost = true;

    if(State.currState == State.START) {
        hideWaitScreen();
        showHostScreen();
    }
}

function showHostScreen() {
    hostScreen.classList.remove("invisible");
}

function showWaitScreen() {
    waitScreen.classList.remove("invisible");
}

// TODO: rename for clarity
export function hideWaitScreen() {
    waitScreen.classList.add("invisible");
    endScreen.classList.add("invisible");
}

// TODO: same as above
function hostStartClick() {
    hostScreen.classList.add("invisible");
    endScreen.classList.add("invisible");
    hostStartGame();
}

export function showLostScreen() {
    lostScreen.classList.remove("invisible");
}

export function endGame(winner) {
    if(State.currState == State.PLAYING) {
        State.currState = State.END_WON;
        endText.textContent = "You won! \r\n\r\n";
    } else {
        lostScreen.classList.add("invisible");
        State.currState = State.END_LOST;
        endText.textContent = winner + " won. \r\n\r\n";
    }

    if(State.isHost) {
        hostRestart.classList.remove("invisible");
    } else {
        endText.textContent += "Waiting for the host...";
        hostRestart.classList.add("invisible");
    }

    endScreen.classList.remove("invisible");
}

export function handleEnterPress() {
    if(State.currState == State.JOIN) nameSubmitClick();
    else if(State.currState == State.START && State.isHost) hostStartClick();
}

export function updateOpponentWidth() {
    let cols = Math.ceil(getNumOpponents() / 2);
    cols = Math.max(cols, 1);
    //console.log(cols + " " + getNumOpponents());
    opponentCanvas.width = (10 + cols * (S_SIZE * 10 + 10));
}
