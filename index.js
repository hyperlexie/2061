// IMPORTANT - The column values (columns, $columns, COLUMNS) and the row values (rows, $rows, ROWS)
//     MUST be the same between the HTML (index.pug), CSS (style.scss) and JavaScript (index.js) files
//     The square-edge values ($square-edge, SQUARE_EDGE) and the border-size values ($border-size, BORDER_SIZE)
//     MUST be the same between the CSS (style.scss) and JavaScript (index.js) files

const COLUMNS = 5;
const ROWS    = 7;
const SQUARE_EDGE  = 40;
const BORDER_SIZE  =  5;

class Position {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

class EmptyTile {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    getPosition() {
        return new Position(this.x, this.y);
    }

    update(x, y) {
        this.x = x;
        this.y = y;
    }
}

class Tile {
    constructor(x, y, value) {
        this.x = x;
        this.y = y;
        this.value = value;

        //create tile element
        let span = document.createElement('span');
        span.setAttribute('class', 'tiles');
        this.element = span;
        //append element to board
        $('#board').append(this.element);

        this.render();
    }

    render() {
        $(this.getElement()).text(this.value);
        $(this.getElement()).css({
            top:  this.y * (SQUARE_EDGE + BORDER_SIZE) + 'px',
            left: this.x * (SQUARE_EDGE + BORDER_SIZE) + 'px'
        });
        if (this.getValue() > 2048) {
            $(this.getElement()).addClass('tile-super');
        } else {
            $(this.getElement()).addClass('tile-' + this.getValue());
        }
    }

    getElement() {
        return this.element;
    }

    getPosition() {
        return new Position(this.x, this.y);
    }

    slideTo(position, callback) {
        this.x = position.x;
        this.y = position.y;

        $(this.getElement()).animate({
            top:  position.y * (SQUARE_EDGE + BORDER_SIZE) + 'px',
            left: position.x * (SQUARE_EDGE + BORDER_SIZE) + 'px',
        }, 'fast', callback);
    }

    destroy() {
        $(this.getElement()).remove();
    }

    getValue() {
        return this.value;
    }

    setValue(value) {
        this.value = value;
    }
}

class Board {
    constructor() {
        this.tiles = [];
        this.score = 0;
        this.spawnOnSlide = false;
        this.init();
    }

    // This function draws the blank squares
    init() {
        $('.blanks').each((index, ele) => {
            const y = parseInt(index / COLUMNS);   // TODO fix this
            const x = index % COLUMNS;
            $(ele).css({
                top:  (y * (SQUARE_EDGE + BORDER_SIZE)) + 'px',
                left: (x * (SQUARE_EDGE + BORDER_SIZE)) + 'px'
            });
        });
    }

    setScore(value) {
        this.score = value;
        $('#score').text(this.score);
    }

    getScore() {
        return this.score;
    }

    getTile(x, y) {
        for (const tile of this.tiles) {
            if (tile.x === x && tile.y === y)
                return tile;
        }
        return undefined;
    }

    swipe(direction) {
        let sets = [];

        for (let x = 0; x < COLUMNS; x++) {
            let set = [];
            for (let y = 0; y < ROWS; y++) {
                switch (direction) {
                    case "UP": {
                        const tile = this.getTile(x, y);
                        if (tile) {
                            set.push(tile);
                        } else {
                            set.push(new EmptyTile(x, y));
                        }
                    }
                        break;
                    case "DOWN": {
                        const tile = this.getTile(x, ROWS - 1 - y);
                        if (tile) {
                            set.push(tile);
                        } else {
                            set.push(new EmptyTile(x, ROWS - 1 - y));
                        }
                    }
                        break;
                }
            }
            sets.push(set);
        }

        for (let y = 0; y < ROWS; y++) {
            let set = [];
            for (let x = 0; x < COLUMNS; x++) {
                switch (direction) {
                    case "LEFT": {
                        const tile = this.getTile(x, y);
                        if (tile) {
                            set.push(tile);
                        } else {
                            set.push(new EmptyTile(x, y));
                        }
                    }
                        break;
                    case "RIGHT": {
                        const tile = this.getTile(COLUMNS - 1 - x, y);
                        if (tile) {
                            set.push(tile);
                        } else {
                            set.push(new EmptyTile(COLUMNS - 1 - x, y));
                        }
                    }
                        break;
                }
            }
            sets.push(set);
        }

        for (const set of sets) {
            this.slide(set);
        }

        if (this.spawnOnSlide) {
            this.spawnTile();
            this.spawnOnSlide = false;
        }
    }

