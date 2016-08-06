var Pill = function(cells) {
    this.cells = cells || [
        new Cell(Cell.TYPE.LEFT),
        new Cell(Cell.TYPE.RIGHT)
    ];
    this.sort();
};

Pill.prototype.toString = function() {
    // H or V
    return (this.isHorz() ? "H" : "V") +
            "(" + this.cells[0].toChar() + this.cells[1].toChar() + ")" +
            (this.cells[0].position ? (" @ " + this.cells[0].position.toString()) : "");

    // // Color abbreviation
    // s += "(" + this.cells.map(function(part) {
    //     return part.color.name.substring(0,3);
    // }).join("-") + ")";

    // // Position of cells
    // s += " Pos: [" + this.cells.map(function(part) {
    //     return part.position && part.position.toString();
    // }).join(",") + "]";

    // return s;
};

this.equals = function(pill) {
    if (!(this.cells.length == pill.cells.length == 2)) {
        console.log(this.toString());
        alert("we got a non equal 2-er");
    }
    // return ( this.cells[0].equals(pill.cells[0] && this.cells[1].equals(pill.cells[1]) ) ||
    //        ( this.cells[0].equals(pill.cells[1] && this.cells[1].equals(pill.cells[0]) )
    return (this.cells[0].color === piece.cells[0].color || this.cells[0].color === piece.cells[1].color)
        && (this.cells[1].color === piece.cells[0].color || this.cells[1].color === piece.cells[1].color);

};

Pill.prototype.positions = function() {
    if (!this.cells[0].position || !this.cells[1].position) {
        console.log("problem with pill: " + this.toString());
    }
    return [this.cells[0].position, this.cells[1].position];
};

Pill.prototype.isDouble = function() {
    return this.cells[0].color === this.cells[1].color;
};

Pill.prototype.isRotatedLike = function(pill) {
    return this.cells[0].equals(pill.cells[0]) &&
           this.cells[1].equals(pill.cells[1]);
};

Pill.prototype.sort = function() {
    if (this.cells.length != 2) {
        console.log("piece corrupt");
        alert("piece corrupt");
    }
    if (this.cells[0].position == null || this.cells[1].position == null) {
        return;
    }
    // Ensure cells[0] is the most lower-right cells
    this.cells.sort(function(a, b) {
        return b.position.row - a.position.row ||
               a.position.col - b.position.col;
    });
    // Set cells types
    if (this.isHorz()) {
        this.cells[0].type = Cell.TYPE.LEFT;
        this.cells[1].type = Cell.TYPE.RIGHT;
    } else {
        this.cells[0].type = Cell.TYPE.BOTTOM;
        this.cells[1].type = Cell.TYPE.TOP;
    }
};

Pill.prototype.copy = function() {
    return new Pill(this.cells.map(function(cell) {return cell.copy();}));
};

Pill.prototype.isHorz = function() {
    // return this.cells[0].type === TYPE.LEFT;
    // if (this.positions())
    return this.cells[0].position != null && this.cells[1].position != null &&
           this.cells[0].position.row === this.cells[1].position.row;
};

Pill.prototype.isVert = function() {
    return !this.isHorz();
};

Pill.prototype.print = function() {
    // styledConsoleLog('<span style="color:hsl(0, 100%, 90%);background-color:hsl(0, 100%, 50%);"> Red </span> <span style="color:hsl(39, 100%, 85%);background-color:hsl(39, 100%, 50%);"> Orange </span> <span style="color:hsl(60, 100%, 35%);background-color:hsl(60, 100%, 50%);"> Yellow </span> <span style="color:hsl(120, 100%, 60%);background-color:hsl(120, 100%, 25%);"> Green </span> <span style="color:hsl(240, 100%, 90%);background-color:hsl(240, 100%, 50%);"> Blue </span> <span style="color:hsl(300, 100%, 85%);background-color:hsl(300, 100%, 25%);"> Purple </span> <span style="color:hsl(0, 0%, 80%);background-color:hsl(0, 0%, 0%);"> Black </span>');
    var s = "";
    for (var i = 0; i < this.cells.length; i++) {
        if (i == 1 && this.isVert()) {
            s += "\n";
        }
        var cell = this.cells[i];
        var color = cell.color.name == "Yellow" ? "black" : "white";
        var text = text = cell.type.shortName;
        s += '<span style="color:' + color + ';background-color: #' + cell.color.value.toString(16) + ';">' + text + '</span>';
    }
    // s += " @ " + this.cells[0].position ? this.cells[0].position.toString() : "null";
    styledConsoleLog(s);
};

    // this.addToMap = function() {
    //     this.cells[0].position = new Position(1, 3);
    //     this.cells[1].position = new Position(1, 4);
    //     game.map.add(this.cells[0]);
    //     game.map.add(this.cells[1]);
    // };

    // this.move = function(mover) {
    //     if (this.cells[0][mover](1, true) && this.cells[1][mover](1, true)) {
    //         this.cells[0][mover]();
    //         this.cells[1][mover]();
    //         return true;
    //     }
    //     return false;
    // };

    // this.warpTo = function(position, test, force) {
    //     var otherPos = isHorz() ? position.toRight() : position.above();
    //     if (force || (this.cells[0].moveTo(position, true) && this.cells[1].moveTo(otherPos, true))) {
    //         if (test) return true;
    //         this.cells[0].moveTo(position, false, force);
    //         this.cells[1].moveTo(otherPos, false, force);
    //         return true;
    //     }
    //     return false;
    // };



    // this.rotate = function(cc, n, force) {
    //     n = n || 1;
    //     force = force === true;
    //     while(n--) {
    //         var wasHorz = isHorz();
    //         // Horizontal -> Vertical rotation
    //         if (wasHorz) {
    //             // Default unobstructed
    //             if (!this.cells[1].moveTo(this.cells[0].position.above(), false, force)) {
    //                 // Try above-right
    //                 if (this.cells[1].moveUp()) {
    //                     this.cells[0].moveRight();
    //                 // Try below
    //                 } else if (!this.cells[1].moveTo(this.cells[0].position.below())) {
    //                     // Try below-right
    //                     if (this.cells[1].moveDown()) {
    //                         this.cells[0].moveRight();
    //                     } else return false;
    //                 }
    //             }
    //         // Vertical -> Horizontal, try right
    //         } else if (!this.cells[1].moveTo(this.cells[0].position.toRight(), false, force)) {
    //             // Try shifting left
    //             if (this.cells[0].moveLeft()) {
    //                 this.cells[1].moveDown();
    //             } else return false;
    //         }
    //         // Achieve counter-clockwise rotation by
    //         // swapping positions
    //         if ((wasHorz && !cc) || (!wasHorz && cc)) {
    //             var tmp = this.cells[0].position;
    //             this.cells[0].moveTo(this.cells[1].position, false, true);
    //             this.cells[1].moveTo(tmp, false, true);
    //         }
    //         sort();
    //     }
    //     return true;
    // };
    
// };

// this.isSettled = function() {
//     var below = game.map.at(this.cells[0].position.below());
//     var belowBlocked = below === undefined || below != null;
//     if (isVert()) {
//         return belowBlocked;
//     } else {
//         return belowBlocked || game.map.at(this.cells[1].position.below()) != null;
//     }
//     // return game.map.at(this.cells[0].position.below()) != null &&
//     //     (isVert() || game.map.at(this.cells[1].position.below()) != null);
// };