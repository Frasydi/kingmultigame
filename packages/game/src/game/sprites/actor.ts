import { Physics } from "phaser";

class Actor extends Phaser.GameObjects.Sprite {
    protected hp = 100;
    status: "hurt" | "idle" | "attack" | "move" = "idle"
    hpText: Phaser.GameObjects.Text
    damaged: boolean = false
    playerText: Phaser.GameObjects.Text;
    ancor: "right" | "left" = "right"
    isDead : boolean = false;



    constructor(scene: Phaser.Scene, x: number, y: number, name: string, skin: string, frame?: string | number) {
        super(scene, x, y, "player", frame);
        this.scene = scene
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.getBody().setCollideWorldBounds(true);
        this.getBody().setSize(40, 60);
        this.getBody().setOffset(15, 70);

        this.initAnimations(skin);
        this.hpText = this.scene.add.text(this.x, this.y - this.height, this.hp.toString())
        this.playerText = this.scene.add.text(this.x, this.y - this.height, name)
        this.hpText.setDepth(9999)
        this.playerText.setDepth(9999)

    }

    private initAnimations(skin: string): void {
        this.anims.create({
            key: "idle",
            frames: this.anims.generateFrameNumbers(skin + "_idle"),
            repeat: -1,
            frameRate: 8,


        })

        this.anims.create({
            key: "attack",
            frames: this.anims.generateFrameNumbers(skin + "_attack"),
            frameRate: 8,

        })
        this.anims.create({
            key: "move",
            frames: this.anims.generateFrameNumbers(skin + "_move"),
            frameRate: 8,
            repeat: -1,
            skipMissedFrames: true
        })
        this.anims.create({
            key: "hurt",
            frames: this.anims.generateFrameNumbers(skin + "_hurt"),
            frameRate: 3,
            duration : 1000
        })
        this.anims.create({
            key: "dead",
            frames: this.anims.generateFrameNumbers(skin + "_dead"),
            frameRate: 8,
            duration : 1000
        })

        this.play("idle")
    }

    public death(cb? : () => void) {
        this.isDead = true
        this.play("dead").once("animationcomplete", () => {
            console.log("dead")
            cb?.()
        })
    }

    public destroy() {
        this.playerText.destroy()
        this.hpText.destroy()
        super.destroy()
    }

    public attack(): void {
        if (this.status == "attack") return
        this.status = "attack"
        this.scene.sound.play("attack")
        this.play("attack").once("animationcomplete", () => {
            console.log("Attack finished")
            this.status = "idle"
            this.play("idle")
        });

    }

    public getDamage(value: number, direction?: 1 | -1): void {
        if (this.damaged) return
        if(this.isDead) return
        
        this.scene.sound.play("hit")

        this.damaged = true
        this.scene.tweens.add({
            targets: this,
            duration: 100,
            repeat: 3,
            yoyo: true,
            alpha: 0.5,
            onComplete: () => {
                this.setAlpha(1);
                this.damaged = false
            },
        });

        this.hp = this.hp - value;
        this.hpText.setText(this.hp.toString());


        if (this.body && direction != null && this.status != "hurt") {
            
            this.status = "hurt"
            this.body.velocity.x = 500 * direction;
            
            setTimeout(() => {
                if (this.body == null) return
                this.body.velocity.x = 0;
                
            }, 300)

            
        }

    }
    public getHPValue(): number {
        return this.hp;
    }

    public setHPValue(value: number) {

        this.hp = value;
        this.hpText.setText(this.hp.toString());
    }

    update() {

        if(this.isDead) return

        if (this.ancor == "right") {

            this.hpText.setPosition(this.x - this.width * 0.2, this.y - this.height * 0.1);
            this.hpText.setOrigin(0.8, 0.5);
            this.playerText.setPosition(this.x - this.width * 0.2, this.y - this.height * 0.25);
            this.playerText.setOrigin(0.8, 0.5);
        } else {
            this.hpText.setPosition(this.x - this.width * -0.2, this.y - this.height * 0.1);
            this.hpText.setOrigin(0.8, 0.5);
            this.playerText.setPosition(this.x - this.width * -0.2, this.y - this.height * 0.25);
            this.playerText.setOrigin(0.8, 0.5);
        }

        if (this.status == "move" && this.anims.currentAnim?.key != "move") {
            this.play("move")
        } else if (this.status == "idle" && this.anims.currentAnim?.key != "idle") {
            this.play("idle")
        } else if (this.status == "hurt" && this.anims.currentAnim?.key != "hurt") {
            this.play("hurt").once("animationcomplete", () => {
                this.status = "idle"
            })
        }

    }

    protected checkFlip(): void {
        if (this.body == null) return
        if (this.body.velocity.x < 0) {
            this.scaleX = -1;
        } else {
            this.scaleX = 1;
        }
    }
    protected getBody(): Physics.Arcade.Body {
        return this.body as Physics.Arcade.Body;
    }

    onMove() {
        if (this.status == "attack") return
        this.status = "move"
        this.play("move")
    }
}

export default Actor