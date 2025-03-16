import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  username: string;
//allow null
  @Column(
    {
      nullable: true
    }
  )
  password: string; 

  @Column({ default: 'patient' }) 
  role: string;

  @Column({ default: 'local' })
  provider: string;

  @Column({ unique: true })
  email: string;
}
