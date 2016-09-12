//This game is based on Dark Blue by Thomas Palef, as per chapter 15 of 'Eloquent JavaScript' by Marijn Haverbeke

/* 
@ = Player start
o = Coin
x = Solid ground
! = Lava
= = Vertical lava
v = Dripping lava
| = Flowing lava
*/

console.log("alive!");
var simpleLevelPlan = [
  "                      ",
  "                      ",
  "  x              = x  ",
  "  x         o o    x  ",
  "  x @      xxxxx   x  ",
  "  xxxxx            x  ",
  "      x!!!!!!!!!!!!x  ",
  "      xxxxxxxxxxxxxx  ",
  "                      "
];

function Level(plan) {
  this.width = plan[0].length;
  this.height = plan.length;
  // Array of arrays, each position containing null or a character
  this.grid = [];
  // Contains all of the dynamic objects (lava, coin or player),
  // along with their position and state
  this.actors = [];
  
  for (var y = 0; y < this.height; y++) {
    var line = plan[y], gridLine = [];
    for (var x = 0; x < this.width; x++) {
      var ch = line[x], fieldType = null;
      var Actor = actorChars[ch];
      if (Actor)
        // This constructs the referenced moving object in
        // actorChars and pushes it to the actors array
        this.actors.push(new Actor(new Vector(x, y), ch));
      else if (ch == 'x')
        // Wall
        fieldType = 'wall';
      else if (ch == '!')
        // Stationary lava
        fieldType = 'lava';
      gridLine.push(fieldType);
    }
    this.grid.push(gridLine);
  }
  // Find the Player actor
  this.player = this.actors.filter(function(actor) {
    return actor.type == 'player';
  })[0];
  // Track whether the player has won or lost;
  // finishDelay keeps the level active for a brief period of time
  this.status = this.finishDelay = null;
}

//check whether level is completed
Level.prototype.isFinished = function() {
  return this.status !== null && this.finishDelay < 0;
};




//Storing position and size of actors, using Vector
function Vector (x, y) {
  this.x = x; this.y = y; 
}
Vector.prototype.plus = function(other) {
  return new Vector (this.x + other.x, this.y + other.y);
};
//Scales vector by a given amount
Vector.prototype.times = function(factor) {
  return new Vector(this.x * factor, this.y * factor);
};

//Actors
var actorChars = {
  "@": Player,
  "o": Coin,
  "=": Lava, "|": Lava, "v": Lava
};

//Constructor to build player type
function Player(pos) {
  //initial player position set to 0.5 squares above position where @ character appeared
  this.pos = pos.plus(new Vector(0, -0.5));
  //Player is 1.5 squares high
  this.size = new Vector(0.8, 1.5);
  this.speed = new Vector (0, 0);
}
Player.prototype.type = "player";

//properties for 'lava' depend on type
function Lava(pos, ch) {
  this.pos = pos;
  this.size = new Vector(1, 1);
  if (ch == "=") {
    this.speed = new Vector(2, 0);
  } else if (ch == "|") {
    this.speed = new Vector(0, 2);
  } else if (ch == "v") {
    this.speed = new Vector(0, 3);
    this.repeatPos = pos;
  }
}

Lava.prototype.type = "lava";

function Coin(pos) {
  this.basePos = this.pos = pos.plus(new Vector(0.2, 0.1));
  this.size = new Vector(0.6, 0.6);
  //gives coin a random starting position on Sin wave (ie, a wobble)
  this.wobble = Math.random() * Math.PI * 2;
}

Coin.prototype.type = "coin";


//helper function to create an element and give it a class
function elt(name, className) {
  var elt = document.createElement(name);
  if (className) elt.className = className;
  return elt;
}

//creating a display
function DOMDisplay(parent, level) {
  this.wrap = parent.appendChild(elt('div', 'game'));
  this.level = level;
  
  // Background is drawn only once
  this.wrap.appendChild(this.drawBackground());
  // The actorLayer is animated in the drawFrame() method
  this.actorLayer = null;
  this.drawFrame();
}
//scale variable gives number of pixels a single unit takes up on screen
var scale = 20;

// Draw the background
DOMDisplay.prototype.drawBackground = function() {
  var table = elt('table', 'background');
  table.style.width = this.level.width * scale + 'px';
  this.level.grid.forEach(function(row) {
    var rowElt = table.appendChild(elt('tr'));
    rowElt.style.height = scale + 'px';
    row.forEach(function(type) {
      rowElt.appendChild(elt('td', type));
    });
  });
  return table;
};

//Drawing each character by creating a DOM element for it
DOMDisplay.prototype.drawActors = function() {
  var wrap = elt("div");
  this.level.actors.forEach(function(actor) {
    var rect = wrap.appendChild(elt("div",
                                    "actor " + actor.type));
    rect.style.width = actor.size.x * scale + "px";
    rect.style.height = actor.size.y * scale + "px";
    rect.style.left = actor.pos.x * scale + "px";
    rect.style.top = actor.pos.y * scale + "px";
  });
  return wrap;
};

DOMDisplay.prototype.drawFrame = function() {
  if (this.actorLayer)
    this.wrap.removeChild(this.actorLayer);
  this.actorLayer = this.wrap.appendChild(this.drawActors());
  this.wrap.className = "game" + (this.level.status || "");
  this.scrollPlayerIntoView();
};

//Locate player position & update wrapping element's scroll position
DOMDisplay.prototype.scrollPlayerIntoView = function() {
  var width = this.wrap.clientWidth;
  var height = this.wrap.clientHeight;
  var margin = width / 3;

  //the viewport
  var left = this.wrap.scrollLeft, right = left + width;
  var top = this.wrap.scrollTop, bottom = top + width;

  var player = this.level.player;
  var center = player.pos.plus(player.size.times(0.5)).times(scale);

  if(center.x < left + margin)
    this.wrap.scrollLeft = center.x - margin;
  else if(center.y < top + margin)
    this.wrap.scrollTop = center.y - margin;
  else if(center.y > bottom - margin)
    this.wrap.scrollTop = center.y + margin - height;
};

//Clear displayed level
DOMDisplay.prototype.clear = function() {
  this.wrap.parentNode.removeChild(this.wrap);
  };

