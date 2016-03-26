var DrMarioGame = function(config) {
    var game = this;
    var config = config || {};

    game.map = null;
    var piece = null;
    var pieceQ = config.pieceQ || [];
    var cellsCreated = 0;
    var gameState = 0;
    var turnTimer = null;
    var gravityStep = config.gravityStep || 600;
    // var emitEvents = false;
    // game.eventEmitter = Events;
    game.rows = config.rows || 17;
    game.cols = config.cols || 8;
    var nBugs = config.nBugs || 30;

    game.copy = function() {
        return new DrMarioGame({
            cells: game.map.cells.map(function(cell) {return cell.copy();}),
            rows: game.rows,
            cols: game.cols,
            nBugs: nBugs,
            pieceQ: pieceQ
        });
    };

    const STATE = {
        PLAYER_CONTROL:  "Player's Turn",
        PHYSICS_CONTROL: "Physic's Turn",
        GAME_OVER: "Game Over",
        GAME_WON: "Game won"
    };

    // Simple event system
    game.events = new EventSystem();

    // A game piece
    var Cell = function(position, type, color, disableEmit) {
        this.position = position || null;
        this.color = color || bugPalette.random();
        this.type = type || TYPE.BUG;
        this.destroyed = false;
        this.id = cellsCreated++;
        this.copy = function() {
            return new Cell(
                new Position(this.position.x, this.position.y),
                this.type, this.color, true);
        };
        if (!disableEmit) {
            game.events.emit("cellCreated", this);
        }
    };

    // Data structure for game board layout
    var Map = function(cells) {
        var map = this;
        map.rows = game.rows;
        map.cols = game.cols;
        map.cells = cells || [];

        map.inBounds = function(pos) {
            return (pos.row >= 0 && pos.row < map.rows) &&
                   (pos.col >= 0 && pos.col < map.cols);
        };

        map.at = function(pos, col) {
            // Accept numbers
            if (typeof pos == "number") {
                pos = new Position(pos, col);
            }
            var result = map.cells.filter(function(item) {
                return item.position.equals(pos);
            });
            if (result.length == 1) return result[0];
            if (result.length == 0) return null;
            if (result.length > 1) alert("result > 1");
            // return m[pos.row * cols + pos.col];
        };

        map.remove = function(cell) {
            map.cells.splice(map.cells.indexOf(cell), 1);
        };

        map.add = function(cells) {
            var cells = cells.constructor === Array ? cells : [cells];
            cells.forEach(function(cell) {
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
                    return game.events.emit("cellDestroyed", this);
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
                map.cells.push(cell);
            });

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
                var pool = map.cells.slice();

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
            items = (items || map.cells).filter(function(cell) {
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
            while (map.cells.length < nBugs) {
                map.add(new Cell(randomBlankPosition(4)));
                map.killables(3).forEach(function(cell) {
                    cell.destroy();
                });
            }
        };
        // Generate board or use predefined cells
        if (map.cells.length == 0) {
            init();
        } else {
            map.add(cells);
        }
    };

    game.start = function() {
        // generateMap(this.rows, this.cols, nBugs);
        game.events.enabled = true;
        // emitEvents = true;
        pieceQ = [new PlayerPiece()];
        game.events.emit("gameInitialized", this)
        .then(playerTurn);
    };

    var gameOver = function() {
        gameState = STATE.GAME_OVER;
        game.events.emit("gameOver");
        console.log("game over");
    };

    var playerTurn = function() {
        if (game.map.at(1, 3) || game.map.at(1, 4)) {
            gameOver();
        } else {
            piece = pieceQ.shift();
            piece.position = new Position(1, 3);
            piece.addToMap();

            pieceQ.push(new PlayerPiece());
            game.events.emit("nowOnDeck", pieceQ[0].parts);

            gameState = STATE.PLAYER_CONTROL;
            game.events.emit("playerTurn");
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
            if (game.map.settle()) {
                physicsStep();
            // Then kill blocks, repeat
            } else {
                var kCells = game.map.killables(4);
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

    var simulationHelpers = function() {
        // settling of the board and destroy happen all in one shot
        var physicsSimulation = function() {
            var kCells = game.map.killables(4);
            while(kCells.length > 0) {
                kCells.forEach(function(cell) {cell.destroy();});
                while(game.map.settle()) {}
                kCells = game.map.killables(4);
            }
        };
    };


    var PlayerPiece = function(parts) {
        this.parts = parts || [
            new Cell(null, TYPE.LEFT),
            new Cell(null, TYPE.RIGHT)
        ];

        this.addToMap = function() {
            this.parts[0].position = new Position(1, 3);
            this.parts[1].position = new Position(1, 4);
            game.map.add(this.parts[0]);
            game.map.add(this.parts[1]);
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
    game.map = new Map(config.cells);
};