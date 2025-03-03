import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { InfluxdbService } from './influxdb/influxdb.service';
import { CreateLogDto } from './dto/insert.dto';
import { dateFormat } from './utils/date-format';
import { FirebaseService } from './firebase/firebase.service';
import { SocketService } from './socket/socket.service';

@Injectable()
export class AppService {
  constructor(
    private readonly prisma: PrismaService, 
    private readonly influxdb: InfluxdbService,
    private readonly firebase: FirebaseService,
    private readonly socket: SocketService
  ) {}
  async createLogDays(message: CreateLogDto) {
    message.createAt = dateFormat(new Date());
    message.updateAt = dateFormat(new Date());
    const log = await this.prisma.notifications.create({ data: message, include: { device: true } });
    const tags = { sn: message.serial };
    const fields = { message: message.detail };
    await this.influxdb.writeData('notification', fields, tags);
    await this.firebase.pushNotification('admin', log.device.name, log.detail);
    this.socket.socket.emit('send_message',  {
      device: log.device.name,
      message: log.detail,
      hospital: log.device.hospital,
      wardName: log.device.ward,
      time: log.createAt.toString()
    });
  }
}