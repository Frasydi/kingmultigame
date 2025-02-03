import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { GameService } from './game.service';
import { Server, Socket } from 'socket.io';


interface Player {
  health: number;
  x: number;
  y: number;
  id: string;
  name: string;
}

@WebSocketGateway({
  cors: {
    origin: "*"
  },
  path: "/socket",
  namespace: "/socket"
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
    client.emit("welcome", { id: client.id, spawnPoint: spawns, chestId: this.chest, players: Array.from(this.player.values()) });

    return

  }



  handleDisconnect(client: Socket) {
    console.log("Disconnect")
    this.player.delete(client.id);
    client.broadcast.emit('player_disconnect', client.id);
    return
  }

  @SubscribeMessage("join")
  handleJoin(client: Socket, { name, x, y }: { name: string, x: number, y: number }) {
    console.log("Join")
    this.player.set(client.id, { health: 100, x, y, id: client.id, name });
    client.broadcast.emit('new_player', { health: 100, x, y, id: client.id, name });
    return { chestId: this.chest }
  }

  @SubscribeMessage("knockback")
  handleKnockback(client: Socket, data: unknown) {
    if (data == null || typeof data !== 'object') return
    try {
      const { x, y } = data as { x: number, y: number };
      const player = this.player.get(client.id);
      if (player == null) return
      player.x = x;
      player.y = y;
      client.broadcast.emit('knockback', player);
    } catch (error) {
      console.error('Knockback handler error:', error);
      client.emit('error', { message: 'Knockback operation failed' });
    }
    return
  }

  @SubscribeMessage("move")
  handleMove(client: Socket, data: unknown) {
    try {

      if (!data || typeof data !== 'object') throw new Error('Invalid move data');

      const { x, y } = data as { x: number; y: number };

      if (typeof x !== 'number' || typeof y !== 'number') {
        throw new Error('Invalid coordinate format');
      }

      const player = this.player.get(client.id);

      if(player == null) return

      player.x = x;
      player.y = y;

      client.broadcast.emit('move', player);

      return
    } catch (err) {
      console.log(err)
    }
  }

  @SubscribeMessage("chest")
  handleChest(client: Socket) {
    try {
      const player = this.player.get(client.id);
      if (!player) return;
  
      player.health += 50;
      client.broadcast.emit('damage', player);
  
      setTimeout(() => {
        this.chest = Math.floor(Math.random() * 10);
        this.server.emit('chest', this.chest);
      }, 10000);
  
      this.chest = -1;
      client.broadcast.emit('chest', -1);
    } catch (error) {
      console.error('Chest handler error:', error);
      client.emit('error', { message: 'Chest operation failed' });
    }

  }

  @SubscribeMessage("damage")
  handleDamage(client: Socket, data: unknown) {
    console.log(data)
    if (data == null || typeof data !== 'object') return
    try {

      const { attacker, health } = data as { attacker: string, health: number }
      const player = this.player.get(client.id);
      // console.log(player)
      if (player == null) return
      player.health = health;

      if (player.health <= 0) {
        this.player.delete(client.id);
        if(client.connected) {
          client.emit('game_over', { attacker });
        }
        client.broadcast.emit('player_disconnect', client.id);

      } else {
        client.broadcast.emit('damage', player)
      }

    } catch (err) {
      console.log(err)

    }
    return

  }

  @SubscribeMessage("revive")
  handleRevive(client: Socket) {
    const spawns = Math.floor(Math.random() * 7)
    client.emit("welcome", { id: client.id, spawnPoint: spawns, chestId: this.chest, players: Array.from(this.player.values()) });
    return
  }

  @SubscribeMessage("attack")
  handleAttack(client: Socket) {
    client.broadcast.emit('attack', client.id)
    return
  }





}
