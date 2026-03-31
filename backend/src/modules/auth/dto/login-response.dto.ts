import type { RoleName } from '../../roles/types/role-name.type';

export type LoginResponseDto = {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: string;
  user: {
    id: string;
    username: string;
    email: string;
    role: RoleName;
  };
};
