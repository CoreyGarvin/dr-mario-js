var PositionPool = (function(rows, cols, pad) {
    var cacheEnabled = true;
    var cache = [];

    // 2D integer coordinates
    var Position = function(row, col) {
        this.row = row;
        this.col = col;
    };

    var getCached = function(row, col) {
        return cache[(row + pad) * (cols + (2 * pad)) + col + pad] || new Position(row, col);
    };

    var getNew = function(row, col) {
        return new Position(row, col);
    };

    var pos = cacheEnabled ? getCached : getNew;

    var posGetter = function(row, col) {
        return pos(row, col);
    };

    Position.prototype.offset = function(offset) {
        return pos(this.row + offset.row, this.col + offset.col);
    };

    Position.prototype.above = function(n) {return this.offset(pos(-1, 0));};
    Position.prototype.below = function(n) {return this.offset(pos( 1, 0));};
    Position.prototype.left  = function(n) {return this.offset(pos( 0,-1));};
    Position.prototype.right = function(n) {return this.offset(pos( 0, 1));};

    Position.prototype.equals = function(position) {
        return this === position ||
               position.row === this.row && position.col === this.col;
    };

    Position.prototype.toString = function() {
        return "(" + this.row + ", " + this.col + ")";
    };

    // for (var row = -pad; row < rows + pad; row++) {
    //     var arr = [];
    //     for (var col = -pad; col < cols + pad; col++) {
    //         arr.push(new Position(row, col));
    //     }
    //     cache.push(arr);
    // }

    for (var row = -pad; row < rows + pad; row++) {
        for (var col = -pad; col < cols + pad; col++) {
            cache.push(new Position(row, col));
        }
    }

    return {
        pos: posGetter,
        toggleCaching: function(enabled) {
            cacheEnabled = enabled !== undefined ? enabled : !cacheEnabled;
            pos = cacheEnabled ? getCached : getNew;
            return cacheEnabled;
        }

    };
})(17, 8, 1);

var Position = PositionPool.pos;