    newGame() {
        for (const tile of this.tiles) {
            tile.destroy()
        }
        this.tiles = []
        this.spawnTile(1)
        this.spawnTile(1)
        this.setScore(0)
    }

    spawnTile(value = Board.getNewTileValue(), x, y) {
        if (x === undefined) {
            const positions = this.getEmptyPositions();
            const index = Board.getRandomRange(0, positions.length - 1);
            const position = positions[index];
            x = position.x;
            y = position.y;
        }
        const tile = new Tile(x, y, value);
        this.tiles.push(tile);
    }

    // Gabriele Cirulli's code to compute value of a new tile
    static getNewTileValue() {
        return Math.random() < 0.9 ? 1 : 2;
    }

    getEmptyPositions() {
        let positions = [];
        for (let x = 0; x < COLUMNS; x++) {
            for (let y = 0; y < ROWS; y++) {
                if (!this.getTile(x, y)) {
                    positions.push(new Position(x, y));
                }
            }
        }
        return positions;
    }

    // 2048 tiles can merge with tiles other than 2048 as long as they don't add up to > 2061
    static merge_tiles_for_2061(filledTile, tile) {
        if ((filledTile.getValue() >= 2048 || tile.getValue() >= 2048) &&
            // if ((filledTile.getValue() >= 2048 ) &&      // merges when it should, but also when it shouldn't
            // if ((tile.getValue() >= 2048) &&             // never merges when it shouldn't, but sometimes doesn't merge
            filledTile.getValue() + tile.getValue() <= 2061)
            return true;
        else
            return false;
    }

    slide(set) {
        for (let i = 0; i < set.length; i++) {
            let tile = set[i];
            if (i > 0) {
                if (tile instanceof Tile) {
                    const previousTiles = set.slice(0, i);

                    const filledTile = previousTiles.filter(t => t instanceof Tile).reverse().shift();
                    //if same value is found in previous tile
                    //merge tiles and replace current tile with empty
                    if (filledTile && (filledTile.getValue() === tile.getValue() ||
                        Board.merge_tiles_for_2061(filledTile, tile))
                    ) {
                        const index = set.indexOf(filledTile);
                        set[index] = tile;
                        set[i] = new EmptyTile(tile.x, tile.y);
                        const newPos = filledTile.getPosition();
                        let board = this;
                        // tile.setValue(tile.getValue() * 2);
                        tile.setValue(tile.getValue() + filledTile.getValue());
                        this.tiles.splice(this.tiles.indexOf(filledTile), 1);
                        tile.slideTo(newPos, () => {
                            filledTile.destroy();
                            board.setScore(board.getScore() + tile.getValue());
                            tile.render();
                        });

                        this.spawnOnSlide = true;
                    }
                    //if empty tiles found in previous tiles
                    //switch tiles and update positions
                    else {
                        let emptyTile = previousTiles.filter(t => t instanceof EmptyTile).shift();
                        if (emptyTile) {
                            const index = set.indexOf(emptyTile);
                            set[index] = tile;
                            set[i] = emptyTile;
                            const newPos = emptyTile.getPosition();
                            emptyTile.update(tile.x, tile.y);
                            tile.slideTo(newPos, () => {

                            });

                            this.spawnOnSlide = true;
                        }
                    }
                }
            }
        }
    }

    static getRandomRange(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
}

let board = new Board();
board.newGame();

$(document).keydown(function(e) {
    switch(e.which) {
        case 37: // left
        board.swipe("LEFT");
        break;

        case 38: // up
        console.log("up arrow");
        board.swipe("UP");
        break;

        case 39: // right
        board.swipe("RIGHT");
        break;

        case 40: // down
        board.swipe("DOWN");
        break;

        default: return; // exit this handler for other keys
    }
    e.preventDefault(); // prevent the default action (scroll / move caret)
});

$(document).on('swipeleft',function(e,data){
  board.swipe("LEFT");
  e.preventDefault();
});
$(document).on('swiperight',function(e,data){
  board.swipe("RIGHT");
  e.preventDefault();
});
$(document).on('swipeup',function(e,data){
  console.log("swipeup");
  board.swipe("UP");
  e.preventDefault();
});
$(document).on('swipedown',function(e,data){
  board.swipe("DOWN");
  e.preventDefault();
});

$('#restart').click(() => {
    board.newGame();
});
