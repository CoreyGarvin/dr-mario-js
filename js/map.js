const BUGS = [
    new Cell(Cell.TYPE.BUG, BUG_COLORS.RED),
    new Cell(Cell.TYPE.BUG, BUG_COLORS.YELLOW),
    new Cell(Cell.TYPE.BUG, BUG_COLORS.BLUE),
];

// Data structure for game board layout
var Map = function(rows, cols, nBugs, cells) {
    // var map = this;
    this.bugCount = 0;
    this.positions = PositionPool.allPositions();
    this.rows = rows || 17;
    this.cols = cols || 8;

    if (!cells) {
        this.cells = init2d(rows, cols, null);
        this.cells = init1d(this.rows * this.cols, null);
        if(true) {
            while (this.bugCount < nBugs) {
                this.add(BUGS[getRandomInt(0, BUGS.length)].copy(), this.randomBlankPosition(4));
                // map.killables(3).forEach(function(cell) {
                //     cell.destroy();
                // });
            }
        } else {
            // Consistent board
            for (var row = 4; row < rows; row++) {
                for (var col = 0; col < cols; col++) {
                    this.add(BUGS[(col + row) % BUGS.length].copy(), Position(row, col));
                }
            }
        }
    } else {
        this.cells = cells;
    }
};

Map.prototype.copy = function(map) {
    return new Map(this.rows, this.cols, null, this.cells.slice());
};

Map.prototype.deepCopy = function(map) {
    return new Map(this.rows, this.cols, null, this.cells.map(function(cell) {
        if (!cell) {
            return null;
        }
        return cell.copy();
    }));
};

// ------------------------------------------------------------ Layer 0
Map.prototype.inBounds = function(pos) {
    return (pos.row >= 0 && pos.row < this.rows) &&
           (pos.col >= 0 && pos.col < this.cols);
};

// Lowest level access-checker
Map.prototype.canSet = function(pos) {
    return this.inBounds(pos);
};

Map.prototype.canGet = function(pos) {
    return this.inBounds(pos);
};

// Lowest level settterf
Map.prototype.set = function(pos, val) {
    if (this.canSet(pos)) {
        // Revoke current occupant's position
        var occupant = this.at(pos);
        if (occupant) {
            if (occupant.type === Cell.TYPE.BUG) {
                this.bugCount--;
            }
            occupant.position = null;
        }
        // Assign position to new occupuant
        if (val) {
            if (val.type === Cell.TYPE.BUG) {
                this.bugCount++;
            }
            val.position = pos;
        }
        this.cells[pos.row * this.cols + pos.col] = val;
        return true;
    }
    return false;
};

// Lowest level getter
Map.prototype.at = function(pos) {
    if (this.canGet(pos)) {
        return this.cells[(pos.row * this.cols) + pos.col];
    }
};

Map.prototype.empty = function(pos) {
    return this.at(pos) === null;
};

Map.prototype.empties = function(posArr) {
    for (var i = posArr.length; i--;) {
        if (!this.empty(posArr[i])) {
            return false;
        }
    }
    return true;
};

// ------------------------------------------------------------ Layer 1
// Get multiple
Map.prototype.ats = function(posArr) {
    var self = this;
    return posArr.map(function(pos) {
        return self.at(pos);
    });
};

// Convenience getter
Map.prototype.atCoord = function(row, col) {
    return this.at(Position(row, col));
};

// Add cell to the map
Map.prototype.add = function(cell, pos, test, replace) {
    if (!cell) {
        console.log("trying to add a blank cell to the map");
        console.log("@ " + pos.toString());
    }
    if (replace || this.empty(pos)) {
        return (test && this.canSet(pos)) || this.set(pos, cell);
    }
    log("map.add() failed: " + pos.toString() + " " + cell.toString());
    return false;
};

// Removes and returns cell at pos
Map.prototype.remove = function(pos) {
    const cell = this.at(pos);
    this.set(pos, null);
    return cell;
};

// ------------------------------------------------------------ Layer 2

