import Actor from './actor';
export default class OtherPlayer extends Actor {
  public xcur: number;
  public ycur: number;
  public isAttack: boolean;
  public id: string;
  public distanceFromPlayer: number;
  public moveSound :Phaser.Sound.HTML5AudioSound | Phaser.Sound.NoAudioSound | Phaser.Sound.WebAudioSound| null;
  constructor(scene: Phaser.Scene, x: number, y: number, health: number, name: string, id: string) {
    super(scene, x, y, name, "knight2");
    if (this.scene == null || this.scene.input == null || this.scene.input.keyboard == null)
      return
    this.x = x;
    this.y = y;
    this.id = id
    this.hp = health
    this.hpText.destroy()
    this.hpText = this.scene.add.text(this.x, this.y - this.height, this.hp.toString())
    this.moveSound = this.scene.sound.add("walk", {
      volume : 0,
      loop : true
    })
    this.moveSound.play()

  }

  setCur(x: number, y: number, disableFlipCheck: boolean = false, distance: number = 0) {

    this.setDepth(y)

    if(this.moveSound != null) {
      console.log(1 - Phaser.Math.Clamp(distance / 600, 0, 1))
      this.moveSound.setVolume(1 - Phaser.Math.Clamp(distance / 600, 0, 1))
      if(!this.moveSound.isPlaying) {
        this.moveSound.play()
      }
    }

    if (this.x != x && !disableFlipCheck) {

      if (this.x > x) {
        this.scaleX = -1
        this.ancor = "left"
        this.getBody().setOffset(48, 70);
      } else {
        this.scaleX = 1
        this.ancor = "right"
        this.getBody().setOffset(15, 70);
      }

    }


    if ((this.x != x || this.y != y) && !disableFlipCheck && !this.isDead) {
      if (this.status != "move") {
        this.status = "move"
      } 
    }


    this.x = x;
    this.y = y;

  }



  update(): void {
    super.update()



  }
}