/*
A begineer exercise work
Change the original game vertical direction to horizental
Origina from https://github.com/straker/galaxian-canvas-game
And tutorials http://blog.sklambert.com/html5-canvas-game-2d-collision-detection/
*/

var game = new Game();
var lastFrame = Date.now();
var thisFrame;
var elapsed;
var avgFramerate = 0;
var frameCount = 0;
var elapsedCounter = 0;

function init() {
  if (game.init())
    game.start();
}

// imported image
var imageRepository = new function() {
	this.background = new Image();
  this.background2 = new Image();
	this.spaceship = new Image();
	this.bullet = new Image();
	this.enemy = new Image();
	this.enemyBullet = new Image();

	// Ensure all images have loaded before starting the game
	var numImages = 6;
	var numLoaded = 0;
	function imageLoaded() {
		numLoaded++;
		if (numLoaded === numImages) {
			window.init();
		}
	}
	this.background.onload = function() {
		imageLoaded();
	}
  this.background2.onload = function() {
    imageLoaded();
  }
	this.spaceship.onload = function() {
		imageLoaded();
	}
	this.bullet.onload = function() {
		imageLoaded();
	}
	this.enemy.onload = function() {
		imageLoaded();
	}
	this.enemyBullet.onload = function() {
		imageLoaded();
	}

	this.background.src = "imgs/bg.png";
  this.background2.src = "imgs/bg2.png"
	this.spaceship.src = "imgs/ship.png";
	this.bullet.src = "imgs/bullet.png";
	this.enemy.src = "imgs/enemy.png";
	this.enemyBullet.src = "imgs/bullet_enemy.png";
}

//Base drawable object,define variables and funcitons
function Drawable() {
	this.init = function(x, y, width, height) {
		// Defualt variables
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
	}

	this.speed = 0;
	this.canvasWidth = 0;
	this.canvasHeight = 0;
	this.collidableWith = "";
	this.isColliding = false;
	this.type = "";

	// Define abstract function to be implemented in child objects
	this.draw = function() {
	};
	this.move = function() {
	};
	this.isCollidableWith = function(object) {
		return (this.collidableWith === object.type);
	};
}

//background child object
function Background() {
  this.velocity = {'x': -1, 'y': 0}; // Redefine speed of the background for panning
	this.velocity2 = {'x': -0.1, 'y': 0};
	this.x2 = 0;

	// Implement abstract function
	this.draw = function() {
		// Pan background
		this.x += this.velocity.x;
		this.x2 += this.velocity2.x;

		this.context.drawImage(imageRepository.background2, this.x2, this.y);
		this.context.drawImage(imageRepository.background2, this.x2 + this.canvasWidth, this.y);

		//this.context.clearRect(0,0, this.canvasWidth, this.canvasHeight);
		this.context.drawImage(imageRepository.background, this.x, this.y);

		// Draw another image at the top edge of the first image
		this.context.drawImage(imageRepository.background, this.x + this.canvasWidth, this.y);

		// If the image scrolled off the screen, reset
		if (this.x <= -this.canvasWidth)
			this.x = 0;
		if (this.x2 <= -imageRepository.background2.width)
			this.x2 = 0;
	};
}

Background.prototype = new Drawable();

/**
 * QuadTree object.
 *
 * The quadrant indexes are numbered as below:
 *     |
 *  1  |  0
 * —-+—-
 *  2  |  3
 *     |
 */
