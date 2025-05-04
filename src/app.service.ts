import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { InfluxdbService } from './influxdb/influxdb.service';
import { CreateNotificationDto } from './dto/insert.dto';
import { dateFormat } from './utils/date-format';
import { FirebaseService } from './firebase/firebase.service';
import { SocketService } from './socket/socket.service';
import { ClientProxy } from '@nestjs/microservices';
import { Cron } from '@nestjs/schedule';
import axios from 'axios';
import { format } from 'date-fns';
import { Probe } from './types/probe.type';

@Injectable()
export class AppService {
  constructor(
    @Inject('RABBITMQ_SERVICE') private readonly client: ClientProxy,
    private readonly prisma: PrismaService,
    private readonly influxdb: InfluxdbService,
    private readonly firebase: FirebaseService,
    private readonly socket: SocketService
  ) {}

  async createNotification(message: CreateNotificationDto) {
    message.createAt = dateFormat(new Date());
    message.updateAt = dateFormat(new Date());
    const notification = await this.prisma.notifications.create({ data: message, include: { device: true } });
    const tags = { sn: message.serial, static: notification.device.staticName, hospital: notification.device.hospital, ward: notification.device.ward };
    const fields = { message: message.message };
    await this.influxdb.writeData('notification', fields, tags);
    if (notification.device.hospital === 'HID-DEVELOPMENT') {
      if (notification.message.split("/")[1].substring(0, 4) === 'DOOR') {
        await this.firebase.pushNotification('admin-door', notification.device.name, notification.detail);
      } else {
        await this.firebase.pushNotification('admin', notification.device.name, notification.detail);
      }
    } else {
      if (notification.message.split("/")[1].substring(0, 4) === 'DOOR') {
        await this.firebase.pushNotification('admin-door', notification.device.name, notification.detail);
        await this.firebase.pushNotification('service-door', notification.device.name, notification.detail);
        await this.firebase.pushNotification(`${notification.device.ward}-door`, notification.device.name, notification.detail);
        await this.firebase.pushNotification(`${notification.device.hospital}-door`, notification.device.name, notification.detail);
      } else {
        await this.firebase.pushNotification('admin', notification.device.name, notification.detail);
        await this.firebase.pushNotification('service', notification.device.name, notification.detail);
        await this.firebase.pushNotification(notification.device.ward, notification.device.name, notification.detail);
        await this.firebase.pushNotification(notification.device.hospital, notification.device.name, notification.detail);
      }
    }
    this.client.emit('notification-backup', {
      id: notification.id,
      serial: notification.serial,
      staticName: notification.device.staticName,
      message: notification.message,
      detail: notification.detail,
      status: notification.status,
      createAt: notification.createAt,
      updateAt: notification.updateAt
    });
    this.socket.emit('send_message', {
      device: notification.device.name,
      message: notification.detail,
      hospital: notification.device.hospital,
      wardName: notification.device.ward,
      time: notification.createAt.toString()
    });
  }

  @Cron('*/10 * * * *')
  async handleCron() {
    const result = await axios.get(process.env.DEVICE_URL);
    const data = result.data.data as Probe[];
    if (data.length === 0) return;
    const device = data.filter((device) => device.firstDay === "ALL"
      || device.firstDay === format(new Date(), "eee").toUpperCase()
      || device.secondDay === format(new Date(), "eee").toUpperCase()
      || device.thirdDay === format(new Date(), "eee").toUpperCase()
    )
    if (device.length === 0) return;
    const sendTime = device.filter((device) => device.firstTime === format(new Date(), "HHmm")
      || device.secondTime === format(new Date(), "HHmm")
      || device.thirdTime === format(new Date(), "HHmm")
    );
    if (sendTime.length === 0) return;
    sendTime.forEach((device) => {
      if (device.device.log.length > 0) {
        this.createNotification({
          serial: device.device.id,
          message: `REPORT/TEMP ${device.device.log[0].tempDisplay} C, HUMI ${device.device.log[0].humidityDisplay}%`,
          detail: `Report: TEMP ${device.device.log[0].tempDisplay} C, HUMI ${device.device.log[0].humidityDisplay}%`,
          createAt: dateFormat(new Date()),
          updateAt: dateFormat(new Date())
        });
      } else {
        this.createNotification({
          serial: device.device.id,
          message: `REPORT/Can't get Temp. and Humi.`,
          detail: `Report: Can't get Temp. and Humi.`,
          createAt: dateFormat(new Date()),
          updateAt: dateFormat(new Date())
        });
      }
    });
  }
}