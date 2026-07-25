import axios from 'axios';
import { env } from 'process';
import { ConfigService } from '@nestjs/config';
import { HttpException, Injectable, Logger } from '@nestjs/common';
import { User, UserRole } from '@bugflow-2026/shared-types';

@Injectable()
export class Auth0Service {
  // private domain = env.AUTH0_DOMAIN;
  private clientId = env.AUTH0_CLIENT_ID;
  private clientSecret = env.AUTH0_CLIENT_SECRET;
  private usersCache: User[] | null = null;
  private cacheTimeout: NodeJS.Timeout | null = null;
  private domain = this.configService.get<string>('AUTH0_DOMAIN');
  private managedRolesCache: Record<string, string> | null = null;

  constructor(private configService: ConfigService) {}

  private async getManagementToken(): Promise<string> {
    const response = await axios.post(`https://${this.domain}/oauth/token`, {
      client_id: this.clientId,
      client_secret: this.clientSecret,
      audience: `https://${this.domain}/api/v2/`,
      grant_type: 'client_credentials',
    });

    return response.data.access_token;
  }

  async getUserInfo(accessToken: string) {
    try {
      const response = await axios.get(
        `https://${this.domain}/userinfo`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      return response.data;
    } catch (error) {
      Logger.error('Error fetching user info from Auth0:', error);
      throw new HttpException('Failed to fetch user info', 401);
    }
  }

  async getCachedUsers(): Promise<User[]> {
    if (this.usersCache) return this.usersCache;
    const users = await this.getUsersFromAuth0();
    this.usersCache = users;

    if (this.cacheTimeout) clearTimeout(this.cacheTimeout);

    this.cacheTimeout = setTimeout(() => {
      this.usersCache = null;
    }, 10 * 60 * 1000);

    return users;
  }

  async getUsersFromAuth0(): Promise<User[]> {
    const token = await this.getManagementToken();
    const usersMap = new Map();

    const rolesRes = await axios.get(
      `https://${this.domain}/api/v2/roles`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const roles = rolesRes.data.filter((r: { id: string; name: string; description: string }) =>
      ['developer', 'tester'].includes(r.name)
    );

    for (const role of roles) {
      const usersRes = await axios.get(
        `https://${this.domain}/api/v2/roles/${role.id}/users`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      for (const user of usersRes.data) {
        usersMap.set(user.user_id, {
          auth0Id: user.user_id,
          email: user.email,
          name: user.name,
          role: role.name,
        });
      }
    }

    return Array.from(usersMap.values());
  }

  /**
   * Fetches and caches the Auth0 role IDs for the roles BugFlow manages
   * (admin/developer/tester), keyed by role name.
   */
  private async getManagedRolesMap(token: string): Promise<Record<string, string>> {
    if (this.managedRolesCache) return this.managedRolesCache;

    const rolesRes = await axios.get(
      `https://${this.domain}/api/v2/roles`,
      { headers: { Authorization: `Bearer ${token}` } },
    );

    const managedRoleNames: string[] = Object.values(UserRole);
    const map: Record<string, string> = {};

    for (const role of rolesRes.data as { id: string; name: string }[]) {
      if (managedRoleNames.includes(role.name)) {
        map[role.name] = role.id;
      }
    }

    this.managedRolesCache = map;
    return map;
  }

  /**
   * Auth0 is the source of truth for roles. This removes any currently
   * assigned managed role (admin/developer/tester) that isn't the target
   * one, and assigns the target role if the user doesn't already have it.
   */
  async updateUserRole(auth0Id: string, newRole: UserRole): Promise<void> {
    const token = await this.getManagementToken();
    const rolesMap = await this.getManagedRolesMap(token);
    const targetRoleId = rolesMap[newRole];

    if (!targetRoleId) {
      throw new HttpException(
        `Auth0 role "${newRole}" is not configured in this tenant`,
        500,
      );
    }

    try {
      const { data: currentRoles } = await axios.get<{ id: string }[]>(
        `https://${this.domain}/api/v2/users/${auth0Id}/roles`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      const managedRoleIds = Object.values(rolesMap);
      const currentRoleIds = currentRoles.map(r => r.id);

      const rolesToRemove = currentRoleIds.filter(
        id => managedRoleIds.includes(id) && id !== targetRoleId,
      );

      if (rolesToRemove.length) {
        await axios.delete(
          `https://${this.domain}/api/v2/users/${auth0Id}/roles`,
          {
            headers: { Authorization: `Bearer ${token}` },
            data: { roles: rolesToRemove },
          },
        );
      }

      if (!currentRoleIds.includes(targetRoleId)) {
        await axios.post(
          `https://${this.domain}/api/v2/users/${auth0Id}/roles`,
          { roles: [targetRoleId] },
          { headers: { Authorization: `Bearer ${token}` } },
        );
      }
    } catch (error) {
      Logger.error('Error updating user role in Auth0:', error);
      throw new HttpException('Failed to update role in Auth0', 502);
    }

    this.usersCache = null;
  }
}
