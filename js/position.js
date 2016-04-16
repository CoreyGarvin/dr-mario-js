var PositionPool = (function(rows, cols, pad) {
    var self = this;
    var cacheEnabled = true;
    var cache = [];
    var positions = [];

    // 2D integer coordinates
    var Position = function(row, col) {
        this.row = row;
        this.col = col;
        this.hash = row * rows + col;
    };

    var getCached = function(row, col) {
        return cache[(row + pad) * (cols + (2 * pad)) + col + pad] || getNew(row, col);
    };

    var getNew = function(row, col) {
        return new Position(row, col);
    };

    var positionGetter = cacheEnabled ? getCached : getNew;

    var getPosition = function(row, col) {
        return positionGetter(row, col);
    };

    Position.prototype.offset = function(offset) {
        return getPosition(this.row + offset.row, this.col + offset.col);
    };

    Position.prototype.above = function(n) {return this.offset(getPosition(-1, 0));};
    Position.prototype.below = function(n) {return this.offset(getPosition( 1, 0));};
    Position.prototype.left  = function(n) {return this.offset(getPosition( 0,-1));};
    Position.prototype.right = function(n) {return this.offset(getPosition( 0, 1));};

    Position.prototype.equals = function(position) {
        return this === position ||
               position.row === this.row && position.col === this.col;
    };

    Position.prototype.toString = function() {
        return "(" + this.row + ", " + this.col + ")";
    };

    // Build cache with padding
    for (var row = -pad; row < rows + pad; row++) {
        for (var col = -pad; col < cols + pad; col++) {
            var pos = getNew(row, col);
            cache.push(pos);
            // Collect only in-bounds positions
            if (row >= 0 && col >= 0 && row < rows && col < cols) {
                positions.push(pos);
            }
        }
    }

    return {
        getPosition: getPosition,
        allPositions: function() {return positions;},
        toggleCaching: function(enabled) {
            cacheEnabled = enabled !== undefined ? enabled : !cacheEnabled;
            positionGetter = cacheEnabled ? getCached : getNew;
            return cacheEnabled;
        }
    };
})(17, 8, 1);

var Position = PositionPool.getPosition;