import { Scene, Tilemaps } from 'phaser';
import { EventBus } from '../EventBus';
import Player from '../sprites/player';
import { gameObjectsToObjectPoints } from '../helper/gamepointtopoint';
import OtherPlayer from '../sprites/otherplayer';
import io, { Socket } from 'socket.io-client';

interface PlayerSocket {
    id: string
    x: number
    y: number
    health: number,
    name: string
}

export class Game extends Scene {
    player!: Player
    myId: string = ""
    private map!: Tilemaps.Tilemap;
    private tileset!: Tilemaps.Tileset | null;
    private wallsLayer!: Tilemaps.TilemapLayer | null;
    private groundLayer!: Tilemaps.TilemapLayer | null;
    private chests!: Phaser.GameObjects.Sprite | null;
    otherPlayer: Map<String, OtherPlayer> = new Map();
    private socket!: Socket;
    myName: string = ""
    private spawnPoint : number = -1


    constructor() {
        super('Game');
    }

    private initMap(): void {
        this.map = this.make.tilemap({ key: 'map', tileWidth: 32, tileHeight: 32 });
        this.tileset = this.map.addTilesetImage('map', 'tiles') as Tilemaps.Tileset;
        this.groundLayer = this.map.createLayer('ground', this.tileset, 0, 0);
        this.wallsLayer = this.map.createLayer('wall', this.tileset, 0, 0);
        this.wallsLayer?.setCollisionByProperty({ collides: true });
        this.physics.world.setBounds(0, 0, this.wallsLayer?.width || 0, this.wallsLayer?.height || 0);
        // this.showDebugWalls();
    }

    private initSocket(): void {
        this.socket = io('/socket', {
            path: "/socket"
        }); // Replace with your server URL

        this.socket.on('connect', () => {
            console.log('Connected to server');
        });

        this.socket.on("connect_error", (err) => {
            console.log(err)
        })

        this.socket.on('disconnect', () => {
            console.log('Disconnected from server');
        });

        this.socket.on("welcome", ({ players, id, chestId, spawnPoint }: { spawnPoint : number,chestId: number, id: string, players: PlayerSocket[] }) => {
            Array.from(this.otherPlayer.values()).forEach(player => {
                player.destroy()
            })
            this.otherPlayer = new Map()
            this.initChests(chestId)
            this.spawnPoint = spawnPoint

            if(this.myName.trim().length == 0) {
                this.game.events.emit("welcome")
            } else {
               
                this.game.events.emit("join-game", this.myName)
            }

            // this.createPlayer()
            // console.log(chestId)
            // this.physics.add.collider(this.player, this.wallsLayer as any);
            // this.initCamera()

            this.myId = id
            players.filter(el =>
                el.id != this.myId
            ).forEach(player => {
                this.createOtherPlayer(player.id, player.x, player.y, player.health, player.name)
            })
            console.log(players)
        })

        this.socket.on("chest", (id: number) => {
            this.initChests(id)
        })

        this.socket.on("move", (player: PlayerSocket) => {
            if (this.otherPlayer.has(player.id)) {
                this.otherPlayer.get(player.id)?.setCur(player.x, player.y)
            }
        })

        this.socket.on("attack", (player: string) => {
            if (this.otherPlayer.has(player)) {
                this.otherPlayer.get(player)?.attack()
            }
        })

        this.socket.on("player_disconnect", (players: string) => {
            console.log(players)
            this.otherPlayer.get(players)?.destroy()
            this.otherPlayer.delete(players)
        })

        this.socket.on("new_player", (player: PlayerSocket) => {
            console.log(player.id)
            this.createOtherPlayer(player.id, player.x, player.y, player.health, player.name)
        })

        this.socket.on("damage", (player: PlayerSocket) => {
            if (this.otherPlayer.has(player.id)) {
                this.otherPlayer.get(player.id)?.setHPValue(player.health)
            } else {
                if (player.id == this.myId) {
                    this.player.setHPValue(player.health)
                }
            }
        })



        this.socket.on("game_over", (id: string) => {
            this.player.destroy()
            this.initCameraGameOver(this.otherPlayer.get(id) as OtherPlayer)

            setTimeout(() => {
                this.socket.emit("revive")
            }, 5000)

        })

        // Handle other socket events
    }



    private showDebugWalls(): void {
        const debugGraphics = this.add.graphics().setAlpha(0.7);
        this.wallsLayer?.renderDebug(debugGraphics, {
            tileColor: null,
            collidingTileColor: new Phaser.Display.Color(243, 234, 48, 255),
        });
    }

