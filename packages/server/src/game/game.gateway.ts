import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { GameService } from './game.service';
import { Server, Socket } from 'socket.io';


interface Player {
  health: number;
  x: number;
  y: number;
  id: string;
  name : string;
}

@WebSocketGateway({
  cors: {
    origin: "*"
  },
  path: "/socket",
  namespace : "/socket"
})
export class GameGateway {
  @WebSocketServer()
  server: Server;

  private player = new Map<string, Player>()

  private chest = -1;

  constructor(private readonly gameService: GameService) {
    this.chest = Math.floor(Math.random() * 10);

    console.log(this.chest)
  }

  handleConnection(client: Socket) {
    const spawns = Math.floor(Math.random() * 7)
    client.emit("welcome", { id: client.id, spawnPoint : spawns,chestId : this.chest ,players: Array.from(this.player.values()) });

    return
    
  }



  handleDisconnect(client: Socket) {
    console.log("Disconnect")
    this.player.delete(client.id);
    client.broadcast.emit('player_disconnect', client.id);
    return
  }

  @SubscribeMessage("join") 
  handleJoin(client: Socket, {name, x, y} : {name : string, x : number, y : number}) {
    console.log("Join")
    this.player.set(client.id, { health: 100, x, y, id: client.id, name });
    client.broadcast.emit('new_player', { health: 100, x, y, id: client.id, name });
    return {chestId : this.chest}
  }

  @SubscribeMessage("move")
  handleMove(client: Socket, data: { x: number, y: number }) {
    const player = this.player.get(client.id);
    player.x = data.x;
    player.y = data.y;

    client.broadcast.emit('move', player);

    return
  }

  @SubscribeMessage("chest")
  handleChest(client: Socket) {
    const player = this.player.get(client.id);
    player.health += 50;
    client.broadcast.emit('damage', player)

    setTimeout(() => {
      this.chest = Math.floor(Math.random() * 13);
      this.server.emit('chest', this.chest);
    }, 10000)

    this.chest = -1
    client.broadcast.emit('chest', -1);

    return

  }

  @SubscribeMessage("damage")
  handleDamage(client: Socket, { attacker, health }: {
    health: number,
    attacker: string
  }) {
    const player = this.player.get(client.id);
    player.health = health;

    if (player.health <= 0) {
      try {

        this.player.delete(client.id);
        client.emit('game_over', attacker);
        client.broadcast.emit('player_disconnect', client.id);
      }catch(err) {
        console.log(err)
      }
    } else {
      client.broadcast.emit('damage', player)
    }

    return

  }

  @SubscribeMessage("revive")
  handleRevive(client: Socket) {
    const spawns = Math.floor(Math.random() * 7)
    client.emit("welcome", { id: client.id, spawnPoint : spawns,chestId : this.chest ,players: Array.from(this.player.values()) });
    return
  }

  @SubscribeMessage("attack")
  handleAttack(client: Socket) {
    client.broadcast.emit('attack', client.id)
    return
  }





}
