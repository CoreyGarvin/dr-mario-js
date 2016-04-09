var cellsCreated = 0;
var logError = function(err) {
    console.err(err);
};

var DrMarioGame = function(config) {
    var config = config || {};
    config = {
        name: config.name || "Game " + ++DrMarioGame.instances,
        rows: config.rows || 17,
        cols: config.cols || 8,
        bugs: config.bugs || 3,
        stepTime: config.step || 600,
        map: config.map || null
    };

    // Timer for gravity steps
    this.timer = null;
    this.stepTime = config.stepTime;
    // Simple event system
    this.events = new EventSystem("Game (" + config.name + ")");
    this.startPositions = [Position(1, 3), Position(1, 4)];
    this.pill = null;
    this.pillQ = config.pillQ || [];
    this.state = config.state || 0;
    this.turnCount = 0;

    this.map = config.map || new Map(config.rows, config.cols, config.bugs);
};

DrMarioGame.STATE = {
    PLAYER_CONTROL:  "Player's Turn",
    PHYSICS_CONTROL: "Physic's Turn",
    GAME_OVER: "Game Over",
    GAME_WON: "Game won"
};

DrMarioGame.prototype.copy = function() {
    // Deep copy all cells, identify pill cells
    var newMap = this.map.deepCopy(),
        newPill = null;
    if (this.pill) {
        newPill = new Pill(newMap.ats(this.pill.positions()));
    }
    // var cells = this.map.cells.map(function(cell) {
    //     var copy = cell.copy();
    //     if (cell === this.pill.cells[0] || cell === this.pill.cells[1]) {
    //         pillCells.push(copy);
    //     }
    //     return copy;
    // });
    if (newPill.cells.length != 2) {
        alert("bad piece on game copy");
        pillCells = null;
    }

    return new DrMarioGame({
        name: this.name + " Copy",
        state: this.state,
        rows: this.rows,
        cols: this.cols,
        nBugs: nBugs,
        pill: newPill,
        pillQ: pillQ.map(function(pill) {return pill.copy();}),
        map: newMap
    });
};

DrMarioGame.prototype.start = function() {
    var game = this;
    var playerTurn = function() {
        if (game.map.empties(game.startPositions)) {
            game.turnCount++;
            game.pill = game.pillQ.shift();
            if (!game.map.adds(game.pill.cells, game.startPositions)) {
                console.error("playerTurn: couldnt add pill to map");
                return;
            }

            game.pillQ.push(new Pill());
            game.events.emit("nowOnDeck", game.pillQ[0].cells);

            game.state = DrMarioGame.STATE.PLAYER_CONTROL;
            game.events.emit("playerTurn")
            .then(playerTurnStep, logError);
        } else {
            gameOver();
        }
    };

    var playerTurnStep = function() {
        clearTimeout(game.timer);
        game.map.print();
        game.timer = setTimeout(function() {
            if (game.map.offsetTogether(game.pill.positions(), Position(1, 0))) {
                playerTurnStep();
            } else {
                physicsTurn();
            }
        }, game.stepTime);
    };

    var physicsTurn = function() {
        game.state = DrMarioGame.STATE.PHYSICS_CONTROL;
        clearTimeout(game.timer);
        physicsStep();
    };

    var physicsStep = function() {
        game.map.print();
        clearTimeout(game.timer);
        if (!game.map.bugCount) {
            return win();
        }

        game.timer = setTimeout(function() {
            // Settle while possible
            if (game.map.settle()) {
                physicsStep();
            // Then kill blocks, repeat
            } else {
                var posArr = game.map.killables(4);
                // Kill cells, should resolve immediately if none
                if (posArr.length) {
                    destroyCells(posArr).then(physicsStep);
                } else {
                    playerTurn();
                }
            }
        }, game.stepTime);
    };

    var destroyCells = function(posArr) {
        var cells = game.map.ats(posArr);
        return Promise.all(
            cells.map(function(cell) {
                return game.events.emit("cellDestroyed", cell);
            })
        ).then(function() {
            cells.forEach(function(cell) {
                if (cell.type.opposite) {
                     var op = game.map.at(cell.position.offset(cell.type.opposite));
                     op.type = Cell.TYPE.ORPHAN;
                }
            });
            game.map.removes(posArr);
        });
    };

    var win = function() {
        game.state = DrMarioGame.STATE.GAME_WON;
        console.log("WIN after " + turnCount + " turns");
        game.events.emit("win");
    };

    var gameOver = function() {
        game.state = DrMarioGame.STATE.GAME_OVER;
        game.events.emit("gameOver");
        console.log("game over after " + game.turnCount + " turns");
    };

    game.events.enabled = true;
    game.pillQ = [new Pill()];

    var prom = game.events.emit("gameInitialized", game);
    prom.then(playerTurn, logError);
};

DrMarioGame.offsets = {
    up:     Position(-1, 0),
    down:   Position( 1, 0),
    left:   Position( 0,-1),
    right:  Position( 0, 1),
};

DrMarioGame.prototype.movePill = function(key) {
    return this.map.offsetTogether( this.pill.positions(), DrMarioGame.offsets[key] );
};

DrMarioGame.prototype.rotatePill = function() {
    
};

DrMarioGame.prototype.playerMove = function(key) {
    var success = this.state === DrMarioGame.STATE.PLAYER_CONTROL && this.movePill(key);
    if (success) {
        this.map.print();
    }
    return success;
};





//     this.nextPiece = function() {
//         return pillQ[0];
//     };

//     this.pill = config.pillCells == null ? null : new Pill(config.pillCells);
//     pillQ = config.pillQParts == null ? [] : [new Pill(config.pillQParts )];

//     var ifPlayerTurn = function(func) {return function() {return this.state == STATE.PLAYER_CONTROL && func.apply(this, arguments);}};
//     this.playerControls = {
//         left:  ifPlayerTurn(function() {return this.pill.move("moveLeft");}),
//         right: ifPlayerTurn(function() {return this.pill.move("moveRight");}),
//         down:  ifPlayerTurn(function() {
//             if (this.pill.move("moveDown")) {
//                 playerTurnStep();
//             } else {
//                 physicsTurn();
//             }
//         }),
//         warp: ifPlayerTurn(function(pos) {return this.pill.warpTo(pos);}),
//         rotate: ifPlayerTurn(function(cc) {return this.pill.rotate(cc);})
//     };
    


//     console.log(this.map.toString());

//     // Benchmark
//     if (false) {
//         console.log(map.verticalStreaks(null, [Position(14, 3)]));

//         var a = performance.now();
//         for(var i = 0; i < 100000; i++) {map.killables();}
//         var b = performance.now();
//         console.log('It took ' + (b - a)/1000 + ' s.');


//         console.log(map.horizontalStreaks());

//         var success = map.offsetTogether([Position(4,4), Position(4,5), Position(5,4)], Position(-2, 0));

//         console.log(map.verticalStreaks(1, [new Position(13, 7), new Position(14, 7), new Position(16, 7)]));
//         console.log(map.verticalStreaks());

//         console.log(map.horizontalStreaks(1, [new Position(13, 7), new Position(14, 7), new Position(16, 7)]));

//         var collect = {};
//         console.log(map.horizontalStreaks(1, null, collect));
//     }
// };

// DrMarioGame.instances = 0;