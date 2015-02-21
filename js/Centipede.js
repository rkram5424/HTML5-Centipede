var game = new Phaser.Game(512, 672, Phaser.CANVAS, 'gameContainer', { preload: preload, create: create, update: update}, null, false, false);

// Global variables, or Globs as I call them.
var player, bolts, centipedes, centipede, section, spider, scorpion, flea, mushrooms; // Characters/things you can see
var lives, score, speed, wave, wave_offset, fire_button, cursors, touch, touch_button, mushrows; // Mechanics
var flea_timer, scorpion_timer, spider_timer; // Timers

// Constants
PLAYER_SPEED = 300;
BOUND_PLAYER_HIGH = 432;
BOUND_PLAYER_LOW = 512;

// Set up assets.
function preload() {
  game.load.atlasJSONHash('atlas', 'assets/centipede_sprites_1.png', 'assets/cent_sprites.json');
  game.load.spritesheet('button', 'assets/button.png', 512, 144);
}

// Set up objects and groups and place the first centipede.
function create(){
  // touch = true;
  mushrows = [];
  lives = 3;
  speed = 5;
  wave_offset = 0;
  game.physics.startSystem(Phaser.Physics.ARCADE);

  mushrooms = game.add.group();
  mushrooms.enableBody = true;
  spawnMushrooms();

  scorpion = game.add.group();
  scorpion.enableBody = true;
  scorpion.physicsBodyType = Phaser.Physics.ARCADE;

  bolts = game.add.group();
  bolts.enableBody = true;
  bolts.physicsBodyType = Phaser.Physics.ARCADE;
  bolts.createMultiple(1, 'atlas', 'bolt');
  bolts.setAll('anchor.x', 0.5);
  bolts.setAll('anchor.y', 1);
  bolts.setAll('outOfBoundsKill', true);
  bolts.setAll('checkWorldBounds', true);

  centipedes = game.add.group();
  centipedes.enableBody = true;
  centipedes.physicsBodyType = Phaser.Physics.ARCADE;
  centipedes.setAll('checkWorldBounds', true);

  player = game.add.sprite(game.width/2, game.height - 152, 'atlas', 'player');
  player.anchor.setTo(0.5, 0.5);
  game.physics.enable(player, Phaser.Physics.ARCADE);
  player.body.collideWorldBounds = true;

  cursors = game.input.keyboard.createCursorKeys();
  fire_button = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);

  touch_button = game.add.button(256, 600, 'button', touchButton, this, 2, 1, 0); 
  touch_button.name = 'touch_button'; 
  touch_button.anchor.setTo(0.5, 0.5);

  spawnCentipede(game.width/2, 0);
  spawnScorpion(512, 64, -1);
}

// Called 60(maybe?) times a second, the heartbeat of the game.
function update(){
  game.physics.arcade.collide(player, mushrooms);
  game.physics.arcade.collide(bolts, mushrooms, boltHitsMushroom, null, this);
  game.physics.arcade.collide(centipedes, mushrooms, centipedeHitsMushroom, null, this);
  game.physics.arcade.collide(scorpion, mushrooms, scorpionHitsMushroom, null, this);
  game.physics.arcade.collide(centipedes, player, playerDies, null, this);
  player.body.velocity.setTo(0, 0);

  if (cursors.left.isDown)
  {
    player.body.velocity.x = -PLAYER_SPEED;
  }
  if (cursors.right.isDown)
  {
    player.body.velocity.x = PLAYER_SPEED;
  }
  if (player.y >= BOUND_PLAYER_HIGH){
    if (cursors.up.isDown)
    {
      player.body.velocity.y = -PLAYER_SPEED;
    }
  }
  if (player.y <= BOUND_PLAYER_LOW){
    if (cursors.down.isDown)
    {
      player.body.velocity.y = PLAYER_SPEED;
    }
  }
  if (fire_button.isDown)
  {
    fireBolt();
  }

  moveCentipede(centipede);

  if (scorpion){
    moveScorpion();
  }
}

function touchButton(){
  touch_button.kill();
  GameController.init( {
    forcePerformanceFriendly: true,
    left: {
      type: 'joystick',
      position: {left: '15px', bottom: '10px'},
      joystick: {
        touchMove: function(details) { 
          player.body.velocity.x = (details.normalizedX * PLAYER_SPEED);
          player.body.velocity.y = -(details.normalizedY * PLAYER_SPEED);
        }
      } 
    },
    right: {
      position: {right: '5px', bottom: '17px'},
      type: 'buttons',
      buttons: [
      {
        label: 'fire', fontSize: 13, touchStart: function() {
          fireBolt();
        }
      },
      false, false, false
      ]
    }
  });
}

function playerDies(){
  lives -= 1;
  if (lives < 0){
    gameOver();
  }
}

function fireBolt() {
  var bolt = bolts.getFirstExists(false);
  if (bolt){
      bolt.reset(player.x, player.y + 8);
      bolt.body.velocity.y = -800;
  }
}

// // Spawning functions. Get a room!

function spawnMushrooms(){
  var chance = 0;
  for (var i = 0; i < 512; i += 16) {
    mushrows.push(i);
    for (var j = 0; j < 512; j += 16){
      chance = Math.floor(Math.random() * 25) + 1;
      if (chance == 1) {
        var mushroom = mushrooms.create(i, j, 'atlas', 'mushroom00');
        mushroom.body.immovable = true;
        mushroom.hits = 0;
        mushroom.poisoned = false;
      }
    } 
  }
}

function spawnCentipede(x, y){
  centipede = centipedes.create(x, y, 'atlas', 'head00');
  centipede.animations.add('move', Phaser.Animation.generateFrameNames('head', 0, 7, '', 2), 10, true);
  centipede.animations.play('move');
  centipede.anchor.setTo(0, 0);
  centipede.direction = 1;
  centipede.layer = y;
  centipede.body.collideWorldBounds = true;
}

function spawnScorpion(x, y, dir){
  scorpion = scorpion.create(x, y, 'atlas', 'scorpion00');
  scorpion.animations.add('move', Phaser.Animation.generateFrameNames('scorpion', 0, 3, '', 2), 10, true);
  scorpion.animations.play('move');
  scorpion.direction = dir;
}

// // function spawnSpider(x, y, dir){}
// // function spawnFlea(x, y){}
// // function gameOver(){}

// // AI functions. SKYNET!!!

function moveCentipede(cent){
  // This function will be the heart and soul of the centipede movement algorithm. Cool things to come!
  cent.x += speed;
}

function moveScorpion(){
  scorpion.x += speed * scorpion.direction;
}

// // function moveSpider(){}
// // function moveFlea(){}

// // Collision functions. Let's exchange insurance info.

function boltHitsMushroom (bolt, mushroom) {
  bolt.kill();
  mushroom.hits += 1;
  if (mushroom.hits >= 4){
    mushroom.kill();
  }
  else {
    mushroom.loadTexture('atlas', 'mushroom0' + mushroom.hits);
  }
}

function centipedeHitsMushroom(centipede, mushroom){
  centipede.kill();
}

function scorpionHitsMushroom(scorpion, mushroom){
  mushroom.poisoned = true;
  mushroom.loadTexture('atlas', 'poison0' + mushroom.hits);
}