import { Game as MainGame } from './scenes/Game';
import { AUTO, Game, Types } from 'phaser';
import { LoadingScene } from './scenes/loading';
import { UIScene } from './scenes/ui/ui-scene';
import RexUIPlugin from 'phaser3-rex-plugins/templates/ui/ui-plugin'

//  Find out more information about the Game Config at:
//  https://newdocs.phaser.io/docs/3.70.0/Phaser.Types.Core.GameConfig
const config: Types.Core.GameConfig = {
    type: AUTO,
    width: 1024,
    height: 768,
    parent: 'game-container',
    backgroundColor: 'black',
    scene: [
        LoadingScene,MainGame, UIScene
    ],
    dom : {
        createContainer : true
    },
    physics : {
        default :"arcade",
        arcade : {
            
            debug : false
        }
    },
    plugins: {
		scene: [
			{
				key: 'rexUI',
				plugin: RexUIPlugin,
				mapping: 'rexUI'
			}
		]
    }
};

const StartGame = (parent : string) => {
    return new Game({ ...config, parent });
}

export default StartGame;

