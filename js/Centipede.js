// Constants
var HEADER_OFFSET = 16;
var PLAYER_SPEED = 300;
var BOUND_PLAYER_HIGH = 432;
var BOUND_PLAYER_LOW = 512;
var TOUCH = Phaser.Device.touch;

var game;

if (TOUCH){
  game = new Phaser.Game(512, 688, Phaser.CANVAS, 'game', { preload: preload, create: create, update: update}, null, false, false);
}
else {
  game = new Phaser.Game(512, 544, Phaser.CANVAS, 'game', { preload: preload, create: create, update: update}, null, false, false);
}

// Global variables, or Globs as I call them.
var player, bolts, centipedes, centipede, section, spider, scorpion, flea, mushrooms, life_sprites; // Characters/things you can see
var lives, score, speed, wave, wave_offset, fire_button, cursors, touch, touch_button, mushrows; // Mechanics
var flea_timer, scorpion_timer, spider_timer; // Timers

// Set up assets.
function preload() {
  game.load.atlasJSONHash('atlas', 'assets/centipede_sprites_1.png', 'assets/cent_sprites.json');
  game.load.spritesheet('button', 'assets/button.png', 512, 144);
}

// Set up objects and groups and place the first centipede.
function create(){
  mushrows = [];
  lives = 3;
  speed = 5;
  score = 0;
  hi_score = 16543;
  wave_offset = 0;
  game.physics.startSystem(Phaser.Physics.ARCADE);

  var score_style = { font: "16px Arial", fill: "#ff0044", align: "center" };
  game.add.text(game.world.centerX, 0, hi_score, score_style);

  mushrooms = game.add.group();
  mushrooms.enableBody = true;
  mushrooms.physicsBodyType = Phaser.Physics.ARCADE;
  spawnMushrooms();

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

  if (TOUCH){
    player = game.add.sprite(game.width/2, game.height - 152, 'atlas', 'player');
  }
  else{
    player = game.add.sprite(game.width/2, game.height, 'atlas', 'player');
  }
  player.anchor.setTo(0.5, 0.5);
  game.physics.enable(player, Phaser.Physics.ARCADE);
  player.body.collideWorldBounds = true;
  player.animations.add('die', Phaser.Animation.generateFrameNames('bigexplosion', 0, 7, '', 2), 30, true);

  cursors = game.input.keyboard.createCursorKeys();
  fire_button = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);

  touch_button = game.add.button(256, 616, 'button', touchButton, this, 2, 1, 0); 
  touch_button.name = 'touch_button'; 
  touch_button.anchor.setTo(0.5, 0.5);

  spawnCentipede(game.width/2, 16);
  spawnScorpion();
  spawnFlea();
}

// Called 60(maybe?) times a second, the heartbeat of the game.
function update(){
  game.physics.arcade.collide(player, mushrooms);
  game.physics.arcade.collide(bolts, mushrooms, boltHitsMushroom, null, this);
  game.physics.arcade.collide(centipedes, mushrooms, centipedeHitsMushroom, null, this);
  game.physics.arcade.overlap(scorpion, mushrooms, scorpionHitsMushroom, null, this);
  // game.physics.arcade.collide(centipedes, player, playerDies, null, this);
  game.physics.arcade.overlap(flea, player, fleaHitsPlayer, null, this);
  player.body.velocity.setTo(0, 0);


  // if ((game.input.x < 512) && (game.input.x > 0) && (game.input.y < 672) && (game.input.y > 0)){
  //   player.body.x = game.input.x;
  //   if (game.input.y <= BOUND_PLAYER_HIGH){ // && game.input.y <= BOUND_PLAYER_LOW){
  //     player.body.y = BOUND_PLAYER_HIGH;  
  //   }
  //   else if (game.input.y >= BOUND_PLAYER_LOW){ // && game.input.y <= BOUND_PLAYER_LOW){
  //     player.body.y = BOUND_PLAYER_LOW;  
  //   }
  //   else{
  //     player.body.y = game.input.y;
  //   }
  // }

  if (game.input.activePointer.isDown){
    fireBolt();
  }

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

  if (flea){
    moveFlea();
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
  player.animations.play('die', 30, false, true);
  lives -= 1;
  // if (lives < 0){
  //   gameOver();
  // }
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
    for (var j = 16; j < 512; j += 16){
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

function spawnScorpion(){
  var dir = Math.floor(Math.random() * 2);
  if (dir == 0){dir = -1}
  var row = Math.floor((Math.random() * 5)  + 5) * 16;
  var x = 512;
  if (dir == 1){
    x = 0;
  }
  scorpion = game.add.sprite(x, row, 'atlas', 'scorpion00');
  scorpion.outOfBoundsKill = true;
  game.physics.enable(scorpion, Phaser.Physics.ARCADE);
  scorpion.anchor.setTo(.5, 1);
  if (dir == 1){scorpion.scale.x = -1};
  scorpion.animations.add('move', Phaser.Animation.generateFrameNames('scorpion', 0, 3, '', 2), 10, true);
  scorpion.animations.play('move');
  scorpion.direction = dir;
}

function spawnFlea(){
  var col = (Math.floor(Math.random() * 32) * 16);
  flea = game.add.sprite(col, 0, 'atlas', 'flea00');
  flea.outOfBoundsKill = true;
  game.physics.enable(flea, Phaser.Physics.ARCADE);
  flea.animations.add('move', Phaser.Animation.generateFrameNames('flea', 0, 3, '', 2), 10, true);
  flea.animations.play('move');
}

// // function spawnSpider(x, y, dir){}
// // function gameOver(){}

// // AI functions. SKYNET!!!

function moveCentipede(cent){
  // This function will be the heart and soul of the centipede movement algorithm. Cool things to come!
  cent.x += speed;
}

function moveScorpion(){
  scorpion.x += (speed / 2) * scorpion.direction;
}

function moveFlea(){
  flea.y += (speed);
}

// // function moveSpider(){}

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

function fleaHitsPlayer(flea, player){
  playerDies();
}