function QuadTree(boundBox, lvl) {
	var maxObjects = 10;
	this.bounds = boundBox || {
		x: 0,
		y: 0,
		width: 0,
		height: 0
	};
	var objects = [];
	this.nodes = [];
	var level = lvl || 0;
	var maxLevels = 5;
	/*
	 * Clears the quadTree and all nodes of objects
	 */
	this.clear = function() {
		objects = [];
		for (var i = 0; i < this.nodes.length; i++) {
			this.nodes[i].clear();
		}
		this.nodes = [];
	};
	/*
	 * Get all objects in the quadTree
	 */
	this.getAllObjects = function(returnedObjects) {
		for (var i = 0; i < this.nodes.length; i++) {
			this.nodes[i].getAllObjects(returnedObjects);
		}
		for (var i = 0, len = objects.length; i < len; i++) {
			returnedObjects.push(objects[i]);
		}
		return returnedObjects;
	};
	/*
	 * Return all objects that the object could collide with
	 */
	this.findObjects = function(returnedObjects, obj) {
		if (typeof obj === "undefined") {
			console.log("UNDEFINED OBJECT");
			return;
		}
		var index = this.getIndex(obj);
		if (index != -1 && this.nodes.length) {
			this.nodes[index].findObjects(returnedObjects, obj);
		}
		for (var i = 0, len = objects.length; i < len; i++) {
			returnedObjects.push(objects[i]);
		}
		return returnedObjects;
	};
	/*
	 * Insert the object into the quadTree. If the tree
	 * excedes the capacity, it will split and add all
	 * objects to their corresponding nodes.
	 */
	this.insert = function(obj) {
		if (typeof obj === "undefined") {
			return;
		}
		if (obj instanceof Array) {
			for (var i = 0, len = obj.length; i < len; i++) {
				this.insert(obj[i]);
			}
			return;
		}
		if (this.nodes.length) {
			var index = this.getIndex(obj);
			// Only add the object to a subnode if it can fit completely
			// within one
			if (index != -1) {
				this.nodes[index].insert(obj);
				return;
			}
		}
		objects.push(obj);
		// Prevent infinite splitting
		if (objects.length > maxObjects && level < maxLevels) {
			if (this.nodes[0] == null) {
				this.split();
			}
			var i = 0;
			while (i < objects.length) {
				var index = this.getIndex(objects[i]);
				if (index != -1) {
					this.nodes[index].insert((objects.splice(i,1))[0]);
				}
				else {
					i++;
				}
			}
		}
	};
	/*
	 * Determine which node the object belongs to. -1 means
	 * object cannot completely fit within a node and is part
	 * of the current node
	 */
	this.getIndex = function(obj) {
		var index = -1;
		var verticalMidpoint = this.bounds.x + this.bounds.width / 2;
		var horizontalMidpoint = this.bounds.y + this.bounds.height / 2;
		// Object can fit completely within the top quadrant
		var topQuadrant = (obj.y < horizontalMidpoint && obj.y + obj.height < horizontalMidpoint);
		// Object can fit completely within the bottom quandrant
		var bottomQuadrant = (obj.y > horizontalMidpoint);
		// Object can fit completely within the left quadrants
		if (obj.x < verticalMidpoint &&
				obj.x + obj.width < verticalMidpoint) {
			if (topQuadrant) {
				index = 1;
			}
			else if (bottomQuadrant) {
				index = 2;
			}
		}
		// Object can fix completely within the right quandrants
		else if (obj.x > verticalMidpoint) {
			if (topQuadrant) {
				index = 0;
			}
			else if (bottomQuadrant) {
				index = 3;
			}
		}
		return index;
	};
	/*
	 * Splits the node into 4 subnodes
	 */
	this.split = function() {
		// Bitwise or [html5rocks]
		var subWidth = (this.bounds.width / 2) | 0;
		var subHeight = (this.bounds.height / 2) | 0;
		this.nodes[0] = new QuadTree({
			x: this.bounds.x + subWidth,
			y: this.bounds.y,
			width: subWidth,
			height: subHeight
		}, level+1);
		this.nodes[1] = new QuadTree({
			x: this.bounds.x,
			y: this.bounds.y,
			width: subWidth,
			height: subHeight
		}, level+1);
		this.nodes[2] = new QuadTree({
			x: this.bounds.x,
			y: this.bounds.y + subHeight,
			width: subWidth,
			height: subHeight
		}, level+1);
		this.nodes[3] = new QuadTree({
			x: this.bounds.x + subWidth,
			y: this.bounds.y + subHeight,
			width: subWidth,
			height: subHeight
		}, level+1);
	};
}

function Bullet(object) {
  this.alive = false;
  var self = object;
  this.spawn = function(x, y, speed) {
    this.x = x;
    this.y = y;
    this.speed = speed;
    this.alive = true;
  };
  /*
   * Uses a "drity rectangle" to erase the bullet and moves it.
   */
  this.draw = function() {
    this.context.clearRect(this.x, this.y, this.width, this.height);
    //调整子弹方向
    this.x += this.speed;
    if (this.isColliding) {
      return true;
    }
    else if (self === "bullet" && this.x >= this.canvasWidth + this.width) {
      return true;
    }
    else if (self === "enemyBullet" && this.x <= 0 - this.width) {
      return true;
    }
    else {
      if (self === "bullet") {
      this.context.drawImage(imageRepository.bullet, this.x, this.y);
      }
      else if (self === "enemyBullet") {
				this.context.drawImage(imageRepository.enemyBullet, this.x, this.y);
			}
			return false;
    }
  };
  /*
   * Resets the bullet values
   */
  this.clear = function() {
    this.x = 0;
    this.y = 0;
    this.speed = 0;
    this.alive = false;
    this.isColliding = false;
  };
}
Bullet.prototype = new Drawable();

