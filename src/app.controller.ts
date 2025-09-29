import { Controller } from '@nestjs/common';
import { AppService } from './app.service';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { CreateNotificationDto } from './dto/insert.dto';
import { JsonLogger } from './logger';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}
  private readonly logger = new JsonLogger();

  @EventPattern('notification')
  async handleMessage(@Payload() data: CreateNotificationDto, @Ctx() context: RmqContext) {
    const channel = context.getChannelRef();
    const message = context.getMessage();
    try {
      await this.appService.createNotification(data);
      channel.ack(message);
    } catch (error) {
      this.logger.error(error);
      channel.nack(message, false, false);
    }
  }
}
