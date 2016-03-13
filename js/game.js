var DrMarioGame = function(width, height, nBugs, pillQueue) {
    var self = this;
    // 2d [] of Cells, list of cells
    var map = null;
    // var cells = null;
    var piece = null;
    var pieceQ = [];
    var cellsCreated = 0;
    var gameState = 0;
    var turnTimer = null;
    var gravityStep = 600;
    var emitEvents = false;
    this.rows = height || 17;
    this.cols = width || 8;
    nBugs = nBugs || 90;

    const STATE = {
        PLAYER_CONTROL:  "Player's Turn",
        PHYSICS_CONTROL: "Physic's Turn",
        GAME_OVER: "Game Over",
        GAME_WON: "Game won"
    };



    var emit = function() {
        if (emitEvents) {
            return Events.emit.apply(this, arguments);
        }
    };

    var cells = function() {
        var output = [];
        for(var row = 0; row < map.length; row++) {
            for(var col = 0; col < map[row].length; col++) {
                if (map[row][col]) {
                    output.push(map[row][col]);
                }
            }
        }
        return output;
    }

    // A game piece
    var Cell = function(position, type, color) {
        this.position = position || null;
        this.color = color || bugPalette.random();
        this.type = type || TYPE.BUG;
        this.destroyed = false;
        this.id = cellsCreated++;

        this.moveTo = function(position, test, force, ignorePiece) {
            var position = position || this.position;
            var row = position.row,
                col = position.col;
                force = force || false,
                ignorePiece = ignorePiece == null || ignorePiece === true;

            // Check bounds
            if (row < 0 || row >= map.length ||
                col < 0 || col >= map[0].length) {
                    return false;
            }
            if (force && test) {
                return true;
            }
            // Check if space is already occupied
            if (!force && map[row][col] != null && !(piece.parts.indexOf(map[row][col]) != -1 && ignorePiece)) {
                return false;
            }
            // Move the cell, void the old space
            if (!test) {
                if (this.position && map[this.position.row][this.position.col] === this) {
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
            // cells.filter(function(cell) {
            //     return this !== cell;
            // });
            if (this.type === TYPE.LEFT) map[this.position.row][this.position.col + 1].type = TYPE.ORPHAN;
            if (this.type === TYPE.RIGHT) map[this.position.row][this.position.col - 1].type = TYPE.ORPHAN;
            if (this.type === TYPE.TOP) map[this.position.row + 1][this.position.col].type = TYPE.ORPHAN;
            if (this.type === TYPE.BOTTOM) map[this.position.row - 1][this.position.col].type = TYPE.ORPHAN;
            return emit("cellDestroyed", this);
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
        emit("cellCreated", this);
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

    // Generate 2d map of bugs
    var generateMap = function(rows, cols, nBugs) {
        // setTimeout(function() {
            map = init2d(rows, cols, null);
            var needs = nBugs;
            var iterations = 0;
            do {
                if (iterations++ > 10) break;
                for (var i = 0; i < needs; i++) {
                    new Cell(randomBlankPosition(4)).moveTo();
                }
                var kCells = killables(3);
                needs = kCells.length;
                kCells.map(function(cell) {
                    cell.destroy();
                })
            } while (needs > 0);
        // }, 15000);

    };

    // Moves all eligable pieces downward
    var settle = function(items) {
        items = (items || cells()).filter(function(cell) {
            return cell.type !== TYPE.BUG && cell.position;
        });
        var motion = false;
        // Sort by row, so that lowest items are processed first
        items.sort(function(a, b) {
            return b.position.row - a.position.row});

        // Move each eligable cell down
        for (var i = 0; i < items.length; i++) {
            var cell = items[i];
            // These conditionals keep pill pieces 'glued' together
            // If left pill and can move down, ensure the right half can
            if (cell.type === TYPE.LEFT && cell.moveDown(1, true)) {
                var next = map[cell.position.row][cell.position.col + 1];
                if (next && next.type === TYPE.RIGHT && !next.moveDown(1, true)) {
                    continue;
                }
            } else if (cell.type === TYPE.RIGHT && cell.moveDown(1, true)) {
                var next = map[cell.position.row][cell.position.col - 1];
                if (next && next.type === TYPE.LEFT && !next.moveDown(1, true)) {
                    continue;
                }
            }
            motion = cell.moveDown(1, false, false, false) || motion;
        };
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

    this.start = function() {
        generateMap(this.rows, this.cols, nBugs);
        emitEvents = true;
        pieceQ = [new PlayerPiece()];
        emit("gameInitialized", cells())
        .then(playerTurn);

    };

    var gameOver = function() {
        gameState = STATE.GAME_OVER;
        emit("gameOver");
        console.log("game over");
    };

    var playerTurn = function() {
        if (map[1][3] || map[1][4]) {
            gameOver();
        } else {
            piece = pieceQ.shift();
            piece.position = new Position(1, 3);
            piece.addToMap();

            pieceQ.push(new PlayerPiece());
            Events.emit("nowOnDeck", pieceQ[0].parts);

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
                            return cell.destroy();
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

    var PlayerPiece = function(parts) {
        this.parts = parts || [
            new Cell(null, TYPE.LEFT),
            new Cell(null, TYPE.RIGHT)
        ];

        this.addToMap = function() {
            this.parts[0].moveTo(new Position(1, 3));
            this.parts[1].moveTo(new Position(1, 4));
        };

        this.move = function(mover) {
            if (this.parts[0][mover](1, true) && this.parts[1][mover](1, true)) {
                this.parts[0][mover]();
                this.parts[1][mover]();
                return true;
            }
            return false;
        };

        this.rotate = function(cc) {
            var horz = this.parts[0].position.row === this.parts[1].position.row;
            // Horizontal -> Vertical rotation
            if (horz) {
                // Default unobstructed
                if (!this.parts[1].moveTo(this.parts[0].position.above())) {
                    // Try above-right
                    if (this.parts[1].moveUp()) {
                        this.parts[0].moveRight();
                    // Try below
                    } else if (!this.parts[1].moveTo(this.parts[0].position.below())) {
                        // Try below-right
                        if (this.parts[1].moveDown()) {
                            this.parts[0].moveRight();
                        } else return false;
                    }
                }
            // Vertical -> Horizontal, try right
            } else if (!this.parts[1].moveTo(this.parts[0].position.toRight())) {
                // Try shifting left
                if (this.parts[0].moveLeft()) {
                    this.parts[1].moveDown();
                } else return false;
            }
            // Achieve counter-clockwise rotation by
            // swapping positions
            if ((horz && !cc) || (!horz && cc)) {
                var tmp = this.parts[0].position;
                // this.parts[0].position = this.parts[1].position;
                // this.parts[1].position = tmp;
                this.parts[0].moveTo(this.parts[1].position, false, true);
                this.parts[1].moveTo(tmp, false, true);
            }
            // Ensure parts[0] is the most lower-right cells
            this.parts.sort(function(a,b) {
                return b.position.row - a.position.row ||
                a.position.col - b.position.col;
            });
            // Set cells types
            if (horz) {
                this.parts[0].type = TYPE.BOTTOM;
                this.parts[1].type = TYPE.TOP;
            } else {
                this.parts[0].type = TYPE.LEFT;
                this.parts[1].type = TYPE.RIGHT;
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
};