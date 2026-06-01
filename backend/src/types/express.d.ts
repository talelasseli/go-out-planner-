declare namespace Express {
  interface Request {
    user?: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      emailVerified?: boolean | null;
    };
  }
}
