export type AuthUser = {
  id: string;
  username: string;
  email: string;
  role: string;
};

export type AuthSession = {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: string;
  user: AuthUser;
};

export type LoginInput = {
  email: string;
  password: string;
};
