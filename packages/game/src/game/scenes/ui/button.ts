import  RexUIPlugin  from 'phaser3-rex-plugins/templates/ui/ui-plugin';
import { Scene } from "phaser";
const COLOR_PRIMARY = 0x4e342e;

const createButton = function (scene : Scene & {rexUI : RexUIPlugin}, text : string) {
    return scene.rexUI.add.label({
        width: 100,
        height: 40,
        background: scene.rexUI.add.roundRectangle(0, 0, 0, 0, 20, COLOR_PRIMARY),
        text: scene.add.text(0, 0, text, {
            fontSize: 18
        }),
        space: {
            left: 10,
            right: 10,
        }
    });
}

export default createButton