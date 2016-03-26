var CpuPlayer = function(sourceGame) {
    var self = this;
    self.events = new EventSystem(true);
    // var game = null;
    // var game = null;
    sourceGame.events.register(function() {
        var gameInitialized = function(newGame) {
            self.game = newGame.copy();
            self.events.emit("gameInitialized", self.game);
            var x = 3;
        };

        var cellCreated = function(cell) {

        };

        var nowOnDeck = function(cells) {

        };

        var cellDestroyed = function(cell) {

        };

        var gameOver = function() {
        };

        return new Component("Graphics",
            {
                gameInitialized: gameInitialized,
                cellCreated: cellCreated,
                // cellDestroyed: cellDestroyed,
                // nowOnDeck: nowOnDeck,
                // gameOver: gameOver,
            }
        );
    }());
};