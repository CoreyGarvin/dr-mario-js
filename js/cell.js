// A game piece
var Cell = function(type, color) {
    this.color = color || bugPalette.random();
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