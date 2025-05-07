"use strict"

// game config
let config = {
    parent: 'phaser-game',
    type: Phaser.CANVAS,
    render: {
        pixelArt: true  // prevent pixel art from getting blurred when scaled
    },
    width: 1200,
    height: 675,
    scene: [Gameplay, Menu],
    backgroundColor: '#A1D6E7'
}

const game = new Phaser.Game(config);