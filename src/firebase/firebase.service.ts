import { Injectable, Logger, Inject } from '@nestjs/common';
import { FCM_LEGACY, FCM_NEW } from './firebase.providers';
import { App } from 'firebase-admin/app';
import { getMessaging, Message } from "firebase-admin/messaging";

@Injectable()
export class FirebaseService {
  constructor(@Inject(FCM_LEGACY) private readonly legacyApp: App, @Inject(FCM_NEW) private readonly newApp: App) {}
  private readonly logger = new Logger(FirebaseService.name);

  async pushNotification(topic: string, title: string, detail: string) {
    try {
      const message: Message = {
        notification: {
          title: title,
          body: detail,
        },
        android: {
          notification: {
            sound: 'default',
            priority: 'max',
            icon: 'ic_stat_sm',
          },
          priority: 'high'
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
            },
          }
        },
        topic: topic
      };
      await getMessaging(this.legacyApp).send(message);
      this.logger.log('test');
      await getMessaging(this.newApp).send(message);
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  };
}

