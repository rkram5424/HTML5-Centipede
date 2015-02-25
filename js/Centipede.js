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
// Characters/things you can see
var player, bolts, centipedes, centipede, section, spider, scorpion, flea, mushrooms, life_sprites, monsters;
// Mechanics
var lives, score, speed, wave, wave_offset, fire_button, cursors, touch, touch_button, mushrows, mush_array;
// Timers
var flea_timer, scorpion_timer, spider_timer, score_timer; // Timers

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

  var score_style = { font: "16px Arial", fill: "#ff0000", align: "center" };
  game.add.text(0, 0, score, score_style);
  game.add.text(game.width/2, 0, hi_score, score_style);

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
  player.alive = true;
  game.physics.enable(player, Phaser.Physics.ARCADE);
  player.body.collideWorldBounds = true;
  player.animations.add('die', Phaser.Animation.generateFrameNames('bigexplosion', 0, 7, '', 2), 30, true);

  cursors = game.input.keyboard.createCursorKeys();
  fire_button = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);

  touch_button = game.add.button(256, 616, 'button', touchButton, this, 2, 1, 0);
  touch_button.name = 'touch_button';
  touch_button.anchor.setTo(0.5, 0.5);

  monsters = new MonsterManager();
  var monster = new MonsterGenerator(game, 'atlas', monsters);

  var scorpion = new monster('scorpion00', 10);
  scorpion.addAnimation('move', 'scorpion');
  scorpion.addAnimation('die', 'explosion');
  scorpion.onCreation(function(creature, animations){
      for(var i = 0, j = animations.length; i < j;i++){
          if(animations[i].animation === 'move'){
              creature.animations.play('move');
          }
      }
  });
  scorpion.set('dir', Math.random() < 0.5 ? -1 : 1);
  scorpion.addMovement(function(creature){
      creature.x += 5;
      creature.y += 5;
  });

  // Create 10 scorpions
  for(var i = 0;i < 10;i++){
      function rand(){
          return Math.random() * 400;
      }
      scorpion.create(rand(), rand());
  }

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
  game.physics.arcade.overlap(bolts, flea, boltHitsFlea, null, this);
  game.physics.arcade.overlap(bolts, scorpion, boltHitsScorpion, null, this);
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
  // if (game.input.activePointer.isDown){
  //   fireBolt();
  // }

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

  monsters.move();

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

/////////////////////////
// Mechanics functions //
/////////////////////////

function playerDies(){
  player.alive = false;
  player.animations.play('die', 30, false, true);
  lives -= 1;
  // if (lives < 0){
  //   gameOver();
  // }
}

function fleaDies(){
  flea.alive = false;
  flea.animations.play('die', 30, false, true);
}

function scorpionDies(){
  scorpion.alive = false;
  scorpion.animations.play('die', 30, false, true);
}

function spiderDies(){
  spider.alive = false;
  spider.animations.play('die', 30, false, true);
}

function fireBolt() {
  if (player.alive){ // Roberto found this bug.
    var bolt = bolts.getFirstExists(false);
    if (bolt){
      bolt.reset(player.x, player.y + 8);
      bolt.body.velocity.y = -800;
    }
  }
}

// function gameOver(){}

/////////////////////////////////////
// Spawning functions. Get a room! //
/////////////////////////////////////

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

// Should be responsible for placement/spawning of all monsters truly
function MonsterManager(){
    var monsters = [];

    // Add a guy
    this.addMonster = function(monster){
        monsters.push(monster);
    }

    // Make them groove
    this.move = function(){
        for(var i = 0, j = monsters.length;i < j;i++){
            monsters[i].move();
        }
    }
}