function Pool(maxSize) {
  var size = maxSize; // Max bullets allowed in the pool
  var pool = [];

  /*
   * Populates the pool array with Bullet objects
   */
   this.init = function(object) {
 		if (object == "bullet") {
 			for (var i = 0; i < size; i++) {
 				// Initalize the object
 				var bullet = new Bullet("bullet");
 				bullet.init(0,0, imageRepository.bullet.width, imageRepository.bullet.height);
        bullet.collidableWith = "enemy";
				bullet.type = "bullet";
        pool[i] = bullet;
 			}
 		}
 		else if (object == "enemy") {
 			for (var i = 0; i < size; i++) {
 				var enemy = new Enemy();
 				enemy.init(0,0, imageRepository.enemy.width, imageRepository.enemy.height);
 				pool[i] = enemy;
 			}
 		}
 		else if (object == "enemyBullet") {
 			for (var i = 0; i < size; i++) {
 				var bullet = new Bullet("enemyBullet");
 				bullet.init(0,0, imageRepository.enemyBullet.width, imageRepository.enemyBullet.height);
 				pool[i] = bullet;
        bullet.collidableWith = "ship";
        bullet.type = "enemyBullet";
 			}
 		}
 	};

// return all alive objects in the pool as an array
// that will then be inserted into the quadtree
  this.getPool = function() {
		var obj = [];
		for (var i = 0; i < size; i++) {
			if (pool[i].alive) {
				obj.push(pool[i]);
			}
		}
		return obj;
	}
  /*
   * Grabs the last item in the list and initializes it and
   * pushes it to the front of the array.
   */
  this.get = function(x, y, speed) {
    if (!pool[size - 1].alive) {
      pool[size - 1].spawn(x, y, speed);
      pool.unshift(pool.pop());
    }
  };

  this.getTwo = function(x1, y1, speed1, x2, y2, speed2) {
    if (!pool[size - 1].alive &&
      !pool[size - 2].alive) {
      this.get(x1, y1, speed1);
      this.get(x2, y2, speed2);
    }
  };

  /*
   * Draws any in use Bullets. If a bullet goes off the screen,
   * clears it and pushes it to the front of the array.
   */
  this.animate = function() {
    for (var i = 0; i < size; i++) {
      // Only draw until we find a bullet that is not alive
      if (pool[i].alive) {
        if (pool[i].draw()) {
          pool[i].clear();
          pool.push((pool.splice(i, 1))[0]);
        }
      } else
        break;
    }
  };
}

/**
 * Create the Ship object that the player controls. The ship is
 * drawn on the "ship" canvas and uses dirty rectangles to move
 * around the screen.
 */
function Ship() {
  this.speed = 3;
  this.bulletPool = new Pool(30);
  this.bulletPool.init("bullet");
  var fireRate = 15;
  var counter = 0;
  this.collidableWith = "enemyBullet";
  this.type = "ship";

  this.init = function(x, y, width, height) {
    // Defualt variables
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.alive = true;
    this.isColliding = false;
    this.bulletPool.init("bullet");
  }

  this.draw = function() {
    this.context.drawImage(imageRepository.spaceship, this.x, this.y);
  };
  this.move = function() {
    counter++;
    // Determine if the action is move action
    if (KEY_STATUS.left || KEY_STATUS.right ||
      KEY_STATUS.down || KEY_STATUS.up) {

      this.context.clearRect(this.x, this.y, this.width, this.height);
      //飞船行动范围 保持在屏幕
      if (KEY_STATUS.left) {
        this.x -= this.speed
        if (this.x <= 0)
          this.x = 0;
      } else if (KEY_STATUS.right) {
        this.x += this.speed
        if (this.x >= this.canvasWidth - this.width)
          this.x = this.canvasWidth - this.width;
      } else if (KEY_STATUS.up) {
        this.y -= this.speed
        if (this.y <= 0)
          this.y = 0;
      } else if (KEY_STATUS.down) {
        this.y += this.speed
        if (this.y >= this.canvasHeight - this.height)
          this.y = this.canvasHeight - this.height;
      }
      // Finish by redrawing the ship
      if (!this.isColliding) {
				this.draw();
			}
      else {
        this.alive = false;
        game.gameOver();
      }
    }
    if (KEY_STATUS.space && counter >= fireRate  && !this.isColliding) {
      this.fire();
      counter = 0;
    }
  };
  /*
   * Fires two bullets
   */
  this.fire = function() {
    this.bulletPool.getTwo(this.x, this.y + 22, 3,
      this.x, this.y + 13, 3);
  };
}
Ship.prototype = new Drawable();

