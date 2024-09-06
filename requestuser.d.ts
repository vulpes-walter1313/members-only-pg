import * as express from "express";
declare global {
  namespace Express {
    interface User {
      id: string;
      first_name: string;
      last_name: string;
      username: string;
      password: string;
      is_member: boolean;
      is_admin: boolean;
    }
  }
}
