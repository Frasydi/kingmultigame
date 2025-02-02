import Actor  from './actor';
export default class OtherPlayer extends Actor {
  public xcur : number;
  public ycur : number;
  public isAttack : boolean;
  public id : string;
  constructor(scene: Phaser.Scene, x: number, y: number, health : number, name : string, id : string) {
    super(scene, x, y, name);
    if(this.scene == null || this.scene.input == null || this.scene.input.keyboard == null) 
        return
    this.x = x;
    this.y = y;
    this.hp = health
    this.id = id

  }

  setCur(x: number, y: number) {

    if(this.x != x) {

        if(this.x > x ) {
            this.scaleX = -1
            this.getBody().setOffset(48, 15);
        } else {
            this.scaleX =  1
            this.getBody().setOffset(15, 15);
        }
    }

    this.x = x;
    this.y = y;
    // if(this.body) {
    //     this.getBody().setVelocityX(this.xcur)
    //     this.getBody().setVelocityY(this.ycur)
    // }
  }



  update(): void {
    super.update()
  }
}