import { activePiece } from "./game";
import { handleEnterPress } from "./ui";

//Tao cac bien dinh huong cho khoi tetro
let left;
let right;
let up;
let down;
let space;
let c;

export function initInput() {
    window.addEventListener("keydown", keyDown);
    window.addEventListener("keyup", keyUp);

    left = new Key();
    right = new Key();
    up = new Key(Infinity);
    down = new Key();
    space = new Key();
    c = new Key(Infinity);
}

//Dieu kien de cac tetro di chuyen
export function updateInput() {
    if(left.query()) activePiece.moveSideways(-1);
    if(right.query()) activePiece.moveSideways(1);
    if(up.query()) activePiece.rotate();
    if(down.query()) activePiece.moveDown();
    if(space.query()) activePiece.dropFull();
    if(c.query()) activePiece.reserve();
}

class Key {
    constructor(delay = 200) {
        this.pressed = false;
        //timeout is the last time (in unix time (ms)) that
        //query returned true
        this.timeout = 0;
        //delay is how long before the key's action should be
        //performed again. Default delay is 200 ms.
        this.delay = delay;
    }

    setPressed(val) {
        this.pressed = val;

        if(!val) this.timeout = 0;
    }

    //check to see if the key's action should be processed
    //it depends on whether or not the key is actually down,
    //as well as other rules that have to do with the key's "delay"
    query() {
        if(!this.pressed) return false;

        if(this.timeout == 0) {
            //first time keypress is being handled
            this.timeout = new Date().getTime();
            return true;
        } else if(new Date().getTime() - this.timeout >= this.delay) {
            //after initial delay -- always return true
            return true;
        } else {
            //must be in key delay period -- return false
            return false;
        }
    }
}

function keyDown(event) {
    switch(event.key) {
    case "ArrowLeft":
    case "a":
        left.setPressed(true);
        return;
    case "ArrowRight":
    case "d":
        right.setPressed(true);
        return;
    case "ArrowUp":
    case "w":
        up.setPressed(true);
        return;
    case "ArrowDown":
    case "s":
        down.setPressed(true);
        return;
    case " ":
        space.setPressed(true);
        return;
    case "c":
        c.setPressed(true);
    }
}

function keyUp(event) {
    switch(event.key) {
    case "ArrowLeft":
    case "a":
        left.setPressed(false);
        return;
    case "ArrowRight":
    case "d":
        right.setPressed(false);
        return;
    case "ArrowUp":
    case "w":
        up.setPressed(false);
        return;
    case "ArrowDown":
    case "s":
        down.setPressed(false);
        return;
    case " ":
        space.setPressed(false);
        return;
    case "c":
        c.setPressed(false);
        return;
    case "Enter":
        //Xu ly khi an enter o trong menu
        handleEnterPress();
    }
}

