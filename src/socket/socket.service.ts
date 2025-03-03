import { Injectable, OnModuleInit } from '@nestjs/common';
import { Socket, io } from 'socket.io-client';

@Injectable()
export class SocketService implements OnModuleInit {
  socket: Socket;

  onModuleInit() {
    this.connect();
  }

  private connect() {
    this.socket = io(process.env.BROKER);
    return this.socket;
  }

  emit(event: string, data: any) {
    this.socket.emit(event, data);
  }
}