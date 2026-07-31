declare namespace Express {
  interface Request {
    user?: {
      id: string;
      roles: string[];
      [key: string]: any;
    };
    profileId?: string;
  }
}
