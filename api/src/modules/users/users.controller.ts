import {
  Controller,
  Get,
  UseGuards,
  Patch,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from './users.service';
import { UserRole } from '@bugflow-2026/shared-types';
import { CurrentUser } from '../auth/current-user.decorator';
import { RequestUser } from '../../interfaces/auth/request-user.interface';
import { ApiOperation, ApiQuery } from '@nestjs/swagger';
import { SearchUsersDto } from './dto/search-users.dto';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  async findAll() {
    return await this.usersService.findAll();
  }

  @Get('me')
  async getMe(@CurrentUser() user: RequestUser) {
    return await this.usersService.findOrCreateFromAuth0(user);
  }

  @Get('assignable')
  async findAssignable() {
    return this.usersService.findAssignableUsers();
  }

  @Patch(':id/role')
  async updateRole(
    @Param('id') id: string,
    @Body('role') role: UserRole
  ) {
    return await this.usersService.updateRole(id, role);
  }

  @Get('search')
    @ApiOperation({ summary: 'Search users for AI tools' })
    @ApiQuery({ name: 'query', required: true })
    @ApiQuery({ name: 'role', required: false, enum: UserRole })
    @ApiQuery({ name: 'projectId', required: false })
    @ApiQuery({ name: 'limit', required: false })
    searchUsers(@Query() dto: SearchUsersDto) {
      return this.usersService.searchUsers(dto);
    }
}
