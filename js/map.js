const BUGS = [
    new Cell(TYPE.BUG, BUG_COLORS.RED),
    new Cell(TYPE.BUG, BUG_COLORS.YELLOW),
    new Cell(TYPE.BUG, BUG_COLORS.BLUE),
];

// Data structure for game board layout
var Map = function(rows, cols, nBugs) {
    // var map = this;
    this.cells = init2d(rows, cols, null);
    this.bugCount = 0;

    if(true) {
        while (this.bugCount < nBugs) {
            this.add(BUGS[getRandomInt(0, BUGS.length)], this.randomBlankPosition(4));
            // map.killables(3).forEach(function(cell) {
            //     cell.destroy();
            // });
        }
    } else {
        this.cells = SAVEDBOARD;
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
    return posArr.map(function(pos) {
        return this.at(pos);
    });
};

// Convenience getter
Map.prototype.atCoord = function(row, col) {
    return this.at(new Position(row, col));
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
        if (didSet && cell.type === TYPE.BUG) {
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
        if (!this.add(cells[i], posArr[i], true, replace)) {
            log(this.toString());
            alert("this should never happen!");
            return false;
        }
    }
    return true;
};

// Remove multiple
Map.prototype.removes = function(posArr) {
    return posArr.map(function(pos) {
        return this.remove(pos);
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
    // Remove our cells to avoid problems with intersection
    var cells = this.removes(srcArr);
    // Test each cell's move
    for (var i = 0; i < srcArr.length; i++) {
        if (!this.move(srcArr[i], destArr[i], true, replace)) {
            // A cell failed to move - move cells back to their original pos
            this.adds(cells, srcArr);
            return false;
        }
    }
    // Test succeeded, perform the move
    return test === true || this.adds(cells, destArr);
};

Map.prototype.offsetTogether = function(srcArray, offset, test, replace) {
    var destArr = srcArr.map(function(pos) {
        return pos.offset(offset);
    });
    return this.moveTogether(srcArray, destArr, test, replace);
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
        pos = new Position (
            getRandomInt(rowMin || 0, rowMax || this.cells.length),
            getRandomInt(colMin || 0, colMax || this.cells[0].length)
        );
    while (this.at(pos));
    return pos;
};

Map.prototype.horizontalStreaks = function(minLength, positions) {
    var streaks = [],
        streak  = []
        minLength = minLength || 1,
        cells = this.cells,
        rows = this.cells.length,
        cols = this.cells[0].length;

    // If positions are provided, only streaks involving those
    // positions are returned.  Intended as an optimization.
    if (positions) {
        // Sort by -col, then -row
        positions.sort(function(a, b) {return b.row - a.row || b.col - a.col;});
        // For each position, find streak
        for (var i = 0; i < positions.length; i++) {
            // Skip blanks
            if (!this.at(positions[i])) continue;

            var row = positions[i].row,
                col = positions[i].col;

            // Go right, collect consecutive colors
            streak = [];
            do {
                streak.push(cells[row][col]);
                col++;
            } while (
                col < cols &&
                cells[row][col] &&
                cells[row][col].color === streak[0].color
            );

            // Rewind, then go left
            col = positions[i].col - 1;
            while (
                col >= 0 && cells[row][col] &&
                cells[row][col].color === streak[0].color
            ) {
                streak.push(cells[row][col]);
                col--;
            }
            // Save result
            if (streak.length >= minLength) {streaks.push(streak);}

            // Skip other positions already included in this streak
            while (
                positions[i + 1] &&
                positions[i + 1].row == row &&
                positions[i + 1].col > col
            ) {i++;}
        }
        return streaks;
    }

    // Full map search
    for (var row = 0; row < rows; row++) {
        for (var col = 0; col < cols; col++) {
            // Skip blanks
            if (!cells[row][col]) {continue;}

            // Accumulate consecutive colors
            streak = [];
            do {
                streak.push(cells[row][col]);
                col++;
            } while(row < rows && cells[row][col] && cells[row][col].color === streak[0].color);
            // Rewind 1
            col--;
            if (streak.length >= minLength) {
                streaks.push(streak);
            }
        }
    }
    return streaks;
};

Map.prototype.verticalStreaks = function(minLength, positions) {
    var streaks = [],
        streak  = [],
        minLength = minLength || 1,
        cells = this.cells,
        rows = this.cells.length,
        cols = this.cells[0].length,
        pos = null,
        cell = null;

    // If positions are provided, only streaks involving those
    // positions are returned.  Intended as an optimization.
    if (positions) {
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
            pos = new Position(row, col);
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
                var next = map.at(cell.position.toRight());
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
