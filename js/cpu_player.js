var CpuPlayer = function(sourceGame) {
    var self = this;
    self.events = new EventSystem("CpuPlayer", true);
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
        log("Option " + (it) + "/" + currentOptions.length + " ");
        log(option);
        return option;
    };

    self.showNextOption = function(n) {
        var option = nextOption(n || 1);
        game.piece.warpTo(game.startPosition);
        while(!game.piece.isRotatedLike(option)) {
            game.piece.rotate(false, 1, true);
        }
        game.piece.warpTo(option.position());

    };

    var findOptions = function() {
        game = sourceGame.copy();
        game.state = "Player's Turn";
        self.events.emit("gameStateRefresh", game);
        var found = 0;
        currentOptions = [];
        it = 0;
        for (var row = 0; row < game.rows; row++) {
            for (var col = 0; col < game.cols; col++) {
                var pos = new Position(row, col);
                if (game.piece.warpTo(pos) && game.piece.isSettled()) {
                    currentOptions.push(game.piece.copy());
                    if (!game.piece.isDouble()) {
                        game.piece.warpTo(game.startPosition);
                        game.piece.rotate(false, 2, true);
                        game.piece.warpTo(pos);
                        currentOptions.push(game.piece.copy());
                    }
                }
                game.piece.warpTo(game.startPosition);
                game.piece.rotate(false, 1, true);
                if (game.piece.warpTo(pos) && game.piece.isSettled()) {
                    currentOptions.push(game.piece.copy());
                    if (!game.piece.isDouble()) {
                        game.piece.warpTo(game.startPosition);
                        game.piece.rotate(false, 2, true);
                        game.piece.warpTo(pos);
                        currentOptions.push(game.piece.copy());
                    }
                }
            }
        }
        console.log("found " + currentOptions.length  + " combinations");
        // setTimeout(function() {
        //     console.log("resolving");
        //     resolve();
        // }, 3000);
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
            findOptions();
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