function Enemy() {
	var percentFire = .01;
	var chance = 0;
	this.alive = false;
  this.collidableWith = "bullet";
	this.type = "enemy";
	/*
	 * Sets the Enemy values
	 */
	this.spawn = function(x, y, speed) {
		this.x = x;
		this.y = y;
		this.speed = speed;
		this.speedX = speed;
		this.speedY = 0;
		this.alive = true;
    //设定边界
    this.leftEdge = this.x - 200;
		this.topEdge = this.y - 30;
		this.bottomEdge = this.y + 30;
	};

	// 到达边界 改变方向
	this.draw = function() {
		this.context.clearRect(this.x-1, this.y, this.width+1, this.height);
		this.x += this.speedX;
		this.y += this.speedY;
		if (this.y <= this.topEdge) {
			this.speedY = this.speed;
		}
		else if (this.y >= this.bottomEdge) {
			this.speedY = -this.speed;
		}
		else if (this.x <= this.leftEdge) {
			this.speed = 1.5;
			this.speedX = 0;
			this.x += 5;
			this.speedY = -this.speed;
		}

    if (!this.isColliding) {
			this.context.drawImage(imageRepository.enemy, this.x, this.y);
			// Enemy has a chance to shoot every movement
			chance = Math.floor(Math.random()*101);
			if (chance/100 < percentFire) {
				this.fire();
			}
			return false;
		}
		else {
      game.playerScore += 10;
			return true;
		}

	};

	/*
	 * Fires a bullet
	 */
	this.fire = function() {
		game.enemyBulletPool.get(this.x+this.width/2, this.y+this.height, -2.5);
	}

	/*
	 * Resets the enemy values
	 */
	this.clear = function() {
		this.x = 0;
		this.y = 0;
		this.speed = 0;
		this.speedX = 0;
		this.speedY = 0;
		this.alive = false;
    this.isColliding = false;
	};
}
Enemy.prototype = new Drawable();


function Game() {

  this.init = function() {
    this.bgCanvas   = document.getElementById('background');
    this.shipCanvas = document.getElementById('ship');
    this.mainCanvas = document.getElementById('main');


    if (this.bgCanvas.getContext) {
      this.bgContext = this.bgCanvas.getContext('2d');
      this.shipContext = this.shipCanvas.getContext('2d');
      this.mainContext = this.mainCanvas.getContext('2d');

      Background.prototype.context = this.bgContext;
      Background.prototype.canvasWidth = this.bgCanvas.width;
      Background.prototype.canvasHeight = this.bgCanvas.height;

      Ship.prototype.context = this.shipContext;
      Ship.prototype.canvasWidth = this.shipCanvas.width;
      Ship.prototype.canvasHeight = this.shipCanvas.height;

      Bullet.prototype.context = this.mainContext;
      Bullet.prototype.canvasWidth = this.mainCanvas.width;
      Bullet.prototype.canvasHeight = this.mainCanvas.height;

      Enemy.prototype.context = this.mainContext;
			Enemy.prototype.canvasWidth = this.mainCanvas.width;
			Enemy.prototype.canvasHeight = this.mainCanvas.height;

      this.background = new Background();
      this.background.init(0, 0);

      //飞船初始位置
      this.ship = new Ship();
      this.shipStartX = 0 + imageRepository.spaceship.width / 2;
      this.shipStartY = this.shipCanvas.height / 2 ;
      this.ship.init(this.shipStartX, this.shipStartY, imageRepository.spaceship.width,
        imageRepository.spaceship.height);

      // Initialize the enemy pool object
			this.enemyPool = new Pool(30);
			this.enemyPool.init("enemy");
      this.spawnWave();

			this.enemyBulletPool = new Pool(50);
			this.enemyBulletPool.init("enemyBullet");

      this.quadTree = new QuadTree({x:0,y:0,width:this.mainCanvas.width,height:this.mainCanvas.height});

      this.playerScore = 0;

      return true;
    } else {
      return false;
    }
  };

this.spawnWave = function() {
    var height = imageRepository.enemy.height;
    var enemyWidth = imageRepository.enemy.width;
    var canvasWidth = imageRepository.background.width
    var x = canvasWidth;
    var y = 280;
    var spacer = -height * 1.5;
    for (var i = 1; i <= 12; i++) {
      this.enemyPool.get(x,y,-2);
      x += enemyWidth + 25;
      if (i % 2 == 0) {
        x = canvasWidth;
        y += spacer
      }
    }
  }

  // Start the animation loop
  this.start = function() {
    this.ship.draw();
    animate();
  };

  // Restart the game
	this.restart = function() {
		// this.gameOverAudio.pause();

		document.getElementById('game-over').style.display = "none";
		this.bgContext.clearRect(0, 0, this.bgCanvas.width, this.bgCanvas.height);
		this.shipContext.clearRect(0, 0, this.shipCanvas.width, this.shipCanvas.height);
		this.mainContext.clearRect(0, 0, this.mainCanvas.width, this.mainCanvas.height);

		this.quadTree.clear();

		this.background.init(0,0);
		this.ship.init(this.shipStartX, this.shipStartY,
		               imageRepository.spaceship.width, imageRepository.spaceship.height);

		this.enemyPool.init("enemy");
		this.spawnWave();
		this.enemyBulletPool.init("enemyBullet");

		this.playerScore = 0;

		this.start();
	};

	// Game over
	this.gameOver = function() {

		document.getElementById('game-over').style.display = "block";
	};
}

