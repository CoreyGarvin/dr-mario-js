var debug = false;
// var debug = true;
var log = function(msg) { if (debug) console.log(msg);}

function uniqueFilter(value, index, self) {
    return self.indexOf(value) === index;
}

// Returns a random integer between min (included) and < max (not included)
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

// Returns a random integer between min (included) and max (included)
function getRandomIntInclusive(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function init1d(n, val) {
  var array = [];
  while (n--) array.push(val);
  return array;
}

function init2d(rows, cols, val) {
  var array = [], row = [];
  while (cols--) row.push(val);
  while (rows--) array.push(row.slice());
  return array;
}

function toRadians(deg) {
    return deg * Math.PI / 180;
}

var ColorPalette = function(colors) {
    var self = this;
    // Make colors publically available (necessary?)
    Object.keys(colors).forEach(function(key,index) {
        self[key] = colors[key];
    });

    // Return a random color
    this.random = function() {
        var keys = Object.keys(colors);
        return colors[keys[getRandomInt(0, keys.length)]];
    };
};

const BUG_COLORS = new ColorPalette({
    RED:    {name: "Red",    value: 0xDD2222},
    YELLOW: {name: "Yellow", value: 0xDDDD22},
    BLUE:   {name: "Blue",   value: 0x2222DD},
});





var Component = function(name, handlers) {
    var handlers = handlers;
    this.name = name;

    /*
    Contact point between the controller and a component.  Components
    whose 'states' var contains a function(keyed by state name) are
    effectively 'listening' to state changes broadcasted from the
    controller.  State change handlers may return a Promise, enabling
    them to effectively take as much time as they need to "return";
    @param {String} arguments[0]
    @param {(any)}  (all other args)
    @return {Promise}
     */
    this.handleEvent = function() {
        var arguments = Array.prototype.slice.call(arguments);
        var event = arguments.shift();
        if (handlers.hasOwnProperty(event)) {
            var msg = ("\tACCEPTED:\t" + this.name);
            var p = handlers[event].apply(this, arguments);
            if (p instanceof Object && p.hasOwnProperty("then")) {
                log(msg + "\tsuccess(Promise)");
                return p;
            } else {
                log(msg + "\tsuccess(" + (p == null ? "" : p) + ")");
                return Promise.resolve(p);
            }
        }
        log("\tIGNORED :\t" + this.name);
        return Promise.resolve();
    };
};

// Simple event system
var EventSystem = function(name, enabled) {
    var registeredComponents = [];
    // Notifies all registered components of the new game state ()
    this.enabled = enabled || false;
    this.register = function() {
        for (var i = 0; i < arguments.length; i++) {
            registeredComponents.push(arguments[i]);
        }
    };
    // Untested
    this.unRegister = function() {
        registeredComponents = registeredComponents.filter(function(cmpt) {
            return arguments.indexOf(cmpt) == -1;
        });
    };
    this.emit = function() {
        if (!this.enabled) {
            return Promise.resolve();
        }
        var args = arguments;
        log("\n" + name + ": " + arguments[0]);
        return Promise.all(registeredComponents.map(function(component) {
            return component.handleEvent.apply(component, args);
        }));
    };
};

var killablesOld = function(n) {
    var output = {};
    // Horizontal Scan
    for(var row = 0; row < map.length; row++) {
        for(var col = 0; col < map[row].length; col++) {
            // Skip blanks
            if (!map[row][col]) {
                continue;
            }
            // Accumulate consecutive colors
            var streak = [];
            do {
                streak.push(map[row][col++]);
            } while(col < map[row].length && map[row][col] && map[row][col].color === streak[streak.length - 1].color);
            col--;

            // Add streak to our output
            if (streak.length >= n) {
                streak.forEach(function(cell) {
                    output[cell.id] = cell;
                });
            }
        }
    }
    // Vertical scan
    for(var col = 0; col < map[0].length; col++) {
        for(var row = 0; row < map.length; row++) {
            // Skip blanks
            if (!map[row][col]) {
                continue;
            }
            // Accumulate consecutive colors
            var streak = [];
            do {
                streak.push(map[row++][col]);
            } while(row < map.length && map[row][col] && map[row][col].color === streak[streak.length - 1].color);
            row--;

            // Add streak to our output
            if (streak.length >= n) {
                streak.forEach(function(cell) {
                    output[cell.id] = cell;
                });
            }
        }
    }
    // Return [] of cells
    return Object.keys(output).map(function(key) {
        return output[key];
    });
};

// map.findStreaks = function() {
//     var streaks = [];

//     // Function names for each direction of each axis
//     [["above", "below"],["toLeft", "toRight"]]
//     .forEach(function(axis) {
//         var pool = map.cells.slice();

//         // Find streaks
//         while (pool.length > 0) {
//             var streak = new Streak(pool[0]);

//             axis.forEach(function(direction) {
//                 var next = pool[0];
//                 do {
//                     next = map.at(next.position[direction]());
//                 } while(next && streak.add(next));
//             });
//             streaks.push(streak);
//             pool = pool.filter(function(cell) {
//                 return !streak.contains(cell);
//             });
//         }
//     });
//     return streaks;
// };
// 
// 


function styledConsoleLog() {
    var argArray = [];

    if (arguments.length) {
        var startTagRe = /<span\s+style=(['"])([^'"]*)\1\s*>/gi;
        var endTagRe = /<\/span>/gi;

        var reResultArray;
        argArray.push(arguments[0].replace(startTagRe, '%c').replace(endTagRe, '%c'));
        while (reResultArray = startTagRe.exec(arguments[0])) {
            argArray.push(reResultArray[2]);
            argArray.push('');
        }

        // pass through subsequent args since chrome dev tools does not (yet) support console.log styling of the following form: console.log('%cBlue!', 'color: blue;', '%cRed!', 'color: red;');
        for (var j = 1; j < arguments.length; j++) {
            argArray.push(arguments[j]);
        }
    }

    console.log.apply(console, argArray);
}