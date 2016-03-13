var debug = true;
var log = function(msg) { if (debug) console.log(msg);}

// Returns a random integer between min (included) and < max (not included)
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

// Returns a random integer between min (included) and max (included)
function getRandomIntInclusive(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
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
    // Make colors publically available (necessary?)
    Object.keys(colors).forEach(function(key,index) {
        this[key] = colors[key];
    });

    // Return a random color
    this.random = function() {
        var keys = Object.keys(colors);
        return colors[keys[getRandomInt(0, keys.length)]];
    };
};

const bugPalette = new ColorPalette({
    RED:    {name: "Red",    value: 0xFF0000},
    YELLOW: {name: "Yellow", value: 0xFFFF00},
    BLUE:   {name: "Blue",   value: 0x0000FF},
});

const TYPE = {
    BUG:    {name: "Bug",           frame: "bug.png",   rotation: 0},
    TOP:    {name: "Pill Top",      frame: "pill.png",  rotation: toRadians(-90)},
    BOTTOM: {name: "Pill Bottom",   frame: "pill.png",  rotation: toRadians(90)},
    LEFT:   {name: "Pill Left",     frame: "pill.png",  rotation: toRadians(180)},
    RIGHT:  {name: "Pill Right",    frame: "pill.png",  rotation: 0},
    ORPHAN: {name: "Pill Piece",    frame: "bug.png",   rotation: 0},
};

var Position = function(row, col) {
    this.set = function(row, col) {
        this.row = row;
        this.col = col;
    };
    this.above = function(n) {
        return new Position(this.row - (n || 1), this.col);
    };
    this.below = function(n) {
        return this.above(-(n || 1));
    };
    this.toLeft = function(n) {
        return new Position(this.row, this.col - (n || 1));
    };
    this.toRight = function(n) {
        return this.toLeft(-(n || 1));
    };
    this.set(row, col);
};

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
                log(msg + "success(Promise)");
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

var Events = (function() {
    var registeredComponents = [];
    // Notifies all registered components of the new game state ()
    return {
        register: function() {
            for (var i = 0; i < arguments.length; i++) {
                registeredComponents.push(arguments[i]);
            }
        },
        unRegister: function() {
            for (var i = 0; i < arguments.length; i++) {
                registeredComponents.pop(arguments[i]);
            }
        },
        emit: function() {
            var args = arguments;
            log("\n" + arguments[0]);
            return Promise.all(registeredComponents.map(
                function(component) {
                    return component.handleEvent.apply(component, args);
                })
            );
        }
    };
} ());
