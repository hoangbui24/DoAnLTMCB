import { getTable, activePiece, reservedPieceType, upcomingTypes, State } from "./game";
import { getOpponentTables } from "./opponents";

const imgPath = require.context("./assets");

const F_SIZE = 30;//full square side length
export const S_SIZE = 13;//small square side length
//S_SIZE is needed in ui.js for resizing the opponent canvas

const SIDEBAR_BG_CLR = "#292e3dff";
const OPPONENT_BG_CLR = "#292e3dff";
// const SIDEBAR_BG_CLR = "#FAF0D7";
// const OPPONENT_BG_CLR = "#FAF0D7";
const TEXT_CLR = "#fff";
const BLACK_CLR = "#fff";

const OVERLAY_CLR = "#292e3dff";
// const OVERLAY_CLR = "#FAF0D7";

const RED_CLR = "#FF5555";
const GREEN_CLR = "#00FF99";
const BLUE_CLR = "#0099FF";
const ORANGE_CLR = "#FFAA44";
const CYAN_CLR = "#66FFFF";
const PINK_CLR = "#FF66FF";
const YELLOW_CLR = "#FFFF66";
const BG_CLR = "#292e3dff";
// const BG_CLR = "#FAF0D7"

const gameCanvas = document.getElementById("gameCanvas");
const gCtx = gameCanvas.getContext("2d");

const reservedCanvas = document.getElementById("reservedCanvas");
const rCtx = reservedCanvas.getContext("2d");

const upcomingCanvas = document.getElementById("upcomingCanvas");
const uCtx = upcomingCanvas.getContext("2d");

const opponentCanvas = document.getElementById("opponentCanvas");
const oCtx = opponentCanvas.getContext("2d");

const images = [undefined];

export function getImages() {
    for(let i = 1; i <= 7; i++) {
        images.push(new Image());
        images[i].src = imgPath("./" + i + ".png");
    }
}

export function render() {
    renderMainTable();
    renderSideBars();
    renderOpponents();
}

function renderMainTable() {
    //render the table
    const table = getTable();
    for(let x = 0; x < 10; x++) {
        for(let y = 0; y < 20; y++) {
            //Them block voi mau da duoc thiet lap
            drawBlock(gCtx, x, y, F_SIZE, getColor(table[x][y]));
        }
    }

    if(activePiece == undefined) return;

    //xu ly shadow cua khoi tetro
    let currColor = getColor(activePiece.type) + "70";  //Opacity
    const copyObj = activePiece.getDroppedObj();
    for(let i = 0; i < 4; i++) {
        const block = copyObj.blocks[i];
        drawBlock(gCtx, block.x, block.y, F_SIZE, currColor);
    }

    //Xu ly khoi tetro
    currColor = getColor(activePiece.type);
    for(let i = 0; i < 4; i++) {
        const block = activePiece.blocks[i];
        drawBlock(gCtx, block.x, block.y, F_SIZE, currColor);
    }
}

function renderSideBars() {
    //Xu ly khoi duoc bao quan
    rCtx.fillStyle = SIDEBAR_BG_CLR;
    rCtx.fillRect(0, 0, 140, 140);
    if(reservedPieceType != -1) {
         rCtx.drawImage(images[reservedPieceType], 0, 0);
    }

    if(upcomingTypes.length != 5) return;

    //Xu ly cac khoi sap toi
    uCtx.fillStyle = SIDEBAR_BG_CLR;
    uCtx.fillRect(0, 0, 140, 600);
    for(let n = 0; n < 5; n++) {
        uCtx.drawImage(images[upcomingTypes[n]], 0, 120 * n - 15);
    }
}

function renderOpponents() {
    oCtx.fillStyle = OPPONENT_BG_CLR;
    oCtx.fillRect(0, 0, opponentCanvas.width, opponentCanvas.height);

    const opponentIt = getOpponentTables();
    let oppNum = 0;

    for(const opponent of opponentIt) {
        //Can le 10px voi moi opponent
        const x = Math.floor(oppNum / 2) * (S_SIZE * 10 + 10) + 10;
        const y = (oppNum % 2) * 290 + 10;//just two rows
        drawOpponent(x, y, opponent.data);

        // Them mot lop mau den neu nhu nguoi choi do khong hoat dong
        if(opponent.currState != State.PLAYING) {
            oCtx.fillStyle = OVERLAY_CLR;
            oCtx.fillRect(x, y, 10 * S_SIZE, 20 * S_SIZE);
        }

        const xMid = x + S_SIZE * 5;
        const yBot = y + S_SIZE * 20 + 15;
        drawOpponentText(xMid, yBot, opponent.name);
        oppNum++;
    }
}

function drawOpponent(startX, startY, table) {
    oCtx.strokeStyle = BLACK_CLR;
    oCtx.lineWidth = "1";
    for(let x = 0; x < 10; x++) {
        for(let y = 0; y < 20; y++) {
            drawBlock(oCtx, x, y, S_SIZE, getColor(table[x][y]), startX, startY);
        }
    }
}

function drawOpponentText(x, y, text) {
    oCtx.font = "24px Press Start 2P";
    oCtx.textAlign = "center";
    oCtx.fillStyle = TEXT_CLR;
    oCtx.fillText(text, x, y);
}

//  x va y la toa do tren grid
//xOff va yOff la offset cua x va y tren toan bo grid 
function drawBlock(ctx, x, y, size, color, xOff = 0, yOff = 0) {
    ctx.strokeStyle = BLACK_CLR;
    ctx.fillStyle = color;
    ctx.fillRect(x * size + xOff, y * size + yOff, size, size);
    ctx.strokeRect(x * size + xOff, y * size + yOff, size, size);

    // Bong cua tetro
    if(color != "#303535") {
        ctx.fillStyle = "#00000080";
        ctx.fillRect(x * size + xOff, y * size + yOff + size*5/6, size, size*1/6);
        ctx.fillRect(x * size + xOff + size*5/6, y * size + yOff, size*1/6, size*5/6);
        
        ctx.fillStyle = "#FFFFFF80";
        ctx.fillRect(x * size + xOff, y * size + yOff, size*5/6, size*1/6);
        ctx.fillRect(x * size + xOff, y * size + yOff + size*1/6, size*1/6, size*4/6);
    }
}

function getColor(type) {
    if(type == 1) return GREEN_CLR;
    if(type == 2) return RED_CLR;
    if(type == 3) return BLUE_CLR;
    if(type == 4) return ORANGE_CLR;
    if(type == 5) return CYAN_CLR;
    if(type == 6) return PINK_CLR;
    if(type == 7) return YELLOW_CLR;
    return BG_CLR;
}
