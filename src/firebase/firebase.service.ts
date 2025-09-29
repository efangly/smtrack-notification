import { Injectable, Inject } from '@nestjs/common';
import { FCM_LEGACY, FCM_NEW } from './firebase.providers';
import { App } from 'firebase-admin/app';
import { getMessaging, Message } from "firebase-admin/messaging";
import { JsonLogger } from '../logger';

@Injectable()
export class FirebaseService {
  constructor(@Inject(FCM_LEGACY) private readonly legacyApp: App, @Inject(FCM_NEW) private readonly newApp: App) {}
  private readonly logger = new JsonLogger();

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
      await getMessaging(this.newApp).send(message);
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  };
}

