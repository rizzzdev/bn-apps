import { Router, RequestHandler } from 'express';
import { env } from '@/configs/env';
import { prisma } from '@/database';

export const webhookRoute = Router();

const validateApiKey: RequestHandler = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || apiKey !== env.API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

webhookRoute.use(validateApiKey);

webhookRoute.post('/students/sync', async (_req, res) => {
  const data = await prisma.student.findMany({
    include: { currentClass: true, currentMajor: true, picture: true },
  });
  res.json({ data });
});

webhookRoute.post('/teachers/sync', async (_req, res) => {
  const data = await prisma.teacher.findMany({
    include: { picture: true },
  });
  res.json({ data });
});

webhookRoute.post('/academic-years/sync', async (_req, res) => {
  const data = await prisma.academicYear.findMany({
    include: { semesters: true },
  });
  res.json({ data });
});

webhookRoute.post('/semesters/sync', async (_req, res) => {
  const data = await prisma.semester.findMany({
    include: { academicYear: true },
  });
  res.json({ data });
});

webhookRoute.post('/subjects/sync', async (_req, res) => {
  const data = await prisma.subject.findMany({
  });
  res.json({ data });
});

webhookRoute.post('/majors/sync', async (_req, res) => {
  const data = await prisma.major.findMany({
    include: {
      classes: true,
      currentStudents: true,
    },
  });
  res.json({ data });
});

webhookRoute.post('/classes/sync', async (_req, res) => {
  const data = await prisma.class.findMany({
    include: {
      major: true,
      currentStudents: true,
    },
  });
  res.json({ data });
});
