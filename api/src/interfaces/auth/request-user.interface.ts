import { UserRole } from "shared-types/src/lib/user-role.enum";
import { JwtPayload } from "./jwt-payload.interface";
import { User } from "@bugflow-2026/shared-types";

export interface RequestUser extends JwtPayload {
  accessToken: string;
  roles: UserRole[];
  dbUser?: User;
}
