/*
  hotakyi@gmail.com

  main_container
    game_container
      background_container
      bullet_container
      fish_container
      net_container
      coin_container
      score_container
    ui_static_container
    ui_container
*/
var hotaFish = function() {
  // rendering size
  var WIDTH = 1366;
  var HEIGHT = 768;
  var SIZE_MODIFIER = 1; // texture is 50% compressed
  var GRAPHIC_LOCATION = '_assets/graphics/';
  // var GAME_ASSETS = [
  //   'im_bg.jpg',
  //   'all_sprite.json'
  // ];
  var GAME_ASSETS = [
    'im_bg.jpg',
    'all_sprite_hd_0.json',
    'all_sprite_hd_1.json',
    'all_sprite_hd_2.json',
    'all_sprite_hd_3.json',
  ];
  var SOUND_LOCATION = '_assets/sounds/';
  var SOUND_EFFECT_FILES = [
    'changebarrel',
    'common_fire',
    'gold'
  ];
  var BACKGROUND_MUSIC_FILES = [
    'bgm0',
    'bgm1',
    'bgm2',
    'bgm3'
  ];
  var FIRE_INTERVAL = 200; // time between bullet fire
  var BULLET_LIMIT = 10; // maximun number of bullet on screen for the player
  var MIN_UPDATE_INTERVAL = 10; // ms minimum screen update interval
  var FORCE_UPDATE_INTERVAL = 1000; // ms force screen update interval if focus is lost
  var MIN_COLLISION_CHECK_INTERVAL = 33; // ms minimum collision check interval
  var CANNON_DATA = [
    //cannon, bullet, net, speed, size, radius
    ['cannon1_norm', 'bullet1_norm', 'net2', 600, 0.8, 1],
    ['cannon2_norm', 'bullet2_norm', 'net2', 600, 1.2, 5],
    ['cannon3_norm', 'bullet3_norm', 'net3', 900, 1.5, 10],
    ['cannon4_norm', 'bullet4_norm', 'net4', 900, 1.6, 10]
  ];
  var NET_ANIMATION_SPEED = 0.25;
  var REMOVE_BOUNDARY = 251; // how long fishes can travel offscreen before deletion
  var FISH_DATA = [
    // name, frame, travel_speed, anim_speed, d_anim_frame, d_anim_speed, bounding_x, bounding_y
    ['fish1', 12, 150, 0.5, 5, 0.25, 60, 25],
    ['fish2', 16, 150, 0.5, 3, 0.25, 60, 25],
    ['fish3', 24, 150, 0.5, 3, 0.25, 80, 32],
    ['fish4', 24, 150, 0.5, 10, 0.25, 70, 43],
    ['fish5', 24, 150, 0.5, 3, 0.25, 80, 54],
    ['fish6', 25, 150, 0.5, 6, 0.25, 90, 70],
    ['fish7', 60, 150, 0.5, 3, 0.25, 90, 40],
    ['fish8', 20, 150, 0.5, 6, 0.25, 120, 55],
    ['fish9', 24, 150, 0.5, 3, 0.25, 150, 47],
    ['fish10', 16, 150, 0.25, 7, 0.25, 110, 112],
    ['fish11', 24, 120, 0.5, 4, 0.25, 145, 80],
    ['fish12', 12, 120, 0.125, 4, 0.25, 120, 150],
    ['fish13', 24, 120, 0.25, 4, 0.25, 180, 70],
    ['fish14', 20, 120, 0.5, 3, 0.25, 255, 88],
    ['fish15', 24, 120, 0.25, 6, 0.25, 180, 180],
    ['fish16', 24, 90, 0.5, 6, 0.25, 270, 80],
    ['fish17', 24, 90, 0.5, 4, 0.25, 290, 90],
    ['fish18', 9, 90, 0.1, 3, 0.25, 500, 170], // shark
    ['fish19', 9, 60, 0.2, 4, 0.1, 400, 100], // dragon
    ['fish20', 20, 30, 0.25, 20, 0.25, 404, 100], // naga f
    ['fish21', 15, 60, 0.25, 9, 0.1, 200, 245], // naga m
    ['fish22', 15, 90, 0.15, 15, 0.5, 180, 100],
    ['fish23', 8, 90, 0.15, 8, 0.5, 140, 140]
  ];
  var COIN_DATA = [
    // coin size, anim_speed, collect rate
    0.8, 0.25, 5
  ];
  // -----
  // coin
  var coin_anim = [];

  // cannon
  var cannons = []; // cannons anim holder
  var nets = []; // nets holder
  var bullets = []; // bullets holder
  var cannon_multi_list; // store server available bet
  var cannon_multi_index = 0; // bet index
  var cannon_multi_text_list = []; // all multiplier text object order by seat index
  var cannon_list = []; // all cannon in the room order by seat index
  var cannon_spread; // for changing cannons
  var bullet_counter = 0; // counting on-screen bullet for the player

  var score_text_list = [];
  var name_text_list = [];

  // fish
  var all_fish = []; // fish anim holder
  var all_d_fish = []; // fish dead anim holder
  var fishes = {}; // all fishes currently on screen

  var socket; // socket.io instance

  var my_seat; // player seat index
  var cannon_index = 0; // cannon set index

  var renderer;
  var last_update = 0; // frame delta time calculation
  var last_hit_test = 0; // delta of collision test
  var isFocus = true;
  var fps_timer; // timer for forcing screen update if focus is lost

  // firing
  var tap_pos;//storing last tap pos
  var last_fire = 0;
  var pressing = false;
  var isMouse = true;

  // pool
  var score_effect_pool = [];
  var coin_pool = [];
  var bullet_pool = [];

  // progress text
  var progressText = document.getElementById("progress-text");

  var master_container = new PIXI.Container(); // the container that will be passed to the renderer
  var game_container = new PIXI.Container(); // container for most game elements
  master_container.addChild(game_container);
  var background_layer = new PIXI.Container(); // container for the background image
  game_container.addChild(background_layer);
  var bullet_container = new PIXI.Container(); // container for the bullets
  game_container.addChild(bullet_container);
  var fish_container = new PIXI.Container(); // container for fishes
  game_container.addChild(fish_container);
  var net_container = new PIXI.Container(); // container for net animation
  game_container.addChild(net_container);
  var coin_container = new PIXI.Container(); // container for coin animation
  game_container.addChild(coin_container);
  var score_container = new PIXI.Container(); // container for score animation
  game_container.addChild(score_container);
  var ui_static_container = new PIXI.Container(); // container for UI elements
  master_container.addChild(ui_static_container);
  var ui_container = new PIXI.Container(); // container for UI elements
  master_container.addChild(ui_container);

  var fish_shadow = new PIXI.filters.DropShadowFilter();
  fish_shadow.alpha = 0.8;
  fish_shadow.distance = 30;
  fish_container.filters = [fish_shadow];

  // loading graphic assets
  var loader = PIXI.loader;
  var fail_loading = false;
  var pixi_loaded = false;
  var pixi_loading_progress = 0;
  for (var i = 0; i < GAME_ASSETS.length; i++) {
    loader.add(GRAPHIC_LOCATION + GAME_ASSETS[i]);
  }
  loader.on("progress", function(loader, resource){
    pixi_loading_progress = loader.progress;
    updateProgress();
  });
  loader.on('error', function(loader, what) {
    fail_loading = true;
    progressText.innerHTML = "Some of the assets cannot be downloaded, please check your internet connection or try again later.";

  });
  loader.load(function() {
    pixi_loaded = true;
    updateProgress();
  });

  // create sound effect object
  var howler_loading_progress = 0;
  var sound_effect = {};
  function musicLoaded() {
    howler_loading_progress += 1;
    updateProgress();
  }
  for (var i = 0; i < SOUND_EFFECT_FILES.length; i++) {
    sound_effect[SOUND_EFFECT_FILES[i]] = new Howl({
      urls: [SOUND_LOCATION + SOUND_EFFECT_FILES[i] + '.mp3', SOUND_LOCATION + SOUND_EFFECT_FILES[i] + '.ogg'],
      onload: musicLoaded
    });
  }
  var backgroundMusic = { // background music object, won't start downloading until the game is started
    current_music: null,
    start: function() {
      var which = Math.floor(Math.random() * BACKGROUND_MUSIC_FILES.length);
      this.current_music = new Howl({
        urls: [SOUND_LOCATION + BACKGROUND_MUSIC_FILES[which] + '.mp3', SOUND_LOCATION + BACKGROUND_MUSIC_FILES[which] + '.ogg'],
        onend: this.start
      });
      this.current_music.play();
    },
    play: function() {
      if (this.current_music !== null) {
        this.current_music.play();
      }
    },
    pause: function() {
      if (this.current_music !== null) {
        this.current_music.pause();
      }
    }
  };
  // function for easily playing sound effects
  function playSound(effect) {
    if (isFocus) {
      sound_effect[effect].play();
    }
  }

  var loading_complete = false; // prevent double onAssetsLoaded call
  function updateProgress() {
    if (!fail_loading) {
      if (howler_loading_progress === SOUND_EFFECT_FILES.length && pixi_loaded && loading_complete === false) {
        loading_complete = true;
        updateProgressBar(100);
        onAssetsLoaded();
      } else {
        var value = pixi_loading_progress * 0.9 + howler_loading_progress / (SOUND_EFFECT_FILES.length) * 100 * 0.1;
        updateProgressBar(value);
      }
    }
  }

  // loading progress
  var progress_in = document.getElementById("progress-in");
  var progress_val = document.getElementById("progress-val");
  function updateProgressBar(value) {
    var text = Math.floor(value) + '%';
    progress_val.innerHTML = text;
    progress_in.style.width = text;
  }

  // function for scaling the renderer when resized
  function resizeRenderer() {
    var thisWidth = window.innerWidth;
    var thisHeight = window.innerHeight;
    var unit = thisWidth / WIDTH;
    var testHeight = Math.floor(HEIGHT * unit);
    if (thisHeight >= testHeight) {
      renderer.view.style.width = thisWidth + 'px';
      renderer.view.style.height = testHeight + 'px';
    } else {
      unit = thisHeight / HEIGHT;
      var testWidth = Math.floor(WIDTH * unit);
      renderer.view.style.width = testWidth + 'px';
      renderer.view.style.height = thisHeight + 'px';
    }
  }

  function onAssetsLoaded() // will be called when assets are loaded, except background music
  {
    progressText.innerHTML = 'Preparing Assets...';

    game_container.interactive = true;
    // adding mouse callbacks
    game_container.on('mousedown', clickFire);
    game_container.on('mouseup', fireEnd);
    game_container.on('mouseupoutside', fireEnd);

    // adding touch callbacks
    game_container.on('touchstart', tapFire);
    game_container.on('touchend', fireEnd);
    game_container.on('touchendoutside', fireEnd);
    game_container.on('touchmove', holdFire);

    // fullscreen button
    var fullscreen_button_style = {
      font : 'bold italic 36px Arial',
      fill : '#F7EDCA',
      stroke : '#3399FF',
      strokeThickness : 5,
      dropShadow : true,
      dropShadowColor : '#000000',
      dropShadowAngle : Math.PI / 6,
      dropShadowDistance : 6,
      wordWrap : true,
      wordWrapWidth : 440
    };
    var fullscreen_button = new PIXI.Text("Full Screen", fullscreen_button_style);
    fullscreen_button.position.x = 20;
    fullscreen_button.position.y = 20;
    fullscreen_button.interactive = true;
    fullscreen_button.click = fullscreen_button.tap = function() {
      if (screenfull.enabled) {
        screenfull.request();
      }
    };
    ui_static_container.addChild(fullscreen_button);

    // background image
    var bg = new PIXI.Sprite.fromImage('_assets/graphics/im_bg.jpg');
    background_layer.addChild(bg);

    //preparing coin anim
    for (var i = 1; i < 6; i++) {
      coin_anim.push(PIXI.Texture.fromFrame('coin0' + i + '.png'));
    }

    //preparing cannon anim, bullet anim, net anim
    for (var i = 0; i < CANNON_DATA.length; i ++) {
      //cannon
      var frames = [];
      for (var j = 0; j < 6; j++) {
        frames.push(PIXI.Texture.fromFrame(CANNON_DATA[i][0] + '_' + j + '.png'));
      }
      frames.push(PIXI.Texture.fromFrame(CANNON_DATA[i][0] + '_0.png'));//adding the idle image to the end
      cannons.push(frames);

      //bullet
      frames = [];
      for (var j = 0; j < 10; j++) {
        var frames2 = [];
        for (var k = 0; k < 2; k++) {
          frames2.push(PIXI.Texture.fromFrame(CANNON_DATA[i][1] + (j + 1) + '_' + k + '.png'));
        }
        frames.push(frames2);
      }
      bullets.push(frames);

      //net
      frames = [];
      for (var j = 0; j < 12; j++) {
        frames.push(PIXI.Texture.fromFrame(CANNON_DATA[i][2] + '_' + j + '.png'));
      }
      nets.push(frames);
    }

    //preparing fish anim
    for (var i = 0; i < FISH_DATA.length; i++) {
      //fish
      var frames = [];
      for (var j = 0; j < FISH_DATA[i][1]; j++) {
        frames.push(PIXI.Texture.fromFrame(FISH_DATA[i][0] + '_' + j + '.png'));
      }
      all_fish.push(frames);

      //dead fish
      frames = [];
      for (var l = 0; l < FISH_DATA[i][4]; l++) {
        frames.push(PIXI.Texture.fromFrame(FISH_DATA[i][0] + '_d_' + l + '.png'));
      }
      all_d_fish.push(frames);
    }

    progressText.innerHTML = 'Connecting To Server...';
    socket = io.connect(server_address,{reconnection: false}); // connect to server
    socket.on('disconnect', function() {
      if(alert('Connection lost.')) {
        //nothing
      } else {
        window.location.reload();
      }
    });
    socket.on('connect', function() { // send login message after connection is made
      socket.emit(0, 123123);
    });
    socket.on(0, function(msg) { // login response, with room data
      progressText.innerHTML = 'Creating room...';
      my_seat = msg.seat_number;
      cannon_multi_list = msg.cannons;
      cannon_spread = cannon_multi_list.length / CANNON_DATA.length;

      //creating common element
      for (var i = 0; i < msg.max_seat_number; i++) {
        var cannon_background = new PIXI.Sprite.fromFrame('board.png');
        cannon_background.anchor.x = 0.5;
        cannon_background.anchor.y = 1;
        cannon_background.position.x = WIDTH / (msg.max_seat_number / 2 + 1) * (i % (msg.max_seat_number / 2) + 1);
        cannon_background.position.y = i < msg.max_seat_number / 2 ? HEIGHT : 0;
        cannon_background.rotation = i < msg.max_seat_number / 2 ? 0 : Math.PI;
        cannon_background.width *=  0.5 * SIZE_MODIFIER;
        cannon_background.height *=  0.5 * SIZE_MODIFIER;
        ui_static_container.addChild(cannon_background);

        //bracket for cannon multi text
        var cannon_multi = new PIXI.Sprite.fromFrame('boardmutiple.png');
        cannon_multi.anchor.x = 0.5;
        cannon_multi.anchor.y = 1;
        cannon_multi.position.x = WIDTH / (msg.max_seat_number / 2 + 1) * (i % (msg.max_seat_number / 2) + 1);
        cannon_multi.position.y = i < msg.max_seat_number / 2 ? HEIGHT - 7 : 7;
        cannon_multi.rotation = i < msg.max_seat_number / 2 ? 0 : Math.PI;
        cannon_multi.width *=  0.5 * SIZE_MODIFIER;
        cannon_multi.height *=  0.5 * SIZE_MODIFIER;
        ui_static_container.addChild(cannon_multi);


        var cannon_multi_text_style = {
          font : '18px Arial',
          fill : '#F7EDCA',
          align: 'center',
          stroke : '#000000',//'#4a1850',
          strokeThickness : 5
        };
        var cannon_multi_text = new PIXI.Text('', cannon_multi_text_style);
        cannon_multi_text.anchor.x = 0.5;
        cannon_multi_text.anchor.y = 0.5;
        cannon_multi_text.position.x = WIDTH / (msg.max_seat_number / 2 + 1) * (i % (msg.max_seat_number / 2) + 1);
        cannon_multi_text.position.y = i < msg.max_seat_number / 2 ? HEIGHT - 20 : 20;
        cannon_multi_text.visible = false;
        ui_container.addChild(cannon_multi_text);
        cannon_multi_text_list.push(cannon_multi_text);

        var score_text_style = {
          font : '26px Arial',
          fill : '#F7EDCA',
          align: 'left',
          stroke : '#4a1850',//'#4a1850',
          strokeThickness : 5,
          dropShadow : true,
          dropShadowColor : '#000000',
          dropShadowAngle : Math.PI / 6,
          dropShadowDistance : 6
        };
        var score_text = new PIXI.Text('', score_text_style);
        //score_text.anchor.x = 0.5;
        score_text.anchor.y = 0.5;
        score_text.position.x = WIDTH / (msg.max_seat_number / 2 + 1) * (i % (msg.max_seat_number / 2) + 1) + 75;
        score_text.position.y = i < msg.max_seat_number / 2 ? HEIGHT - 15 : 40;
        score_text.visible = false;
        ui_container.addChild(score_text);
        score_text_list.push(score_text);

        var name_text = new PIXI.Text('', score_text_style);
        name_text.anchor.y = 0.5;
        name_text.position.x = WIDTH / (msg.max_seat_number / 2 + 1) * (i % (msg.max_seat_number / 2) + 1) + 75;
        name_text.position.y = i < msg.max_seat_number / 2 ? HEIGHT - 40 : 15;
        name_text.visible = false;
        ui_container.addChild(name_text);
        name_text_list.push(name_text);

        //preparing cannon object
        var cannon = new PIXI.extras.MovieClip(cannons[0]);
        cannon.index = 0;
        cannon.anchor.x = 0.5;
        cannon.anchor.y = 0.75;
        cannon.width *= 0.75 * SIZE_MODIFIER;
        cannon.height *= 0.75 * SIZE_MODIFIER;
        cannon.position.x = WIDTH / (msg.max_seat_number / 2 + 1) * (i % (msg.max_seat_number / 2) + 1);
        cannon.position.y = i < msg.max_seat_number / 2 ? HEIGHT - 50 : 50;
        cannon.animationSpeed = 0.5;
        cannon.rotation = i < msg.max_seat_number / 2 ? 0 : Math.PI;
        cannon.visible = false;
        cannon.loop = false;//anim will only play once
        ui_container.addChild(cannon);
        cannon_list.push(cannon);
      }

      //cannon multi + button
      var cannon_add = new PIXI.Sprite.fromFrame('bt_add.png');
      cannon_add.anchor.x = 0.5;
      cannon_add.anchor.y = 1;
      cannon_add.position.x = WIDTH / (msg.max_seat_number / 2 + 1) * (msg.seat_number % (msg.max_seat_number / 2) + 1) + (msg.seat_number < msg.max_seat_number / 2 ? 50 : -50);
      cannon_add.position.y = msg.seat_number < msg.max_seat_number / 2 ? HEIGHT + 9 : -9;
      cannon_add.rotation = msg.seat_number < msg.max_seat_number / 2 ? 0 : Math.PI;
      cannon_add.width *=  0.5 * SIZE_MODIFIER;
      cannon_add.height *=  0.5 * SIZE_MODIFIER;
      cannon_add.interactive = true;
      cannon_add.click = cannon_add.tap = function() {
        if (++cannon_multi_index >= cannon_multi_list.length) {
          cannon_multi_index = 0;
        }
        updateBarrel();
      };
      ui_container.addChild(cannon_add);

      //cannon multi - button
      var cannon_sub = new PIXI.Sprite.fromFrame('bt_sub.png');
      cannon_sub.anchor.x = 0.5;
      cannon_sub.anchor.y = 1;
      cannon_sub.position.x = WIDTH / 2 - 75;
      cannon_sub.position.y = HEIGHT + 13;
      cannon_sub.position.x = WIDTH / (msg.max_seat_number / 2 + 1) * (msg.seat_number % (msg.max_seat_number / 2) + 1) + (msg.seat_number < msg.max_seat_number / 2 ? -50 : 50);
      cannon_sub.position.y = msg.seat_number < msg.max_seat_number / 2 ? HEIGHT + 9 : -9;
      cannon_sub.rotation = msg.seat_number < msg.max_seat_number / 2 ? 0 : Math.PI;
      cannon_sub.width *=  0.5 * SIZE_MODIFIER;
      cannon_sub.height *=  0.5 * SIZE_MODIFIER;
      cannon_sub.interactive = true;
      cannon_sub.click = cannon_sub.tap = function() {
        if (--cannon_multi_index < 0) {
          cannon_multi_index = cannon_multi_list.length - 1;
        }
        updateBarrel();
      };
      ui_container.addChild(cannon_sub);

      for (var i = 0; i < msg.member.length; i++) { // populate the room with player data from the response
        cannon_list[msg.member[i].seat].visible = true;
        cannon_list[msg.member[i].seat].index = msg.member[i].multiplier; //tbc
        cannon_multi_text_list[msg.member[i].seat].text = cannon_multi_list[msg.member[i].multiplier];
        cannon_multi_text_list[msg.member[i].seat].visible = true;
        name_text_list[msg.member[i].seat].text = msg.member[i].name;
        name_text_list[msg.member[i].seat].visible = true;
        score_text_list[msg.member[i].seat].text = msg.member[i].score;
        score_text_list[msg.member[i].seat].visible = true;
        if (msg.member[i].seat == my_seat) {
          score = msg.member[i].score;
        }
      }

      backgroundMusic.start();
      ui_static_container.cacheAsBitmap = true; // cache the static ui elements after they are created as bitmap for better performance

      document.body.removeChild(document.getElementById("progress-set")); // remove the loading progress bar
      renderer = PIXI.autoDetectRenderer(WIDTH, HEIGHT, {view: document.getElementById("game")}); // create renderer and bind it to the canvas
      // renderer = PIXI.autoDetectRenderer(1920, 1080, {view: document.getElementById("game")});
      document.body.onresize = resizeRenderer; // bind resizer to body
      resizeRenderer(); // resize now
      last_update = Date.now(); // initialize the delta time checker
      animate(); // start animating
    });
    socket.on(1, function(msg) { // player join
      cannon_list[msg.seat].visible = true;
      cannon_multi_text_list[msg.seat].text = cannon_multi_list[0];
      cannon_multi_text_list[msg.seat].visible = true;
      name_text_list[msg.seat].text = msg.name;
      name_text_list[msg.seat].visible = true;
      score_text_list[msg.seat].text = msg.score;
      score_text_list[msg.seat].visible = true;
    });
    socket.on(2, function(msg) { // player quit
      cannon_list[msg].visible = false;
      cannon_multi_text_list[msg].visible = false;
      name_text_list[msg].visible = false;
      score_text_list[msg].visible = false;
    });
    socket.on(3, function(msg) { // new fish
      var which = msg.index;
      var fish = new PIXI.extras.MovieClip(all_fish[which]);
      fish.speed = FISH_DATA[which][2];
      fish.index = which;
      fish.boundx = FISH_DATA[which][6] / 2; // prepare for bounding box calculation
      fish.boundy = FISH_DATA[which][7] / 2;
      fish.anchor.x = 0.5;
      fish.anchor.y = 0.5;
      fish.width *= SIZE_MODIFIER;
      fish.height *= SIZE_MODIFIER;
      fish.position.x = msg.posX;
      fish.position.y = msg.posY;
      fish.direction = msg.direction;
      fish.rotation = -fish.direction + (Math.PI / 2);
      fish.animationSpeed = FISH_DATA[which][3];

      // shadow test
      // fish.filters = [fish_shadow];

      fish.play();
      fishes[msg.key] = fish;
      fish_container.addChild(fish);
    });
    socket.on(4, function(msg) { // other player change cannon
      var cannon_set = Math.floor(msg[1] / cannon_spread);
      cannon_list[msg[0]].index = cannon_set;
      cannon_list[msg[0]].textures = cannons[cannon_set];
      cannon_multi_text_list[msg[0]].text = cannon_multi_list[msg[1]];
      playSound('changebarrel');
    });
    socket.on(5, function(msg) { // other player fire cannon
      score_text_list[msg[0]].text = msg[2];
      if (msg[0] == my_seat) {
        score = msg[2];
      } else {
        cannon_list[msg[0]].rotation = Math.PI - msg[1];
        cannon_list[msg[0]].gotoAndPlay(0);
        playSound('common_fire');
        var bullet_index = cannon_list[msg[0]].index;
        var bullet = new PIXI.extras.MovieClip(bullets[bullet_index][msg[0]]);
        bullet.index = bullet_index;
        bullet.speed = CANNON_DATA[bullet_index][3];
        bullet.anchor.x = 0.5;
        bullet.anchor.y = 0.5;
        bullet.width *= SIZE_MODIFIER * CANNON_DATA[bullet_index][4];
        bullet.height *= SIZE_MODIFIER * CANNON_DATA[bullet_index][4];
        bullet.direction = msg[1];
        bullet.position.x = cannon_list[msg[0]].position.x + Math.sin(bullet.direction) * 75;
        bullet.position.y = cannon_list[msg[0]].position.y + Math.cos(bullet.direction) * 75;
        bullet.rotation = -bullet.direction + Math.PI;
        bullet.animationSpeed = 0.05;
        bullet.radius = CANNON_DATA[cannon_index][5];
        bullet.play();
        bullet_pool.push(bullet);
        bullet_container.addChild(bullet);
      }
    });
    socket.on(6, function(msg) { // fish die
      score_text_list[msg[0]].text = msg[3];
      if (msg[0] == my_seat) { // update score if it is current player's kill
        score = msg[3];
      }
      if (msg[1] in fishes) {
        var fish = fishes[msg[1]];
        playSound('gold');
        fish_container.removeChild(fish);

        if (isFocus) { // skip animation if focus is lost
          // dead fish animation
          var d_fish = new PIXI.extras.MovieClip(all_d_fish[fish.index]);
          d_fish.anchor.x = 0.5;
          d_fish.anchor.y = 0.5;
          d_fish.width *= SIZE_MODIFIER;
          d_fish.height *= SIZE_MODIFIER;
          d_fish.position = fish.position;
          d_fish.animationSpeed = FISH_DATA[fish.index][5];
          d_fish.rotation = fish.rotation;
          d_fish.loop = false;
          d_fish.onComplete = function() {
            fish_container.removeChild(this);
          };
          d_fish.play();
          fish_container.addChild(d_fish);

          // coin animation
          var coin = new PIXI.extras.MovieClip(coin_anim);
          coin.targetX = cannon_list[msg[0]].position.x;
          coin.targetY = cannon_list[msg[0]].position.y;
          coin.anchor.x = 0.5;
          coin.anchor.y = 0.5;
          coin.width *= SIZE_MODIFIER * COIN_DATA[0];
          coin.height *= SIZE_MODIFIER * COIN_DATA[0];
          coin.position.x = fish.position.x;
          coin.position.y = fish.position.y;
          coin.animationSpeed = COIN_DATA[1];
          coin.rotation = fish.rotation;
          coin.play();
          coin_container.addChild(coin);
          coin_pool.push(coin);

          // score animation
          var style = {
            font : 'bold 54px Arial',
            fill : '#ECBC4A',
            stroke : '#FF8C00',
            strokeThickness : 3,
            dropShadow : true,
            dropShadowColor : '#000000',
            dropShadowAngle : Math.PI / 6,
            dropShadowDistance : 6
          };
          var score_effect = new PIXI.Text(msg[2], style);
          score_effect.started = Date.now();
          score_effect.position.x = fish.position.x;
          score_effect.position.y = fish.position.y -50;
          score_effect.anchor.x = 0.5;
          score_effect.anchor.y = 0.5;
          score_effect.oldX = score_effect.width;
          score_effect.oldY = score_effect.height;
          score_container.addChild(score_effect);
          score_effect_pool.push(score_effect);
        }
        // remove the fish from calculation
        delete fishes[msg[1]];
      }
    });
  }

  function animate() {
    clearInterval(fps_timer);
    if (!isFocus) {
      backgroundMusic.play();
      isFocus = true;
    }
    var now = Date.now(); // get current time
    var delta = now - last_update; // delta time since last update
    if (delta > MIN_UPDATE_INTERVAL) {
      gameLoop(now, delta);
    }
    fps_timer = setInterval(intervalCheck, FORCE_UPDATE_INTERVAL);
    renderer.render(master_container);
    requestAnimationFrame(animate);
  }

  function intervalCheck() { // function for force updating screen if focus is lost
    if (isFocus) {
      backgroundMusic.pause();
      isFocus = false;
    }
    var now = Date.now();
    var delta = now - last_update;
    gameLoop(now, delta);
  }

  function gameLoop(now, delta) { // main game loop function
    //score effect update
    var i = 0;
    while (i < score_effect_pool.length) {
      var score_effect = score_effect_pool[i];
      var passed = now - score_effect.started;
      if (passed > 550) {
        score_container.removeChild(score_effect);
        score_effect_pool.splice(i, 1);
      } else {
        score_effect.width = score_effect.oldX * (1 + passed / 550);
        score_effect.height = score_effect.oldY * (1 - passed / 550);
        ++i;
      }
    }

    // coin position update
    var i = 0;
    while (i < coin_pool.length) {
      var coin = coin_pool[i];
      var a = Math.abs(coin.targetX - coin.position.x);
      var b = Math.abs(coin.targetY - coin.position.y);
      if (Math.sqrt((a * a) + (b * b)) < 10) {
        coin_pool.splice(i, 1);
        coin_container.removeChild(coin);
      } else {
        coin.position.x += (coin.targetX - coin.position.x) * COIN_DATA[2] * delta / 1000;
        coin.position.y += (coin.targetY - coin.position.y) * COIN_DATA[2] * delta / 1000;
        ++i;
      }
    }

    // update bullet position
    for (var i = 0; i < bullet_pool.length; i++) {
      var bullet = bullet_pool[i];
      bullet.position.x += Math.sin(bullet.direction) * bullet.speed * delta / 1000;
      bullet.position.y += Math.cos(bullet.direction) * bullet.speed * delta / 1000;
      if (bullet.position.x > WIDTH ) {
        bullet.position.x = WIDTH;
        bullet.direction *= -1;
        bullet.rotation = -bullet.direction + Math.PI;
      } else if (bullet.position.x < 0) {
        bullet.position.x = 0;
        bullet.direction = 2 * Math.PI - bullet.direction;
        bullet.rotation = -bullet.direction + Math.PI;
      } else if (bullet.position.y > HEIGHT) {
        bullet.position.y = HEIGHT;
        bullet.direction = Math.PI - bullet.direction;
        bullet.rotation = -bullet.direction + Math.PI;
      } else if (bullet.position.y < 0) {
        bullet.position.y = 0;
        bullet.direction = Math.PI - bullet.direction ;
        bullet.rotation = -bullet.direction + Math.PI;
      }
    }

    // update fish position and checking for collision
    for (var fish_key in fishes) {
      var fish = fishes[fish_key];
      fish.position.x += Math.sin(fish.direction) * fish.speed * delta / 1000;
      fish.position.y += Math.cos(fish.direction) * fish.speed * delta / 1000;

      // remove fish that go too far offscreen
      if (fish.position.x > WIDTH + REMOVE_BOUNDARY || fish.position.x < 0 - REMOVE_BOUNDARY || fish.position.y > HEIGHT + REMOVE_BOUNDARY || fish.position.y < 0 - REMOVE_BOUNDARY) {
        fish_container.removeChild(fish);
        delete fishes[fish_key];
      }
    }
    if (now - last_hit_test > MIN_COLLISION_CHECK_INTERVAL) {
      for (var fish_key in fishes) {
        var fish = fishes[fish_key];
        for (var index in bullet_pool) {
          var bullet = bullet_pool[index];
          var test_angle = fish.rotation * -1; // calculate bounding box rotation base on fish direction
          // normalize bullet position to the fish
          var unrotatedCircleX = Math.cos(test_angle) * (bullet.position.x - fish.position.x) -
            Math.sin(test_angle) * (bullet.position.y - fish.position.y) + fish.position.x;
          var unrotatedCircleY = Math.sin(test_angle) * (bullet.position.x - fish.position.x) +
            Math.cos(test_angle) * (bullet.position.y - fish.position.y) + fish.position.y;

          // calculate the closest point on the fish x axis to the bullet
          var closestX;
          var low_x = fish.position.x - fish.boundx;
          if (unrotatedCircleX < low_x) {
            closestX = low_x;
          } else {
            var high_x = fish.position.x + fish.boundx;
            if (unrotatedCircleX > high_x) {
              closestX = high_x;
            } else {
              closestX = unrotatedCircleX;
            }
          }

          // calculate the closest point on the fish x axis to the bullet
          var closestY;
          var low_y = fish.position.y - fish.boundy;
          if (unrotatedCircleY < low_y) {
            closestY = low_y;
          } else {
            var high_y = fish.position.y + fish.boundy;
            if (unrotatedCircleY > high_y) {
              closestY = high_y;
            } else {
              closestY = unrotatedCircleY;
            }
          }

          var a = Math.abs(unrotatedCircleX - closestX); // distance on x axis
          var b = Math.abs(unrotatedCircleY - closestY); // distance on y axis
          if (Math.sqrt((a * a) + (b * b)) < bullet.radius) { // hit
            bullet_container.removeChild(bullet);
            bullet_pool.splice(index, 1);

            if (isFocus) {
              var hit_net = new PIXI.extras.MovieClip(nets[bullet.index]);
              hit_net.anchor.x = 0.5;
              hit_net.anchor.y = 0.5;
              hit_net.width *= SIZE_MODIFIER;
              hit_net.height *= SIZE_MODIFIER;
              hit_net.position = bullet.position;
              hit_net.animationSpeed = NET_ANIMATION_SPEED;
              hit_net.rotation = bullet.rotation;
              hit_net.loop = false;
              hit_net.onComplete = removeNet;
              hit_net.play();
              net_container.addChild(hit_net);
            }
            if (bullet.hasOwnProperty('key')) {
              bullet_counter -= 1;
              hit(bullet, fish_key);
            }
          }
        }
      }
      last_hit_test = now; // update the last hit test timestamp
    }
    if (isMouse) {
      tap_pos = renderer.plugins.interaction.mouse.global;
    }
    var angle = Math.atan2(tap_pos.y - cannon_list[my_seat].position.y, tap_pos.x - cannon_list[my_seat].position.x);
    // insert code here if we wanna limit cannon angle
    cannon_list[my_seat].rotation = angle + Math.PI / 2;
    if (pressing) {
      fire();
    }
    last_update = now; // update the delta time check
  }

  function removeNet() {
    net_container.removeChild(this);
  }

  // player interaction
  function holdFire(touchData) {
    tap_pos = touchData.data.global;
  }
  function tapFire(touchData) {
    isMouse = false;
    tap_pos = touchData.data.global;
    var angle = Math.atan2(tap_pos.y - cannon_list[my_seat].position.y, tap_pos.x - cannon_list[my_seat].position.x);
    cannon_list[my_seat].rotation = angle + Math.PI / 2;
    prepareToFire();
  }
  function clickFire() { // player click
    isMouse = true;
    prepareToFire();
  }
  function prepareToFire() {
    pressing = true;
    fire();
  }
  function fireEnd() {
    pressing = false;
  }
  function fire() {
    var now = Date.now();
    if (score >= cannon_multi_list[cannon_multi_index] && bullet_counter < BULLET_LIMIT && now - last_fire > FIRE_INTERVAL) {
      last_fire = now;
      var key = uuid.v4();
      score -= cannon_multi_list[cannon_multi_index];
      cannon_list[my_seat].gotoAndPlay(0);
      playSound('common_fire');

      if (isMouse) {
        tap_pos = renderer.plugins.interaction.mouse.global;
      }

      var angle = Math.atan2(tap_pos.y - cannon_list[my_seat].position.y, tap_pos.x - cannon_list[my_seat].position.x);
      angle = angle * -1 + Math.PI / 2;

      socket.emit(2, [key, cannon_multi_index, angle]); // register the bullet to the server

      // create the bullet
      var bullet = new PIXI.extras.MovieClip(bullets[cannon_index][my_seat]);
      bullet.key = key;// store key in object, need to send this on hit
      bullet.index = cannon_index;
      bullet.multi_index = cannon_multi_index;
      bullet.speed = CANNON_DATA[cannon_index][3];
      bullet.anchor.x = 0.5;
      bullet.anchor.y = 0.5;
      bullet.width *= SIZE_MODIFIER * CANNON_DATA[cannon_index][4];
      bullet.height *= SIZE_MODIFIER * CANNON_DATA[cannon_index][4];
      bullet.direction = angle;
      bullet.position.x = cannon_list[my_seat].position.x + Math.sin(bullet.direction) * 75;
      bullet.position.y = cannon_list[my_seat].position.y + Math.cos(bullet.direction) * 75;
      bullet.rotation = -bullet.direction + Math.PI;
      bullet.animationSpeed = 0.05;
      bullet.radius = CANNON_DATA[cannon_index][5];
      bullet.play();
      bullet_pool.push(bullet);
      bullet_counter += 1;
      bullet_container.addChild(bullet);
    }
  }

  function hit(bullet, fish_key) { // called when a fish is hit, bullet already removed in the game loop
    socket.emit(3, [bullet.key, fish_key]); // register bullet hit to server
  }

  function updateBarrel() { // player changes multiplier
    cannon_index = Math.floor(cannon_multi_index / cannon_spread);
    cannon_list[my_seat].textures = cannons[cannon_index];
    cannon_multi_text_list[my_seat].text = cannon_multi_list[cannon_multi_index];
    playSound('changebarrel');
    socket.emit(1, cannon_multi_index);
  }
}();