// Add all or none
Map.prototype.adds = function(cells, posArr, test, replace, skipTest) {
    // Ensure equal lengths
    if (cells.length !== posArr.length) {
        log("Map.adds() failed: cells + dest array length mismatch");
        alert();
        return false;
    }
    // Test all cells
    if (!skipTest) {
        for (var i = 0; i < cells.length; i++) {
            if (!this.add(cells[i], posArr[i], true, replace)) {
                return false;
            }
        }
    }
    if (test) return true;

    // Add all cells
    for (var i = 0; i < cells.length; i++) {
        if (!this.add(cells[i], posArr[i], false, replace)) {
            log(this.toString());
            alert("this should never happen!");
            return false;
        }
    }
    return true;
};

// Remove multiple
Map.prototype.removes = function(posArr) {
    var self =  this;
    return posArr.map(function(pos) {
        return self.remove(pos);
    });
};

// Moves (by removing and adding) a cell to an absolute position
Map.prototype.move = function(src, dest, test, replace) {
    // Just a test, can delete later
    if (src.equals(dest)) {
        log("Map.move() alert: src == dest");
        alert();
        return true;
    }
    // Another test
    if (!this.at(src)) {
        log("Map.move() failed: src pos " + src.toString() + " is blank");
        alert();
        return false;
    }
    // Attempt to add the cell to the dest
    if (this.add(this.at(src), dest, test, replace)) {
        this.remove(src);
        return true;
    }
    return false;
};

// Moves a cell by a specified amount
Map.prototype.offset = function(src, offset, test, replace) {
    return this.move(src, src.offset(offset), test, replace);;
};

// ------------------------------------------------------------ Layer 3

// Moves a set
Map.prototype.moveTogether = function(srcArr, destArr, test, replace) {
    // Remove our cells to avoid problems with intersection
    var cells = this.removes(srcArr);
    var success = this.adds(cells, destArr, test, replace);
    if (test || !success) {
        // Put the cells back
        if(!this.adds(cells, srcArr)) {
            alert("something horrible has happened");
        }
    }
    return success;
    // if (test) {
    //     var success = this.adds(cells, destArr, true, replace);
    //     // Put the cells back
    //     if(!this.adds(cells, srcArr)) {
    //         alert("something horrible has happened");
    //     }
    //     return success;
    // }
    // if (!this.adds(cells, destArr)) {
    //     if(!this.adds(cells, srcArr)) {
    //         alert("something horrible has happened");
    //     }
    //     return false;
    // }
    // return true;
};

// Moves conditionally, according to type (ie, bugs cannot move)
Map.prototype.moveContextually = function(src, dest, test, replace) {
    var cell = this.at(src);
    if (!cell || !cell.type.movable) {
        return false;
    }
    if (!cell.type.opposite) {
        return this.move(src, dest, test, replace);
    }
    var srcArr  = [src,   src.offset(cell.type.opposite)];
    var destArr = [dest, dest.offset(cell.type.opposite)];
    return this.moveTogether(srcArr, destArr, true, replace) &&
           (test || this.move(src, dest, test, replace));
};

Map.prototype.offsetTogether = function(srcArr, offset, test, replace) {
    var destArr = srcArr.map(function(pos) {
        return pos.offset(offset);
    });
    return this.moveTogether(srcArr, destArr, test, replace);
};

Map.prototype.entranceBlocked = function() {
    return this.at(1, 3) || this.at(1, 4);
};

Map.prototype.randomBlankPosition = function(rowMin, rowMax, colMin, colMax) {
    var pos;
    rowMin = rowMin || 0,
    rowMax = rowMax || this.rows,
    colMin = colMin || 0,
    colMax = colMax || this.cols;

    do {
        // pos = this.positions[getRandomInt()];
        pos = Position(
            getRandomInt(rowMin, rowMax),
            getRandomInt(colMin, colMax)
        );
    } while (this.at(pos));
    return pos;
};

var byRow = function(a, b) {return b.row - a.row || b.col - a.col;};
var byCol = function(a, b) {return b.col - a.col || b.row - a.row;};

