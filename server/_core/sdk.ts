import { jwtVerify } from "jose";
import { parse as parseCookies } from "cookie";
import { getUserById } from "../db";
import { COOKIE_NAME } from "@shared/const";
import type { Request } from "express";

const DEV_SECRET = "dev-secret-change-before-going-live";

export function getJwtSecret() {
  const s = process.env.JWT_SECRET || DEV_SECRET;
  return new TextEncoder().encode(s);
}

export const sdk = {
  async authenticateRequest(req: Request) {
    const cookies = parseCookies(req.headers.cookie ?? "");
    const token = cookies[COOKIE_NAME];
    if (!token) return null;

    try {
      const { payload } = await jwtVerify(token, getJwtSecret());
      const userId = parseInt(String(payload.sub ?? "0"), 10);
      if (!userId) return null;
      return await getUserById(userId);
    } catch {
      return null;
    }
  },
};
