import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Patch,
  Delete,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { User } from '@bugflow-2026/shared-types';

@ApiTags('Comments')
@ApiBearerAuth()
@Controller('issues/:issueId/comments')
@UseGuards(JwtAuthGuard)
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  create(
    @Param('issueId') issueId: string,
    @Body() dto: CreateCommentDto,
    @Req() req: any,
  ) {
    const auth0Id = req.user.sub;
    const userdb: User = req.user.dbUser;
    return this.commentsService.create(issueId, dto, auth0Id, userdb);
  }

  @Get()
  findAll(
    @Param('issueId') issueId: string,
  ) {
    return this.commentsService.findAll(issueId);
  }

  @Patch(':commentId')
  update(
    @Param('commentId') commentId: string,
    @Body() dto: UpdateCommentDto,
    @Req() req: any,
  ) {
    const auth0Id = req.user.sub;
    const userdb: User = req.user.dbUser;
    return this.commentsService.update(commentId, dto, auth0Id, userdb);
  }

  @Delete(':commentId')
  remove(
    @Param('commentId') commentId: string,
    @Req() req: any,
  ) {
    const auth0Id = req.user.sub;
    const userdb: User = req.user.dbUser;
    return this.commentsService.remove(commentId, auth0Id, userdb);
  }
}