    private createPlayer(x : number, y : number) {
        this.player = new Player(this, x, y, this.myName);

    }

    private createOtherPlayer(id: string, x: number, y: number, health: number, name: string) {
        const otherPlayer = new OtherPlayer(this, x, y, health, name, id)
        if (this.player != null) {

            this.physics.add.overlap(otherPlayer, this.player, (obj1, obj2) => {
                if (otherPlayer.status == "attack") {
                    this.player.getDamage(10)
                    this.socket.emit("damage", { health: this.player.getHPValue(), attacker: id })
                    this.cameras.main.flash();

                }
                if (this.player.status == "attack") {
                    otherPlayer.getDamage(10)
                }
            })
        }
        // this.physics.add.collider(otherPlayer, this.player)
        this.physics.add.collider(otherPlayer, this.wallsLayer as any)
        this.otherPlayer.set(id, otherPlayer)

    }

    private updateOtherPlayer() {
        this.otherPlayer.forEach((value, key) => {
            value.update()
        })
    }

    create() {
        this.initSocket()
        this.initMap()
        this.game.events.on("player-update", ({ x, y }: { x: number, y: number }) => {
            this.socket.emit("move", { x, y })
        })
        this.game.events.on("player-attack", () => {
            this.socket.emit("attack")
        })
        this.game.events.on("join-game", (name: string) => {
            if(this.spawnPoint == -1) return
            const {x, y} = this.initSP(this.spawnPoint)
            this.myName = name
            this.socket.emit("join", { name, x, y}, ({chestId}:{
                chestId : number
            }) => {
                this.createPlayer(x, y)
                this.spawnPoint = -1
                this.physics.add.collider(this.player, this.wallsLayer as any);
                this.initCamera()
                this.initChests(chestId)
                this.otherPlayer.forEach(otherPlayer => {
                    this.physics.add.overlap(otherPlayer, this.player, (obj1, obj2) => {
                        
                        if (otherPlayer.status == "attack") {
                            this.player.getDamage(10)
                            this.socket.emit("damage", { health: this.player.getHPValue(), attacker: otherPlayer.id })
                            this.cameras.main.flash();
        
                        }
                        if (this.player.status == "attack") {
                            otherPlayer.getDamage(10)
                        }
                    })
                })

               

                
            })
        })
        EventBus.emit('current-scene-ready', this);

    }




     initSP(ind : number) {
        const spawnPoints = gameObjectsToObjectPoints(
            this.map.filterObjects('spawnpoint', obj => obj.name === 'spawnpoint') as any,
        );

        const spawnPoint = spawnPoints[ind]

        return spawnPoint

    }
    private initChests(id: number): void {

        if (this.chests != null) {
            this.chests.destroy()
            this.chests = null
        }

        console.log(id)

        if (id == -1) {
            
            return
        }

        const chestPoints = gameObjectsToObjectPoints(
            this.map.filterObjects('chest', obj => obj.name === 'chestpoint') as any,
        );

        console.log(id)
        console.log(chestPoints[id])

        const chest = this.physics.add.sprite(chestPoints[id].x, chestPoints[id].y, "tiles_spr", 993).setScale(1.5)
        this.chests = chest

        if (this.player == null) {
            return
        }

        this.physics.add.overlap(this.player, chest, (_obj1, obj2) => {
            if (this.player.status != "attack") return
            this.game.events.emit("score-add")
            obj2.destroy();
            this.socket.emit("chest")
            this.player.getDamage(-50)


        })


        // this.chests = chestPoints.map(chestPoint =>
        //   this.physics.add.sprite(chestPoint.x, chestPoint.y, 'tiles_spr', 993).setScale(1.5),
        // );
        // this.chests.forEach(chest => {
        //   this.physics.add.overlap(this.player, chest, (obj1, obj2) => {
        //     if(this.player.status != "attack") return
        //     this.game.events.emit("score-add")
        //     obj2.destroy();
        //     console.log("Update")
        //   });
        // });

    }

    private initCamera(): void {
        this.cameras.main.setSize(this.game.scale.width, this.game.scale.height);
        this.cameras.main.startFollow(this.player, true, 0.09, 0.09);
        this.cameras.main.setZoom(2);
    }

    private initCameraGameOver(otherPlayer: OtherPlayer): void {
        this.cameras.main.setSize(this.game.scale.width, this.game.scale.height);
        this.cameras.main.startFollow(otherPlayer, true, 0.09, 0.09);
        this.cameras.main.setZoom(2);
    }

    update() {
        if (this.player != null) {
            this.player.update();
        }
        this.updateOtherPlayer()

    }
}
