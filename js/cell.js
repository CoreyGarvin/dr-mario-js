// A game piece
var Cell = function(type, color) {
    this.color = color || BUG_COLORS.random();
    this.type = type || Cell.TYPE.BUG;
    this.position = null;
    this.id = ++Cell.count;
};

Cell.prototype.copy = function() {
    return new Cell(this.type, this.color);
};

Cell.prototype.equals = function(cell) {
    return this.color === cell.color &&
           this.type === cell.type;
};

Cell.prototype.toString = function() {
    return this.color.name + " " + this.type.name;
};

Cell.prototype.toChar = function() {
    return this.color.name.substring(0, 1);
};

Cell.count = 0;

Cell.TYPE = {
    BUG:    {name: "Bug",           opposite: null,             movable: false},
    ORPHAN: {name: "Pill Piece",    opposite: null,             movable: true},
    TOP:    {name: "Pill Top",      opposite: Position( 1, 0),  movable: true},
    BOTTOM: {name: "Pill Bottom",   opposite: Position(-1, 0),  movable: true},
    LEFT:   {name: "Pill Left",     opposite: Position( 0, 1),  movable: true},
    RIGHT:  {name: "Pill Right",    opposite: Position( 0,-1),  movable: true},
};