function animate() {
  thisFrame = Date.now();
  elapsed = thisFrame - lastFrame;
  lastFrame = thisFrame;
  document.getElementById('fps').innerHTML = avgFramerate;
  document.getElementById('score').innerHTML = game.playerScore;

  // Insert objects into quadtree
  game.quadTree.clear();
  game.quadTree.insert(game.ship);
  game.quadTree.insert(game.ship.bulletPool.getPool());
  game.quadTree.insert(game.enemyPool.getPool());
  game.quadTree.insert(game.enemyBulletPool.getPool());
  detectCollision();

  // No more enemies
  if (game.enemyPool.getPool().length === 0) {
    game.spawnWave();
  }

  if (game.ship.alive) {
    requestAnimFrame(animate);
    game.background.draw();
    game.ship.move();
    game.ship.bulletPool.animate();
    game.enemyPool.animate();
    game.enemyBulletPool.animate();

    frameCount++;
    elapsedCounter += elapsed;
    if (elapsedCounter > 1000) {
      elapsedCounter -= 1000;
      avgFramerate = frameCount;
      frameCount = 0;
    }
  }
}

function detectCollision() {
	var objects = [];
	game.quadTree.getAllObjects(objects);
	for (var x = 0, len = objects.length; x < len; x++) {
		game.quadTree.findObjects(obj = [], objects[x]);

		for (y = 0, length = obj.length; y < length; y++) {

			// DETECT COLLISION ALGORITHM
			if (objects[x].collidableWith === obj[y].type &&
				(objects[x].x < obj[y].x + obj[y].width &&
			     objects[x].x + objects[x].width > obj[y].x &&
				 objects[x].y < obj[y].y + obj[y].height &&
				 objects[x].y + objects[x].height > obj[y].y)) {
				objects[x].isColliding = true;
				obj[y].isColliding = true;
			}
		}
	}
};

KEY_CODES = {
  32: 'space',
  37: 'left',
  38: 'up',
  39: 'right',
  40: 'down',
}

KEY_STATUS = {};
for (code in KEY_CODES) {
  KEY_STATUS[KEY_CODES[code]] = false;
}

document.onkeydown = function(e) {
  var keyCode = (e.keyCode) ? e.keyCode : e.charCode;
  if (KEY_CODES[keyCode]) {
    e.preventDefault();
    KEY_STATUS[KEY_CODES[keyCode]] = true;
  }
}

document.onkeyup = function(e) {
  var keyCode = (e.keyCode) ? e.keyCode : e.charCode;
  if (KEY_CODES[keyCode]) {
    e.preventDefault();
    KEY_STATUS[KEY_CODES[keyCode]] = false;
  }
}

/*Finds the first API that works to optimize the animation loop,
 otherwise defaults to setTimeout().
 */
window.requestAnimFrame = (function() {
  return window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.oRequestAnimationFrame ||
    window.msRequestAnimationFrame ||
    function( /* function */ callback, /* DOMElement */ element) {
      window.setTimeout(callback, 1000 / 60);
    };
})();
