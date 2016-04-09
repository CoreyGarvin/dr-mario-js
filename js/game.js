var cellsCreated = 0;
var logError = function(err) {
    console.err(err);
};

var DrMarioGame = function(config) {
    var game = this;
    var config = config || {};
    config = {
        name: config.name || "Game " + DrMarioGame.instances,
        rows: config.rows || 17,
        cols: config.cols || 8,
        bugs: config.bugs || 104,
        step: config.step || 600,
        map: config.map || null
    };

    // Timer for gravity steps
    var stepTimer = null;
    // Game board
    game.map = config.map;
    game.startPositions = [Position(1, 3), Position(1, 4)];

    var pillQ = config.pillQ || [];
    game.state = config.state || 0;
    var turnCount = 0;

    game.copy = function() {
        var pieceParts = [];
        var cells = game.map.cells.map(function(cell) {
            var copy = cell.copy();
            if (cell === game.piece.cells[0] || cell === game.piece.cells[1]) {
                pieceParts.push(copy);
            }
            return copy;
        });
        if (pieceParts.length != 2) {
            alert("bad piece on game copy");
            pieceParts = null;
        }

        return new DrMarioGame({
            name: this.name + " Copy",
            state: game.state,
            rows: game.rows,
            cols: game.cols,
            nBugs: nBugs,
            pieceParts: pieceParts,
            pillQParts: pillQ[0].cells.map(function(part) {return part.copy();}),
            map: game.map.copy(),
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
        pillQ = [new Pill()];

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
            game.piece = pillQ.shift();
            if (!this.map.adds)
            // piece.position = new Position(1, 3);
            game.piece.addToMap();

            pillQ.push(new Pill());
            game.events.emit("nowOnDeck", pillQ[0].cells);

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


    
    game.nextPiece = function() {
        return pillQ[0];
    };

    game.piece = config.pieceParts == null ? null : new Pill(config.pieceParts);
    pillQ = config.pillQParts == null ? [] : [new Pill(config.pillQParts )];

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
    game.map = new Map(config.rows, config.cols, config.bugs);


    console.log(game.map.toString());

    // Benchmark
    if (false) {
        console.log(map.verticalStreaks(null, [Position(14, 3)]));

        var a = performance.now();
        for(var i = 0; i < 100000; i++) {map.killables();}
        var b = performance.now();
        console.log('It took ' + (b - a)/1000 + ' s.');


        console.log(map.horizontalStreaks());

        var success = map.offsetTogether([Position(4,4), Position(4,5), Position(5,4)], Position(-2, 0));

        console.log(map.verticalStreaks(1, [new Position(13, 7), new Position(14, 7), new Position(16, 7)]));
        console.log(map.verticalStreaks());

        console.log(map.horizontalStreaks(1, [new Position(13, 7), new Position(14, 7), new Position(16, 7)]));

        var collect = {};
        console.log(map.horizontalStreaks(1, null, collect));
    }
};

DrMarioGame.instances = 0;