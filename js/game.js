var cellsCreated = 0;
var logError = function(err) {
    console.err(err);
};

var DrMarioGame = function(config) {
    var game = this;
    var config = config || {};

    this.name = config.name || "Game " + ++cellsCreated;
    game.map = null;
    game.startPosition = new Position(1, 3);

    var pieceQ = config.pieceQ || [];
    game.state = config.state || 0;
    var turnTimer = null;
    var gravityStep = config.gravityStep || 100;
    game.rows = config.rows || 17;
    game.cols = config.cols || 8;
    var nBugs = config.nBugs || 104;
    var turnCount = 0;

    game.copy = function() {
        var pieceParts = [];
        var cells = game.map.cells.map(function(cell) {
            var copy = cell.copy();
            if (cell === game.piece.parts[0] || cell === game.piece.parts[1]) {
                pieceParts.push(copy);
            }
            return copy;
        });
        if (pieceParts.length != 2) {
            alert("bad piece on game copy");
            pieceParts = null;
        }

        return new DrMarioGame({
            name: this.name + " Copy " + ++cellsCreated,
            state: game.state,
            cells: cells,
            rows: game.rows,
            cols: game.cols,
            nBugs: nBugs,
            pieceParts: pieceParts,
            pieceQParts: pieceQ[0].parts.map(function(part) {return part.copy();}),
        });
    };

    const STATE = {
        PLAYER_CONTROL:  "Player's Turn",
        PHYSICS_CONTROL: "Physic's Turn",
        GAME_OVER: "Game Over",
        GAME_WON: "Game won"
    };

    // Simple event system
    game.events = new EventSystem("Game");

    // A game piece
    var Cell = function(position, type, color, disableEmit) {
        this.position = position || null;
        this.color = color || bugPalette.random();
        this.type = type || TYPE.BUG;
        this.destroyed = false;
        this.id = cellsCreated++;
        this.copy = function() {
            return new Cell(
                this.position == null ? null : new Position(this.position.row, this.position.col),
                this.type, this.color, true);
        };
        if (!disableEmit) {
            game.events.emit("cellCreated", this);
        }
    };

    // Data structure for game board layout
    var Map = function(cells) {
        var map = this;
        map.cells = [];
        map.rows = game.rows;
        map.cols = game.cols;

        map.inBounds = function(pos) {
            return (pos.row >= 0 && pos.row < map.rows) &&
                   (pos.col >= 0 && pos.col < map.cols);
        };

        map.at = function(pos, col) {
            // Accept numbers
            if (typeof pos == "number") {
                pos = new Position(pos, col);
            }

            if (!map.inBounds(pos)) {
                return undefined;
            }

            var result = map.cells.filter(function(item) {
                return item.position.equals(pos);
            });
            if (result.length == 1) return result[0];
            if (result.length == 0) return null;
            if (result.length > 1) {
                console.log(result);
                return result;
                // alert("result > 1");
            }
            // return m[pos.row * cols + pos.col];
        };

        map.remove = function(cell) {
            map.cells.splice(map.cells.indexOf(cell), 1);
        };

        map.add = function(cells) {
            var cells = cells.constructor === Array ? cells : [cells];
            cells.forEach(function(cell) {
                cell.moveTo = function(position, test, force, ignoreList) {
                    ignoreList = ignoreList || game.piece.parts;
                    force = force || false;

                    // Check bounds
                    if (!force && !map.inBounds(position) && map.inBounds(this.position)) {
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
                    var otherPiece = null;
                    if (this.type === TYPE.LEFT) otherPiece = map.at(this.position.toRight());
                    if (this.type === TYPE.RIGHT) otherPiece = map.at(this.position.toLeft());
                    if (this.type === TYPE.TOP) otherPiece = map.at(this.position.below());
                    if (this.type === TYPE.BOTTOM) otherPiece = map.at(this.position.above());
                    if (otherPiece) {
                        otherPiece.type = TYPE.ORPHAN;
                    } else {
                        console.log("how could this be?");
                    }
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

        map.bugs = function() {
            return map.cells.filter(function(cell) {
                return cell.type === TYPE.BUG;
            });
        };

        map.entranceBlocked = function() {
            return map.at(1, 3) || map.at(1, 4);
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

        map.findStreaks = function() {
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
            return map.findStreaks().filter(function(streak) {
                return streak.cells().length >= n;
            }).reduce(function(prev, curr) {
                return prev.concat(curr.cells());
            }, []).filter(uniqueFilter);
        };

        // Moves all eligable pieces downward
        map.settle = function(items) {
            // By default, use all cells that are not bugs (and have a position)
            items = (items || map.cells).filter(function(cell) {
                return cell.type !== TYPE.BUG && cell.position && map.inBounds(cell.position);
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

        map.settleAndKill = function() {
            var kCells = game.map.killables(4);
            while(kCells.length > 0) {
                kCells.forEach(function(cell) {cell.destroy();});
                while(game.map.settle()) {}
                kCells = game.map.killables(4);
            }
        };

        var init = function() {
            while (map.cells.length < nBugs) {
                map.add(new Cell(randomBlankPosition(4)));
                map.killables(3).forEach(function(cell) {
                    cell.destroy();
                });
            }
        };

        var inita = function() {
            while (map.cells.length < 104) {
                map.add(new Cell(randomBlankPosition(4)));
            }
            map.cells.filter(function(cell){
                return [cell.position.row-1,cell.position.row,cell.position.row].indexOf(Math.floor(cell.position.col)) != -1;
                // return cell.position.col == 2 || cell.position.row == 7 || (cell.position.row >=6 && cell.position.col ==6);
                // return [2,6].indexOf(cell.position.col) != -1 || cell.position.row == 8;
            }).forEach(function(cell) {
                cell.destroy();
            });
        };

        // Generate board or use predefined cells
        if ((cells || []).length == 0) {
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

        var prom = game.events.emit("gameInitialized", this);
        prom.then(playerTurn, logError);
    };

    var gameOver = function() {
        game.state = STATE.GAME_OVER;
        game.events.emit("gameOver");
        console.log("game over after " + turnCount + " turns");
    };

    var playerTurn = function() {
        if (game.map.at(1, 3) || game.map.at(1, 4)) {
            gameOver();
        } else {
            turnCount++;
            game.piece = pieceQ.shift();
            // piece.position = new Position(1, 3);
            game.piece.addToMap();

            pieceQ.push(new PlayerPiece());
            game.events.emit("nowOnDeck", pieceQ[0].parts);

            game.state = STATE.PLAYER_CONTROL;
            game.events.emit("playerTurn")
            .then(playerTurnStep, logError);
        }
    };

    var playerTurnStep = function() {
        clearTimeout(turnTimer);
        turnTimer = setTimeout(function() {
            if (game.piece.move("moveDown")) {
                playerTurnStep();
            } else {
                physicsTurn();
            }
        }, gravityStep);
    };

    var physicsTurn = function() {
        game.state = STATE.PHYSICS_CONTROL;
        clearTimeout(turnTimer);
        physicsStep();
    };

    var physicsStep = function() {
        clearTimeout(turnTimer);
        if (game.map.bugs().length == 0) {
            return win();
        }

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
                    ).then(physicsStep);
                } else {
                    playerTurn();
                }
            }
        }, gravityStep);
    };

    var win = function() {
        game.state = STATE.GAME_WON;
        console.log("WIN after " + turnCount + " turns");
        game.events.emit("win");
    };

    var PlayerPiece = function(parts) {
        var self = this;

        var init = function() {
            self.parts = parts || [
                new Cell(null, TYPE.LEFT),
                new Cell(null, TYPE.RIGHT)
            ];
            sort();
        };

        this.toString = function() {
            // H or V
            var s = (isHorz() ? "H" : "V") + " ";

            // Color abbreviation
            s += "(" + this.parts.map(function(part) {
                return part.color.name.substring(0,3);
            }).join("-") + ")";

            // Position of parts
            s += " Pos: [" + this.parts.map(function(part) {
                return part.position && part.position.toString();
            }).join(",") + "]";

            return s;
        };

        this.isSettled = function() {
            var below = game.map.at(self.parts[0].position.below());
            var belowBlocked = below === undefined || below != null;
            if (isVert()) {
                return belowBlocked;
            } else {
                return belowBlocked || game.map.at(self.parts[1].position.below()) != null;
            }
            // return game.map.at(self.parts[0].position.below()) != null &&
            //     (isVert() || game.map.at(self.parts[1].position.below()) != null);
        };
        this.position = function() {
            return self.parts[0].position;
        };

        this.isDouble = function() {
            return self.parts[0].color === self.parts[1].color;
        };

        this.isRotatedLike = function(piece) {
            return self.parts[0].type === piece.parts[0].type &&
                self.parts[0].color === piece.parts[0].color;
        };

        var sort = function() {
            if (self.parts.length != 2) {
                console.log("piece corrupt");
            }
            if (self.parts[0].position == null || self.parts[1].position == null) {
                return;
            }
            // Ensure parts[0] is the most lower-right cells
            self.parts.sort(function(a,b) {
                return b.position.row - a.position.row ||
                a.position.col - b.position.col;
            });
            // Set cells types
            if (isHorz()) {
                self.parts[0].type = TYPE.LEFT;
                self.parts[1].type = TYPE.RIGHT;
            } else {
                self.parts[0].type = TYPE.BOTTOM;
                self.parts[1].type = TYPE.TOP;
            }
        };

        this.copy = function() {
            return new PlayerPiece(this.parts.map(function(part) {return part.copy();}));
        };

        var isHorz = function() {
            // return self.parts[0].type === TYPE.LEFT;
            return self.parts[0].position != null && self.parts[0].position != null &&
                   self.parts[0].position.row === self.parts[1].position.row;
        };

        var isVert = function() {
            return !isHorz();
        };

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

        this.warpTo = function(position, test, force) {
            var otherPos = isHorz() ? position.toRight() : position.above();
            if (force || (this.parts[0].moveTo(position, true) && this.parts[1].moveTo(otherPos, true))) {
                if (test) return true;
                this.parts[0].moveTo(position, false, force);
                this.parts[1].moveTo(otherPos, false, force);
                return true;
            }
            return false;
        };

        this.equals = function(piece) {
            return (this.parts[0].color === piece.parts[0].color || this.parts[0].color === piece.parts[1].color)
                && (this.parts[1].color === piece.parts[0].color || this.parts[1].color === piece.parts[1].color)
                && this.parts.length == piece.parts.length;
        };

        this.rotate = function(cc, n, force) {
            n = n || 1;
            force = force === true;
            while(n--) {
                var wasHorz = isHorz();
                // Horizontal -> Vertical rotation
                if (wasHorz) {
                    // Default unobstructed
                    if (!this.parts[1].moveTo(this.parts[0].position.above(), false, force)) {
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
                } else if (!this.parts[1].moveTo(this.parts[0].position.toRight(), false, force)) {
                    // Try shifting left
                    if (this.parts[0].moveLeft()) {
                        this.parts[1].moveDown();
                    } else return false;
                }
                // Achieve counter-clockwise rotation by
                // swapping positions
                if ((wasHorz && !cc) || (!wasHorz && cc)) {
                    var tmp = this.parts[0].position;
                    this.parts[0].moveTo(this.parts[1].position, false, true);
                    this.parts[1].moveTo(tmp, false, true);
                }
                sort();
            }
            return true;
        };
        init();
    };
    
    game.nextPiece = function() {
        return pieceQ[0];
    };

    game.piece = config.pieceParts == null ? null : new PlayerPiece(config.pieceParts);
    pieceQ = config.pieceQParts == null ? [] : [new PlayerPiece(config.pieceQParts )];

    var ifPlayerTurn = function(func) {return function() {return game.state == STATE.PLAYER_CONTROL && func.apply(this, arguments);}};
    this.playerControls = {
        left:  ifPlayerTurn(function() {return game.piece.move("moveLeft");}),
        right: ifPlayerTurn(function() {return game.piece.move("moveRight");}),
        down:  ifPlayerTurn(function() {
            if (game.piece.move("moveDown")) {
                playerTurnStep();
            } else {
                physicsTurn();
            }
        }),
        warp: ifPlayerTurn(function(pos) {return game.piece.warpTo(pos);}),
        rotate: ifPlayerTurn(function(cc) {return game.piece.rotate(cc);})
    };
    game.map = new Map(config.cells);
};