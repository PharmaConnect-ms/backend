import { Entity, PrimaryGeneratedColumn, Column , OneToMany } from 'typeorm';
import { Prescription } from '@/prescription/entities/prescription.entity';
import { Exclude, Expose } from 'class-transformer';


@Entity()
export class User {
  @PrimaryGeneratedColumn()
  @Expose()
  id: number;

  @Column({ unique: true })
  @Expose()
  username: string;
//allow null
  @Column({nullable: true})
  @Exclude({ toPlainOnly: true })
  password: string; 

  @Column({ default: 'user' }) 
  @Expose()
  role: string;

  @Column({ default: 'local' })
  @Expose()
  provider: string;

  @Column({ unique: true })
  @Expose()
  email: string;

  @Column({ nullable: true })
  @Expose()
  phone: string;

  @Column({ nullable: true })
  @Expose()
  address: string;

  @Column({ nullable: true })
  @Expose()
  userSummary: string;

  // Prescriptions issued by the doctor
  @OneToMany(() => Prescription, prescription => prescription.doctor)
  @Expose()
  prescriptionsIssued: Prescription[];

  // Prescriptions belonging to the patient
  @OneToMany(() => Prescription, prescription => prescription.patient)
  @Expose()
  prescriptionsReceived: Prescription[];

}
