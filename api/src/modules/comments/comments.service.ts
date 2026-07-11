import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { RealtimeService } from '../realtime/services/realtime.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { CommentEntity } from './entities/comment.entity';
import { IssueEntity } from '../issues/entities/issue.entity';
import { User as UserEntity } from '../users/entities/user.entity';
import { NotificationDispatcherService } from '../notifications/services/notification-dispatcher.service';
import { NotificationType, User } from '@bugflow-2026/shared-types';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(CommentEntity)
    private repo: Repository<CommentEntity>,
    @InjectRepository(IssueEntity)
    private issuesRepo: Repository<IssueEntity>,
    @InjectRepository(UserEntity)
    private usersRepo: Repository<UserEntity>,
    private realtimeService: RealtimeService,
    private readonly notificationDispatcherService: NotificationDispatcherService,
  ) {}

  async create(
    issueId: string,
    dto: CreateCommentDto,
    authorId: string,
    user: User,
  ) {
    const content = dto.content;
    const issue = await this.issuesRepo.findOneBy({ id: issueId });

    if (!issue) {
      throw new NotFoundException('Issue not found');
    }

    const comment = this.repo.create({ content, issueId, authorId });
    const savedComment = await this.repo.save(comment);

    await this.notificationDispatcherService.notifyCommentAdded(
      issue,
      [user.id],
      user.name || user.email
    );
    this.realtimeService.commentCreated(issueId);

    return savedComment;
  }

  async findAll(issueId: string) {
    const comments = await this.repo.find({
      where: { issueId },
      order: {
        createdAt: 'DESC',
      },
    });

    const authorIds = [
      ...new Set(
        comments.map(c => c.authorId)
      ),
    ];

    const users = await this.usersRepo.find({
      where: { auth0Id: In(authorIds) },
    });

    const usersMap = new Map(
      users.map(u => [u.auth0Id, u])
    );

    return comments.map(comment => ({
      ...comment,
      author: {
        id: comment.authorId,
        name:
          usersMap.get(comment.authorId)?.name ??
          'Unknown',
      },
    }));
  }

  async findOne(commentId: string) {
    const comment = await this.repo.findOne({ where: { id: commentId } });
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }
    return comment.content;
  }

  async update(commentId: string, dto: UpdateCommentDto, authorId: string, user: User) {
    const comment = await this.repo.findOne({ where: { id: commentId } });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }
    const issue = await this.issuesRepo.findOneBy({ id: comment.issueId });
    if (!issue) {
      throw new NotFoundException('Issue not found');
    }
    if (comment.authorId !== authorId) {
      throw new ForbiddenException('You can only edit your own comments');
    }

    comment.content = dto.content;
    const updatedComment = await this.repo.save(comment);

    await this.notificationDispatcherService.notifyWatchers(
      issue,
      NotificationType.COMMENT_EDITED,
      `${user.name || user.email} updated a comment to "${issue.title}"`
    );
    this.realtimeService.commentUpdated(comment.issueId);
    return updatedComment;
  }

  async remove(commentId: string, authorId: string, user: User) {
    const comment = await this.repo.findOne({ where: { id: commentId } });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }
    const issue = await this.issuesRepo.findOneBy({ id: comment.issueId });
    if (!issue) {
      throw new NotFoundException('Issue not found');
    }
    if (comment.authorId !== authorId) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    await this.repo.remove(comment);

    await this.notificationDispatcherService.notifyWatchers(
      issue,
      NotificationType.COMMENT_DELETED,
      `${user.name || user.email} removed a comment to "${issue.title}"`
    );

    this.realtimeService.commentDeleted(comment.issueId);
    return { success: true };
  }
}
