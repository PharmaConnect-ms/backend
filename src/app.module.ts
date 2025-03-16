
// import { Module } from '@nestjs/common';
// import { TypeOrmModule } from '@nestjs/typeorm';
// import { ConfigModule, ConfigService } from '@nestjs/config';
// import { AuthModule } from './auth/auth.module';
// import { PrescriptionsModule } from './prescriptions/prescriptions.module';
// import { UsersModule } from './users/users.module';

// @Module({
//   imports: [
//     ConfigModule.forRoot({
//       isGlobal: true, // This makes config available throughout the app
//     }),
//     TypeOrmModule.forRootAsync({
//       imports: [ConfigModule],
//       inject: [ConfigService],
//       useFactory: (configService: ConfigService) => ({
//         type: 'mysql',
//         host: configService.get<string>('DATABASE_HOST'),
//         port: configService.get<number>('DATABASE_PORT'),
//         username: configService.get<string>('DATABASE_USER'),
//         password: configService.get<string>('DATABASE_PASSWORD'),
//         database: configService.get<string>('DATABASE_NAME'),
//         autoLoadEntities: true,
//         synchronize: true, // Turn off in production
//       }),
//     }),
//     AuthModule,
//     PrescriptionsModule,
//     UsersModule,
//   ],
//   controllers: [],
//   providers: [],
// })
// export class AppModule {}


import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { User } from './users/user.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DATABASE_HOST,
      port: Number(process.env.DATABASE_PORT),
      username: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
      entities: [User],
      synchronize: true, // Set to false in production
    }),
    UsersModule,
    AuthModule,
  ],
})
export class AppModule {}

