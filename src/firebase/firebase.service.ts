import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { credential } from "firebase-admin";
import { initializeApp } from 'firebase-admin/app';
import { getMessaging, Message } from "firebase-admin/messaging";

@Injectable()
export class FirebaseService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseService.name);
  onModuleInit() {
    initializeApp({
      credential: credential.cert(require('../../temp-alarm-firebase-adminsdk.json')),
      projectId: 'smtemp-f7de5',
    });
  }

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
      await getMessaging().send(message);
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  };
}

