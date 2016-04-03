// A game piece
var Cell = function(type, color) {
    this.color = color || BUG_COLORS.random();
    this.type = type || TYPE.BUG;
    this.id = ++Cell.count;
};

Cell.count = 0;

Cell.prototype.copy = function() {
    return new Cell(this.type, this.color, true);
};

Cell.prototype.toString = function() {
    return this.color.name + " " + this.type.name;
};

Cell.prototype.toChar = function() {
    return this.color.name.substring(0, 1);
};




// 2D integer coordinates
var Position = function(row, col) {
    this.row = row;
    this.col = col;
};

Position.prototype.offset = function(pos) {
    return new Position(this.row + pos.row, this.col + pos.col);
}

Position.prototype.above = function(n) {return this.offset(new Position(-1, 0));};
Position.prototype.below = function(n) {return this.offset(new Position( 1, 0));};
Position.prototype.left  = function(n) {return this.offset(new Position( 0,-1));};
Position.prototype.right = function(n) {return this.offset(new Position( 0, 1));};

Position.prototype.equals = function(position) {
    return position.row === this.row && position.col === this.col;
};

Position.prototype.toString = function() {
    return "(" + this.row + ", " + this.col + ")";
};


var posCache = [];
for (var row = 0; row < 17; row++) {
    var r = [];
    for (var col = 0; col < 8; col++) {
        r.push(new Position(row, col));
    }
    posCache.push(r);
}
console.log(posCache);

var newPosition = function(row, col) {
    return posCache[row][col];
};