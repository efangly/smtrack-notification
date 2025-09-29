import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { JsonLogger } from './logger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new JsonLogger(),
    bufferLogs: true,
  });
  
  const microservice = app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ],
      queue: 'notification_queue',
      queueOptions: { durable: true },
      noAck: false,
      prefetchCount: 1
    }
  });
  
  await microservice.listen();
  await app.listen(3000);
}
bootstrap();
