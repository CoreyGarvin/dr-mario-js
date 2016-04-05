const BUGS = [
    new Cell(TYPE.BUG, BUG_COLORS.RED),
    new Cell(TYPE.BUG, BUG_COLORS.YELLOW),
    new Cell(TYPE.BUG, BUG_COLORS.BLUE),
];

// Data structure for game board layout
var Map = function(rows, cols, nBugs) {
    // var map = this;
    this.rows = rows;
    this.cols = cols;
    this.cells = init2d(rows, cols, null);
    this.bugCount = 0;

    if(false) {
        while (this.bugCount < nBugs) {
            this.add(BUGS[getRandomInt(0, BUGS.length)], this.randomBlankPosition(4));
            // map.killables(3).forEach(function(cell) {
            //     cell.destroy();
            // });
        }
    } else {
        for (var row = 4; row < rows; row++) {
            for (var col = 0; col < cols; col++) {
                this.add(BUGS[(col + row) % BUGS.length], Position(row, col));
            }
        }
    }
    // console.log(JSON.stringify(this.cells));
};

// ------------------------------------------------------------ Layer 0
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
        this.cells[pos.row][pos.col] = val;
        return true;
    }
    return false;
};

// Lowest level getter
Map.prototype.at = function(pos) {
    if (this.canGet(pos)) {
        return this.cells[pos.row][pos.col];
    }
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
    if (replace || !this.at(pos)) {
        if (test) {
            return this.canSet(pos);
        }

        var didSet = this.set(pos, cell);
        // Doing a replace on a bug would throw off the bugcount
        // @TODO bug counting logic
        if (didSet && cell && cell.type === TYPE.BUG) {
            this.bugCount++;
        }
        return didSet;
    }
    log("map.add() failed: " + pos.toString() + " " + cell.toString());
    return false;
};

// Removes and returns cell at pos
Map.prototype.remove = function(pos) {
    const cell = this.at(pos);
    if (cell && cell.type === TYPE.BUG) {
        this.bugCount--;
    }
    this.set(pos, null);
    return cell;
};

// ------------------------------------------------------------ Layer 2

// Add all or none
Map.prototype.adds = function(cells, posArr, test, replace, skipTest) {
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
    if (src.equals(dest)) {
        log("Map.move() alert: src == dest");
        alert();
        return true;
    }
    if (!this.at(src)) {
        log("Map.move() failed: src pos " + src.toString() + " is blank");
        alert();
        return false;
    }
    return test || this.add(this.remove(src), dest, replace);
};

// Moves a cell by a specified amount
Map.prototype.offset = function(src, offset, test, replace) {
    return this.move(src, src.offset(offset), test, replace);;
};

// ------------------------------------------------------------ Layer 3

// Moves a set
Map.prototype.moveTogether = function(srcArr, destArr, test, replace) {
    // Ensure equal lengths
    if (srcArr.length !== destArr.length) {
        log("Map.moveTogether() failed: src + dest array length mismatch");
        alert();
        return false;
    }

    if (test) {
        return this.adds(cells, destArr, true, replace);
    }
    // Remove our cells to avoid problems with intersection
    var cells = this.removes(srcArr);
    if (!this.adds(cells, destArr)) {
        if(!this.adds(cells, srcArr)) {
            alert("something horrible has happened");
        }
        return false;
    }
    return true;
    // Test each cell's move
/*    for (var i = 0; i < srcArr.length; i++) {
        if (!this.move(srcArr[i], destArr[i], true, replace)) {
            // A cell failed to move - move cells back to their original pos
            this.adds(cells, srcArr);
            return false;
        }
    }*/
    // Test succeeded, perform the move
    // return test === true || this.adds(cells, destArr);
};

Map.prototype.offsetTogether = function(srcArr, offset, test, replace) {
    var destArr = srcArr.map(function(pos) {
        return pos.offset(offset);
    });
    return this.moveTogether(srcArr, destArr, test, replace);
};



    // map.bugs = function() {
    //     return cells.filter(function(cell) {
    //         return cell.type === TYPE.BUG;
    //     });
    // };

Map.prototype.entranceBlocked = function() {
    return this.at(1, 3) || this.at(1, 4);
};

Map.prototype.randomBlankPosition = function(rowMin, rowMax, colMin, colMax) {
    var pos;
    do
        pos = Position(
            getRandomInt(rowMin || 0, rowMax || this.cells.length),
            getRandomInt(colMin || 0, colMax || this.cells[0].length)
        );
    while (this.at(pos));
    return pos;
};

var byRow = function(a, b) {return b.row - a.row || b.col - a.col;};
var byCol = function(a, b) {return b.col - a.col || b.row - a.row;};

