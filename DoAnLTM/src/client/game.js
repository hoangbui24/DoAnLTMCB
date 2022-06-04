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
    // Trang thai cua phong cho (co bao nhieu nguoi tham gia, bat dau, dang choi, thang, thua,...)
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

export function updateGame() {
    render();
    if(State.currState != State.PLAYING) return;

    updateInput();

    const currTime = new Date().getTime();
    if(currTime - activePiece.lastDropTime >= AUTO_DROP_INTERVAL) {
        activePiece.drop();
    }
}

// checks the table for any lines that need to be cleared
// also checks if the game is lost
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
            //must clear this line
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

    //direction: 1 = to the right, -1 = to the left
    forceMoveSideways(direction) {
        for(let i = 0; i < 4; i++) {
            this.blocks[i].x += direction;
        }
        this.pivot.x += direction;
    }

    //does not move the piece if something is in the way
    moveSideways(direction) {
        for(let i = 0; i < 4; i++) {
            let newPos = this.blocks[i].x + direction;
            if(newPos < 0 || newPos >= 10) return;
            if(this.blocks[i].y >= 0 && 
                table[newPos][this.blocks[i].y] != 0) return;
        }

        this.forceMoveSideways(direction);
    }

    //move the piece up until it is not colliding with any blocks
    autoMoveUp() {
        while(true) {
            //make sure the piece isn't "clear" of any blocks
            let clear = true;
            for(let i = 0; i < 4; i++) {
                if(table[this.blocks[i].x][this.blocks[i].y] != 0 &&
                    this.blocks[i].y >= 0) {
                    clear = false;
                    break;
                }
            }
            if(clear) return;

            //move the piece up one and repeat
            for(let i = 0; i < 4; i++) {
                this.blocks[i].y--;
            }
            this.pivot.y--;
        }
    }

    //rotates the piece depending on its pivot and restrictions
    rotate() {
        let centerX = this.pivot.x;
        let centerY = this.pivot.y;

        for(let i = 0; i < 4; i++) {
            let tmp = this.blocks[i].x;
            this.blocks[i].x = Math.floor(centerX - (this.blocks[i].y - centerY)
                * this.direction);
            this.blocks[i].y = Math.floor(centerY + (tmp - centerX) * this.direction);
        }

        //move the piece in bounds, if necessary
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

    //tries to move the piece one space downwards
    //returns true if the piece successfully moved down
    //returns false if something blocked the piece from moving
    moveDown() {
        for(let i = 0; i < 4; i++) {
            let newPos = this.blocks[i].y + 1;
            if(newPos < 0) {
                continue;
            } else if(newPos == 20 || table[this.blocks[i].x][newPos] != 0) {
                //block below is either past the bottom or occupied
                return false;
            }
        }

        for(let i = 0; i < 4; i++) {
            this.blocks[i].y++;
        }
        this.pivot.y++;
        
        //reset the auto drop interval
        this.lastDropTime = new Date().getTime();
        return true;
    }

    //same thing as moveDown(), but automatically finalizes the piece if needed
    drop() {
        if(!this.moveDown()) {
            this.finalize();
            return false;
        }

        return true;
    }

    //drop the piece as far down as possible
    dropFull() {
        //this will also automatically generate the new piece
        //by calling finalize
        while(this.drop()) {}
    }

    //return a new Active Piece object that has been dropped all the way down
    //used for rendering the shadow piece in the game
    getDroppedObj() {
        let newObj = new ActivePiece(this.type);
        newObj.blocks = [];
        for(let i = 0; i < 4; i++) {
            //copy coordinate object
            newObj.blocks.push(Object.assign({}, this.blocks[i]));
        }

        while(newObj.moveDown()) {}
        return newObj;
    }

    //set the current active piece into place
    //and generates a new active piece
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

        //send update of table to server
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


//Lol, Duc Hoang met moi qua :((
