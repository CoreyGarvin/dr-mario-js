var CpuPlayer = function(sourceGame) {
    var self = this;
    self.events = new EventSystem("CpuPlayer", true);
    var sourceGame = sourceGame;
    var game = null;

    // var game = null;
    // var game = null;
    sourceGame.events.register(function() {
        var gameInitialized = function(newGame) {
            sourceGame = newGame;
            // game = sourceGame.copy();
            // self.events.emit("gameStateRefresh", game);
        };

        var playerTurn = function() {
            game = sourceGame.copy();
            game.state = "Player's Turn";
            self.events.emit("gameStateRefresh", game);
            return new Promise(function(resolve, reject) {
                game.playerControls.warp(new Position(3, 3));
                // for (var row = 0; row < game.rows; row++) {
                //     for (var col = 0; col < game.cols; col++) {
                //         game.playerControls.warp(new Position(row, col));
                //     }
                // }
                setTimeout(function() {
                    console.log("resolving");
                    resolve();
                }, 3000);
            });
        };

        var cellCreated = function(cell) {

        };

        // var nowOnDeck = function(cells) {

        // };

        // var cellDestroyed = function(cell) {

        // };

        // var gameOver = function() {
        // };

        return new Component("CPU Player",
            {
                gameInitialized: gameInitialized,
                // cellCreated: cellCreated,
                // cellDestroyed: cellDestroyed,
                // nowOnDeck: nowOnDeck,
                playerTurn: playerTurn,
                // gameOver: gameOver,
            }
        );
    }());
};