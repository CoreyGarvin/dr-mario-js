// A game piece
var Cell = function(type, color) {
    this.color = color || BUG_COLORS.random();
    this.type = type || TYPE.BUG;
    this.id = ++Cell.count;
};

Cell.prototype.copy = function() {
    return new Cell(this.type, this.color);
};

Cell.prototype.toString = function() {
    return this.color.name + " " + this.type.name;
};

Cell.prototype.toChar = function() {
    return this.color.name.substring(0, 1);
};

Cell.count = 0;

Cell.TYPE = {
    BUG:    {name: "Bug",           opposite: null,             movable: false,  rotation: 0},
    ORPHAN: {name: "Pill Piece",    opposite: null,             movable: true,   rotation: 0},
    TOP:    {name: "Pill Top",      opposite: Position( 1, 0),  movable: true,   rotation: toRadians(-90)},
    BOTTOM: {name: "Pill Bottom",   opposite: Position(-1, 0),  movable: true,   rotation: toRadians(90)},
    LEFT:   {name: "Pill Left",     opposite: Position( 0, 1),  movable: true,   rotation: toRadians(180)},
    RIGHT:  {name: "Pill Right",    opposite: Position( 0,-1),  movable: true,   rotation: 0}
};