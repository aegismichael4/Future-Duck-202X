class Menu extends Phaser.Scene {

    constructor () {
        super('menu');

        this.scoreText;
        this.score;
        this.highScore = 0;

        this.duckSprite;

        this.beer = [];

        this.noInputTimer = 0;

    }

    init(data) {
        this.score = data.score;
        this.noInputTimer = 0;
        if (data.score > this.highScore) this.highScore = data.score;
    }

    create () {

        this.scoreText = this.add.text(800, 90, ("scrore: " + this.score), {
            fontSize: '32px',
            fontFamily: 'Arial',
            color: '#000000',
        });
        
        this.highScoreText = this.add.text(800, 120, ("high score: " + this.highScore), {
            fontSize: '32px',
            fontFamily: 'Arial',
            color: '#000000',
        });

        this.pressSpace = this.add.text(800, 150, "press space to try again", {
            fontSize: '32px',
            fontFamily: 'Arial',
            color: '#000000',
        });

        this.music = this.sound.add("sad_piano_loop", {
            loop: true,
            volume: 0.6
        });
        this.music.play();

        this.rain = this.sound.add("rain", {
            loop: true,
            volume: 0.8
        });
        this.rain.play();

        this.duckSprite = this.add.sprite(this.game.config.width / 2, this.game.config.height / 2,"duck");
        this.duckSprite.scale = 1.5;
        this.duckSprite.alphaTopRight = 0;

        this.beer.push(this.add.sprite(300, 300, "beer_empty"));
        this.beer.push(this.add.sprite(510, 200, "beer_empty"));
        this.beer[this.beer.length - 1].scale = 0.8;
        this.beer.push(this.add.sprite(400, 320, "beer_empty"));
        this.beer[this.beer.length - 1].scale = 1.05;
        this.beer.push(this.add.sprite(470, 460, "beer_empty"));
        this.beer[this.beer.length - 1].scale = 1.1;
        this.beer.push(this.add.sprite(680, 480, "beer_empty"));
        this.beer[this.beer.length - 1].scale = 1.15;
        this.beer[this.beer.length - 1].rotation = Math.PI / 2;
        this.beer.push(this.add.sprite(800, 370, "beer"));
        this.beer[this.beer.length - 1].scale = 1.08;

        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        this.spaceKey.on('down', (key, event) => {

            if (this.noInputTimer > 1000) {
                this.music.stop();
                this.rain.stop();
                this.scene.remove('gameplay');
                this.game.scene.add('gameplay', Gameplay);
                this.scene.start('gameplay');
            }            
        });
    }

    update(time, delta) {
        this.noInputTimer += delta;
    }
}