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
        bugs: config.bugs || 60,
        pillQ: config.pillQ || [],
        pill: config.pill || null,
        state: config.state || 0,
        stepTime: config.step || 800,
        map: config.map || null
    };
    this.name = config.name;
    // Timer for gravity steps
    this.timer = null;
    this.stepTime = config.stepTime;
    this.id = ++DrMarioGame.instances;
    // Simple event system
    this.events = new EventSystem("Game (" + config.name + ")");
    this.startPositions = [Position(1, 3), Position(1, 4)];
    this.pill = config.pill || null;
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
        pill: newPill,
        pillQ: this.pillQ.map(function(pill) {return pill.copy();}),
        map: newMap
    });
};

DrMarioGame.prototype.enterNextPill = function() {
    this.pill = this.pillQ.shift();
    return this.map.adds(this.pill.cells, this.startPositions);
    // if (!this.map.adds(this.pill.cells, this.startPositions)) {
    //     console.error("playerTurn: couldnt add pill to map");
    //     alert("playerTurn: couldnt add pill to map");
    //     return false;
    // }
    // return true;
};

DrMarioGame.prototype.start = function() {
    var game = this;
    game.initialBugs = game.map.bugCount;
    var playerTurn = function() {

        if (game.enterNextPill()) {
            game.turnCount++;
            game.pillQ.push(new Pill());
            game.events.emit("nowOnDeck", game.pillQ[0].cells);
            game.state = DrMarioGame.STATE.PLAYER_CONTROL;
            game.print();


            var cpuPlayer = new CpuPlayer(game);
            cpuPlayer.playerTurn();
            playerTurnStep();

            // game.events.emit("playerTurn")
            // .then(playerTurnStep, logError);
        } else {
            gameOver();
        }
    };

    var playerTurnStep = function() {
        // game.map.sanityCheck("start Player turn step");
        clearTimeout(game.timer);
        game.print();
        game.timer = setTimeout(function() {
            if (game.map.offsetTogether(game.pill.positions(), Position(1, 0))) {
                playerTurnStep();
            } else {
                game.endPlayerTurn();
            }
        }, game.stepTime);
    };

    this.endPlayerTurn = function() {
        clearTimeout(game.timer);
        log("end player turn");
        physicsTurn();
    };

    this.resetPlayerTimer = function() {
        if (this.state !== DrMarioGame.STATE.PLAYER_CONTROL) {
            return false;
        }
        playerTurnStep();
    };

    var physicsTurn = function() {
        game.state = DrMarioGame.STATE.PHYSICS_CONTROL;
        clearTimeout(game.timer);
        physicsStep();
    };

    // var physicsStep = function() {
    //     game.map.print();
    //     clearTimeout(game.timer);
    //     if (!game.map.bugCount) {
    //         return win();
    //     }

    //     game.timer = setTimeout(function() {
    //         // Settle while possible
    //         if (game.map.settle()) {
    //             physicsStep();
    //         // Then kill blocks, repeat
    //         } else {
    //             var posArr = game.map.killables(null, 4);
    //             // Kill cells, should resolve immediately if none
    //             if (posArr.length) {
    //                 destroyCells(posArr).then(physicsStep);
    //             } else {
    //                 playerTurn();
    //             }
    //         }
    //     }, game.stepTime);
    // };

    var physicsStep = function() {
        game.print();
        clearTimeout(game.timer);
        if (!game.map.bugCount) {
            return win();
        }

        game.timer = setTimeout(function() {
            // Settle while possible
            if (game.map.settle()) {
                // game.map.sanityCheck("after settle");
                physicsStep();
            // Then kill blocks, repeat
            } else {
                // game.map.sanityCheck("after settle");
                var posArr = game.map.killables(null, 4);
                // Kill cells, should resolve immediately if none
                if (posArr.length) {
                    destroyCells(posArr)
                    physicsStep();
                } else {
                    playerTurn();
                }
            }
        }, game.stepTime);
    };

    // var destroyCells = function(posArr) {
    //     var cells = game.map.ats(posArr);
    //     return Promise.all(
    //         cells.map(function(cell) {
    //             return game.events.emit("cellDestroyed", cell);
    //         })
    //     ).then(function() {
    //         game.map.destroy(posArr);
    //     });
    // };

    var destroyCells = function(posArr) {
        game.map.destroy(posArr);
    };

    var win = function() {
        game.state = DrMarioGame.STATE.GAME_WON;
        console.log("WIN after " + game.turnCount + " turns");
        game.events.emit("win");

        // inifite Testing
        var newGame = new DrMarioGame();
        // var cpuPlayer = new CpuPlayer(newGame);
        console.clear();
        newGame.start();
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
    rotateH: [
        // A pill rotation behaves depending on its surroundings
        // If offset fails, try next one
        [Position( 0, 0), Position(-1,-1)],  // Right becomes above
        [Position( 0, 1), Position(-1, 0)],  // Above-right
        [Position( 1, 0), Position( 0,-1)],  // Below
        [Position( 1, 1), Position( 0, 0)],  // Below-right
    ],
    rotateV: [
        [Position(0, 0), Position( 1, 1)],  // Top falls right
        [Position(0,-1), Position( 1, 0)],  // Shift left
    ]
};

// Test if pill can move down
DrMarioGame.prototype.isPillSettled = function() {
    return !this.map.offsetTogether(this.pill.positions(), DrMarioGame.offsets.down, true);
};

// Attempt move pill to a position, disregarding any pathfinding
DrMarioGame.prototype.warpPill = function(pos) {
    return this.map.moveContextually(this.pill.cells[0].position, pos);
};

// Attempt move pill to a position, disregarding any pathfinding
DrMarioGame.prototype.warpPillHome = function() {
    return this.warpPill(this.startPositions[0]);
};

// Moves the game's current pill
DrMarioGame.prototype.movePill = function(key) {
    return this.map.offsetTogether( this.pill.positions(), DrMarioGame.offsets[key] );
};

// Swaps positions of the pill halves on the map, without
// dealing with the constraints of rotation.
DrMarioGame.prototype.reversePill = function() {
    this.map.moveTogether(
        this.pill.positions(),
        this.pill.positions().reverse()
    );
    this.pill.sort();
};

// Rotates the game's current pill, counter-clockwise if ccw == "ccw"
DrMarioGame.prototype.rotatePill = function(ccw) {
    ccw = ccw === true || ccw == "ccw";
    var wasHorz = this.pill.isHorz();

    var offsets = DrMarioGame.offsets[wasHorz ? "rotateH" : "rotateV"];
    // Attempt the rotation
    for (var i = 0; i < offsets.length; i++) {
        if (this.map.offsetEach(this.pill.positions(), offsets[i])) {
            // Achieve counter-clockwise rotation by swapping positions
            if ((wasHorz && !ccw) || (!wasHorz && ccw)) {
                this.reversePill();
            }
            this.pill.sort();
            return true;
        }
    }
    return false;
};

// Accepts a 2 word command such as 'move right' or 'rotate ccw'
DrMarioGame.prototype.playerInput = function(cmd) {
    // It's not your turn!
    if (this.state !== DrMarioGame.STATE.PLAYER_CONTROL) {return false;}

    // Record the cell's row
    var row = this.pill.cells[0].position.row;

    // Perform the action
    var parts = cmd.split(" ");
    if (!this[parts[0] + "Pill"](parts[1])) {
        if (cmd == "move down") {
            this.endPlayerTurn();
        }
        return false;
    }

    // for debug
    this.print();

    // Pill has moved down, reset steptimer
    if (this.pill.cells[0].position.row > row) {
        this.resetPlayerTimer();
    }
    return true;
};

// DrMarioGame.prototype.playerMove = function(key) {
//     var success = this.state === DrMarioGame.STATE.PLAYER_CONTROL && this.movePill(key);
//     if (success) {
//         this.map.print();
//     }
//     return success;
// };

// DrMarioGame.prototype.playerRotate = function(key) {
//     var success = this.state === DrMarioGame.STATE.PLAYER_CONTROL && this.rotatePill(key);
//     if (success) {
//         this.map.print();
//         // console.log("success");
//     }
//     return success;
// };





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

DrMarioGame.prototype.print = function() {
    // console.log("----------------------------------------------------------");
    // this.pill.print();
    // if (this.pillQ[0]) {
    //     this.pillQ[0].print();
    // }
    this.map.print([
        {name: "Turn:    ", text: this.turnCount},
        {name: "Kills:   ", text: this.initialBugs - this.map.bugCount},
        {name: "Pill/Kill", text: (this.turnCount / (this.initialBugs - this.map.bugCount)).toFixed(2)},
    ]);
    // console.log("Turn:\t" + this.turnCount);
    // console.log("----------------------------------------------------------");

};

DrMarioGame.instances = 0;