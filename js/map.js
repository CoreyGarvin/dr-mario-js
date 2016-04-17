const BUGS = [
    new Cell(Cell.TYPE.BUG, BUG_COLORS.RED),
    new Cell(Cell.TYPE.BUG, BUG_COLORS.YELLOW),
    new Cell(Cell.TYPE.BUG, BUG_COLORS.BLUE),
];

// Data structure for game board layout
var Map = function(rows, cols, nBugs, cells) {
    // var map = this;
    this.bugCount = 0;
    this.occupantCount = 0;
    this.bugPositions = {};
    this.positions = PositionPool.allPositions();
    this.rows = rows || 17;
    this.cols = cols || 8;
    this.cells = init1d(this.rows * this.cols, null);


    if (!cells) {
        if(true) {
            // return Map.fromString("17 8 - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - yB yB - - - - - - - rB rB - - - - - - - - - rB rB - - - rB yB - - rB - rB - - yB - rB yB yB - rB - - - - bB - - rB - - - - - - - - yB - - - rB - rB yB - - - - - - - - - - yB - - - - - - - - rB rB yB bB - bB - - yB rB - yB - - - - - -");
            // return testMap;
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
        if (this.positions.length != cells.length) {
            alert("cells provided not same length as positions.length");
            return;
        }
        // If cells already have positions
        if (false) {
            this.cells = cells;
        } else {
            for (var i = 0; i < this.positions.length; i++) {
                this.add(cells[i], this.positions[i]);
            }
        }
    }
};

Map.prototype.sanityCheck = function(msg) {
    // Sanity Check
    var cells = this.cells;
    var problem = false;
    for (var i = 0; i < cells.length; i++) {
        if (cells[i] && !cells[i].position) {
            problem = true;
            console.log("no positionn on cell " + Math.floor(i/this.cols) + ", " + i%this.cols);
        }
    }
    if (problem) {
        console.log(msg + ": sanityCheck FAIL NIGGA!");
        this.print();
    }
    // else {
    //     console.log(msg + ": sanityCheck OK!");
    // }
};

Map.fromString = function(s) {
    var parts = s.split(" ");
    var rows = parts.shift();
    var cols = parts.shift();
    var cells = parts.map(function(str) {
        return Cell.fromString(str);
    });
    return new Map(rows, cols, null, cells);
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
    if (!pos) {
        console.log("got non-pos");
    }
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

// Lowest level getter
Map.prototype.at = function(pos) {
    if (this.canGet(pos)) {
        return this.cells[(pos.row * this.cols) + pos.col];
    }
};

// Lowest level settter.  Assigns positions upon entry, revokes them
// when overwriting.
Map.prototype.set = function(pos, val, test, replace) {
    if (!this.canSet(pos)) {
        return false;
    }
    // Revoke current occupant's position
    var occupant = this.at(pos);
    if (occupant) {
        if (!replace) {return false;}
        if (test)     {return pos;}

        // We're overwriting a bug
        if (occupant.type === Cell.TYPE.BUG) {
            this.bugCount--;
            this.bugPositions[pos.hash] = null;
        }
        this.occupantCount--;
        occupant.position = null;
    } else if (test) {
        return pos;
    }
    // Assign position to new occupuant
    if (val) {
        if (val.type === Cell.TYPE.BUG) {
            this.bugCount++;
            this.bugPositions[pos.hash] = pos;
        }
        val.position = pos;
        this.occupantCount++;
    }
    this.cells[pos.row * this.cols + pos.col] = val;
    return pos;
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
Map.prototype.atC = function(row, col) {
    return this.at(Position(row, col));
};

// Add cell to the map
Map.prototype.add = function(cell, pos, test, replace) {
    // if (!cell) {
        // console.log("trying to add a blank cell to the map");
        // console.log("@ " + pos.toString());
        // alert();
    // }

    return this.set(pos, cell, test, replace);

    // log("map.add() failed: " + pos.toString() + " " + cell.toString());
    // return false;
};

// Removes and returns cell at pos
Map.prototype.remove = function(pos) {
    const cell = this.at(pos);
    this.set(pos, null, false, true);
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
    if (test) return posArr;

    // Add all cells
    for (var i = 0; i < cells.length; i++) {
        if (!this.add(cells[i], posArr[i], false, replace)) {
            console.log(this.toString());
            console.log("^^^this should never happen!");
            return false;
        }
    }
    return posArr;
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
        return dest;
    }
    // Another test
    if (!this.at(src)) {
        log("Map.move() failed: src pos " + src.toString() + " is blank");
        alert();
        return false;
    }
    // Attempt to add the cell to the dest
    var cell = this.remove(src);
    var success = this.add(cell, dest, test, replace);
    if (!success || test) {
        // Put the cell back
        if (!this.add(cell, src, test, replace)) {
            console.log("something horrible has happened");
        }
    }
    return success;
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
    var result = this.adds(cells, destArr, test, replace);
    if (test || !result) {
        // Put the cells back (should always succeed)
        if(!this.adds(cells, srcArr)) {
            alert("something horrible has happened");
        }
    }
    return result;
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
// Pills will move together.  Returns [] of positions upon success.
Map.prototype.moveContextually = function(src, dest, test, replace) {
    var cell = this.at(src);

    // Require a movable cell type
    if (!cell || !cell.type.movable) {return false;}

    // Move the cell if unlinked
    if (!cell.type.opposite) {
        var result = this.move(src, dest, test, replace);
        if (result) {return [result];}
        return result;
    }

    // Determine where the 2 cells should go
    var srcArr  = [src,   src.offset(cell.type.opposite)];
    var destArr = [dest, dest.offset(cell.type.opposite)];

    // Move the 2 cells together
    return this.moveTogether(srcArr, destArr, test, replace);
};

// Moves a set of cells (all or none), each by a corresponding offset
Map.prototype.offsetEach = function(srcArr, offArr, test, replace) {
    var destArr = [];
    for (var i = 0; i < srcArr.length; i++) {
        destArr.push(srcArr[i].offset(offArr[i]));
    }
    return this.moveTogether(srcArr, destArr, test, replace);
};

// Moves a set of cells (all or none), all by a common offset
Map.prototype.offsetTogether = function(srcArr, offset, test, replace) {
    var destArr = srcArr.map(function(pos) {
        return pos.offset(offset);
    });
    return this.moveTogether(srcArr, destArr, test, replace);
};

Map.prototype.entranceBlocked = function() {
    return this.atC(1, 3) || this.atC(1, 4);
};

Map.prototype.randomBlankPosition = function(rowMin, rowMax, colMin, colMax) {
    var pos;
    rowMin = rowMin || 0,
    rowMax = rowMax || this.rows,
    colMin = colMin || 0,
    colMax = colMax || this.cols;

    do {
        pos = Position(
            getRandomInt(rowMin, rowMax),
            getRandomInt(colMin, colMax)
        );
    } while (this.at(pos));
    return pos;
};

Map.byRow = function(a, b) {return b.row - a.row || b.col - a.col;};
Map.byCol = function(a, b) {return b.col - a.col || b.row - a.row;};

Map.prototype.emptyStreak = function(position, horizontal) {
    var directions = horizontal ? ["right", "left"] : ["below", "above"];
    if (!this.empty(position)) {
        alert("this muffucka");
        return [];
    }
    var streak = [],
        pos = position;

    do {
        // Collect
        streak.unshift(pos);
        // Move
        pos = pos[directions[0]]();
    } while (this.empty(pos));

    // Rewind, then go left or up
    pos = position[directions[1]]();
    cell = this.at(pos);
    while (this.empty(pos)) {
        // Collect
        streak.push(pos);
        // Move
        pos = pos[directions[1]]();
    }
    return streak;
};
// Given a set of positions, returns [ ] of streaks (each an [ ] of Positions).
// If an {} is passed in as 'collector', it will used to accumulate unique
// positions in it's values
Map.prototype.positionStreaks = function(minLength, positions, horizontal, collector) {
    var streaks = [],
        streak  = [],
        color = null,
        minLength = minLength || 1,
        pos = null,
        cell = null;

    positions.sort(horizontal ? Map.byRow : Map.byCol);
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
            streak.unshift(pos);

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
            if (collector) {
                for (var s = streak.length; s--;) {
                    collector[streak[s].row * this.cols + streak[s].col] = streak[s];
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

Map.prototype.occupancy = function() {
    return this.occupantCount / (this.rows * this.cols);
};

var HP = 10;
var FULLHP = 3 * HP;

Map.prototype.healthAt = function(position, healthyColor, multiplier, horizontal) {
    multiplier = multiplier || 1;
    var cell = this.at(position);
    if (cell) {
        // We've reached a different bug, escape
        if (cell.type === Cell.TYPE.BUG && healthyColor != null) {
            return 0;
        } else {
            // Entry point for new recursive call
            // healthyColor = healthyColor || cell.color;

            // Healthy color subtracts health, otherwise add full health
            var healthDelta = multiplier * (cell.color === healthyColor ? -HP : FULLHP);

            return healthDelta + this.healthAt(position.above(), cell.color, multiplier, horizontal);
        }
    }
    // Empty cell
    else if (cell === null) {
        if (!healthyColor) {
            alert("no healthyColor ever defined");
            return;
        }
        // Jump to after empties
        var nextPos = this.emptyStreak(position).pop().above();
        return this.healthAt(nextPos, healthyColor, 1, horizontal);
    }
    // Cell is OOB
    return 0;
};

Map.prototype.getHealthAt = function(position, horizontal) {
    // Do not let values get to zero if they still exist
    return Math.max(HP / 2, this.healthAt(position, null, null, horizontal));
};

Map.prototype.bugHealth = function(horizontal) {
    var pos = null,
        cell = null,
        positions = this.positions,
        totalHealth = 0;

    // For each position, find streak
    for (var i = 0; i < positions.length; i++) {
        pos = positions[i];
        cell = this.at(pos);

        // Skip non-bugs
        if (!cell || cell.type !== Cell.TYPE.BUG) {continue;}
        totalHealth += this.getHealthAt(pos, horizontal);
    }
    return totalHealth;
};

Map.prototype.bugHealth2 = function(horizontal) {
    // positions = this.bugPositions
    // for (var i = 0; i < this.positions.length; i++) {
    //     var pos = positions[i];
    //     var cell = this.at(pos);
    //     // Skip non-bugs
    //     if (!cell || cell.type !== Cell.TYPE.BUG) {continue;}
    //     var health = 3;

    //     // Go upwards
    //     var nextPos = pos.above();
    //     while (true) {
    //         var nextCell = this.at(nextPos);
    //         if 
    //     }
    // }

    var color = null,
        pos = null,
        cell = null,
        positions = this.positions,
        health = 0,
        totalHealth = 0;

    var directions = horizontal ? ["right", "left"] : ["below", "above"];
    // For each position, find streak
    for (var i = 0; i < positions.length; i++) {
        pos = positions[i];
        cell = this.at(pos);

        // Skip non-bugs
        if (!cell || cell.type !== Cell.TYPE.BUG) {continue;}

        health = 30;
        color = cell.color;

        // PHASE 1: Find consecutive colors, lower health score

        // Go right/down, find consecutive colors
        pos = pos[directions[0]]();
        cell = this.at(pos);
        while (
            cell &&
            cell.color === color
        ) {
            health -= 10;
            pos = pos[directions[0]]();
            cell = this.at(pos);
        }
        // Rewind, then go other direction
        pos = positions[i][directions[1]]();
        cell = this.at(pos);
        while (
            cell &&
            cell.color === color
        ) {
            health -= 10;
            pos = pos[directions[1]]();
            cell = this.at(pos);
        }
        totalHealth += Math.max(0, health);
    }
    return totalHealth;


        // Dif colored cell
      /*  var nextColor = null;
        if (!cell || cell.type === Cell.TYPE.BUG) {
            // end that direcction
        } else {

        }
            if (!cell.type === Cell.TYPE.BUG) {
                // end of health count
            }
            nextColor = cell.color;
        }
        while (cell) {
            health += 10;
            pos = pos[directions[0]]();
            cell = this.at(pos);
            var newColor = cell.color;
        }
        // Found blank
        else {

        }*/





};

Map.prototype.horizontalStreaks = function(minLength, positions, collector) {
    // If positions are provided, only streaks involving those
    // positions are returned.  Intended as an optimization.
    if (positions) {
        return this.positionStreaks(minLength, positions, true, collector);
    }

    var streaks = [],
        streak  = [],
        color = null,
        minLength = minLength || 1,
        rows = this.rows,
        cols = this.cols,
        pos = null,
        cell = null;

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
                if (collector) {
                    for (var s = streak.length; s--;) {
                        collector[streak[s].row * cols + streak[s].col] = streak[s];
                    }
                }
            }

            // Fast forward iterator to streak end position
            col = pos.col - 1;
        }
    }
    return streaks;
};

Map.prototype.verticalStreaks = function(minLength, positions, collector) {
    // If positions are provided, only streaks involving those
    // positions are returned.  Intended as an optimization.
    if (positions) {
        return this.positionStreaks(minLength, positions, false, collector);
    }

    var streaks = [],
        streak  = [],
        color = null,
        minLength = minLength || 1,
        rows = this.rows,
        cols = this.cols,
        pos = null,
        cell = null;

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
                if (collector) {
                    for (var s = streak.length; s--;) {
                       collector[streak[s].row * cols + streak[s].col] = streak[s];
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
Map.prototype.killables = function(positions, minLength) {
    // this.sanityCheck("start killables");

    minLength = minLength || 4;
    var collector = {};
    this.verticalStreaks(minLength, positions, collector);
    this.horizontalStreaks(minLength, positions, collector);
    return Object.keys(collector).map(function(key) {return collector[key];});
};



// Moves all eligable cells downward once.  Repeats if allTheWay
// Returns [] of positions of cells that were moved
Map.prototype.settle = function(positions, allTheWay) {

    // this.sanityCheck("start settle");

    positions = positions || this.positions;
    var allMovers = {};
    do {
        var settledPositions = {};
        // For each position
        var i = positions.length;
        while (i--) {
            // if (i==120) {
            //     console.log("this is the guy");
            // }
            // Attempt move downward, record ending positions of moved items
            var movedArr = this.moveContextually(positions[i], positions[i].below());
            if (movedArr) {
                for (var j = movedArr.length; j--;) {
                    // Convenience alias
                    var newPos  = movedArr[j];
                    var prevPos = newPos.above();
                    // Clear the allmovers where the pieces were previously
                    delete allMovers[prevPos.row * this.cols + prevPos.col];
                }
                for (var j = movedArr.length; j--;) {
                    // Convenience alias
                    var newPos  = movedArr[j];
                    var prevPos = newPos.above();

                    // Record moved position for local use
                    settledPositions[newPos.row * this.cols + newPos.col] = newPos;

                    // Record moved position for final output
                    allMovers[newPos.row * this.cols + newPos.col] = newPos;
                }
            }
        }
        // Only positions that moved are tested next round
        positions = Object.keys(settledPositions).map(function(key) {
            return settledPositions[key];
        });
    } while (positions.length && allTheWay);
    // Return ending positions of anything that moved
    var endPositions = Object.keys(allMovers).map(function(key) {
        return allMovers[key];
    });
    if (endPositions.length) {
        return endPositions;
    }
    return false;
};

// Like 'removes', but is contextual toward cell type (AKA, destroying half of
// a pill will leave the other half as an orphan type)
// Returns [Position] of cells that could be affected (like orphans or above cells))
// Map.prototype.destroy = function(posArr) {
//     var map = this;
//     var affectedPositions = [];

//     posArr.forEach(function(pos) {
//         var cell = map.at(pos);
//         if (cell.type.opposite) {
//             var opPos = cell.position.offset(cell.type.opposite);
//             map.at(opPos).type = Cell.TYPE.ORPHAN;
//             affectedPositions.push(opPos);
//         }
//         map.remove(pos);
//     });
//     posArr.forEach(function(pos) {
//         if (map.at(pos.above())) {
//             affectedPositions.push(pos);
//         }
//     });
//     return affectedPositions;
// };


// This one is trying to return 'affected' positions, so we can feed into
// the settle function, but you never know how high a stack is
// Map.prototype.destroy = function(posArr) {
//     var map = this;
//     var affectedPositions = [];
//     posArr.forEach(function(pos) {
//         var cell = map.at(pos);
//         if (cell.type.opposite) {
//             var opPos = cell.position.offset(cell.type.opposite);
//             map.at(opPos).type = Cell.TYPE.ORPHAN;
//             affectedPositions.push(opPos);
//         }
//         map.remove(pos);
//     });
//     affectedPositions = affectedPositions.filter(function(pos) {
//         return map.at(pos);
//     });
//     posArr.forEach(function(pos) {
//         if (map.at(pos.above())) {
//             affectedPositions.push(pos);
//         }
//     });
//     return affectedPositions;
// };

Map.prototype.destroy = function(posArr) {
    // this.sanityCheck("start destroy");

    var map = this;
    this.ats(posArr).forEach(function(cell) {
        if (cell.type.opposite) {
            var opPos = cell.position.offset(cell.type.opposite);
            map.at(opPos).type = Cell.TYPE.ORPHAN;
        }
        // Sanity check
        if (!cell.position) {
            console.log("nothing at position");
        }
        map.remove(cell.position);
    });

    // this.sanityCheck("end destroy");
};

Map.prototype.settleAndDestroy = function(posArr) {
    // this.sanityCheck("start settle&destroy");

    var killables = this.killables(posArr);
    while (killables.length) {
        var affected = this.destroy(killables);
        // var aboveKills = killables.map(function(pos) {return pos.above();});
        var settled = this.settle(null, true);
        if (settled) {
            killables = this.killables(settled);
        } else {
            killables = [];
        }
    }

    // this.sanityCheck("end settledestroy");
    // while (this.settle(null, true) && this.destroy(this.killables()).length) {}
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

Map.prototype.toString = function() {
    return this.rows + " " + this.cols + " " +
           this.cells.map(function(cell) {
                if (cell) {
                    return cell.toString();
                }
                return "--";
           }).join(" ");
};

Map.prototype.print2 = function() {
    // styledConsoleLog('<span style="color:hsl(0, 100%, 90%);background-color:hsl(0, 100%, 50%);"> Red </span> <span style="color:hsl(39, 100%, 85%);background-color:hsl(39, 100%, 50%);"> Orange </span> <span style="color:hsl(60, 100%, 35%);background-color:hsl(60, 100%, 50%);"> Yellow </span> <span style="color:hsl(120, 100%, 60%);background-color:hsl(120, 100%, 25%);"> Green </span> <span style="color:hsl(240, 100%, 90%);background-color:hsl(240, 100%, 50%);"> Blue </span> <span style="color:hsl(300, 100%, 85%);background-color:hsl(300, 100%, 25%);"> Purple </span> <span style="color:hsl(0, 0%, 80%);background-color:hsl(0, 0%, 0%);"> Black </span>');

    // var line = "__________________________\n";
    var s = this.toString();
    s += "\n  \t 0 1 2 3 4 5 6 7";
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
            text = cell.type.shortName;
            s += '<span style="color:' + color + ';background-color: #' + cell.color.value.toString(16) + ';">' + text + '</span>';
        }
        else s += '<span style="color:hsl(0, 100%, 90%);background-color: black;">  </span>';
    }
    s+="\n  \t 0 1 2 3 4 5 6 7";
    styledConsoleLog(s);
    // return s + "\n" + line;
};



Map.prototype.print = function(miscStats) {
    // styledConsoleLog('<span style="color:hsl(0, 100%, 90%);background-color:hsl(0, 100%, 50%);"> Red </span> <span style="color:hsl(39, 100%, 85%);background-color:hsl(39, 100%, 50%);"> Orange </span> <span style="color:hsl(60, 100%, 35%);background-color:hsl(60, 100%, 50%);"> Yellow </span> <span style="color:hsl(120, 100%, 60%);background-color:hsl(120, 100%, 25%);"> Green </span> <span style="color:hsl(240, 100%, 90%);background-color:hsl(240, 100%, 50%);"> Blue </span> <span style="color:hsl(300, 100%, 85%);background-color:hsl(300, 100%, 25%);"> Purple </span> <span style="color:hsl(0, 0%, 80%);background-color:hsl(0, 0%, 0%);"> Black </span>');

    // var line = "__________________________\n";
    var s = this.toString();
    s += "\n  \t 0 1 2 3 4 5 6 7";
    var pos = {};
    for (var i = 0; i < this.positions.length; i++) {
        if (this.positions[i].row !== pos.row) {
            if (pos.row == 0) {
                s += "\t\tFull:   \t" + Math.floor(this.occupancy() * 100) + "%\t(" + this.occupantCount + ")";
            }
            if (pos.row == 1) {
                s += "\t\tBugs:   \t" + this.bugCount + "\t(" + Math.floor(this.bugCount/this.occupantCount * 100) + "% of occupants)";
            }
            if (pos.row == 2) {
                s += "\t\tBugHP:  \t" + this.bugHealth();
            }
            if (pos.row == 3) {
                s += "\t\tStreaks:\t" + this.verticalStreaks().length + "/" + this.horizontalStreaks().length + "\t(V/H)";
            }
            if (pos.row > 4 && miscStats && miscStats[pos.row - 5]) {
                var stat = miscStats[pos.row - 5];
                s += "\t\t" + stat.name + ":\t" + stat.text;
            }

            // Row #
            s += "\n" + this.positions[i].row + "\t";
        }
        pos = this.positions[i];
        var cell = this.at(pos);
        if (cell) {
            var text = cell.type.shortName;
            var color = cell.color.name == "Yellow" ? "black" : "white";

            // show bug health
            if (cell.type === Cell.TYPE.BUG) {
                var health = this.getHealthAt(pos)/10;
                if (health > 0 && health < 1) {
                    text = "**";
                } else {
                    text = Math.ceil(health);
                    if (text > 99) {
                        text = "++";
                    } else {
                        text = padDigits(text, 2);
                    }
                }

            }
            s += '<span style="color:' + color + ';background-color: #' + cell.color.value.toString(16) + ';">' + text + '</span>';
        }
        else s += '<span style="color:hsl(0, 100%, 90%);background-color: black;">  </span>';
    }
    s+="\n  \t 0 1 2 3 4 5 6 7";
    styledConsoleLog(s);
    // return s + "\n" + line;
};

var testMap = Map.fromString("17 8 - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - yB - - - yB - - - - - - - - - - - - - rB - - rB - - - rB - - yB - - - yB - - - yB - bB - - yB r^ rB - - - - - - bU yB - - - bO yB - bB rB - - bB bO - r( b) - - - - yB yB - bB - - - - bB - r( b) - - - - - yB - rB bB - - - bB -");
var testMap2 = Map.fromString("17 8 -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- y( r) -- -- -- -- -- -- -- y( b) -- -- -- -- -- -- r( b) -- -- -- -- -- -- -- bB -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- y( r) -- -- -- -- -- -- -- rO -- -- -- -- -- -- -- rO -- -- --");

function padDigits(number, digits) {
    return Array(Math.max(digits - String(number).length + 1, 0)).join(0) + number;
}