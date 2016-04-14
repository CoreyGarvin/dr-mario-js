var CpuPlayer = function(sourceGame) {
    var self = this;
    self.events = new EventSystem("CpuPlayer", true);
    self.optionBrowsing = false;
    var sourceGame = sourceGame;
    // var game = null;
    var currentResolve = null;

    var currentOptions = [];

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

    // var movePillToMimic = function(pill) {
    //     if (!game.pill.equals(pill)) {
    //         console.log("Game pill: " + game.pill.toString());
    //         console.log("Optn pill: " + pil.toString());
    //         // alert("Option pill != gamePill");
    //     }
    //     var temp = new Position(-10, -10);
    //     var success = game.pill.warpTo(temp, false, true);
    //     if (!success) {
    //         alert("couldnt warp to start position");
    //     } else {
    //         var n = 4;
    //         while(!game.pill.isRotatedLike(pill) && n--) {
    //             if (!game.pill.rotate(false, 1)) {
    //                 console.log(game.pill.toString());
    //                 alert("couldnt rotate game pill");
    //             }
    //         }
    //         game.pill.warpTo(pill.position());
    //     }
    // };
    
    // Mutates the game, returns score
    var scoreGame = function(game) {
        if (game.map.entranceBlocked()) {
            return Number.NEGATIVE_INFINITY;
        }
        // return game.map.bugCount * -2;
        game = game.copy();
        // game.map.settleAndDestroy();
        game.map.settleAndDestroy(game.pill.positions());
        return (game.map.verticalStreaks().length * -2) +
               (game.map.horizontalStreaks().length * -1) +
               (game.map.bugCount * -2);
    };


    var copySourceGame = function() {
        game = sourceGame.copy();
        // game.state = "Player's Turn";
    };

    var findOptions = function(srcGame, depth) {
        // Recursion depth
        depth = depth || 1;

        // Copy incoming game to avoid mutating it
        srcGame = srcGame.copy();

        // If this is a follow-up move, do physics
        // and bring in the next pill
        if (depth > 1) {
            // srcGame.map.settleAndDestroy();
            srcGame.map.settleAndDestroy(srcGame.pill.positions());

            if (!srcGame.enterNextPill()) {
                // console.log("could not bring in next pill");
                return [];
            }
        }
        // Our working copy
        var game = srcGame.copy();
        var options = [];

        var nRots = game.pill.isDouble() ? 2 : 4;

        // Test every position on the board...
        for (var i = 8; i < game.map.positions.length; i++) {
            var pos = game.map.positions[i];

            // Test every rotation
            for(var rotation = 0; rotation < nRots; rotation++) {
                if (rotation && (!game.warpPillHome() || !game.rotatePill(true))) {
                    console.log("Could not rotate pill");
                    alert("this really f'ing sucks");
                }

                // Warp to position
                if (game.warpPill(pos) && game.isPillSettled()) {
                    var option = game.pill.copy();
                    // Go deeper if possible
                    if (depth == 1) {
                        // Find all suboptions
                        option.options = findOptions(game, depth + 1);

                        // An option's score is the best score of
                        // it's sub-options
                        if (option.options.length) {
                            option.options.sort(function(a, b) {
                                return b.score - a.score;
                            });
                            option.score = option.options[0].score;
                        } else {
                            option.score = scoreGame(game);
                        }
                        // for benchmarking
                        option.length = option.options.length;
                    } else {
                        // game.map.print();
                        option.score = scoreGame(game);
                    }
                    options.push(option);
                    // game.map.print();
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

    self.playerTurn = function() {
        // currentOptions = [];
        // copySourceGame();
        // self.events.emit("gameStateRefresh", game);
        var a = performance.now();
        var options = findOptions(sourceGame);
        options.sort(function(a, b) {
            return b.score - a.score;
        });
        var b = performance.now();

        var nOptions = options.reduce(function(a, b) {
          return a + b.options.length;
        }, 0);
        var ms = b - a;
        console.log("Depth 1 options: " + options.length);
        console.log(nOptions + " in " + Math.floor(ms) + "ms = " + Math.floor(nOptions/(ms/1000)) + "/s");

        if (options[0]) {
            while(!sourceGame.pill.isRotatedLike(options[0])) {
                sourceGame.rotatePill(true);
            }
            sourceGame.warpPill(options[0].cells[0].position);
        }
    };

    sourceGame.events.register(function() {
        var gameInitialized = function(game) {
            sourceGame = game;
            // game = sourceGame.copy();
            // self.events.emit("gameStateRefresh", game);
        };
        var playerTurn = function() {
            // currentOptions = [];
            // copySourceGame();
            // self.events.emit("gameStateRefresh", game);
            var a = performance.now();
            var options = findOptions(sourceGame);
            options.sort(function(a, b) {
                return b.score - a.score;
            });
            var b = performance.now();

            var nOptions = options.reduce(function(a, b) {
              return a + b.options.length;
            }, 0);
            var ms = b - a;
            console.log("Depth 1 options: " + options.length);
            console.log(nOptions + " in " + Math.floor(ms) + "ms = " + Math.floor(nOptions/(ms/1000)) + "/s");

            if (options[0]) {
                while(!sourceGame.pill.isRotatedLike(options[0])) {
                    sourceGame.rotatePill(true);
                }
                sourceGame.warpPill(options[0].cells[0].position);
            }
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
                // gameInitialized: gameInitialized,
                // cellCreated: cellCreated,
                // cellDestroyed: cellDestroyed,
                // nowOnDeck: nowOnDeck,
                // playerTurn: playerTurn,
                // gameOver: gameOver,
                // win: onWin,
            }
        );
    }());
};