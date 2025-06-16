import { Global, Module } from '@nestjs/common';
import { FirebaseService } from './firebase.service';
import { fcmProviders } from './firebase.providers';

@Global()
@Module({
  providers: [...fcmProviders, FirebaseService],
  exports: [FirebaseService]
})
export class FirebaseModule {}
