var CpuPlayer = function(sourceGame) {
    var self = this;
    self.events = new EventSystem("CpuPlayer", true);
    self.optionBrowsing = false;
    var sourceGame = sourceGame;
    var game = null;
    var currentResolve = null;

    var currentOptions = [];
    var it = -1

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
        movePieceToMimic(nextOption(n || 1));
    };

    var movePieceToMimic = function(piece) {
        if (!game.piece.equals(piece)) {
            alert("Option piece != gamePiece");
        }
        game.piece.warpTo(game.startPosition);
        while(!game.piece.isRotatedLike(piece)) {
            game.piece.rotate(false, 1, true);
        }
        game.piece.warpTo(piece.position());
    };

    var copySourceGame = function() {
        game = sourceGame.copy();
        // game.state = "Player's Turn";
    };

    var findOptions = function(game) {
        it = 0;
        var options = [];
        for (var row = 0; row < game.rows; row++) {
            for (var col = 0; col < game.cols; col++) {
                var pos = new Position(row, col);
                if (game.piece.warpTo(pos) && game.piece.isSettled()) {
                    options.push(game.piece.copy());
                    if (!game.piece.isDouble()) {
                        game.piece.warpTo(game.startPosition);
                        game.piece.rotate(false, 2, true);
                        game.piece.warpTo(pos);
                        options.push(game.piece.copy());
                    }
                }
                game.piece.warpTo(game.startPosition);
                game.piece.rotate(false, 1, true);
                if (game.piece.warpTo(pos) && game.piece.isSettled()) {
                    options.push(game.piece.copy());
                    if (!game.piece.isDouble()) {
                        game.piece.warpTo(game.startPosition);
                        game.piece.rotate(false, 2, true);
                        game.piece.warpTo(pos);
                        options.push(game.piece.copy());
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
        var deeper = true;
        options.forEach(function(option) {
            console.log("started option");
            // Simulate the placement
            movePieceToMimic(option);
            game.map.settleAndKill();

            option.score = -1 * game.map.findStreaks().length;
            if (game.map.entranceBlocked()) {
                option.score = Number.NEGATIVE_INFINITY;
            }
            if (deeper) {
                // Find options for next piece
                game.piece = game.nextPiece();
                game.piece.addToMap();
                var beforeNextMove = game.copy();
                option.options = findOptions(game);
                console.log("found options");

                option.options.forEach(function(nextOption) {
                    movePieceToMimic(nextOption);
                    game.map.settleAndKill();
                    console.log("inner settle");
                    nextOption.score = -1 * game.map.findStreaks().length;
                    game = beforeNextMove.copy()
                });
                console.log("finished inner option");

                option.options.sort(function(a, b) {
                    return b.score - a.score;});

                option.score = option.options[0].score;
                delete option.options;
            }
            copySourceGame();
        });
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

            // movePieceToMimic(currentOptions[0]);
            sourceGame.piece.warpTo(sourceGame.startPosition);
            while(!sourceGame.piece.isRotatedLike(options[0])) {
                sourceGame.piece.rotate(false, 1, true);
            }
            sourceGame.piece.warpTo(options[0].position());
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