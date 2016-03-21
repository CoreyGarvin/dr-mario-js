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
    this.rows = height = height || 17;
    this.cols = width = width || 8;
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

    // var cells = function() {
    //     var output = [];
    //     for(var row = 0; row < map.length; row++) {
    //         for(var col = 0; col < map[row].length; col++) {
    //             if (map[row][col]) {
    //                 output.push(map[row][col]);
    //             }
    //         }
    //     }
    //     return output;
    // }

    // A game piece
    var Cell = function(position, type, color) {
        this.position = position || null;
        this.color = color || bugPalette.random();
        this.type = type || TYPE.BUG;
        this.destroyed = false;
        this.id = cellsCreated++;
        emit("cellCreated", this);
    };



    // Returns a blank position on the map (random, with constraints)
    // var randomBlankPosition = function(rowMin, rowMax, colMin, colMax) {
    //     var pos;
    //     do
    //         pos = new Position (
    //             getRandomInt(rowMin || 0, rowMax || map.length),
    //             getRandomInt(colMin || 0, colMax || map[0].length)
    //         );
    //     while (map[pos.row][pos.col] != null);
    //     return pos;
    // };

    // Generate 2d map of bugs
    var Map = function(rows, cols, nBugs) {
        var map = this;
        map.rows = rows;
        map.cols = cols;
        var cells = [];

        map.cells = function() {
            return cells;
        }
        // var arr = init1d(rows * cols, null);

        map.inBounds = function(pos) {
            return (pos.row >= 0 && pos.row < map.rows) &&
                   (pos.col >= 0 && pos.col < map.cols);
        };

        map.at = function(pos, col) {
            // Accept numbers
            if (typeof pos == "number") {
                pos = new Position(pos, col);
            }
            var result = cells.filter(function(item) {
                return item.position.equals(pos);
            });
            if (result.length == 1) return result[0];
            if (result.length == 0) return null;
            if (result.length > 1) alert("result > 1");
            // return m[pos.row * cols + pos.col];
        };

        map.remove = function(cell) {
            cells.splice(cells.indexOf(cell), 1);
        };

        map.add = function(cell) {
            cell.moveTo = function(position, test, force, ignoreList) {
                ignoreList = ignoreList || piece.parts;
                force = force || false;

                // Check bounds
                if (!map.inBounds(position)) {
                    return false;
                }
                if (force && test) {
                    return true;
                }
                // Check if space is already occupied
                var occupant = map.at(position);
                if (!force && occupant && ignoreList.indexOf(occupant) == -1) {
                    return false;
                }
                // Move the cell
                if (!test) {
                    this.position = position;
                }
                return true;
            };
            cell.destroy = function() {
                // necessary?
                this.destroyed = true;
                // Remove from map
                map.remove(this);
                // Remove from cells list
                // cells.filter(function(cell) {
                //     return this !== cell;
                // });
                if (this.type === TYPE.LEFT) map.at(this.position.toRight()).type = TYPE.ORPHAN;
                if (this.type === TYPE.RIGHT) map.at(this.position.toLeft()).type = TYPE.ORPHAN;
                if (this.type === TYPE.TOP) map.at(this.position.below()).type = TYPE.ORPHAN;
                if (this.type === TYPE.BOTTOM) map.at(this.position.above()).type = TYPE.ORPHAN;
                return emit("cellDestroyed", this);
            };

            cell.moveUp = function(n, test, force, ignoreList) {
                return this.moveTo(this.position.above(n), test, force, ignoreList);
            };
            cell.moveDown = function(n, test, force, ignoreList) {
                return this.moveTo(this.position.below(n), test, force, ignoreList);
            };
            cell.moveLeft = function(n, test, force, ignoreList) {
                return this.moveTo(this.position.toLeft(n), test, force, ignoreList);
            };
            cell.moveRight = function(n, test, force, ignoreList) {
                return this.moveTo(this.position.toRight(n), test, force, ignoreList);
            };
            cells.push(cell);
        };

        var randomBlankPosition = function(rowMin, rowMax, colMin, colMax) {
            var pos;
            do
                pos = new Position (
                    getRandomInt(rowMin || 0, rowMax || map.rows),
                    getRandomInt(colMin || 0, colMax || map.cols)
                );
            while (map.at(pos) != null);
            return pos;
        };

        var Streak = function(cells) {
            var cells = cells.constructor === Array ? cells : [cells];
            // this.length = cells.length;
            this.color = cells[0].color;
            this.cells = function() {
                return cells;
            };
            this.contains = function(cell) {
                return cells.indexOf(cell) != -1;
            };
            // Only allows adding same-color cells
            this.add = function(cell) {
                return cell.color === this.color && cells.push(cell);
            };
        };

        var findStreaks = function() {
            var streaks = [];

            // Function names for each direction of each axis
            [["above", "below"],["toLeft", "toRight"]]
            .forEach(function(axis) {
                var pool = cells.slice();

                // Find streaks
                while (pool.length > 0) {
                    var streak = new Streak(pool[0]);

                    axis.forEach(function(direction) {
                        var next = pool[0];
                        do {
                            next = map.at(next.position[direction]());
                        } while(next && streak.add(next));
                    });
                    streaks.push(streak);
                    pool = pool.filter(function(cell) {
                        return !streak.contains(cell);
                    });
                }
            });
            return streaks;
        };

        // Returns [] of killable cells (cells that are part of an n-in-a-row streak)
        map.killables = function(n) {
            return findStreaks().filter(function(streak) {
                return streak.cells().length >= n;
            }).reduce(function(prev, curr) {
                return prev.concat(curr.cells());
            }, []).filter(uniqueFilter);
        };

        // Moves all eligable pieces downward
        map.settle = function(items) {
            // By default, use all cells that are not bugs (and have a position)
            items = (items || cells).filter(function(cell) {
                return cell.type !== TYPE.BUG && cell.position;
            });
            // Track if motion happened
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
                    var next = map.at(cell.position.toRight());
                    if (next && next.type === TYPE.RIGHT && !next.moveDown(1, true)) {
                        continue;
                    }
                } else if (cell.type === TYPE.RIGHT && cell.moveDown(1, true)) {
                    var next = map.at(cell.position.toLeft());
                    if (next && next.type === TYPE.LEFT && !next.moveDown(1, true)) {
                        continue;
                    }
                }
                motion = cell.moveDown(1, false, false, []) || motion;
            };
            return motion;
        };

        var init = function() {
            // var needs = nBugs;
            // var iterations = 0;

            // do {
                // if (iterations++ > 10) break;
                while (cells.length < nBugs) {
                    map.add(new Cell(randomBlankPosition(4)));
                }
                // var kCells = killables(3);
                // needs = kCells.length;
                // kCells.map(function(cell) {
                //     cell.destroy();
                // })
            // } while (needs > 0);
        };
        init();
    };





    this.start = function() {
        map = new Map(height, width, nBugs);
        // generateMap(this.rows, this.cols, nBugs);
        emitEvents = true;
        pieceQ = [new PlayerPiece()];
        emit("gameInitialized", map.cells())
        .then(playerTurn);

    };

    var gameOver = function() {
        gameState = STATE.GAME_OVER;
        emit("gameOver");
        console.log("game over");
    };

    var playerTurn = function() {
        if (map.at(1, 3) || map.at(1, 4)) {
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
            if (map.settle()) {
                physicsStep();
            // Then kill blocks, repeat
            } else {
                var kCells = map.killables(4);
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
            this.parts[0].position = new Position(1, 3);
            this.parts[1].position = new Position(1, 4);
            map.add(this.parts[0]);
            map.add(this.parts[1]);

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