Map.prototype.positionStreaks = function(minLength, positions, horizontal) {
    var streaks = [],
        streak  = [],
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

        // Go right or down, collect consecutive colors
        streak = [];
        do {
            streak.push(cell);
            pos = pos[directions[0]]();
            cell = this.at(pos);
        } while (
            cell &&
            cell.color === streak[0].color
        );

        // Rewind, then go left or up
        pos = positions[i][directions[1]]();
        cell = this.at(pos);
        while (
            cell &&
            cell.color === streak[0].color
        ) {
            streak.push(cell);
            pos = pos[directions[1]]();
            cell = this.at(pos);
        }
        // Save result
        if (streak.length >= minLength) {streaks.push(streak);}

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

Map.prototype.horizontalStreaks = function(minLength, positions) {
    var streaks = [],
        streak  = [],
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
            do {
                streak.push(cell);
                pos = pos.right();
                cell = this.at(pos);
            } while (cell && cell.color === streak[0].color);

            // Save our result
            if (streak.length >= minLength) {
                streaks.push(streak);
            }

            // Fast forward iterator to streak end position
            col = pos.col - 1;
        }
    }
    return streaks;
};

Map.prototype.verticalStreaks = function(minLength, positions) {
    var streaks = [],
        streak  = [],
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
        // Sort by -col, then -row
        positions.sort(function(a, b) {return b.col - a.col || b.row - a.row;});

        for (var i = 0; i < positions.length; i++) {
            pos = positions[i];
            cell = this.at(pos);
            // Skip blanks
            if (!cell) {
                alert("vstreak hint provided empty position " + pos.toString());
                continue;
            }

            // Go downward, collect consecutive colors
            streak = [];
            do {
                streak.push(cell);
                pos = pos.below();
                cell = this.at(pos);
            } while (
                cell &&
                cell.color === streak[0].color
            );

            // Rewind, then go upwards
            pos = positions[i].above();
            cell = this.at(pos);
            while (
                cell &&
                cell.color === streak[0].color
            ) {
                streak.push(cell);
                pos = pos.above();
                cell = this.at(pos);
            }
            // Save result
            if (streak.length >= minLength) {streaks.push(streak);}

            // Fast-forward through other positions already included in this streak
            while (positions[i + 1] &&
                   positions[i + 1].col == pos.col &&
                   positions[i + 1].row > pos.row)
            {i++;}
        }
        return streaks;
    }

    // Full map search
    for (var col = 0; col < cols; col++) {
        for (var row = 0; row < rows; row++) {
            pos = Position(row, col);
            cell = this.at(pos);

            // Skip blanks
            if (!cell) {continue;}

            // Accumulate consecutive colors
            streak = [];
            do {
                streak.push(cell);
                pos = pos.below();
                cell = this.at(pos);
            } while(cell && cell.color === streak[0].color);

            // Save our result
            if (streak.length >= minLength) {
                streaks.push(streak);
            }

            // Fast forward row iterator to match our end  position
            row = pos.row - 1;
        }
    }
    return streaks;
};

/*// Returns [] of killable cells (cells that are part of an n-in-a-row streak)
Map.prototype.killables = function(n) {
    return map.findStreaks().filter(function(streak) {
        return streak.cells().length >= n;
    }).reduce(function(prev, curr) {
        return prev.concat(curr.cells());
    }, []).filter(uniqueFilter);
};

    // Moves all eligable pieces downward
    Map.prototype.settle = function(items) {
        // By default, use all cells that are not bugs (and have a position)
        items = (items || map.cells).filter(function(cell) {
            return cell.type !== TYPE.BUG && cell.position && map.inBounds(cell.position);
        });
        // Track if motion happened
        var motion = false;
        // Sort by row, so that lowest items are processed first
        items.sort(function(a, b) {
            return b.position.row - a.position.row});

        // Move each eligable cell down
        for (var i = 0; i < items.length; i++) {
            var cell = items[i];
            // These conditionals keep pill pieces 'glued' together
            // If left pill and can move down, ensure the right half can
            if (cell.type === TYPE.LEFT && cell.moveDown(1, true)) {
                var next = map.at(cell.position.right());
                if (next && next.type === TYPE.RIGHT && !next.moveDown(1, true)) {
                    continue;
                }
            } else if (cell.type === TYPE.RIGHT && cell.moveDown(1, true)) {
                var next = map.at(cell.position.toLeft());
                if (next && next.type === TYPE.LEFT && !next.moveDown(1, true)) {
                    continue;
                }
            }
            motion = cell.moveDown(1, false, false, []) || motion;
        };
        return motion;
    };

    Map.prototype.settleAndKill = function() {
        var kCells = game.map.killables(4);
        while(kCells.length > 0) {
            kCells.forEach(function(cell) {cell.destroy();});
            while(game.map.settle()) {}
            kCells = game.map.killables(4);
        }
    };*/

Map.prototype.toString = function() {
    var r = 0;
    var line = "__________________________\n";

    return line + this.cells.map(function(row) {
        return r++ + "\t" + row.map(function(cell) {
            if (cell) return cell.toChar();
            return " ";
        }).join(" ");
    }).join("\n") + "\n" + line;
};

Map.prototype.inBounds = function(pos) {
    return (pos.row >= 0 && pos.row < this.cells.length) &&
           (pos.col >= 0 && pos.col < this.cells[0].length);
};
