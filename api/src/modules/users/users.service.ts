import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { In, Repository } from 'typeorm';
import { UserRole } from '@bugflow-2026/shared-types';
import { Auth0Service } from '../auth/auth0.service';
import { RequestUser } from '../../interfaces/auth/request-user.interface';
import { SearchUsersDto } from './dto/search-users.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private repo: Repository<User>,
    private readonly auth0Service: Auth0Service
  ) {}

  async findByAuth0Id(auth0Id: string) {
    return await this.repo.findOne({ where: { auth0Id } });
  }

  async createFromAuth0(data: {
    auth0Id: string;
    email: string;
    name: string;
    role: UserRole;
  }) {
    const user = this.repo.create(data);
    return await this.repo.save(user);
  }

  async findOrCreateFromAuth0(auth0User: RequestUser) {
    const auth0Id = auth0User.sub;
    const role = auth0User.roles?.[0] as UserRole || UserRole.TESTER;
    let dbUser = auth0Id && await this.findByAuth0Id(auth0Id);

    if (!dbUser) {
      const userInfo = await this.auth0Service.getUserInfo(auth0User.accessToken);
      dbUser = await this.createFromAuth0({
        auth0Id: userInfo.sub,
        email: userInfo.email,
        name: userInfo.name,
        role,
      });
    } else {
      await this.repo.update(dbUser.id, { role });
    }

    dbUser.role = role;
    return dbUser;
  }

  async findAll() {
    return await this.repo.find();
  }

  async updateRole(id: string, role: UserRole) {
    await this.repo.update(id, { role });
    return await this.repo.findOne({ where: { id } });
  }

  async searchUsers(filters: SearchUsersDto) {
    const qb = this.repo.createQueryBuilder('user');

    qb.where(
      '(user.name ILIKE :query OR user.email ILIKE :query)',
      { query: `%${filters.query}%`, },
    );

    if (filters.role) {
      qb.andWhere('user.role = :role', {
        role: filters.role,
      });
    }

    // if (filters.projectId) {
    //   qb.innerJoin(
    //     'user.projects',
    //     'project',
    //     'project.id = :projectId',
    //     { projectId: filters.projectId },
    //   );
    // }

    qb.take(filters.limit ?? 10);

    const users = await qb.getMany();

    return users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    }));
  }

  async findAssignableUsers() {
    const auth0Users = await this.auth0Service.getUsersFromAuth0();
    const auth0Ids = auth0Users.map((u) => u.auth0Id);
    const dbUsers = await this.repo.find({ where: { auth0Id: In(auth0Ids) } });
    const usersByAuth0Id = new Map(dbUsers.map((u) => [u.auth0Id, u]));

    return auth0Users.map((user) => {
      const dbUser = usersByAuth0Id.get(user.auth0Id);

      return {
        ...user,
        id: dbUser?.id,
      };
    });
  }
}
