import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { InfluxdbService } from './influxdb/influxdb.service';
import { CreateLogDto } from './dto/insert.dto';
import { dateFormat } from './utils/date-format';
import { FirebaseService } from './firebase/firebase.service';
import { SocketService } from './socket/socket.service';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class AppService {
  constructor(
    @Inject('RABBITMQ_SERVICE') private readonly client: ClientProxy,
    private readonly prisma: PrismaService,
    private readonly influxdb: InfluxdbService,
    private readonly firebase: FirebaseService,
    private readonly socket: SocketService
  ) { }
  async createLogDays(message: CreateLogDto) {
    message.createAt = dateFormat(new Date());
    message.updateAt = dateFormat(new Date());
    const log = await this.prisma.notifications.create({ data: message, include: { device: true } });
    const tags = { sn: message.serial };
    const fields = { message: message.detail };
    await this.influxdb.writeData('notification', fields, tags);
    if (log.device.hospital === 'HID-DEVELOPMENT') {
      if (log.message.split("/")[1].substring(0, 4) === 'DOOR') {
        await this.firebase.pushNotification('admin-door', log.device.name, log.detail);
      } else {
        await this.firebase.pushNotification('admin', log.device.name, log.detail);
      }
    } else {
      if (log.message.split("/")[1].substring(0, 4) === 'DOOR') {
        await this.firebase.pushNotification('admin-door', log.device.name, log.detail);
        await this.firebase.pushNotification('service-door', log.device.name, log.detail);
        await this.firebase.pushNotification(`${log.device.ward}-door`, log.device.name, log.detail);
        await this.firebase.pushNotification(`${log.device.hospital}-door`, log.device.name, log.detail);
      } else {
        await this.firebase.pushNotification('admin', log.device.name, log.detail);
        await this.firebase.pushNotification('service', log.device.name, log.detail);
        await this.firebase.pushNotification(log.device.ward, log.device.name, log.detail);
        await this.firebase.pushNotification(log.device.hospital, log.device.name, log.detail);
      }
    }
    this.client.emit('notification-backup', {
      id: log.id,
      serial: log.serial,
      staticName: log.device.staticName,
      message: log.message,
      detail: log.detail,
      status: log.status,
      createAt: log.createAt,
      updateAt: log.updateAt
    });
    this.socket.emit('send_message', {
      device: log.device.name,
      message: log.detail,
      hospital: log.device.hospital,
      wardName: log.device.ward,
      time: log.createAt.toString()
    });
  }
}