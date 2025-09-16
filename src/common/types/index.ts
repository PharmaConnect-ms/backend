export interface JwtUser {
  userId: string;
  username: string;
  role: string;
}

export interface AuthenticatedRequest extends Request {
  user: JwtUser;
}
