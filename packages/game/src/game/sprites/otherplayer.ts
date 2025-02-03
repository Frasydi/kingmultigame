import Actor  from './actor';
export default class OtherPlayer extends Actor {
  public xcur : number;
  public ycur : number;
  public isAttack : boolean;
  public id : string;
  constructor(scene: Phaser.Scene, x: number, y: number, health : number, name : string, id : string) {
    super(scene, x, y, name, "knight2");
    if(this.scene == null || this.scene.input == null || this.scene.input.keyboard == null) 
      return
    this.x = x;
    this.y = y;
    this.id = id
    this.hp = health
    this.hpText.destroy()
    this.hpText = this.scene.add.text(this.x, this.y - this.height, this.hp.toString())


  }

  setCur(x: number, y: number, disableFlipCheck : boolean = false ) {


    if(this.x != x && !disableFlipCheck) {

        if(this.x > x ) {
            this.scaleX = -1
            this.ancor = "left"
            this.getBody().setOffset(48, 70);
        } else {
            this.scaleX =  1
            this.ancor = "right"
            this.getBody().setOffset(15, 70);
        }

    }


    if((this.x != x || this.y != y) && !disableFlipCheck) {
      this.status = "move"
    }


    this.x = x;
    this.y = y;
    
  }



  update(): void {
    super.update()

    

  }
}