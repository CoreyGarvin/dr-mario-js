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

Cell.prototype.description = function() {
    return this.color.name + " " + this.type.name;
};

Cell.prototype.toString = function() {
    return this.color.char + this.type.char;
};

Cell.fromString = function(s) {
    var type = Cell.TYPE_LOOKUP[s[1]];
    var color = Color.LOOKUP[s[0]];

    if (type && color) {
        return new Cell(type, color);
    }
    return null;
};

Cell.prototype.toChar = function() {
    return this.color.name.substring(0, 1);
};

Cell.count = 0;

Cell.TYPE = {
    BUG:    {name: "Bug",           shortName: "  ",    char: "B",      opposite: null,             movable: false},
    ORPHAN: {name: "Orphan",        shortName: "()",    char: "O",      opposite: null,             movable: true},
    TOP:    {name: "Pill Top",      shortName: "/\\",   char: "^",      opposite: Position( 1, 0),  movable: true},
    BOTTOM: {name: "Pill Bottom",   shortName: "\\/",   char: "U",      opposite: Position(-1, 0),  movable: true},
    LEFT:   {name: "Pill Left",     shortName: "(_",    char: "(",      opposite: Position( 0, 1),  movable: true},
    RIGHT:  {name: "Pill Right",    shortName: "_)",    char: ")",      opposite: Position( 0,-1),  movable: true},
};

Cell.TYPE_LOOKUP = {
    B:   Cell.TYPE.BUG,
    O:   Cell.TYPE.ORPHAN,
    "^": Cell.TYPE.TOP,
    "U": Cell.TYPE.BOTTOM,
    "(": Cell.TYPE.LEFT,
    ")": Cell.TYPE.RIGHT,
};