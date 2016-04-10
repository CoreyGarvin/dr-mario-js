       // map.add = function(cells) {
        //     var cells = cells.constructor === Array ? cells : [cells];
        //     cells.forEach(function(cell) {
        //         cell.moveTo = function(position, test, force, ignoreList) {
        //             ignoreList = ignoreList || game.piece.parts;
        //             force = force || false;

        //             // Check bounds
        //             if (!force && !map.inBounds(position) && map.inBounds(this.position)) {
        //                 return false;
        //             }
        //             if (force && test) {
        //                 return true;
        //             }
        //             // Check if space is already occupied
        //             var occupant = map.at(position);
        //             if (!force && occupant && ignoreList.indexOf(occupant) == -1) {
        //                 return false;
        //             }
        //             // Move the cell
        //             if (!test) {
        //                 this.position = position;
        //             }
        //             return true;
        //         };
        //         cell.destroy = function() {
        //             // necessary?
        //             this.destroyed = true;
        //             // Remove from map
        //             map.remove(this);
        //             // Remove from cells list
        //             // cells.filter(function(cell) {
        //             //     return this !== cell;
        //             // });
        //             var otherPiece = null;
        //             if (this.type === TYPE.LEFT) otherPiece = map.at(this.position.toRight());
        //             if (this.type === TYPE.RIGHT) otherPiece = map.at(this.position.toLeft());
        //             if (this.type === TYPE.TOP) otherPiece = map.at(this.position.below());
        //             if (this.type === TYPE.BOTTOM) otherPiece = map.at(this.position.above());
        //             if (otherPiece) {
        //                 otherPiece.type = TYPE.ORPHAN;
        //             } else {
        //                 console.log("how could this be?");
        //             }
        //             return game.events.emit("cellDestroyed", this);
        //         };

        //         cell.moveUp = function(n, test, force, ignoreList) {
        //             return this.moveTo(this.position.above(n), test, force, ignoreList);
        //         };
        //         cell.moveDown = function(n, test, force, ignoreList) {
        //             return this.moveTo(this.position.below(n), test, force, ignoreList);
        //         };
        //         cell.moveLeft = function(n, test, force, ignoreList) {
        //             return this.moveTo(this.position.toLeft(n), test, force, ignoreList);
        //         };
        //         cell.moveRight = function(n, test, force, ignoreList) {
        //             return this.moveTo(this.position.toRight(n), test, force, ignoreList);
        //         };
        //         map.cells.push(cell);
        //     });

        };

        var Streak = function(cells) {
            var cells = cells.constructor === Array ? cells : [cells];
            // this.length = cells.length;
            this.color = cells[0].color;
            this.cells = function() {
                return cells;
            };
            this.contains = function(cell) {
                return cells.indexOf(cell) != -1;
            };
            // Only allows adding same-color cells
            this.add = function(cell) {
                return cell.color === this.color && cells.push(cell);
            };
        };


            var initb = function() {
                while (map.cells.length < nBugs) {
                    map.add(new Cell(randomBlankPosition(4)));
                    map.killables(3).forEach(function(cell) {
                        cell.destroy();
                    });
                }
            };

            var inita = function() {
                while (map.cells.length < 104) {
                    map.add(new Cell(randomBlankPosition(4)));
                }
                map.cells.filter(function(cell){
                    return [cell.position.row-1,cell.position.row,cell.position.row].indexOf(Math.floor(cell.position.col)) != -1;
                    // return cell.position.col == 2 || cell.position.row == 7 || (cell.position.row >=6 && cell.position.col ==6);
                    // return [2,6].indexOf(cell.position.col) != -1 || cell.position.row == 8;
                }).forEach(function(cell) {
                    cell.destroy();
                });
            };

            // Generate board or use predefined cells
            init();
            console.log(map.toString());
            // console.log(map.verticalStreaks());
            map.verticalStreaks(1, [new Position(13, 7), new Position(14, 7), new Position(16, 7)]);
            // if ((cells || []).length == 0) {
            //     init();
            // } else {
            //     map.add(cells);
            // }
        };


        this.rotate = function(cc) {
            var horz = this.parts[0].position.row === this.parts[1].position.row;
            // Horizontal -> Vertical rotation
            if (horz) {
                // Default unobstructed
                if (!this.parts[1].moveTo(this.parts[0].position.above())) {
                    // Try above-right
                    if (this.parts[1].moveUp()) {
                        this.parts[0].moveRight();
                    // Try below
                    } else if (!this.parts[1].moveTo(this.parts[0].position.below())) {
                        // Try below-right
                        if (this.parts[1].moveDown()) {
                            this.parts[0].moveRight();
                        } else return false;
                    }
                }
            // Vertical -> Horizontal, try right
            } else if (!this.parts[1].moveTo(this.parts[0].position.toRight())) {
                // Try shifting left
                if (this.parts[0].moveLeft()) {
                    this.parts[1].moveDown();
                } else return false;
            }
            // Achieve counter-clockwise rotation by
            // swapping positions
            if ((horz && !cc) || (!horz && cc)) {
                var tmp = this.parts[0].position;
                this.parts[0].moveTo(this.parts[1].position, false, true);
                this.parts[1].moveTo(tmp, false, true);
            }
            // Ensure parts[0] is the most lower-right cells
            this.parts.sort(function(a,b) {
                return b.position.row - a.position.row ||
                a.position.col - b.position.col;
            });
            // Set cells types
            if (horz) {
                this.parts[0].type = TYPE.BOTTOM;
                this.parts[1].type = TYPE.TOP;
            } else {
                this.parts[0].type = TYPE.LEFT;
                this.parts[1].type = TYPE.RIGHT;
            }
            return true;
        };