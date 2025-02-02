export default class Score extends Phaser.GameObjects.Text {
    score = 0
    
    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y, "Score : 0", { color: 'white', fontSize: '32px' });
        scene.add.existing(this);
    }

    public updateScore() {
        this.setText(`Score: ${this.score}`);
    }

    public getScore() {
        return this.score
    }

    public setScore(score: number) {
        this.score = score
        this.updateScore()
    }


}