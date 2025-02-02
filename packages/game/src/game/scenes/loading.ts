import { Scene } from "phaser";

export class LoadingScene extends Scene {
    constructor() {
        super('Loading');
    }

    preload() {
        this.load.setPath('assets');
        this.load.spritesheet('player', 'player.png', {
            frameWidth: 80,
            frameHeight: 57
        });
        this.load.image('background', 'bg.png');
        this.load.image({
            key: 'tiles',
            url: 'tileset/tilemap.png',
        });
        this.load.spritesheet("tiles_spr", "tileset/tilemap.png", {
            frameWidth: 32,
            frameHeight: 32
        }
        )
        this.load.tilemapTiledJSON('map', 'tileset/tilemap.json');
        this.load.image('logo', 'logo.png');
    }

    create() {
        this.scene.start('Game');
        this.scene.start('ui-scene');
    }
}