import { Physics } from "phaser";

class Actor extends Phaser.GameObjects.Sprite {
    protected hp = 100;
    status : "idle" | "attack" = "idle"
    hpText : Phaser.GameObjects.Text
    damaged : boolean = false
    private playerText: Phaser.GameObjects.Text;


    constructor(scene: Phaser.Scene, x: number, y: number, name : string,frame?: string | number) {
        super(scene, x, y, "player", frame);
        
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.getBody().setCollideWorldBounds(true);
        this.getBody().setSize(40, 60);
        this.getBody().setOffset(8, 0);

        this.initAnimations();
        this.hpText = this.scene.add.text(this.x, this.y - this.height, this.hp.toString())
        this.playerText = this.scene.add.text(this.x, this.y - this.height, name)

    }

    private initAnimations(): void {
        this.anims.create({
            key : "walk",
            frames : this.anims.generateFrameNumbers("player", {
                frames : [4,5,6,7,8,9,10]
            }),
            repeat : -1,
            frameRate : 8

        })

        this.anims.create({
            key : "attack",
            frames : this.anims.generateFrameNumbers("player", {
                frames : [0,1,2,3]
            }),
            frameRate : 8
        })
        this.play("walk")
    }

    public destroy() {
        this.playerText.destroy()
        this.hpText.destroy()
        super.destroy()
    }

    public attack() : void {
        if(this.status == "attack") return
        this.status = "attack"
        this.play("attack").once("animationcomplete", () => {
            console.log("Attack finished")
            this.status = "idle"
            this.play("walk")
        });
    }

    public getDamage(value: number): void {
        if(this.damaged) return
        this.damaged = true
        this.scene.tweens.add({
            targets: this,
            duration: 100,
            repeat: 3,
            yoyo: true,
            alpha: 0.5,
            onStart: () => {
                if (value) {
                   
                }
            },
            onComplete: () => {
                this.setAlpha(1);
                this.damaged = false
            },
        });

        this.hp = this.hp - value;
        this.hpText.setText(this.hp.toString());

    }
    public getHPValue(): number {
        return this.hp;
    }

    public setHPValue(value: number) {
        this.hp = value;
        this.hpText.setText(this.hp.toString());
    }

    update() {
        this.hpText.setPosition(this.x, this.y - this.height * 0.4);
        this.hpText.setOrigin(0.8, 0.5);  
        this.playerText.setPosition(this.x + 10, this.y - this.height * 0.7);
        this.playerText.setOrigin(0.8, 0.5);
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
}

export default Actor