// Define a new monster type
// var monsterGenerator = new MonsterGenerator(game, 'atlas');
// var scorpion = new Monster('scorpion00', 10);
// var scorp1 = scorpion.create(0, 0);
// scorp1.addAnimation('move')
function MonsterGenerator(game, atlas, manager){
    return function Monster(name, health){
        var self = this;
        var animations = [];
        var creation, death;
        self.attrs = {};
        self.create = function(x, y, moveFn){
            var creature = game.add.sprite(x, y, atlas, name);
            game.physics.enable(creature, Phaser.Physics.ARCADE);
            creature.health = health;
            for(var i = 0, j = animations.length; i < j;i++){
                creature.animations.add(animations[i].animation, Phaser.Animation.generateFrameNames(animations[i].frame, 0, 3, '', 2), 10, true);
            }
            for(var i = 0, j = Object.keys(this['attrs']);i < j.length;i++){
                creature[j[i]] = this['attrs'][j[i]];
            }
            creature.move = moveFn ? function(){
                moveFn(creature);
            } : self.movement(creature);
            creation(creature);
            manager.addMonster(creature);
            return creature;
        }

        self.addMovement = function(fn){
            self.movement = function(creature){
                return function(){
                    fn(creature);
                }
            }
        }

        // Add animations
        self.addAnimation = function(animation, frame){
            animations.push({'animation': animation, 'frame': frame});
        }

        self.onCreation = function(fn){
            creation = function(creature){
                fn(creature, animations);
            }
        }

        self.onDeath = function(fn){
            self.death = fn(animations);
        }

        // Try not to use too often
        self.set = function(key, value){
            this['attrs'][key] = value;
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
  scorpion.alive = true;
  scorpion.outOfBoundsKill = true;
  game.physics.enable(scorpion, Phaser.Physics.ARCADE);
  scorpion.anchor.setTo(.5, 1);
  if (dir == 1){scorpion.scale.x = -1};
  scorpion.animations.add('move', Phaser.Animation.generateFrameNames('scorpion', 0, 3, '', 2), 10, true);
  scorpion.animations.add('die', Phaser.Animation.generateFrameNames('bigexplosion', 0, 7, '', 2), 30, true);
  scorpion.animations.play('move');
  scorpion.direction = dir;
}

function spawnFlea(){
  var col = (Math.floor(Math.random() * 32) * 16);
  flea = game.add.sprite(col, 0, 'atlas', 'flea00');
  flea.alive = true;
  flea.outOfBoundsKill = true;
  game.physics.enable(flea, Phaser.Physics.ARCADE);
  flea.animations.add('move', Phaser.Animation.generateFrameNames('flea', 0, 3, '', 2), 10, true);
  flea.animations.add('die', Phaser.Animation.generateFrameNames('explosion', 0, 5, '', 2), 30, true);
  flea.animations.play('move');
  // drop mushrooms
}

function spawnSpider(){
  spider = game.add.sprite(0, 480, 'atlas', 'spider00');
  spider.alive = true;
  spider.outOfBoundsKill = true;
  game.physics.enable(spider, Phaser.Physics.ARCADE);
  spider.animations.add('move', Phaser.Animation.generateFrameNames('spider', 0, 7, '', 2), 30, true);
  spider.animations.add('die', Phaser.Animation.generateFrameNames('bigexplosion', 0, 7, '', 2), 30, true);
  spider.animations.play('move');
}

/////////////////////////////
// AI functions. SKYNET!!! //
/////////////////////////////

function moveCentipede(cent){
  // This function will be the heart and soul of the centipede movement algorithm. Cool things to come!
  cent.x += speed;
}

function moveScorpion(){
  if (scorpion.alive){
    scorpion.x += (speed / 2) * scorpion.direction;
  }
}

function moveFlea(){
  if (flea.alive){
    flea.y += (speed);
  }
}

// function moveSpider(){}

/////////////////////////////////////////////////////////
// Collision functions. Let's exchange insurance info. //
/////////////////////////////////////////////////////////

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

function boltHitsFlea(){
  score += 500;
  fleaDies();
}

function boltHitsScorpion(){
  score += 1000;
  scorpionDies();
}

function boltHitsSpider(){
  score += 900;
  spiderDies();
}

function centipedeHitsMushroom(centipede, mushroom){
  //centipede.kill();
}

function scorpionHitsMushroom(scorpion, mushroom){
  mushroom.poisoned = true;
  mushroom.loadTexture('atlas', 'poison0' + mushroom.hits);
}

function fleaHitsPlayer(flea, player){
  playerDies();
}

function spiderHitsPlayer(spider, player){
  playerDies();
}

function centipedeHitsPlayer(centipede, player){
  playerDies();
}
