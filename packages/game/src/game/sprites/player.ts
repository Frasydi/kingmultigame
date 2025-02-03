import Actor from './actor';
export default class Player extends Actor {
  private keyW: Phaser.Input.Keyboard.Key;
  private keyA: Phaser.Input.Keyboard.Key;
  private keyS: Phaser.Input.Keyboard.Key;
  private keyD: Phaser.Input.Keyboard.Key;
  private keySpace: Phaser.Input.Keyboard.Key;
  private delayMoveSocket = false
  private isattackDelay = false


  constructor(scene: Phaser.Scene, x: number, y: number, name: string) {
    super(scene, x, y, name, "knight1");
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
    let isMove = false
    if (this.body == null) return
    if (!this.knockback) {
      this.getBody().setVelocity(0);
      if (this.isattackDelay) return
      if (this.keyW?.isDown) {
        this.body.velocity.y = -110;
        isMove = true


      }
      if (this.keyA?.isDown) {
        this.body.velocity.x = -110;
        this.checkFlip();
        this.ancor = "left"
        this.getBody().setOffset(48, 70);
        isMove = true

      }
      if (this.keyS?.isDown) {
        this.body.velocity.y = 110;
        isMove = true

      }
      if (this.keyD?.isDown) {
        this.body.velocity.x = 110;
        this.ancor = "right"

        this.checkFlip();
        this.getBody().setOffset(15, 70);
        isMove = true
      }
      if (this.keySpace?.isDown && !this.isattackDelay) {
        this.isattackDelay = true
        this.attack();
        this.scene.game.events.emit("player-attack", { x: this.x, y: this.y, health: this.hp })
        setTimeout(() => {
          this.isattackDelay = false
        }, 1000)
      }

      if (isMove && !this.isattackDelay) {
        this.status = "move"
        if (this.delayMoveSocket) return
        this.delayMoveSocket = true
        this.scene.game.events.emit("player-update", { x: this.x, y: this.y, health: this.hp })
        setTimeout(() => {
          this.delayMoveSocket = false
        }, 1000 / 60)
      } else if (!this.isattackDelay) {
        this.status = "idle"
      }
    }


    super.update()




  }
}