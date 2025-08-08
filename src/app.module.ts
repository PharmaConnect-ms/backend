
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { User } from './users/user.entity';
import { Prescription } from './prescription/entities/prescription.entity';
import { Meeting } from './meeting/entities/meeting.entity';
import { Appointment } from './appointment/entities/appointment.entity';
import { PrescriptionModule } from './prescription/prescription.module';
import { MeetingModule } from './meeting/meeting.module';
import { AppointmentModule } from './appointment/appointment.module';

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
      entities: [User , Prescription , Meeting , Appointment],
      synchronize: true, // Set to false in production
    }),
    UsersModule,
    AuthModule,
    PrescriptionModule,
    MeetingModule,
    AppointmentModule,
  ],
})
export class AppModule {}

