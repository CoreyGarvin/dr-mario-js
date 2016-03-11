var debug = true;
var log = function(msg) { if (debug) console.log(msg);}

// Returns a random integer between min (included) and < max (not included)
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

// Returns a random integer between min (included) and max (included)
function getRandomIntInclusive(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function init2d(rows, cols, val) {
  var array = [], row = [];
  while (cols--) row.push(val);
  while (rows--) array.push(row.slice());
  return array;
}

function toRadians(deg) {
    return deg * Math.PI / 180;
}

var ColorPalette = function(colors) {
    // Make colors publically available (necessary?)
    Object.keys(colors).forEach(function(key,index) {
        this[key] = colors[key];
    });

    // Return a random color
    this.random = function() {
        var keys = Object.keys(colors);
        return colors[keys[getRandomInt(0, keys.length)]];
    };
};

const bugPalette = new ColorPalette({
    RED:    {name: "Red",    value: 0xFF0000},
    YELLOW: {name: "Yellow", value: 0xFFFF00},
    BLUE:   {name: "Blue",   value: 0x0000FF},
});

const TYPE = {
    BUG:    {name: "Bug",           frame: "bug.png",   rotation: 0},
    TOP:    {name: "Pill Top",      frame: "pill.png",  rotation: toRadians(-90)},
    BOTTOM: {name: "Pill Bottom",   frame: "pill.png",  rotation: toRadians(90)},
    LEFT:   {name: "Pill Left",     frame: "pill.png",  rotation: toRadians(180)},
    RIGHT:  {name: "Pill Right",    frame: "pill.png",  rotation: 0},
    ORPHAN: {name: "Pill Piece",    frame: "bug.png",   rotation: 0},
};

var Position = function(row, col) {
    this.set = function(row, col) {
        this.row = row;
        this.col = col;
    };
    this.above = function(n) {
        return new Position(this.row - (n || 1), this.col);
    };
    this.below = function(n) {
        return this.above(-(n || 1));
    };
    this.toLeft = function(n) {
        return new Position(this.row, this.col - (n || 1));
    };
    this.toRight = function(n) {
        return this.toLeft(-(n || 1));
    };
    this.set(row, col);
};

var Component = function(name, states) {
    var states = states;
    this.name = name;

    /*
    Contact point between the controller and a component.  Components
    whose 'states' var contains a function(keyed by state name) are
    effectively 'listening' to state changes broadcasted from the
    controller.  State change handlers may return a Promise, enabling
    them to effectively take as much time as they need to "return";
    @param {String} arguments[0]
    @param {(any)}  (all other args)
    @return {Promise}
     */
    this.enterState = function() {
        var arguments = Array.prototype.slice.call(arguments);
        var state = arguments.shift();
        if (states.hasOwnProperty(state)) {
            var msg = ("\tACCEPTED:\t" + this.name);
            var p = states[state].apply(this, arguments);
            if (p instanceof Object && p.hasOwnProperty("then")) {
                log(msg + "success(Promise)");
                return p;
            } else {
                log(msg + "\tsuccess(" + (p == null ? "" : p) + ")");
                return Promise.resolve(p);
            }
        }
        log("\tIGNORED :\t" + this.name);
        return Promise.resolve();
    };
};

var DrMarioGame = function(width, height, nBugs, pillQueue) {
    var self = this;
    // 2d [] of Cells, list of cells
    var map = null;
    var cells = null;
    var piece = null;
    var pieceQ = [];
    var cellsCreated = 0;
    var gameState = 0;
    var turnTimer = null;
    var gravityStep = 1000;
    this.rows = height || 17;
    this.cols = width || 8;
    nBugs = nBugs || 2;

    const STATE = {
        PLAYER_CONTROL:  "Player's Turn",
        PHYSICS_CONTROL: "Physic's Turn"
    };

    var registeredComponents = [];

    // Notifies all registered components of the new game state ()
    var broadcastState = function() {
        var args = arguments;
        log("\n" + arguments[0]);
        return Promise.all(registeredComponents.map(
            function(component) {
                return component.enterState.apply(component, args);
            })
        );
    };

    // A game piece
    var Cell = function(position, type, color) {
        this.position = position || randomBlankPosition(4);
        this.color = color || bugPalette.random();
        this.type = type || TYPE.BUG;
        this.destroyed = false;
        this.id = cellsCreated++;

        this.moveTo = function(position, test, force, ignorePiece) {
            var position = position || this.position;
            var row = position.row,
                col = position.col;
                force = force || false,
                ignorePiece = ignorePiece || true;

            // Check bounds
            if (row < 0 || row >= map.length ||
                col < 0 || col >= map[0].length) {
                    return false;
            }
            if (force && test) {
                return true;
            }
            // Check if space is already occupied
            if (!force && map[row][col] != null && !(piece.cells.indexOf(map[row][col]) != -1 && ignorePiece)) {
                return false;
            }
            // Move the cell, void the old space
            if (!test) {
                if (map[this.position.row][this.position.col] === this) {
                    map[this.position.row][this.position.col] = null;
                }
                map[row][col] = this;
                this.position = position;
            }
            return true;
        };
        this.destroy = function() {
            // necessary?
            this.destroyed = true;
            // Remove from map
            map[this.position.row][this.position.col] = null;
            // Remove from cells list
            cells.filter(function(cell) {
                return this !== cell;
            });
            if (this.type === TYPE.LEFT) map[this.position.row][this.position.col + 1].type = TYPE.ORPHAN;
            if (this.type === TYPE.RIGHT) map[this.position.row][this.position.col - 1].type = TYPE.ORPHAN;
            if (this.type === TYPE.TOP) map[this.position.row + 1][this.position.col].type = TYPE.ORPHAN;
            if (this.type === TYPE.BOTTOM) map[this.position.row - 1][this.position.col].type = TYPE.ORPHAN;
            return broadcastState("cellDestroyed", this);
        };

        this.moveUp = function(n, test, force, ignorePiece) {
            return this.moveTo(this.position.above(n), test, force, ignorePiece);
        };
        this.moveDown = function(n, test, force, ignorePiece) {
            return this.moveTo(this.position.below(n), test, force, ignorePiece);
        };
        this.moveLeft = function(n, test, force, ignorePiece) {
            return this.moveTo(this.position.toLeft(n), test, force, ignorePiece);
        };
        this.moveRight = function(n, test, force, ignorePiece) {
            return this.moveTo(this.position.toRight(n), test, force, ignorePiece);
        };
        cells.push(this);
        broadcastState("cellCreated", this);
    };

    // Returns a blank position on the map (random, with constraints)
    var randomBlankPosition = function(rowMin, rowMax, colMin, colMax) {
        var pos;
        do
            pos = new Position (
                getRandomInt(rowMin || 0, rowMax || map.length),
                getRandomInt(colMin || 0, colMax || map[0].length)
            );
        while (map[pos.row][pos.col] != null);
        return pos;
    };

    var generateMap = function(rows, cols, nBugs) {
        map = init2d(rows, cols, null);
        cells = [];

        while (cells.length < nBugs) {
            new Cell().moveTo();
        }
    };

    var settle = function(items) {
        items = (items || cells).filter(function(cell) {
            return cell.type === TYPE.ORPHAN;
        });
        var motion = false;
        // Sort by row, so that lowest items are processed first
        items.sort(function(a, b) {
            return b.position.row - a.position.row});

        // Move each eligable cell down
        items.forEach(function(cell) {
            motion = cell.moveDown(1, false, false, false) || motion;
        });
        return motion;
    };

    var killables = function(n) {
        var output = {};
        // Horizontal Scan
        for(var row = 0; row < map.length; row++) {
            for(var col = 0; col < map[row].length; col++) {
                // Skip blanks
                if (!map[row][col]) {
                    continue;
                }
                // Accumulate consecutive colors
                var streak = [];
                do {
                    streak.push(map[row][col++]);
                } while(col < map[row].length && map[row][col] && map[row][col].color === streak[streak.length - 1].color);
                col--;

                // Add streak to our output
                if (streak.length >= n) {
                    streak.forEach(function(cell) {
                        output[cell.id] = cell;
                    });
                }
            }
        }
        // Vertical scan
        for(var col = 0; col < map[0].length; col++) {
            for(var row = 0; row < map.length; row++) {
                // Skip blanks
                if (!map[row][col]) {
                    continue;
                }
                // Accumulate consecutive colors
                var streak = [];
                do {
                    streak.push(map[row++][col]);
                } while(row < map.length && map[row][col] && map[row][col].color === streak[streak.length - 1].color);
                row--;

                // Add streak to our output
                if (streak.length >= n) {
                    streak.forEach(function(cell) {
                        output[cell.id] = cell;
                    });
                }
            }
        }
        // Return [] of cells
        return Object.keys(output).map(function(key) {
            return output[key];
        });
    };

    this.register = function() {
        for (var i = 0; i < arguments.length; i++) {
            registeredComponents.push(arguments[i]);
        }
    };

    this.unRegister = function() {
        for (var i = 0; i < arguments.length; i++) {
            registeredComponents.pop(arguments[i]);
        }
    };

    this.start = function() {
        generateMap(this.rows, this.cols, nBugs);
        playerTurn();
    };

    var playerTurn = function() {
        if (map[1][3] || map[1][4]) {
            console.log("game over");
        } else {
            piece = new PlayerPiece();
            piece.addToMap();
            gameState = STATE.PLAYER_CONTROL;
            playerTurnStep();
        }
    };

    var playerTurnStep = function() {
        clearTimeout(turnTimer);
        turnTimer = setTimeout(function() {
            if (piece.move("moveDown")) {
                playerTurnStep();
            } else {
                physicsTurn();
            }
        }, gravityStep);
    };

    var physicsTurn = function() {
        gameState = STATE.PHYSICS_CONTROL;
        clearTimeout(turnTimer);
        physicsStep();
    };

    var physicsStep = function() {
        clearTimeout(turnTimer);
        turnTimer = setTimeout(function() {
            // Settle while possible
            if (settle()) {
                physicsStep();
            // Then kill blocks, repeat
            } else {
                var kCells = killables(4);
                // Kill cells, should resolve immediately if none
                if (kCells.length > 0) {
                    Promise.all(
                        kCells.map(function(cell) {
                            cell.destroy();
                        })
                    ).then(function() {
                        physicsStep();
                    });
                } else {
                    playerTurn();
                }

            }
        }, gravityStep);
    };

    // var killCells = function(kCells) {
    //     for (var i = 0; i < kCells.length; i++) {

    //     }
    // };

    var PlayerPiece = function(cells) {
        this.cells = cells || [
            new Cell(new Position(1,3), TYPE.LEFT),
            new Cell(new Position(1,4), TYPE.RIGHT)
        ];

        this.addToMap = function() {
            this.cells[0].moveTo();
            this.cells[1].moveTo();
        };

        this.move = function(mover) {
            if (this.cells[0][mover](1, true) && this.cells[1][mover](1, true)) {
                this.cells[0][mover]();
                this.cells[1][mover]();
                return true;
            }
            return false;
        };

        this.rotate = function(cc) {
            var horz = this.cells[0].position.row === this.cells[1].position.row;
            // Horizontal -> Vertical rotation
            if (horz) {
                // Default unobstructed
                if (!this.cells[1].moveTo(this.cells[0].position.above())) {
                    // Try above-right
                    if (this.cells[1].moveUp()) {
                        this.cells[0].moveRight();
                    // Try below
                    } else if (!this.cells[1].moveTo(this.cells[0].position.below())) {
                        // Try below-right
                        if (this.cells[1].moveDown()) {
                            this.cells[0].moveRight();
                        } else return false;
                    }
                }
            // Vertical -> Horizontal, try right
            } else if (!this.cells[1].moveTo(this.cells[0].position.toRight())) {
                // Try shifting left
                if (this.cells[0].moveLeft()) {
                    this.cells[1].moveDown();
                } else return false;
            }
            // Achieve counter-clockwise rotation by
            // swapping positions
            if ((horz && !cc) || (!horz && cc)) {
                var tmp = this.cells[0].position;
                // this.cells[0].position = this.cells[1].position;
                // this.cells[1].position = tmp;
                this.cells[0].moveTo(this.cells[1].position, false, true);
                this.cells[1].moveTo(tmp, false, true);
            }
            // Ensure cells[0] is the most lower-right cells
            this.cells.sort(function(a,b) {
                return b.position.row - a.position.row ||
                a.position.col - b.position.col;
            });
            // Set cells types
            if (horz) {
                this.cells[0].type = TYPE.BOTTOM;
                this.cells[1].type = TYPE.TOP;
            } else {
                this.cells[0].type = TYPE.LEFT;
                this.cells[1].type = TYPE.RIGHT;
            }
            return true;
        };
    };
    var ifPlayerTurn = function(func) {return function() {return gameState == STATE.PLAYER_CONTROL && func.apply(this, arguments);}};
    this.playerControls = {
        left:  ifPlayerTurn(function() {return piece.move("moveLeft");}),
        right: ifPlayerTurn(function() {return piece.move("moveRight");}),
        down:  ifPlayerTurn(function() {
            if (piece.move("moveDown")) {
                playerTurnStep();
            } else {
                physicsTurn();
            }
        }),
        rotate: ifPlayerTurn(function(cc) {return piece.rotate(cc);})
    };
    // return {
    //     rows: map.length,
    //     cols: map[0].length,
    //     // piece: function() {
    //     //     return piece;
    //     // },
    //     cells: function() {
    //         return cells;
    //     },
    //     print: function() {
    //         console.log(map.map(function(row) {
    //             return row.join(",");
    //         }).join("\n"));
    //     },
    //     playerControls: 
    // };
};