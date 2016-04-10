// A game piece
var Cell = function(type, color, position) {
    this.color = color || BUG_COLORS.random();
    this.type = type || Cell.TYPE.BUG;
    this.position = position;
    this.id = ++Cell.count;
};

Cell.prototype.copy = function() {
    return new Cell(this.type, this.color, this.position);
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
    BUG:    {name: "Bug",        shortName: "  ",           opposite: null,             movable: false},
    ORPHAN: {name: "Orphan",     shortName: "OO",        opposite: null,             movable: true},
    TOP:    {name: "Pill Top",   shortName: "/\\",      opposite: Position( 1, 0),  movable: true},
    BOTTOM: {name: "Pill Bottom",shortName: "\\/",   opposite: Position(-1, 0),  movable: true},
    LEFT:   {name: "Pill Left",  shortName: "(_",     opposite: Position( 0, 1),  movable: true},
    RIGHT:  {name: "Pill Right", shortName: "_)",    opposite: Position( 0,-1),  movable: true},
};