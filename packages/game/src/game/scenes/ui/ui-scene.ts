import  RexUIPlugin  from 'phaser3-rex-plugins/templates/ui/ui-plugin';
import { Scene } from 'phaser';
import Score from '../text/score';
import createButton from './button';
export class UIScene extends Scene {
  
  private score!: Score;
  private title : Phaser.GameObjects.Text
  private textInput : Phaser.GameObjects.Text
  private myName : string;
  rexUI: RexUIPlugin;
  buttons : RexUIPlugin.Buttons | null 


  constructor() {
    super('ui-scene');

   
  }
  create(): void {
    this.score = new Score(this, 40, 100);
    this.initListener()
  }

  

  private initListener() {
    this.game.events.on('score-add', () => {
        this.score.setScore(this.score.getScore() + 1);

    }, this);

    this.game.events.on("welcome", () => {
      this.title = this.add.text(1024/2 - 310, 768/2- 100, "Welcome to king multiplayer game", { fontSize: "32px", color: "white" })
      this.textInput = this.add.text(1024/2 , 768/2, "You Name", { fontSize: "32px", color: "white", backgroundColor :"black", fixedWidth: 150, fixedHeight: 36  })
      this.textInput.setOrigin(0.5, 0.5)
      this.textInput.setInteractive().on('pointerdown', () => {
        this.rexUI.edit(this.textInput, {
          onTextChanged : (textObject, text) => {
            if(text.trim().length == 0) {
              if(this.buttons != null) {
                this.buttons.destroy();
                this.buttons = null;
                (textObject as any).text = text 
              }
            }

            if(this.buttons == null) {

              this.buttons = this.rexUI.add.buttons({
                x : 1024/2,
                y : 768/2 + 90,
                orientation: 'y',
                space: { item: 8 },
                buttons : [
                  createButton(this, "Start"),
                ]
              }).layout().on("button.click", () => {
                this.game.events.emit("join-game", (textObject as any).text)
                this.buttons?.destroy()
                this.title.destroy();
                this.textInput.destroy();
              });
            }

            (textObject as any).text = text 


            
            
          }
        })
      })
      
      
      console.log(this.buttons)

    })
  }


}