import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { UserRole } from '@bugflow-2026/shared-types';
import { NotificationEntity } from '../../notifications/entities/notification.entity';
import { IssueWatcherEntity } from '../../issues/entities/issue-watcher.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  auth0Id!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  name!: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.TESTER,
  })
  role!: UserRole;

  @OneToMany(
    () => NotificationEntity,
    notification => notification.user,
  )
  notifications!: NotificationEntity[];

  @OneToMany(
    () => IssueWatcherEntity,
    watcher => watcher.user,
  )
  watchedIssues!: IssueWatcherEntity[];

  @CreateDateColumn()
  createdAt!: Date;
}
