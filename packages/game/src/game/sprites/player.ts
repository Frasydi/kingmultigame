import Actor from './actor';
export default class Player extends Actor {
  private keyW: Phaser.Input.Keyboard.Key;
  private keyA: Phaser.Input.Keyboard.Key;
  private keyS: Phaser.Input.Keyboard.Key;
  private keyD: Phaser.Input.Keyboard.Key;
  private keySpace: Phaser.Input.Keyboard.Key;
  private delayMoveSocket = false
  
  constructor(scene: Phaser.Scene, x: number, y: number, name : string) {
    super(scene, x, y, name);
    if (this.scene == null || this.scene.input == null || this.scene.input.keyboard == null)
      return
    // KEYS
    this.keyW = this.scene.input.keyboard.addKey('W');
    this.keyA = this.scene.input.keyboard.addKey('A');
    this.keyS = this.scene.input.keyboard.addKey('S');
    this.keyD = this.scene.input.keyboard.addKey('D');
    this.keySpace = this.scene.input.keyboard.addKey('SPACE');
  }

 

  update(): void {
    super.update()
    let isMove = true 
    if (this.body == null) return
    this.getBody().setVelocity(0);
    if(this.status == "attack") return
    if (this.keyW?.isDown) {
      this.body.velocity.y = -110;
      isMove = true


    }
    if (this.keyA?.isDown) {
      this.body.velocity.x = -110;
      this.checkFlip();
      this.getBody().setOffset(48, 15);
      isMove = true

    }
    if (this.keyS?.isDown) {
      this.body.velocity.y = 110;
      isMove = true

    }
    if (this.keyD?.isDown) {
      this.body.velocity.x = 110;
      this.checkFlip();
      this.getBody().setOffset(15, 15);
      isMove = true
    }
    if (this.keySpace?.isDown) {
      this.attack();
      this.scene.game.events.emit("player-attack", { x: this.x, y: this.y, health: this.hp })
    }

    if(isMove && !this.delayMoveSocket) {
      this.delayMoveSocket = true
      this.scene.game.events.emit("player-update", { x: this.x, y: this.y, health: this.hp })
      setTimeout(() => {
        this.delayMoveSocket = false
      }, 1000/60)
    }

  }
}