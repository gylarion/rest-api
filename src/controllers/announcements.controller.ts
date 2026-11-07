import type { Request, Response } from "express";
import createError from "http-errors";

import prisma from "../../prisma/client.ts";

const userSelect = {
  id: true,
  username: true,
  email: true,
  name: true,
} as const;

const announcementSelect = {
  id: true,
  title: true,
  description: true,
  price: true,
  category: true,
  createdAt: true,
  updatedAt: true,
  user: { select: userSelect },
} as const;

export async function getAnnouncements(req: Request, res: Response) {
  const { search, sort, page } = req.query as unknown as {
    search?: string;
    sort: "newest" | "oldest";
    page: number;
  };
  const perPage = 10;
  const where = search
    ? { title: { contains: search, mode: "insensitive" as const } }
    : {};

  const [data, total] = await prisma.$transaction([
    prisma.announcement.findMany({
      where,
      orderBy: { createdAt: sort === "oldest" ? "asc" : "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
      select: announcementSelect,
    }),
    prisma.announcement.count({ where }),
  ]);

  res.json({
    data,
    pagination: {
      total,
      page,
      totalPages: Math.ceil(total / perPage),
      perPage,
    },
  });
}

export async function getAnnouncement(req: Request, res: Response) {
  const announcement = await prisma.announcement.findUnique({
    where: { id: Number(req.params.id) },
    select: announcementSelect,
  });

  if (!announcement) {
    throw createError(404, "Announcement not found");
  }

  res.json(announcement);
}

export async function createAnnouncement(req: Request, res: Response) {
  const announcement = await prisma.announcement.create({
    data: { ...req.body, userId: req.user!.sub },
    select: announcementSelect,
  });

  res.status(201).json(announcement);
}

export async function updateAnnouncement(req: Request, res: Response) {
  const id = Number(req.params.id);
  const existingAnnouncement = await prisma.announcement.findUnique({
    where: { id },
    select: { userId: true },
  });

  if (!existingAnnouncement) {
    throw createError(404, "Announcement not found");
  }

  if (existingAnnouncement.userId !== req.user!.sub) {
    throw createError(403, "Access denied");
  }

  const announcement = await prisma.announcement.update({
    where: { id },
    data: req.body,
    select: announcementSelect,
  });

  res.json(announcement);
}

export async function deleteAnnouncement(req: Request, res: Response) {
  const id = Number(req.params.id);
  const existingAnnouncement = await prisma.announcement.findUnique({
    where: { id },
    select: { userId: true },
  });

  if (!existingAnnouncement) {
    throw createError(404, "Announcement not found");
  }

  if (existingAnnouncement.userId !== req.user!.sub) {
    throw createError(403, "Access denied");
  }

  await prisma.announcement.delete({ where: { id } });
  res.status(204).end();
}
