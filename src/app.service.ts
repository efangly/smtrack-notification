import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { InfluxdbService } from './influxdb/influxdb.service';
import { CreateLogDto } from './dto/insert.dto';
import { dateFormat } from './utils/date-format';
import { FirebaseService } from './firebase/firebase.service';

@Injectable()
export class AppService {
  constructor(
    private readonly prisma: PrismaService, 
    private readonly influxdb: InfluxdbService,
    private readonly firebase: FirebaseService
  ) {}
  async createLogDays(message: CreateLogDto) {
    message.createAt = dateFormat(new Date());
    message.updateAt = dateFormat(new Date());
    const log = await this.prisma.notifications.create({ data: message, include: { device: true } });
    const tags = { sn: message.serial };
    const fields = { message: message.detail };
    await this.influxdb.writeData('notification', fields, tags);
    await this.firebase.pushNotification('admin', log.device.name, log.detail);
  }
}