export interface JwtPayload {
  sub: number; // userId
  email: string;
  username: string;
  role: string;
}