Map.prototype.positionStreaks = function(minLength, positions, horizontal, collection) {
    var streaks = [],
        streak  = [],
        color = null,
        minLength = minLength || 1,
        cells = this.cells,
        pos = null,
        cell = null;

    positions.sort(horizontal ? byRow : byCol);
    var directions = horizontal ? ["right", "left"] : ["below", "above"];
    // For each position, find streak
    for (var i = 0; i < positions.length; i++) {
        pos = positions[i];
        cell = this.at(pos);
        // Skip blanks
        if (!cell) {
            alert("positionStreaks hint provided empty position " + pos.toString());
            continue;
        }

        // Go right/down, collect consecutive colors
        streak = [];
        color = cell.color;
        do {
            // Collect
            streak.push(pos);

            // Move
            pos = pos[directions[0]]();
            cell = this.at(pos);
        } while (
            cell &&
            cell.color === color
        );

        // Rewind, then go left or up
        pos = positions[i][directions[1]]();
        cell = this.at(pos);
        while (
            cell &&
            cell.color === color
        ) {
            // Collect
            streak.push(pos);

            // Move
            pos = pos[directions[1]]();
            cell = this.at(pos);
        }
        // Save result
        if (streak.length >= minLength) {
            streaks.push(streak);
            if (collection) {
                for (var s = streak.length; s--;) {
                    collection[streak[s].row * cols + streak[s].col] = streak[s];
                }
            }
        }

        // Fast-forward through other positions already included in this streak
        if (horizontal) {
            while (
                positions[i + 1] &&
                positions[i + 1].row == pos.row &&
                positions[i + 1].col > pos.col
            ) {i++;}
        } else {
            while (
                positions[i + 1] &&
                positions[i + 1].col == pos.col &&
                positions[i + 1].row > pos.row
            ) {i++;}
        }
    }
    return streaks;
};

Map.prototype.horizontalStreaks = function(minLength, positions, collection) {
    var streaks = [],
        streak  = [],
        color = null,
        minLength = minLength || 1,
        rows = this.rows,
        cols = this.cols,
        pos = null,
        cell = null;

    // If positions are provided, only streaks involving those
    // positions are returned.  Intended as an optimization.
    if (positions) {
        return this.positionStreaks(minLength, positions, true);
    }

    // Full map search
    for (var row = 0; row < rows; row++) {
        for (var col = 0; col < cols; col++) {
            pos = Position(row, col);
            cell = this.at(pos);

            // Skip blanks
            if (!cell) {continue;}

            // Accumulate consecutive colors
            streak = [];
            color = cell.color;
            do {
                streak.push(pos);

                pos = pos.right();
                cell = this.at(pos);
            } while (cell && cell.color === color);

            // Save our result
            if (streak.length >= minLength) {
                streaks.push(streak);
                if (collection) {
                    for (var s = streak.length; s--;) {
                        collection[streak[s].row * cols + streak[s].col] = streak[s];
                    }
                }
            }

            // Fast forward iterator to streak end position
            col = pos.col - 1;
        }
    }
    return streaks;
};

Map.prototype.verticalStreaks = function(minLength, positions, collection) {
    var streaks = [],
        streak  = [],
        color = null,
        minLength = minLength || 1,
        cells = this.cells,
        rows = this.rows,
        cols = this.cols,
        pos = null,
        cell = null;

    // If positions are provided, only streaks involving those
    // positions are returned.  Intended as an optimization.
    if (positions) {
        return this.positionStreaks(minLength, positions, false);
    }

    // Full map search
    for (var col = 0; col < cols; col++) {
        for (var row = 0; row < rows; row++) {
            pos = Position(row, col);
            cell = this.at(pos);

            // Skip blanks
            if (!cell) {continue;}

            // Accumulate consecutive colors
            color = cell.color;
            streak = [];
            do {
                // Collect position
                streak.push(pos);

                // Move down
                pos = pos.below();
                cell = this.at(pos);
            } while(cell && cell.color === color);

            // Save our result
            if (streak.length >= minLength) {
                streaks.push(streak);
                if (collection) {
                    for (var s = streak.length; s--;) {
                       collection[streak[s].row * cols + streak[s].col] = streak[s];
                    }
                }
            }
            // Fast forward row iterator to match our end  position
            row = pos.row - 1;
        }
    }
    return streaks;
};

// Returns [] of unique positions
Map.prototype.killables = function(minLength, positions) {
    minLength = minLength || 4;
    var collector = {};
    this.verticalStreaks(minLength, positions, collector);
    this.horizontalStreaks(minLength, positions, collector);
    return Object.keys(collector).map(function(key) {return collector[key];});
};

