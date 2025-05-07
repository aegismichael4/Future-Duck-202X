class Gameplay extends Phaser.Scene {

    constructor() {

        super('gameplay');

        this.player = [];
        this.water = [];
        this.sand = [];
        this.obstacles = [];
        this.lasers = [];
        this.bubbles = [];
        this.livesUI = [];
        this.jumpers = [];
        this.sineFish = [];
        this.deadFish = [];

        this.lives = 3;
        this.score = 0;
        this.level = 0;

        this.scoreText;
        this.levelText;

        this.visorXOffset = 20;
        this.visorYOffset = 22;

        this.scoreX;
        this.scoreY = 5;

        this.levelX;
        this.levelY = 5;

        this.invincibilityTimer = 0;

        this.difficultyCoeff = 1;
        this.timeBetweenWaves = 1000;
        this.waveBufferTimer = 0;
        this.jumperTimer = 0;
        this.sineFishTimer = 0;
        this.jumpersToSpawn = 0;
        this.sineFishToSpawn = 0;
        this.remainingJumpers = 0;
        this.remainingSineFish = 0;

        this.bubbleCheckTimer = 0;

        this.buoyTimer = RandomInRange(1000, 3000);
        this.kelpTimer = RandomInRange(1000, 3000);
    }

    preload() {

        this.load.setPath('./assets');

        this.load.image("wave", "wave.png");
        this.load.image("sand", "sand.png");
        this.load.image("buoy", "buoy.png");
        this.load.image("tall_kelp", "tall_kelp.png");
        this.load.image("short_kelp", "short_kelp.png");
        this.load.image("duck", "duck.png");
        this.load.image("visor", "visor.png");
        this.load.image("laser", "laser.png");
        this.load.image("jumper", "jumper.png");
        this.load.image("dead_jumper", "dead_jumper.png");
        this.load.image("sine_fish", "sine.png");
        this.load.image("dead_sine_fish", "dead_sine.png");
        this.load.image("bubble", "bubble.png");
        this.load.image("beer", "beer.png");
        this.load.image("beer_empty", "beer_empty.png");


        this.load.audio("dnb_loop", "dnb_loop.wav");
        this.load.audio("dnb_loop_delay", "dnb_loop_delay.wav");
        this.load.audio("laser_sound", "laser_sound.wav");
        this.load.audio("level_up", "level_up.wav");
        this.load.audio("bubble_emit", "bubble_emit.wav");
        this.load.audio("quack", "quack.wav");
        this.load.audio("sad_piano_loop", "sad_piano_loop.wav");
        this.load.audio("rain", "rain.wav");

    }

    create() {

     //   this.scene.add('menu', Menu, false);

        this.music = this.sound.add("dnb_loop_delay");
        this.music.loop = true;
        this.music.volume = 0.5;;
        this.music.play();

        this.laser_sfx = this.sound.add("laser_sound");
        this.laser_sfx.volume = 0.5;
        this.level_up_sfx = this.sound.add("level_up");
        this.bubble_emit_sfx = this.sound.add("bubble_emit");
        this.quack_sfx = this.sound.add("quack");
        
        this.add.rectangle(0, 0, 2400, 200, 0x5176E7, 100);

        this.scoreX = this.game.config.width - 100;
        this.levelX = this.game.config.width - 330;

        // instantialize the water and sand sprites
        var counter = 0;
        for (let i = 0; i < 2600; i+= 128) {

            // water
            this.water.push(this.add.sprite(i, 128, "wave"));
            this.water[counter].scale = 2;

            //sand
            this.sand.push(this.add.sprite(i, this.game.config.height, "sand"));
            this.sand[counter].scale = 2;

            counter++;
        }

        this.player.push(this.add.sprite(100, this.game.config.height/2, "duck"));
        this.player[0].scale = 0.75;
        this.player.push(this.add.sprite(120, this.game.config.height/2 - 22, "visor"));
        this.player[1].rotation = Math.PI / 2;

        // create player lives counter
        this.livesUI.push(this.add.sprite(this.game.config.width - 150, 20, "duck"));
        this.livesUI.push(this.add.sprite(this.game.config.width - 190, 20, "duck"));
        this.livesUI.push(this.add.sprite(this.game.config.width - 230, 20, "duck"));
        for (let life in this.livesUI) {
            this.livesUI[life].scale = 0.3;
        }

        this.scoreText = this.add.text(this.scoreX, this.scoreY, this.score, {
            fontSize: '32px',
            fontFamily: 'Arial',
            color: '#000000',
        });

        this.levelText = this.add.text(this.levelX, this.levelY, "lv. " + this.level, {
            fontSize: '32px',
            fontFamily: 'Arial',
            color: '#000000',
        });

        this.wKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        this.sKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        this.spaceKey.on('down', (key, event) => {
            this.lasers.push(this.add.sprite(this.player[1].x, this.player[1].y, "laser"));
            this.lasers[this.lasers.length - 1].rotation = Math.PI / 2;
            this.laser_sfx.play();
        });

        this.initializeLevelData();

    }

    update(time, delta) {

        this.playerMovement(delta);

        // handle lasers
        for (let laser in this.lasers) {
            this.lasers[laser].x += 1.2 * delta;
            if (this.lasers[laser].x > this.game.config.width){
                this.lasers[laser].visible = false;
                this.lasers[laser].active = false;
                delete this.lasers[laser]; 
            } 
        }

        this.handleBubbles(delta);

        this.handleObstacles(delta);

        this.scrollWaterAndSand(delta);

        this.deleteOffScreenFish();

        this.handlePlayerCollision(delta);

        this.handleLaserCollision();

        this.handleDeadFish(delta);

        this.handleEnemyWave(delta);

        // handle UI
        this.scoreText.text = this.score;
        this.levelText.text = "lv. " + this.level;

    }

    initializeLevelData() {

        // jumper path is constant
        this.jumperPoints = [
            1300, 200,
            800, 200,
            500, 150,
            200, 30,
            -100, 100
        ];
        this.jumperCurve = new Phaser.Curves.Spline(this.jumperPoints);

        this.sineFishPoints = [
            1500, 300,
            1200, 150,
            900, 300,
            600, 150,
            300, 300,
            0, 150,
            -300, 150

        ];
        this.sineFishCurve = new Phaser.Curves.Spline(this.sineFishPoints);
        

    }

    playerMovement(delta) {

        this.player[0].y -= 0.5 * delta;
        if (this.wKey.isDown) {
            this.player[0].y -= 0.15 * delta;
        }
        if (this.player[0].y <= 50) this.player[0].y = 50;
        if (this.sKey.isDown) {

            this.player[0].y += 0.9 * delta;
            if (this.player[0].y >= this.game.config.height - 64) this.player[0].y = this.game.config.height - 64;

        
        }
        if (this.player[0].y > 128) {

            if (this.sKey.isDown) {
                this.player[0].rotation = 0.7;
                this.player[1].rotation = Math.PI / 2 + 0.72;
                this.visorXOffset = 28;
                this.visorYOffset = 5;
            } else {
                this.player[0].rotation = 0.5;
                this.player[1].rotation = Math.PI / 2 + 0.5;
                this.visorXOffset = 26;
                this.visorYOffset = 10;
            }
            

        } else if (this.player[0].y <= 128 && this.player[0].y > 96) {
            this.player[0].rotation = 0.25;
            this.player[1].rotation = Math.PI / 2 + 0.25;
            this.visorXOffset = 24;
            this.visorYOffset = 17;

        } else {
            this.player[0].rotation = 0;
            this.player[1].rotation = Math.PI / 2;
            this.visorXOffset = 20;
            this.visorYOffset = 22;
        }
        this.player[1].x = this.player[0].x + this.visorXOffset;
        this.player[1].y = this.player[0].y - this.visorYOffset;
    }

    handleObstacles(delta) {

        this.buoyTimer-= delta;
        if (this.buoyTimer <= 0) {
            this.buoyTimer = RandomInRange(5000, 10000);
            this.obstacles.push(this.add.sprite(this.game.config.width + 128, 55, "buoy"));
            this.obstacles[this.obstacles.length - 1].rotation = Math.PI;
            this.obstacles[this.obstacles.length - 1].scale = 0.75;

        }
        this.kelpTimer-= delta;
        if (this.kelpTimer <= 0) {
            this.kelpTimer = RandomInRange(5000, 10000);
            
            if (0.5 - Math.random() >= 0) {
                this.obstacles.push(this.add.sprite(this.game.config.width + 128, this.game.config.height - 80, "tall_kelp"));
                this.obstacles[this.obstacles.length - 1].scale = 2;


            } else {
                this.obstacles.push(this.add.sprite(this.game.config.width + 128, this.game.config.height - 80, "short_kelp"));
                this.obstacles[this.obstacles.length - 1].scale = 2;

            }
        }
        for (let obstacle in this.obstacles) {

            //buoys
            if (this.obstacles[obstacle].y < 500) {

                // sine wave appearance
                if (Math.floor(this.obstacles[obstacle].x / 500) % 2 == 0) {
                    this.obstacles[obstacle].y += 0.02 * delta;
                } else {
                    this.obstacles[obstacle].y -= 0.02 * delta;
                }

                this.obstacles[obstacle].x -= 0.38 * delta;

            } else { // kelp
                this.obstacles[obstacle].x -= 0.4 * delta;
            }

            

            if (this.obstacles[obstacle].x < -128) {

                this.obstacles[obstacle].visible = false;
                this.obstacles[obstacle].active = false;
                delete this.obstacles[obstacle];
            }
        }
    }

    scrollWaterAndSand(delta) {

        // scroll the water
        if (this.water[0].x <= -1280) {
            for (let wave in this.water) {
                this.water[wave].x += 1280;
            }
        }
        for (let wave in this.water) {
            this.water[wave].x -= 0.4 * delta;
        }



        // scroll the sand
        if (this.sand[0].x <= -1280) {
            for (let block in this.sand) {
                this.sand[block].x += 1280;
            }
        }
        for (let block in this.sand) {
            this.sand[block].x -= 0.4 * delta;
        }
    }

    handleBubbles(delta) {

        // first, handle bubble movement
        for (let bubble in this.bubbles) {

            // sine wave appearance
            if (Math.floor(this.bubbles[bubble].x / 200) % 2 == 0) {
                this.bubbles[bubble].y += 0.05 * delta;
            } else {
                this.bubbles[bubble].y -= 0.05 * delta;
            }

            this.bubbles[bubble].x -= 0.7 * delta;

            if (this.bubbles[bubble].x < -10) {
                this.bubbles[bubble].visible = false;
                this.bubbles[bubble].active = false;
                delete this.bubbles[bubble];
            }
        }

        // next, ensure bubble spawn rate depends on time, not update frequency
        if (this.bubbleCheckTimer > 0) {
            this.bubbleCheckTimer -= delta;
            return;
        }

        this.bubbleCheckTimer = 100;

        // chance to spawn on jumpers first
        for (let jumper in this.jumpers) {
            
            // only shoot bubbles if on the right side of the screen
            if (this.jumpers[jumper].x < 500) continue;

            if (RandomInRange(1, 10) == 5) {
                this.bubbles.push(this.add.sprite(this.jumpers[jumper].x, this.jumpers[jumper].y, "bubble"));
                this.bubbles[this.bubbles.length - 1].scale = 1.6;
                this.bubble_emit_sfx.play();
            }
        }

        //chance to spawn on sine fish next
        for (let sine in this.sineFish) {

            // only shoot bubbles if on the right side of the screen
            if (this.sineFish[sine].x < 500) continue;

            if (RandomInRange(1, 10) == 5) {
                this.bubbles.push(this.add.sprite(this.sineFish[sine].x, this.sineFish[sine].y, "bubble"));
                this.bubbles[this.bubbles.length - 1].scale = 1.6;
                this.bubble_emit_sfx.play();
            }
        }
    }

    handlePlayerCollision(delta) {

        if (this.invincibilityTimer >  0) this.invincibilityTimer -= delta;
        if (this.invincibilityTimer <= 0) {

            let hasCollided = false;
            for (let obstacle in this.obstacles) {

                // obstacle and player collision
                if (PlayerCollides(this.player[0], this.obstacles[obstacle])) {
                    
                    if (this.lives > 0) {
                        this.invincibilityTimer = 2000;
                        this.lives--;

                        this.livesUI[this.lives].visible = false;

                        hasCollided = true;

                    } else {

                    }
                }
            }

            // jumper and player collision
            if (!hasCollided) {

                for (let jumper in this.jumpers) {

                    if (PlayerCollides(this.player[0], this.jumpers[jumper])) {

                        if (this.lives > 0) {
                            this.invincibilityTimer = 2000;
                            this.lives--;
    
                            this.livesUI[this.lives].visible = false;
    
                            hasCollided = true;
    
                        } else {
    
                        }
                    }
                }

            }

            // sine fish and player collision
            if (!hasCollided) {

                for (let sine in this.sineFish) {

                    if (PlayerCollides(this.player[0], this.sineFish[sine])) {

                        if (this.lives > 0) {
                            this.invincibilityTimer = 2000;
                            this.lives--;
    
                            this.livesUI[this.lives].visible = false;
    
                            hasCollided = true;
    
                        } else {
    
                        }
                    }
                }
            }

             // bubble and player collision
             if (!hasCollided) {

                for (let bubble in this.bubbles) {

                    if (PlayerCollides(this.player[0], this.bubbles[bubble])) {

                        if (this.lives > 0) {
                            this.invincibilityTimer = 2000;
                            this.lives--;
    
                            this.livesUI[this.lives].visible = false;
    
                            hasCollided = true;
    
                        } else {
    
                        }
                    }
                }
            }

            if (hasCollided) {
                if (this.lives > 0) {
                    this.quack_sfx.play();
                } else {
                    let scoreObject = this.score;
                    this.music.stop();
                    this.scene.start('menu', {score:scoreObject});
                }
                
            }

        } else {

            if (Math.floor(this.invincibilityTimer / 200) % 2 == 1) {
                this.player[0].visible = false;
                this.player[1].visible = false;
            } else {
                this.player[0].visible = true;
                this.player[1].visible = true;
            }
        }
    }

    handleLaserCollision() {

        // check all lasers
        for (let laser in this.lasers) {

            let hasCollided = false;
                        
            // compare current laser with all jumpers
            for (let jumper in this.jumpers) {

                if (LaserCollides(this.lasers[laser], this.jumpers[jumper])) {

                    this.score += 10;
                    this.remainingJumpers--;
                    this.deadFish.push(this.add.sprite(this.jumpers[jumper].x, this.jumpers[jumper].y, "dead_jumper"));
                    this.deadFish[this.deadFish.length - 1].scale = 1.5;
                    this.deadFish[this.deadFish.length - 1].flipX = true;
    
                    this.lasers[laser].visible = false;
                    this.lasers[laser].active = false;
    
                    this.jumpers[jumper].visible = false;
                    this.jumpers[jumper].active = false;
    
                    delete this.lasers[laser];
                    delete this.jumpers[jumper];    

                    hasCollided = true;

                    //assume current laser is only touching one jumper
                    break;
                }
            }

            // if current laser already hit a jumper, then don't bother checking if it's hitting a sine fish
            if (hasCollided) continue;

            // compare current laser with all sine fish
            for (let sine in this.sineFish) {

                if (LaserCollides(this.lasers[laser], this.sineFish[sine])) {

                    this.score += 10;
                    this.remainingSineFish--;
                    this.deadFish.push(this.add.sprite(this.sineFish[sine].x, this.sineFish[sine].y, "dead_sine_fish"));
                    this.deadFish[this.deadFish.length - 1].scale = 1.5;
                    this.deadFish[this.deadFish.length - 1].flipX = true;

                    this.lasers[laser].visible = false;
                    this.lasers[laser].active = false;

                    this.sineFish[sine].visible = false;
                    this.sineFish[sine].active = false;

                    delete this.lasers[laser];
                    delete this.sineFish[sine];

                    break;

                }
            }
            
        }
    }

    spawnJumper(yOffset) {
        this.jumpers.push(this.add.follower(this.jumperCurve, this.jumperCurve.points[0].x, this.jumperCurve.points[0].y + yOffset, "jumper"));
        this.jumpers[this.jumpers.length - 1].flipX = true;
        this.jumpers[this.jumpers.length - 1].scale = 1.5;

        let followObject = {
            from: 0,
            to: 1,
            delay: 0,
            duration: 2000,
            ease: 'Sine.easeInOut',
            repeat: 0,
            yoyo: false,
            rotateToPath: true,
            rotationOffset: 180
        }
        this.jumpers[this.jumpers.length - 1].startFollow(followObject);
    }

    spawnSineFish(yOffset) {
        
        this.sineFish.push(this.add.follower(this.sineFishCurve, this.sineFishCurve.points[0].x, this.sineFishCurve.points[0].y + yOffset, "sine_fish"));
        this.sineFish[this.sineFish.length - 1].flipX = true;
        this.sineFish[this.sineFish.length - 1].scale = 1.5;

        let followObject = {
            from: 0,
            to: 1,
            delay: 0,
            duration: 3000,
  //          ease: 'Sine.easeInOut',
            repeat: 0,
            yoyo: false,
            rotateToPath: false,
            rotationOffset: 180
        }
        this.sineFish[this.sineFish.length - 1].startFollow(followObject);
    }

    deleteOffScreenFish() {

        for (let jumper in this.jumpers) {
            if (this.jumpers[jumper].x < -10) {

                this.remainingJumpers--;
                this.jumpers[jumper].visible = false;
                this.jumpers[jumper].active = false;
                delete this.jumpers[jumper];
            }
        }

        for (let sine in this.sineFish) {
            if (this.sineFish[sine].x < -10) {

                this.remainingSineFish--;
                this.sineFish[sine].visible = false;
                this.sineFish[sine].active = false;
                delete this.sineFish[sine];
            }
        }
    }

    handleDeadFish(delta) {

        for (let fish in this.deadFish) {

            this.deadFish[fish].y += (delta * 0.1) + (this.deadFish[fish].y / 250);
            let hitBottom = false;
            if (this.deadFish[fish].y > this.game.config.height - 60) {
                this.deadFish[fish].y = this.game.config.height - 60;
                hitBottom = true;
            }

            if (hitBottom) {
                this.deadFish[fish].x -= delta * 0.4; 
            } else {
               this.deadFish[fish].x -= delta * 0.15; 
            }
            

            if (this.deadFish[fish].x < -10) {

                this.deadFish[fish].visible = false;
                this.deadFish[fish].active = false;

                delete this.deadFish[fish];
            }
        }
    }

    handleEnemyWave(delta) {

        // once current wave is cleared, start counting down before the next one
        if (this.remainingJumpers == 0 && this.remainingSineFish == 0 && this.jumpersToSpawn == 0 && this.sineFishToSpawn == 0) {
            this.waveBufferTimer -= delta;
        }

        // start a new wave
        if (this.waveBufferTimer <= 0) {

            this.waveBufferTimer = this.timeBetweenWaves;

            // difficulty is exponential
            this.difficultyCoeff *= 1.4;
            this.level++;
            if (this.level != 1) this.level_up_sfx.play();
            this.jumpersToSpawn = RandomInRange(1.2*this.difficultyCoeff, 1.8*this.difficultyCoeff);
            this.sineFishToSpawn = RandomInRange(1.2*this.difficultyCoeff, 1.8*this.difficultyCoeff);

        }
        
        // handle existing wave, even if we just started a new one
        this.jumperTimer -= delta;
        this.sineFishTimer -= delta;

        // spawn a new jumper
        if (this.jumpersToSpawn > 0 && this.jumperTimer <= 0) {
            this.spawnJumper(RandomInRange(0, 100));
            this.jumpersToSpawn--;
            this.remainingJumpers++;
            this.jumperTimer = RandomInRange(10000 / this.difficultyCoeff, 20000 / this.difficultyCoeff) + 300;
        }

        // spawn a new sine fish
        if (this.sineFishToSpawn > 0 && this.sineFishTimer <= 0) {
            this.spawnSineFish(RandomInRange(0, 200));
            this.sineFishToSpawn--;
            this.remainingSineFish++;
            this.sineFishTimer = RandomInRange(10000 / this.difficultyCoeff, 20000 / this.difficultyCoeff) + 300;
        }

        
    }

}

function RandomInRange(min, max) {
        return Math.floor(Math.random() * (max - min + 1) + 1);
    }

function LaserCollides(a, b) {

    if (Math.abs (a.x - b.x) > ((a.width + b.width) / 2)) {
        return false;
    }

    if (Math.abs (a.y - b.y) > ((a.height + b.height) / 2)) {
        return false;
    }

    return true;
}

function PlayerCollides(a, b) {

    if (Math.abs (a.x - b.x) > ((a.width + b.width) / 2 - 20)) {
        return false;
    }

    if (Math.abs (a.y - b.y) > ((a.height + b.height) / 2 - 40)) {
        return false;
    }

    return true;
}