import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { NotificationType } from '@bugflow-2026/shared-types';
import { User } from '../../users/entities/user.entity';
import { IssueEntity } from '../../issues/entities/issue.entity';

@Entity('notifications')
export class NotificationEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column()
  userId!: string;

  @Column()
  issueId!: string;

  @Column({ type: 'varchar' })
  type!: NotificationType;

  @Column()
  message!: string;

  @Index()
  @Column({ default: false })
  read!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(
    () => User,
    user => user.notifications,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'userId' })
  user!: User;

  @ManyToOne(
    () => IssueEntity,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'issueId' })
  issue!: IssueEntity;
}
