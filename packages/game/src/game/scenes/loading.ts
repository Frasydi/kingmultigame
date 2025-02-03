import { Scene } from "phaser";

export class LoadingScene extends Scene {
    constructor() {
        super('Loading');
    }

    preload() {
        this.load.setPath('assets');
        this.load.spritesheet('knight1_idle', 'player/Knight_1/Idle.png', {
            frameWidth: 128,
            frameHeight: 128,

        });
        this.load.spritesheet('knight1_attack', 'player/Knight_1/Attack 1.png', {
            frameWidth: 128,
            frameHeight: 128
        });
        this.load.spritesheet('knight1_move', 'player/Knight_1/Run.png', {
            frameWidth: 128,
            frameHeight: 128,
            
        });
        this.load.spritesheet('knight1_hurt', 'player/Knight_1/Hurt.png', {
            frameWidth: 128,
            frameHeight: 128,
        });
        this.load.spritesheet('knight1_dead', 'player/Knight_1/Dead.png', {
            frameWidth: 128,
            frameHeight: 128,
        });



        this.load.spritesheet('knight2_idle', 'player/Knight_2/Idle.png', {
            frameWidth: 128,
            frameHeight: 128,

        });
        this.load.spritesheet('knight2_attack', 'player/Knight_2/Attack 1.png', {
            frameWidth: 128,
            frameHeight: 128
        });
        this.load.spritesheet('knight2_move', 'player/Knight_2/Run.png', {
            frameWidth: 128,
            frameHeight: 128,
        });
        this.load.spritesheet('knight2_hurt', 'player/Knight_2/Hurt.png', {
            frameWidth: 128,
            frameHeight: 128,
        });

        this.load.spritesheet('knight2_dead', 'player/Knight_2/Dead.png', {
            frameWidth: 128,
            frameHeight: 128,
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
        this.load.audio("music", "audio/music.mp3")
        this.load.audio("attack", "audio/attack.mp3")
        this.load.audio("hit", "audio/hit.mp3")
        this.load.audio("chest-destroy", "audio/chest-destroy.mp3")
        this.load.audio("death", "audio/death.mp3")
        this.load.audio("walk", "audio/walk.mp3")


    }

    create() {
        this.scene.start('Game');
        this.scene.start('ui-scene');
    }
}