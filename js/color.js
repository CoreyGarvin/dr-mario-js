var Color = function(name, value, char) {
    this.name = name;
    this.value = value;
    this.char = char || name.substring(0, 1).toLowerCase();

    Color.LOOKUP = Color.LOOKUP || {};
    Color.LOOKUP[this.char] = this;
};

Color.LOOKUP = {};

Color.RED    = new Color("Red",    0xDD2222);
Color.YELLOW = new Color("Yellow", 0xDDDD22);
Color.BLUE   = new Color("Blue",   0x2222DD);

Color.fromString = function(s) {
    return Color.LOOKUP[s];
};

var ColorPalette = function(colors) {
    var self = this;
    // Make colors publically available (necessary?)
    Object.keys(colors).forEach(function(key) {
        self[key] = colors[key];
    });

    // Return a random color
    this.random = function() {
        var keys = Object.keys(colors);
        return colors[keys[getRandomInt(0, keys.length)]];
    };
};

const BUG_COLORS = new ColorPalette({
    RED:    Color.RED,
    YELLOW: Color.YELLOW,
    BLUE:   Color.BLUE,
});