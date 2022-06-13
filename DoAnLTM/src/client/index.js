import "./index.css";

import { activePiece, initTable, updateGame } from "./game";
import { getImages } from "./render";
import { initInput } from "./input";
import { initNetworking } from "./networking";
import { initUI } from "./ui";

//init sequence
getImages();
initTable();
initInput();
initNetworking();
initUI();

//correct the opponent canvas if necessary
const oppCanvas = document.getElementById("opponentCanvas");
if(oppCanvas.width != oppCanvas.clientWidth) {
    oppCanvas.width = oppCanvas.clientWidth;
}

//bat dau vong lap cua game
setInterval(updateGame, 1000 / 60);

//Cai nay de hien thi giao dien ne ^^
