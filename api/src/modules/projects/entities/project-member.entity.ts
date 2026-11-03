import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Unique } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { ProjectEntity } from './project.entity';

@Entity('project_members')
@Unique(['projectId', 'userId'])
export class ProjectMemberEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  projectId!: string;

  @Column()
  userId!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(
    () => ProjectEntity,
    project => project.members,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'projectId' })
  project!: ProjectEntity;

  @ManyToOne(
    () => User,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'userId' })
  user!: User;
}
