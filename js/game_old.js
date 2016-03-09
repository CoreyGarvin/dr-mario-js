
var Game = function(width, height, nBugs, pillQueue) {
    var self = this;
    // 2d [] of Cells, list of cells
    var map = null;
    var cells = null;
    var pieceQ = [];
    var piece = [];
    var cellsCreated = 0;
    var gameState = 0;



    const STATE = {
        PLAYER_CONTROL:  "Player's Turn",
        PHYSICS_CONTROL: "Physic's Turn"
    };



    var physicsTurn = function() {
        gameState = STATE.PHYSICS_CONTROL;
        kCells = killables();
        if (kCells.length) {

        }

    };

    // A game piece
    var Cell = function(position, type, color) {
        this.position = position || randomBlankPosition(4);
        this.color = color || bugPalette.random();
        this.type = type || TYPE.BUG;
        this.destroy = false;
        this.id = cellsCreated++;

        this.moveTo = function(position, test, force, ignorePiece) {
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
            if (!force && map[row][col] != null && !(piece.indexOf(map[row][col]) != -1 && ignorePiece)) {
                return false;
            }
            // Move the cell, void the old space
            if (!test) {
                map[this.position.row][this.position.col] = null;
                map[row][col] = this;
                this.position.set(row, col);
            }
            return true;
        };
        this.moveUp = function(n, test, force) {
            return this.moveTo(this.position.above(n), test, force);
        };
        this.moveDown = function(n, test, force) {
            return this.moveTo(this.position.below(n), test, force);
        };
        this.moveLeft = function(n, test, force) {
            return this.moveTo(this.position.toLeft(n), test, force);
        };
        this.moveRight = function(n, test, force) {
            return this.moveTo(this.position.toRight(n), test, force);
        };
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
            var cell = new Cell();
            map[cell.position.row][cell.position.col] = cell;
            cells.push(cell);
        }
    };



    var settle = function() {
        var motion = false;
        // Sort by row, so that lowest items are processed first
        cells.sort(function(a, b) {
            return b.position.row - a.position.row});

        // Move each eligable cell down
        cells.forEach(function(cell) {
            motion = cell.moveDown() || motion;
        });
        return motion;
    };

    var killables = function(n) {
        var result = {};
        var currentChain = [];
        return [];
    };

    var playerPiece = function(cells) {
        var cells = cells || [
            new Cell(new Position(1,3), TYPE.LEFT),
            new Cell(new Position(1,4), TYPE.RIGHT)
        ];

        this.move = function(mover) {
            if (cells[0][mover](1, true) && cells[1][mover](1, true)) {
                cells[0][mover]();
                cells[1][mover]();
                return true;
            }
            return false;
        };

        this.rotate = function(cc) {
            var horz = cells[0].position.row === cells[1].position.row;
            // Horizontal -> Vertical rotation
            if (horz) {
                // Default unobstructed
                if (!cells[1].moveTo(cells[0].position.above())) {
                    // Try above-right
                    if (cells[1].moveUp()) {
                        cells[0].moveRight();
                    // Try below
                    } else if (!cells[1].moveTo(cells[0].position.below())) {
                        // Try below-right
                        if (cells[1].moveDown()) {
                            cells[0].moveRight();
                        } else return false;
                    }
                }
            // Vertical -> Horizontal, try right
            } else if (!cells[1].moveTo(cells[0].position.toRight())) {
                // Try shifting left
                if (cells[0].moveLeft()) {
                    cells[1].moveDown();
                } else return false;
            }
            // Achieve counter-clockwise rotation by
            // swapping positions
            if ((horz && !cc) || (!horz && cc)) {
                var tmp = cells[0].position;
                cells[0].position = cells[1].position;
                cells[1].position = tmp;
            }
            // Ensure cells[0] is the most lower-right cells
            cells.sort(function(a,b) {
                return b.position.row - a.position.row ||
                a.position.col - b.position.col;
            });
            // Set cells types
            if (horz) {
                cells[0].type = TYPE.BOTTOM;
                cells[1].type = TYPE.TOP;
            } else {
                cells[0].type = TYPE.LEFT;
                cells[1].type = TYPE.RIGHT;
            }
            return true;
        };
    };

    generateMap(height || 17, width || 8, nBugs || 10);
    piece = new playerPiece();

    return {
        rows: map.length,
        cols: map[0].length,
        // piece: function() {
        //     return piece;
        // },
        cells: function() {
            return cells;
        },
        print: function() {
            console.log(map.map(function(row) {
                return row.join(",");
            }).join("\n"));
        },
        playerControls: {
            left:  function() {return piece.move("moveLeft");},
            right: function() {return piece.move("moveRight");},
            down:  function() {return piece.move("moveDown");},
            rotate: function(cc) {return piece.rotate(cc);}
        },
        // killables: function() {
        //     // Our output map
        //     var killables = init2d(map.length, map[0].length, 0);
        //     var killList = [];

        //     // Horizontal Scan
        //     for (var i = 0; i < map.length; i++) {
        //         var trackedColor = -1;
        //         // var killables = [];
        //         var crumbs = 0;
        //         var crumbType = 0;
        //         for (var j = 0; j < map[i].length; j++) {
        //             var color = Math.floor(map[i][j] / 6);
        //             if (color == 0) {
        //                 trackedColor = -1;
        //                 continue;
        //             }
        //             else if (color == trackedColor) crumbs++;
        //             else {
        //                 if (crumbs > 3) {
        //                     killList.push(crumb)
        //                 }
        //             }

        //             // End of a chain?
        //             if (color != trackedColor || color == 0 || j ==) {

        //             }
        //             // Blank cell resets the process
        //             if (map[i][j] == 0) {
        //                 trackedColor = -1;
        //                 continue;
        //             }
        //             // Found consecutive color
        //             if (Math.floor(map[i][j] / 6) == trackedColor) {
        //                 crumbs++;
        //             }
        //             // End of a color chain
        //             else {
        //                 if (crumbs > 3) {
        //                     killList[killListIterator++] = crumbType;
        //                 }
        //                 trackedColor = Math.floor(map[i][j] / 6);
        //                 crumbType++;
        //                 crumbs = 1;
        //             }
        //             crumbBoard[i][j][0] = crumbType; //drop a crumb
        //         }
        //     }
        // }
    };
};