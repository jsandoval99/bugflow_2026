import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { RealtimeService } from '../realtime/services/realtime.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { CommentEntity } from './entities/comment.entity';
import { IssueEntity } from '../issues/entities/issue.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(CommentEntity)
    private repo: Repository<CommentEntity>,

    @InjectRepository(IssueEntity)
    private issuesRepo: Repository<IssueEntity>,

    @InjectRepository(User)
    private usersRepo: Repository<User>,

    private realtimeService: RealtimeService,
  ) {}

  async create(
    issueId: string,
    dto: CreateCommentDto,
    userId: string,
  ) {
    const issue = await this.issuesRepo.findOneBy({
      id: issueId,
    });

    if (!issue) {
      throw new NotFoundException(
        'Issue not found'
      );
    }

    const comment = this.repo.create({
      content: dto.content,
      issueId,
      authorId: userId,
    });

    const savedComment = await this.repo.save(comment);
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

  async update(
    commentId: string,
    dto: UpdateCommentDto,
    userId: string,
  ) {
    const comment = await this.repo.findOne({ where: { id: commentId } });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }
    if (comment.authorId !== userId) {
      throw new ForbiddenException('You can only edit your own comments');
    }

    comment.content = dto.content;
    const updatedComment = await this.repo.save(comment);
    this.realtimeService.commentUpdated(comment.issueId);
    return updatedComment;
  }

  async remove(commentId: string, userId: string) {
    const comment = await this.repo.findOne({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }
    if (comment.authorId !== userId) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    await this.repo.remove(comment);
    this.realtimeService.commentDeleted(comment.issueId);
    return { success: true };
  }
}
