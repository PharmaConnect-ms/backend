import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
    UpdateDateColumn,
  } from 'typeorm';
  import { User } from '@/users/user.entity';
  
  @Entity()
  export class Prescription {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column()
    patientName: string;
  
    @Column()
    prescriptionImage: string;

    @ManyToOne(() => User, user => user.prescriptionsIssued)
    doctor: User;
  
    @ManyToOne(() => User, user => user.prescriptionsReceived)
    patient: User;
  
    @CreateDateColumn()
    createdAt: Date;
  
    @UpdateDateColumn()
    updatedAt: Date;
  }
  