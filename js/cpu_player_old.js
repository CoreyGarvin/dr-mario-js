var CpuPlayer = function(sourceGame) {
    var self = this;
    self.events = new EventSystem("CpuPlayer", true);
    self.optionBrowsing = false;
    var sourceGame = sourceGame;
    var game = null;
    var currentResolve = null;

    var currentOptions = [];
    var it = -1;

    self.doneViewingOptions = function() {
        if (currentResolve) currentResolve();
    };

    var nextOption = function(n) {
        if (currentOptions.length == 0) return null;
        it = (it + (n || 1) + currentOptions.length) % currentOptions.length;
        var option = currentOptions[it];
        log("Option " + (it + 1) + "/" + currentOptions.length + " ");
        log(option);
        return option;
    };

    self.showNextOption = function(n) {
        movePillToMimic(nextOption(n || 1));
    };

    var movePillToMimic = function(pill) {
        if (!game.pill.equals(pill)) {
            console.log("Game pill: " + game.pill.toString());
            console.log("Optn pill: " + pill.toString());
            // alert("Option pill != gamePill");
        }
        var temp = new Position(-10, -10);
        var success = game.pill.warpTo(temp, false, true);
        if (!success) {
            alert("couldnt warp to start position");
        } else {
            var n = 4;
            while(!game.pill.isRotatedLike(pill) && n--) {
                if (!game.pill.rotate(false, 1)) {
                    console.log(game.pill.toString());
                    alert("couldnt rotate game pill");
                }
            }
            game.pill.warpTo(pill.position());
        }
    };


    var copySourceGame = function() {
        game = sourceGame.copy();
        // game.state = "Player's Turn";
    };

    var findOptions = function(game) {
        it = 0;
        var options = [];
        var temp = new Position(-10, -10);
        var game = game.copy();
        for (var row = 1; row < game.rows; row++) {
            for (var col = 0; col < game.cols; col++) {
                var pos = new Position(row, col);
                if (game.pill.warpTo(pos) && game.pill.isSettled()) {
                    options.push(game.pill.copy());
                    if (!game.pill.isDouble()) {
                        if (!game.pill.warpTo(temp, false, true)) {
                            console.log("could not warp to temp");
                            alert("fail");
                            return;
                        }
                        if (!game.pill.rotate(false, 2)) {
                            console.error("could not rotate");
                            return
                        }
                        if (!game.pill.warpTo(pos)) {
                            console.log("could not warp to pos after rotatingn twice");
                            alert("fail");
                            return;
                        }
                        options.push(game.pill.copy());
                    }
                }
                if (!game.pill.warpTo(temp, false, true)) {
                    console.error("could not warp");
                }
                if (!game.pill.rotate(false, 1)) {
                    console.error("could not rotate");
                }
                if (game.pill.warpTo(pos) && game.pill.isSettled()) {
                    options.push(game.pill.copy());
                    if (!game.pill.isDouble()) {
                        game.pill.warpTo(temp, false, true);
                        if (!game.pill.rotate(false, 2)) {
                            console.error("could not rotate");
                        }
                        game.pill.warpTo(pos);
                        options.push(game.pill.copy());
                    }
                }
            }
        }
        return options;
        // log("found " + currentOptions.length  + " combinations");
        // setTimeout(function() {
        //     console.log("resolving");
        //     resolve();
        // }, 3000);
    };

    var scoreOptions = function(options) {
        var scoreGame = function(game) {
            return -1 * game.map.findStreaks().length;
        };
        var deeper = true;
        var optionCount = options.length;
        var t0 = performance.now();

        options.forEach(function(option) {
            console.log("started option");
            // Simulate the placement
            movePillToMimic(option);
            game.map.settleAndKill();

            option.score = scoreGame(game);
            if (game.map.entranceBlocked()) {
                option.score = Number.NEGATIVE_INFINITY;
            }
            if (deeper) {
                // Find options for next pill
                game.pill = game.nextPill();
                game.pill.addToMap();
                var beforeNextMove = game.copy();

                option.options = findOptions(game);
                optionCount += option.options.length;
                // console.log("found options");

                option.options.forEach(function(nextOption) {
                    movePillToMimic(nextOption);
                    game.map.settleAndKill();
                    // console.log("inner settle");
                    nextOption.score = scoreGame(game);
                    game = beforeNextMove.copy();
                });
                // console.log("finished inner option");

                option.options.sort(function(a, b) {
                    return b.score - a.score;});

                // Score the original option as it's highest next-option
                option.score = option.options[0].score;
                // delete option.options;
            }

            // Restore game for another option change
            copySourceGame();
        });
        
        var t1 = performance.now();
        // console.log("Call to doSomething took " + (t1 - t0) + " milliseconds.")
        console.log("Tested " + optionCount + " options in " + (t1 - t0) + "ms (" + optionCount/((t1-t0) / 1000) + "/s");
        // options.sort(function(a, b) {
        //     return b.score - a.score});
    };

    // var game = null;
    // var game = null;
    sourceGame.events.register(function() {
        var gameInitialized = function(newGame) {
            sourceGame = newGame;
            // game = sourceGame.copy();
            // self.events.emit("gameStateRefresh", game);
        };
        var playerTurn = function() {
            // currentOptions = [];
            copySourceGame();
            // self.events.emit("gameStateRefresh", game);
            var options = findOptions(game);
            scoreOptions(options);
            // self.events.emit("gameStateRefresh", game);
            // Sort by row, so that lowest items are processed first
            options.sort(function(a, b) {
                return b.score - a.score});

            currentOptions = options;
            console.log(options);

            // movePillToMimic(currentOptions[0]);
            // sourcegame.pill.warpTo(sourceGame.startPosition);
            while(!sourcegame.pill.isRotatedLike(options[0])) {
                sourcegame.pill.rotate(false, 1, true);
            }
            sourcegame.pill.warpTo(options[0].position());
            if (!self.optionBrowsing) return Promise.resolve();

            self.events.emit("gameStateRefresh", game);
            return new Promise(function(resolve, reject) {
                currentResolve = resolve;
            });
        };

        var cellCreated = function(cell) {

        };

        // var nowOnDeck = function(cells) {

        // };

        // var cellDestroyed = function(cell) {

        // };

        var onWin = function() {
            console.log("CPU PLAYER: YAY!! IM SMART!!");
        };

        var gameOver = function() {
            console.log("CPU PLAYER: Damnit I lost!!");
        };

        return new Component("CPU Player",
            {
                gameInitialized: gameInitialized,
                // cellCreated: cellCreated,
                // cellDestroyed: cellDestroyed,
                // nowOnDeck: nowOnDeck,
                playerTurn: playerTurn,
                gameOver: gameOver,
                win: onWin,
            }
        );
    }());
};