import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Unique } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { IssueEntity } from './issue.entity';

@Entity('issue_watchers')
@Unique(['issueId', 'userId'])
export class IssueWatcherEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  issueId!: string;

  @Column()
  userId!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(
    () => IssueEntity,
    issue => issue.watchers,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'issueId' })
  issue!: IssueEntity;

  @ManyToOne(
    () => User,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'userId' })
  user!: User;
}
