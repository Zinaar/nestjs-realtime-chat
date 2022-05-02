import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { randomBytes } from 'crypto';
import { UpdateMessageDTO } from './dto/update.message.dto';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class MessagesGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    const { from } = client.handshake.headers;
    if (!from) {
      client.emit('error', 'username is required');
      client.disconnect();
    }
    const userData = {
      username: from,
      id: client.id,
      message: `${from} connected to the chat`,
    };
    this.server.emit('connection', userData);
  }
  handleDisconnect(client: Socket) {
    const { from } = client.handshake.headers;
    this.server.emit('disconnection', `${from} disconnected from server`);
  }

  @SubscribeMessage('message')
  async create(client: Socket, message: string) {
    const messageData = {
      id: randomBytes(10).toString('hex'),
      username: client.handshake.headers.from,
      message,
    };
    this.server.send(message, messageData);
  }

  @SubscribeMessage('findAllUsers')
  findAll(socket: Socket) {
    this.server.sockets.sockets;
    const clients = [];
    this.server.sockets.sockets.forEach((names) => {
      clients.push(names.handshake.headers.from);
    });

    this.server.emit('clients', clients);
  }

  @SubscribeMessage('updateMessage')
  update(client: Socket, data: UpdateMessageDTO) {
    const { message, id } = data;
    const { from } = client.handshake.headers;
    const messageData = {
      id,
      username: from,
      message,
    };
    this.server.send(`${from} updated the message ${id}`, messageData);
  }

  @SubscribeMessage('removeMessage')
  remove(client: Socket, id: string) {
    const { from } = client.handshake.headers;

    this.server.emit('removeMessage', `${from} removed the message ${id}`);
  }
}
