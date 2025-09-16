import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { User } from '../../users/user.entity';
import { CareProfile } from './care-profile.entity';
import { Appointment } from '../../appointment/entities/appointment.entity';

export enum RelationshipType {
  CHILD = 'child',
  PARENT = 'parent',
  GRANDPARENT = 'grandparent',
  SPOUSE = 'spouse',
  SIBLING = 'sibling',
  OTHER = 'other',
}

export enum CareLevel {
  INDEPENDENT = 'independent',
  ASSISTED = 'assisted',
  DEPENDENT = 'dependent',
  CRITICAL = 'critical',
}

@Entity('family_members')
export class FamilyMember {
  @ApiProperty({
    description: 'Unique identifier for the family member',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Full name of the family member',
    example: 'John Doe Jr.'
  })
  @Column()
  name: string;

  @ApiProperty({
    description: 'Current age of the family member',
    example: 8
  })
  @Column()
  age: number;

  @ApiPropertyOptional({
    description: 'Date of birth',
    example: '2016-05-15'
  })
  @Column({ type: 'date', nullable: true })
  dateOfBirth: Date;

  @ApiProperty({
    description: 'Relationship to the caregiver',
    enum: RelationshipType,
    example: RelationshipType.CHILD
  })
  @Column({
    type: 'enum',
    enum: RelationshipType,
  })
  relationship: RelationshipType;

  @ApiProperty({
    description: 'Level of care required',
    enum: CareLevel,
    example: CareLevel.ASSISTED
  })
  @Column({
    type: 'enum',
    enum: CareLevel,
    default: CareLevel.INDEPENDENT,
  })
  careLevel: CareLevel;

  @ApiPropertyOptional({
    description: 'Medical notes and health information'
  })
  @Column({ type: 'text', nullable: true })
  medicalNotes: string;

  @ApiPropertyOptional({
    description: 'List of known allergies',
    example: ['peanuts', 'shellfish'],
    type: [String]
  })
  @Column({ type: 'simple-array', nullable: true })
  allergies: string[];

  @ApiPropertyOptional({
    description: 'List of current medications',
    example: ['insulin', 'vitamins'],
    type: [String]
  })
  @Column({ type: 'simple-array', nullable: true })
  medications: string[];

  @ApiProperty({
    description: 'Whether this family member is active',
    example: true
  })
  @Column({ default: true })
  isActive: boolean;

  @ManyToOne(() => User, (user) => user.familyMembers)
  @JoinColumn({ name: 'caregiver_id' })
  caregiver: User;

  @Column({ name: 'caregiver_id' })
  caregiverId: string;

  @OneToMany(() => CareProfile, (careProfile) => careProfile.familyMember)
  careProfiles: CareProfile[];

  @OneToMany(() => Appointment, (appointment) => appointment.familyMember, {
    nullable: true,
  })
  appointments: Appointment[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
