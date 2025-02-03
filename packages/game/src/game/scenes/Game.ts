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
    player!: Player | null
    myId: string = ""
    private map!: Tilemaps.Tilemap;
    private tileset!: Tilemaps.Tileset | null;
    private wallsLayer!: Tilemaps.TilemapLayer | null;
    // private groundLayer!: Tilemaps.TilemapLayer | null;
    private chests!: Phaser.GameObjects.Sprite | null;
    otherPlayer: Map<String, OtherPlayer> = new Map();
    private socket!: Socket;
    myName: string = ""
    private spawnPoint: number = -1
    private otherPlayerTimeOut: Map<String, ReturnType<typeof setTimeout>> = new Map()
    private wallSprites: Array<{ sprite: Phaser.Physics.Arcade.Sprite, collides: boolean }> = [];


    constructor() {
        super('Game');
    }

    private initMap(): void {
        this.map = this.make.tilemap({ key: 'map', tileWidth: 32, tileHeight: 32 });
        this.tileset = this.map.addTilesetImage('map', 'tiles') as Tilemaps.Tileset;
        // this.groundLayer = this.map.createLayer('ground', this.tileset, 0, 0);
        this.map.createLayer('ground', this.tileset, 0, 0);

        // Create wall layer (but don't render it as tiles)
        this.wallsLayer = this.map.createLayer('wall', this.tileset, 0, 0);
        this.wallsLayer?.setVisible(false); // Hide the original tile layer

        // Create wall sprites from the wall tile layer
        if (this.wallsLayer) {
            this.wallsLayer.forEachTile(tile => {
                if (tile.index !== -1) { // Skip empty tiles
                    // Calculate position (adjust for tile center if needed)
                    const x = tile.pixelX + tile.width / 2;
                    const y = tile.pixelY + tile.height / 2;

                    // Create a sprite using the tile's texture frame
                    const sprite = this.physics.add.sprite(x, y, 'tiles_spr', tile.index - 1);
                    sprite.setDepth(y); // Depth based on bottom edge
                    sprite.body.setImmovable(true); // Make it immovable for collision
                    this.wallSprites.push({ sprite, collides: tile.properties.collides });
                }
            });
        }

        // Set up collisions between player and wall sprites

        this.physics.world.setBounds(0, 0, this.wallsLayer?.width || 0, this.wallsLayer?.height || 0);
        this.sound.unlock();
        this.sound.play("music", {
            loop: true
        })
        this.showDebugWalls();

    }

    private initSocket(): void {



        this.socket = io('/socket', {
            path: "/socket",
            transports: ["websocket"]
        }); // Replace with your server URL

        this.socket.on('connect', () => {
            console.log('Connected to server');
        });

        this.socket.on("connect_error", (err) => {
            console.log(err)
        })

        this.socket.on('disconnect', (res) => {
            console.log(res)
            console.log('Disconnected from server');
        });

        this.socket.on("welcome", ({ players, id, chestId, spawnPoint }: { spawnPoint: number, chestId: number, id: string, players: PlayerSocket[] }) => {
            Array.from(this.otherPlayer.values()).forEach(player => {
                player.destroy()
            })
            this.otherPlayer = new Map()
            this.initChests(chestId)
            this.spawnPoint = spawnPoint

            if (this.myName.trim().length == 0) {
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

        this.socket.on("knockback", (player: PlayerSocket) => {
            if (this.otherPlayer.has(player.id)) {
                const otplayer = this.otherPlayer.get(player.id)
                if (otplayer == null) return
               
                otplayer.setCur(player.x, player.y, true)
            }
        })

        this.socket.on("move", (player: PlayerSocket) => {
            if (this.otherPlayer.has(player.id)) {
                if (this.otherPlayerTimeOut.has(player.id)) {

                    clearTimeout(this.otherPlayerTimeOut.get(player.id))

                    this.otherPlayerTimeOut.delete(player.id)

                }

                const otplayer = this.otherPlayer.get(player.id)
                if (otplayer == null || this.player == null) return
                const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, otplayer.x, otplayer.y);
                otplayer.setCur(player.x, player.y, false, distance)
                const timeout = setTimeout(() => {
                    if (otplayer.status == "attack") return
                    otplayer.status = "idle"
                }, 200)

                this.otherPlayerTimeOut.set(player.id, timeout)

            }
        })

        this.socket.on("attack", (player: string) => {
            if (this.otherPlayer.has(player)) {
                const otplayer = this.otherPlayer.get(player)
                if(otplayer == null || this.player == null) return
                const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, otplayer.x, otplayer.y);
                this.otherPlayer.get(player)?.attack(distance)
            }
        })

        this.socket.on("player_disconnect", (players: string) => {
            this.otherPlayer.get(players)?.destroy()
            this.otherPlayer.delete(players)
        })

        this.socket.on("new_player", (player: PlayerSocket) => {
            this.createOtherPlayer(player.id, player.x, player.y, player.health, player.name)
        })

        this.socket.on("damage", (player: PlayerSocket) => {
            if (this.otherPlayer.has(player.id)) {
                const otplayer = this.otherPlayer.get(player.id)
                if (otplayer == null) return
                otplayer.status = "hurt"
                otplayer.setHPValue(player.health)
            } else if (this.player != null && player.id == this.myId) {
                this.player.setHPValue(player.health)

            }
        })

        this.socket.on("chest-break", () => {
            if(this.player == null || this.chests == null) return
            const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.chests.x, this.chests.y)

            this.sound.play("chest-destroy", {
                volume : 1 - Phaser.Math.Clamp(distance / 600, 0, 1)
            })
            this.chests.destroy()
            this.chests = null
        })



        this.socket.on('error', (error: { message: string }) => {
            console.error('Socket error:', error.message);
            // Add visual feedback to the player
            this.game.events.emit('socket-error', error.message);
        });

        this.socket.on("game_over_other", ( {attacker,id} : {id : string, attacker : string}) => {
            if (this.otherPlayer.has(id)) {
                const otplayer = this.otherPlayer.get(id);
                
                if (otplayer == null) return
                
                if(attacker == this.myId) {
                    this.sound.play("death")    
                    this.game.events.emit("score-add")
                }
                
                otplayer?.death(() => {
                    console.log("OtherPlayer")
                    otplayer.destroy()
                    this.otherPlayer.delete(id)
                })

            }

        })

        this.socket.on('game_over', ({ attacker }: { attacker: string }) => {
            if (this.player) {
                this.sound.play("death")
                this.player.death(() => {
                    if (this.player == null) return
                    this.player.destroy();
                    this.player = null;
                });
                // Verify attacker exists before camera operation
                if (this.otherPlayer.has(attacker)) {
                    this.initCameraGameOver(this.otherPlayer.get(attacker) as OtherPlayer);
                }
            }
            setTimeout(() => {
                if (this.socket.connected) {
                    this.socket.emit("revive");
                }
            }, 5000);
        });

        // Handle other socket events
    }



    private showDebugWalls(): void {
        const debugGraphics = this.add.graphics().setAlpha(0.7);

    }

    private createPlayer(x: number, y: number) {
        this.player = new Player(this, x, y, this.myName);
        this.player.setDepth(this.player.y + this.player.height);

    }



    private createOtherPlayer(id: string, x: number, y: number, health: number, name: string) {
        const otherPlayer = new OtherPlayer(this, x, y, health, name, id)
        if (this.player != null) {

            this.physics.add.overlap(otherPlayer, this.player, (_obj1, _obj2) => {
                if (this.player == null || otherPlayer == null) return
                if (otherPlayer.status == "attack") {
                    if ((this.player == null || this.player.body == null) || (otherPlayer == null || otherPlayer.body == null)) return
                    const dir = this.player.body.position.x < otherPlayer.body.position.x ? -1 : 1
                    this.player.getDamage(10, dir)
                    this.socket.emit("damage", { health: this.player.getHPValue(), attacker: otherPlayer.id })
                    this.cameras.main.flash();

                }
                if (this.player.status == "attack") {
                    otherPlayer.getDamage(10)
                }
            })
        }

        // this.physics.add.collider(otherPlayer, this.player)
        this.physics.add.collider(otherPlayer, this.wallSprites.filter(el => el.collides).map(el => el.sprite));
        this.otherPlayer.set(id, otherPlayer)

    }

    private updateOtherPlayer() {
        this.otherPlayer.forEach((value, _key) => {
            value.update()
        })
    }

    create() {
        this.initSocket()
        this.initMap()
        this.game.events.on("player-knockback", ({ x, y }: { x: number, y: number }) => {
            if (this.player == null) return
            this.player.setDepth(this.player.y);
            this.socket.emit("knockback", { x, y })
        })
        this.game.events.on("player-update", ({ x, y }: { x: number, y: number }) => {
            if (this.player == null) return

            this.player.setDepth(this.player.y);
            this.socket.emit("move", { x, y })
        })
        this.game.events.on("player-attack", () => {
            this.socket.emit("attack")
        })
        this.game.events.on("join-game", (name: string) => {
            if (this.spawnPoint == -1) return
            const { x, y } = this.initSP(this.spawnPoint)
            this.myName = name
            this.socket.emit("join", { name, x, y }, ({ chestId }: {
                chestId: number
            }) => {
                this.createPlayer(x, y)
                this.spawnPoint = -1

                if (this.player == null) return

                this.physics.add.collider(this.player, this.wallSprites.filter(el => el.collides).map(el => el.sprite));


                this.initCamera()
                this.initChests(chestId)

                this.otherPlayer.forEach(otherPlayer => {
                    if(this.player == null) return
                    this.physics.add.overlap(otherPlayer, this.player, (_obj1, _obj2) => {

                        if (otherPlayer.status == "attack") {
                            if ((this.player == null || this.player.body == null) || (otherPlayer == null || otherPlayer.body == null)) return
                            const dir = this.player.body.position.x < otherPlayer.body.position.x ? -1 : 1
                            this.player.getDamage(10, dir)
                            this.socket.emit("damage", { health: this.player.getHPValue(), attacker: otherPlayer.id })
                            this.cameras.main.flash();

                        }
                        if (this.player != null && this.player.status == "attack") {
                            otherPlayer.getDamage(10)
                        }
                    })
                })
            })
        })



        EventBus.emit('current-scene-ready', this);

    }




    initSP(ind: number) {
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


        if (id == -1) {

            return
        }

        const chestPoints = gameObjectsToObjectPoints(
            this.map.filterObjects('chest', obj => obj.name === 'chestpoint') as any,
        );


        const chest = this.physics.add.sprite(chestPoints[id].x, chestPoints[id].y, "tiles_spr", 993).setScale(1.5)

        chest.setDepth(chest.y - 55)


        this.chests = chest



        if (this.player == null) return

        this.physics.add.overlap(this.player, chest, (_obj1, obj2) => {
            if (this.player == null) return
            if (this.player.status != "attack") return
            this.sound.play("chest-destroy")
            obj2.destroy();
            this.socket.emit("chest")
            this.player.getDamage(-50)


        })

    }

    private initCamera(): void {
        if (this.player == null) return
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
