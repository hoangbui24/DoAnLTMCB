import seedrandom from "seedrandom";
import { render } from "./render";
import { updateInput } from "./input";
import { sendUpdate } from "./networking";
import { showLostScreen, hideWaitScreen } from "./ui";

let table;


export let activePiece;
export let reservedPieceType = -1;

export const upcomingTypes = [];

const AUTO_DROP_INTERVAL = 1000;

let randNumGen;

export const State = {
    // Khoi tao va gan gia tri cho game theo so lan luot duoi day
    JOIN: 1,
    START: 2,
    PLAYING: 3,
    LOST: 4,
    END_WON: 5,
    END_LOST: 6,

    // bien dung chung toan server
    currState: 1,
    isHost: false,
};

export function initTable() {
    table = new Array(10);
    for(let x = 0; x < 10; x++) {
        table[x] = new Array(20).fill(0);
    }
}

export function startPlaying(seed) {
    randNumGen = new seedrandom(seed);
    initTable();
    activePiece = new ActivePiece(getRandomType());
    reservedPieceType = -1;

    //them vao mang cac khoi tetro duoc random
    upcomingTypes.length = 0;
    for(let n = 0; n < 5; n++) {
        upcomingTypes.push(getRandomType());
    }

    State.currState = State.PLAYING;
    hideWaitScreen();

    //cho server biet la chung ta dang choi
    sendUpdate();
}

export function getTable() {
    return table;
}

//cap nhat trang thai cua game lien tuc
export function updateGame() {
    render();
    if(State.currState != State.PLAYING) return;

    updateInput();

    const currTime = new Date().getTime();
    if(currTime - activePiece.lastDropTime >= AUTO_DROP_INTERVAL) {
        activePiece.drop();
    }
}

// kiem tra xem co row nao full chua
// cung luc, kiem tra game da ket thuc chua
function checkTable() {
    for(let y = 0; y < 20; y++) {
        let isFullRow = true;
        for(let x = 0; x < 10; x++) {
            if(table[x][y] == 0) {
                isFullRow = false;
                break;
            }
        }

        if(isFullRow) {
            clearLine(y);
        }
    }

    if(table[4][0] != 0 || table[5][0] != 0) {
        State.currState = State.LOST;
        showLostScreen();
        return false;
    }

    return true;
}

function clearLine(y) {
    for(let x = 0; x < 10; x++) {
        table[x].splice(y, 1);
        table[x].unshift(0);
    }
}

function getRandomType() {
    return Math.floor(randNumGen() * 7 + 1);
}

//Ham hien thi khoi tetro tiep theo
function getNextPiece() {
    const n = upcomingTypes.shift();
    upcomingTypes.push(getRandomType());
    return n;
}

class ActivePiece {
    constructor(type, canReserve = true) {
        this.type = type;
        this.blocks = getPiece(this.type);

        this.pivot = getPivot(this.type);
        this.direction = 1;
        this.turns = 0;

        this.lastDropTime = new Date().getTime();

        this.canReserve = canReserve;
        
        this.autoMoveUp();
    }

    //dinh huong: 1 thi di qua phai, -1 thi di qua trai
    forceMoveSideways(direction) {
        for(let i = 0; i < 4; i++) {
            this.blocks[i].x += direction;
        }
        this.pivot.x += direction;
    }

    //Khong di chuyen cac khoi neu co vat can o truoc
    moveSideways(direction) {
        for(let i = 0; i < 4; i++) {
            let newPos = this.blocks[i].x + direction;
            if(newPos < 0 || newPos >= 10) return;
            if(this.blocks[i].y >= 0 && 
                table[newPos][this.blocks[i].y] != 0) return;
        }

        this.forceMoveSideways(direction);
    }

    //Di chuyen khoi tetro len cho toi khi no khong dung cham
    autoMoveUp() {
        while(true) {
            //Dam bao rang cac khoi nay khong clear 1 row nao
            let clear = true;
            for(let i = 0; i < 4; i++) {
                if(table[this.blocks[i].x][this.blocks[i].y] != 0 &&
                    this.blocks[i].y >= 0) {
                    clear = false;
                    break;
                }
            }
            if(clear) return;

            //Di chuyen khoi tetro len va lap lai
            for(let i = 0; i < 4; i++) {
                this.blocks[i].y--;
            }
            this.pivot.y--;
        }
    }

