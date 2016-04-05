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


// var posCache = [];
// for (var row = -1; row < 18; row++) {
//     var r = [];
//     for (var col = -1; col < 9; col++) {
//         r.push(new Position(row, col));
//     }
//     posCache.push(r);
// }
// console.log(posCache);

// var newPosition = function(row, col) {
//     return posCache[row + 1][col + 1] || newPosition(row, col);
// };