import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const host = configService.getOrThrow<string>('DB_HOST');
        const port = configService.getOrThrow<string>('DB_PORT');
        const database = configService.getOrThrow<string>('DB_NAME');
        const authSource = configService.get<string>('DB_AUTH_SOURCE');
        const username = encodeURIComponent(
          configService.getOrThrow<string>('DB_USERNAME'),
        );
        const password = encodeURIComponent(
          configService.getOrThrow<string>('DB_PASSWORD'),
        );

        return {
          uri: `mongodb://${username}:${password}@${host}:${port}/${database}${authSource ? `?authSource=${encodeURIComponent(authSource)}` : ''}`,
        };
      },
    }),
  ],
})
export class DatabaseModule {}