// Moves all eligable cells downward once.  Repeats if allTheWay
Map.prototype.settle = function(positions, allTheWay) {
    positions = positions || this.positions;
    // var offset = Position(0, 1);
    var didMove = false;
    do {
        didMove = false;
        var i = positions.length;

        while (i--) {
            didMove = this.moveContextually(positions[i], positions[i].below()) || didMove;
        }
    } while (didMove && allTheWay);
    return didMove;
};


        // By default, use all cells that are not bugs (and have a position)
    //     items = (items || map.cells).filter(function(cell) {
    //         return cell.type !== TYPE.BUG && cell.position && map.inBounds(cell.position);
    //     });
    //     // Track if motion happened
    //     var motion = false;
    //     // Sort by row, so that lowest items are processed first
    //     items.sort(function(a, b) {
    //         return b.position.row - a.position.row});

    //     // Move each eligable cell down
    //     for (var i = 0; i < items.length; i++) {
    //         var cell = items[i];
    //         // These conditionals keep pill pieces 'glued' together
    //         // If left pill and can move down, ensure the right half can
    //         if (cell.type === TYPE.LEFT && cell.moveDown(1, true)) {
    //             var next = map.at(cell.position.right());
    //             if (next && next.type === TYPE.RIGHT && !next.moveDown(1, true)) {
    //                 continue;
    //             }
    //         } else if (cell.type === TYPE.RIGHT && cell.moveDown(1, true)) {
    //             var next = map.at(cell.position.toLeft());
    //             if (next && next.type === TYPE.LEFT && !next.moveDown(1, true)) {
    //                 continue;
    //             }
    //         }
    //         motion = cell.moveDown(1, false, false, []) || motion;
    //     };
    //     return motion;
    // };

    // Map.prototype.settleAndKill = function() {
    //     var kCells = game.map.killables(4);
    //     while(kCells.length > 0) {
    //         kCells.forEach(function(cell) {cell.destroy();});
    //         while(game.map.settle()) {}
    //         kCells = game.map.killables(4);
    //     }
    // };

Map.prototype.toString = function() {
    var line = "__________________________\n";
    var s = line;
    var pos = {};
    for (var i = 0; i < this.positions.length; i++) {
        if (this.positions[i].row !== pos.row) {
            s += "\n" + this.positions[i].row + "\t";
        }
        pos = this.positions[i];
        var cell = this.at(pos);
        if (cell) s += this.at(pos).toChar() + " ";
        else s += "  ";
    }
    return s + "\n" + line;
};

Map.prototype.print = function() {
    // styledConsoleLog('<span style="color:hsl(0, 100%, 90%);background-color:hsl(0, 100%, 50%);"> Red </span> <span style="color:hsl(39, 100%, 85%);background-color:hsl(39, 100%, 50%);"> Orange </span> <span style="color:hsl(60, 100%, 35%);background-color:hsl(60, 100%, 50%);"> Yellow </span> <span style="color:hsl(120, 100%, 60%);background-color:hsl(120, 100%, 25%);"> Green </span> <span style="color:hsl(240, 100%, 90%);background-color:hsl(240, 100%, 50%);"> Blue </span> <span style="color:hsl(300, 100%, 85%);background-color:hsl(300, 100%, 25%);"> Purple </span> <span style="color:hsl(0, 0%, 80%);background-color:hsl(0, 0%, 0%);"> Black </span>');

    // var line = "__________________________\n";
    var s = "  \t 0 1 2 3 4 5 6 7";
    var pos = {};
    for (var i = 0; i < this.positions.length; i++) {
        if (this.positions[i].row !== pos.row) {
            s += "\n" + this.positions[i].row + "\t";
        }
        pos = this.positions[i];
        var cell = this.at(pos);
        if (cell) {
            var color = cell.color.name == "Yellow" ? "black" : "white";
            var text = cell.type === Cell.TYPE.BUG ? "  " : cell.type.name.substring(0, 2);
            s += '<span style="color:' + color + ';background-color: #' + cell.color.value.toString(16) + ';">' + text + '</span>';
        }
        else s += '<span style="color:hsl(0, 100%, 90%);background-color: black;">  </span>';
    }
    s+="\n  \t 0 1 2 3 4 5 6 7";
    styledConsoleLog(s);
    // return s + "\n" + line;
};

