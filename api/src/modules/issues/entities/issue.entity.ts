import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { IssueStatus, IssuePriority, IssueAssignee } from '@bugflow-2026/shared-types';
import { ProjectEntity } from '../../projects/entities/project.entity';
import { CommentEntity } from '../../comments/entities/comment.entity';
import { IssueWatcherEntity } from './issue-watcher.entity';

@Entity('issues')
export class IssueEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  title!: string;

  @Column()
  description!: string;

  @Column({
    type: 'enum',
    enum: IssueStatus,
    default: IssueStatus.OPEN,
  })
  status!: IssueStatus;

  @Column({
    type: 'enum',
    enum: IssuePriority,
    default: IssuePriority.MEDIUM,
  })
  priority!: IssuePriority;

  @Column({
    type: 'jsonb',
    nullable: true
  })
  assignee?: IssueAssignee;

  @Column({ nullable: true })
  projectId?: string | null;

  @ManyToOne(
    () => ProjectEntity,
    project => project.issues,
    {
      nullable: true,
      onDelete: 'SET NULL',
    }
  )
  @JoinColumn({ name: 'projectId' })
  project!: ProjectEntity;

  @OneToMany(
    () => CommentEntity,
    comment => comment.issue,
  )
  comments!: CommentEntity[];

  @OneToMany(
    () => IssueWatcherEntity,
    watcher => watcher.issue,
  )
  watchers!: IssueWatcherEntity[];

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  statusChangedAt!: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
