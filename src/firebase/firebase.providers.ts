import { initializeApp, App, cert } from 'firebase-admin/app';
import { ServiceAccount } from 'firebase-admin';

export const FCM_LEGACY = 'FCM_LEGACY';
export const FCM_NEW = 'FCM_NEW';

export const fcmProviders = [
  {
    provide: FCM_LEGACY,
    useFactory: (): App => {
      const serviceAccount = require('../../temp-alarm-firebase-adminsdk.json') as ServiceAccount;
      return initializeApp({
        credential: cert(serviceAccount),
      }, 'legacy');
    },
  },
  {
    provide: FCM_NEW,
    useFactory: (): App => {
      const serviceAccount = require('../../sm-monitoring-firebase-adminsdk.json') as ServiceAccount;
      return initializeApp({
        credential: cert(serviceAccount),
      }, 'new');
    },
  },
];
