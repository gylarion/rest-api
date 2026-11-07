import { randomUUID } from "node:crypto";
import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import createError from "http-errors";
import jwt from "jsonwebtoken";

import prisma from "../../prisma/client.ts";

const userSelect = {
  id: true,
  username: true,
  email: true,
  name: true,
} as const;

function createTokens(userId: number) {
  const secret = process.env.JWT_SECRET!;
  const accessToken = jwt.sign({ sub: userId }, secret, {
    expiresIn: "15m",
    jwtid: randomUUID(),
  });
  const refreshToken = jwt.sign({ sub: userId }, secret, {
    expiresIn: "7d",
    jwtid: randomUUID(),
  });

  return { accessToken, refreshToken };
}

export async function register(req: Request, res: Response) {
  const { username, email, password, name } = req.body;
  const existingUser = await prisma.user.findFirst({
    where: { OR: [{ username }, { email }] },
  });

  if (existingUser) {
    throw createError(409, "Username or email already taken");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { username, email, password: hashedPassword, name },
    select: userSelect,
  });
  const tokens = createTokens(user.id);

  await prisma.refreshToken.create({
    data: { token: tokens.refreshToken, userId: user.id },
  });

  res.status(201).json({ user, ...tokens });
}

export async function login(req: Request, res: Response) {
  const { username, password } = req.body;
  const foundUser = await prisma.user.findUnique({ where: { username } });

  if (!foundUser || !(await bcrypt.compare(password, foundUser.password))) {
    throw createError(401, "Invalid credentials");
  }

  const tokens = createTokens(foundUser.id);
  await prisma.$transaction([
    prisma.refreshToken.deleteMany({ where: { userId: foundUser.id } }),
    prisma.refreshToken.create({
      data: { token: tokens.refreshToken, userId: foundUser.id },
    }),
  ]);

  const user = {
    id: foundUser.id,
    username: foundUser.username,
    email: foundUser.email,
    name: foundUser.name,
  };
  res.json({ user, ...tokens });
}

export async function refresh(req: Request, res: Response) {
  const { refreshToken } = req.body;
  let payload: jwt.JwtPayload;

  try {
    payload = jwt.verify(
      refreshToken,
      process.env.JWT_SECRET!,
    ) as jwt.JwtPayload;
  } catch {
    throw createError(401, "Invalid refresh token");
  }

  const savedToken = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
  });

  if (!savedToken || typeof payload.sub !== "number" || payload.sub !== savedToken.userId) {
    throw createError(401, "Invalid refresh token");
  }

  const tokens = createTokens(savedToken.userId);
  await prisma.$transaction([
    prisma.refreshToken.delete({ where: { token: refreshToken } }),
    prisma.refreshToken.create({
      data: { token: tokens.refreshToken, userId: savedToken.userId },
    }),
  ]);

  res.json(tokens);
}

export async function logout(req: Request, res: Response) {
  await prisma.refreshToken.deleteMany({ where: { userId: req.user!.sub } });
  res.status(204).end();
}

export async function getMe(req: Request, res: Response) {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.sub },
    select: { ...userSelect, createdAt: true },
  });

  if (!user) {
    throw createError(404, "User not found");
  }

  res.json(user);
}