    //XOay khoi tetro dua vao vi tri hien tai
    rotate() {
        let centerX = this.pivot.x;
        let centerY = this.pivot.y;

        for(let i = 0; i < 4; i++) {
            let tmp = this.blocks[i].x;
            this.blocks[i].x = Math.floor(centerX - (this.blocks[i].y - centerY)
                * this.direction);
            this.blocks[i].y = Math.floor(centerY + (tmp - centerX) * this.direction);
        }

        //DI chuyen khoi tetro sang 2 ben neu can thiet
        for(let i = 0; i < 4; i++) {
            if(this.blocks[i].x < 0) {
                this.forceMoveSideways(-this.blocks[i].x);
            } else if(this.blocks[i].x > 9) {
                this.forceMoveSideways(9 - this.blocks[i].x);
            }
        }
        this.autoMoveUp();

        this.turns += this.direction;
        if(this.pivot.limit && this.turns == 1) this.direction = -1;
        if(this.pivot.limit && this.turns == -1) this.direction = 1;
    }

    //Luon di chuyen khoi tetro xuong duoi
    //Tra ve true neu khoi tetro di xuong thanh cong
    //Tra va false neu co gi do can duong
    moveDown() {
        for(let i = 0; i < 4; i++) {
            let newPos = this.blocks[i].y + 1;
            if(newPos < 0) {
                continue;
            } else if(newPos == 20 || table[this.blocks[i].x][newPos] != 0) {
                //Kiem tra xem khoi tetro o duoi da duoc in place hay chua
                return false;
            }
        }

        for(let i = 0; i < 4; i++) {
            this.blocks[i].y++;
        }
        this.pivot.y++;
        
        //Thiet lap lai auto drop
        this.lastDropTime = new Date().getTime();
        return true;
    }

    
    drop() {
        if(!this.moveDown()) {
            this.finalize();
            return false;
        }

        return true;
    }

    //Roi khoi tetro xa nhat co the
    dropFull() {
        //Viec nay se tu dong tao mot khoi tetro moi y chang khoi tetro dang active
        while(this.drop()) {}
    }

    // Ham tra ve mot khoi tetro nam o cuoi cung cua column, dung de xu ly khoi ghóst piece
    getDroppedObj() {
        let newObj = new ActivePiece(this.type);
        newObj.blocks = [];
        for(let i = 0; i < 4; i++) {
            //copy toa do cua doi tuong
            newObj.blocks.push(Object.assign({}, this.blocks[i]));
        }

        while(newObj.moveDown()) {}
        return newObj;
    }

    //Dat khoi tetro hien tai vao vi tri, sau do tao mot khoi moi
    finalize() {
        for(let i = 0; i < 4; i++) {
            let x = this.blocks[i].x;
            let y = this.blocks[i].y;
            table[x][y] = this.type;
        }

        if(!checkTable()) {
            sendUpdate();
            return;
        }

        activePiece = new ActivePiece(getNextPiece());

        //Gui update table cho server
        sendUpdate();
    }

    reserve() {
        if(!this.canReserve) return;

        if(reservedPieceType == -1) {
            activePiece = new ActivePiece(getNextPiece(), false);
        } else {
            activePiece = new ActivePiece(reservedPieceType, false);
        }
        reservedPieceType = this.type;
    }
}

function getPiece(type) {
    switch(type) {
    case 1:
        return [{x: 3, y: 1},
                {x: 4, y: 1},
                {x: 4, y: 0},
                {x: 5, y: 0}];
    case 2:
        return [{x: 3, y: 0},
                {x: 4, y: 0},
                {x: 4, y: 1},
                {x: 5, y: 1}];
    case 3:
        return [{x: 3, y: 0},
                {x: 3, y: 1},
                {x: 4, y: 1},
                {x: 5, y: 1}];
	case 4:
		return [{x: 3, y: 1},
                {x: 4, y: 1},
                {x: 5, y: 1},
                {x: 5, y: 0}];
	case 5:
        return [{x: 3, y: 0},
                {x: 4, y: 0},
                {x: 5, y: 0},
                {x: 6, y: 0}];
    case 6:
        return [{x: 3, y: 1},
                {x: 4, y: 0},
                {x: 4, y: 1},
                {x: 5, y: 1}];
    default:
    case 7:
        return [{x: 4, y: 0},
                {x: 4, y: 1},
                {x: 5, y: 0},
                {x: 5, y: 1}];
    }
}

//when limit is true, then the block can only move
//back and forth between two rotations (the rotation button will
//flip between clockwise and counterclockwise). Otherwise,
//the piece will continuously rotate clockwise
function getPivot(type) {
    switch(type) {
    case 1: return {x: 4, y: 1, limit: true};
    case 2: return {x: 4, y: 1, limit: true};
    case 3: return {x: 4, y: 1, limit: false};
    case 4: return {x: 4, y: 1, limit: false};
    case 5: return {x: 4, y: 0, limit: true};
    case 6: return {x: 4, y: 1, limit: false};
    default:
    case 7: return {x: 4.5, y: 0.5, limit: true};
    }
}


