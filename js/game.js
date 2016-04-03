var cellsCreated = 0;
var logError = function(err) {
    console.err(err);
};

var DrMarioGame = function(config) {
    var game = this;
    var config = config || {};
    config = {
        name: config.name || "Unnamed Game",
        rows: config.rows || 17,
        cols: config.cols || 8,
        bugs: config.bugs || 104,
        step: config.step || 600,
    };

    // Timer for gravity steps
    var stepTimer = null;

    game.map = null;
    game.startPosition = new Position(1, 3);

    var pieceQ = config.pieceQ || [];
    game.state = config.state || 0;
    
    // var gravityStep = config.gravityStep || 600;
    // game.rows = config.rows || 17;
    // game.cols = config.cols || 8;
    // var nBugs = config.nBugs || 104;
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
        clearTimeout(stepTimer);
        stepTimer = setTimeout(function() {
            if (game.piece.move("moveDown")) {
                playerTurnStep();
            } else {
                physicsTurn();
            }
        }, gravityStep);
    };

    var physicsTurn = function() {
        game.state = STATE.PHYSICS_CONTROL;
        clearTimeout(stepTimer);
        physicsStep();
    };

    var physicsStep = function() {
        clearTimeout(stepTimer);
        if (game.map.bugs().length == 0) {
            return win();
        }

        stepTimer = setTimeout(function() {
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
    var map = new Map(config.rows, config.cols, config.bugs);
    console.log(map.toString());

    map.verticalStreaks(1, [new Position(13, 7), new Position(14, 7), new Position(16, 7)]);
};