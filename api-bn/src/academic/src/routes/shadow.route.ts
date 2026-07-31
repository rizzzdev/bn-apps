import { Router } from 'express';
import { prisma } from '@academic/database/index.js';
import { shadowSyncService } from '../services/shadow-sync.service.js';
import { withCache, sendResponse } from '@app/index.js';

export const shadowRoute = Router();

// --- Manual Sync Trigger ---
shadowRoute.post('/shadow-sync', async (req, res, next) => {
  try {
    const results = await shadowSyncService.syncAll();
    return sendResponse(res, 200, 'Berhasil mengonfirmasi & menyelaraskan database shadow', results);
  } catch (err) {
    next(err);
  }
});

// --- Shadow Academic Years ---
shadowRoute.get('/shadow-academic-years', async (req, res, next) => {
  try {
    await shadowSyncService.syncAcademicYears();
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const cacheKey = `academic:shadow:academic-year:all:page:${page}:limit:${limit}`;
    const result = await withCache(cacheKey, 600, async () => {
      const [data, totalData] = await Promise.all([
        prisma.shadowAcademicYear.findMany({
          where: { deletedAt: null },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.shadowAcademicYear.count({ where: { deletedAt: null } }),
      ]);
      return {
        data,
        pagination: {
          currentPage: page,
          totalPage: Math.ceil(totalData / limit) || 1,
          totalData,
          dataPerPage: limit,
        },
      };
    });

    return sendResponse(res, 200, 'OK', result.data, result.pagination);
  } catch (err) {
    next(err);
  }
});

shadowRoute.get('/shadow-academic-years/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const cacheKey = `academic:shadow:academic-year:id:${id}`;
    const item = await withCache(cacheKey, 600, async () => {
      return prisma.shadowAcademicYear.findFirst({
        where: { id, deletedAt: null },
      });
    });
    return sendResponse(res, item ? 200 : 404, item ? 'OK' : 'Data tidak ditemukan', item);
  } catch (err) {
    next(err);
  }
});

// --- Shadow Classes ---
shadowRoute.get('/shadow-classes', async (req, res, next) => {
  try {
    await shadowSyncService.syncClasses();
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const cacheKey = `academic:shadow:class:all:page:${page}:limit:${limit}`;
    const result = await withCache(cacheKey, 600, async () => {
      const [data, totalData] = await Promise.all([
        prisma.shadowClass.findMany({
          where: { deletedAt: null },
          skip,
          take: limit,
          orderBy: { name: 'asc' },
        }),
        prisma.shadowClass.count({ where: { deletedAt: null } }),
      ]);
      return {
        data,
        pagination: {
          currentPage: page,
          totalPage: Math.ceil(totalData / limit) || 1,
          totalData,
          dataPerPage: limit,
        },
      };
    });

    return sendResponse(res, 200, 'OK', result.data, result.pagination);
  } catch (err) {
    next(err);
  }
});

shadowRoute.get('/shadow-classes/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const cacheKey = `academic:shadow:class:id:${id}`;
    const item = await withCache(cacheKey, 600, async () => {
      return prisma.shadowClass.findFirst({
        where: { id, deletedAt: null },
      });
    });
    return sendResponse(res, item ? 200 : 404, item ? 'OK' : 'Data tidak ditemukan', item);
  } catch (err) {
    next(err);
  }
});

// --- Shadow Majors ---
shadowRoute.get('/shadow-majors', async (req, res, next) => {
  try {
    await shadowSyncService.syncMajors();
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const cacheKey = `academic:shadow:major:all:page:${page}:limit:${limit}`;
    const result = await withCache(cacheKey, 600, async () => {
      const [data, totalData] = await Promise.all([
        prisma.shadowMajor.findMany({
          where: { deletedAt: null },
          skip,
          take: limit,
          orderBy: { name: 'asc' },
        }),
        prisma.shadowMajor.count({ where: { deletedAt: null } }),
      ]);
      return {
        data,
        pagination: {
          currentPage: page,
          totalPage: Math.ceil(totalData / limit) || 1,
          totalData,
          dataPerPage: limit,
        },
      };
    });

    return sendResponse(res, 200, 'OK', result.data, result.pagination);
  } catch (err) {
    next(err);
  }
});

shadowRoute.get('/shadow-majors/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const cacheKey = `academic:shadow:major:id:${id}`;
    const item = await withCache(cacheKey, 600, async () => {
      return prisma.shadowMajor.findFirst({
        where: { id, deletedAt: null },
      });
    });
    return sendResponse(res, item ? 200 : 404, item ? 'OK' : 'Data tidak ditemukan', item);
  } catch (err) {
    next(err);
  }
});

// --- Shadow Students ---
shadowRoute.get('/shadow-students', async (req, res, next) => {
  try {
    await shadowSyncService.syncStudents();
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const status = req.query.status as string | undefined;

    const whereClause = {
      deletedAt: null,
      ...(status ? { status } : {}),
    };

    const cacheKey = `academic:shadow:student:all:page:${page}:limit:${limit}:status:${status || 'all'}`;
    const result = await withCache(cacheKey, 600, async () => {
      const [data, totalData] = await Promise.all([
        prisma.shadowStudent.findMany({
          where: whereClause,
          skip,
          take: limit,
          orderBy: { fullname: 'asc' },
        }),
        prisma.shadowStudent.count({ where: whereClause }),
      ]);
      return {
        data,
        pagination: {
          currentPage: page,
          totalPage: Math.ceil(totalData / limit) || 1,
          totalData,
          dataPerPage: limit,
        },
      };
    });

    return sendResponse(res, 200, 'OK', result.data, result.pagination);
  } catch (err) {
    next(err);
  }
});

shadowRoute.get('/shadow-students/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const cacheKey = `academic:shadow:student:id:${id}`;
    const item = await withCache(cacheKey, 600, async () => {
      return prisma.shadowStudent.findFirst({
        where: { id, deletedAt: null },
      });
    });
    return sendResponse(res, item ? 200 : 404, item ? 'OK' : 'Data tidak ditemukan', item);
  } catch (err) {
    next(err);
  }
});

// --- Shadow Teachers ---
shadowRoute.get('/shadow-teachers', async (req, res, next) => {
  try {
    await shadowSyncService.syncTeachers();
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const status = req.query.status as string | undefined;

    const whereClause = {
      deletedAt: null,
      ...(status ? { status } : {}),
    };

    const cacheKey = `academic:shadow:teacher:all:page:${page}:limit:${limit}:status:${status || 'all'}`;
    const result = await withCache(cacheKey, 600, async () => {
      const [data, totalData] = await Promise.all([
        prisma.shadowTeacher.findMany({
          where: whereClause,
          skip,
          take: limit,
          orderBy: { fullname: 'asc' },
        }),
        prisma.shadowTeacher.count({ where: whereClause }),
      ]);
      return {
        data,
        pagination: {
          currentPage: page,
          totalPage: Math.ceil(totalData / limit) || 1,
          totalData,
          dataPerPage: limit,
        },
      };
    });

    return sendResponse(res, 200, 'OK', result.data, result.pagination);
  } catch (err) {
    next(err);
  }
});

shadowRoute.get('/shadow-teachers/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const cacheKey = `academic:shadow:teacher:id:${id}`;
    const item = await withCache(cacheKey, 600, async () => {
      return prisma.shadowTeacher.findFirst({
        where: { id, deletedAt: null },
      });
    });
    return sendResponse(res, item ? 200 : 404, item ? 'OK' : 'Data tidak ditemukan', item);
  } catch (err) {
    next(err);
  }
});

// --- Shadow Subjects ---
shadowRoute.get('/shadow-subjects', async (req, res, next) => {
  try {
    await shadowSyncService.syncSubjects();
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const cacheKey = `academic:shadow:subject:all:page:${page}:limit:${limit}`;
    const result = await withCache(cacheKey, 600, async () => {
      const [data, totalData] = await Promise.all([
        prisma.shadowSubject.findMany({
          where: { deletedAt: null },
          skip,
          take: limit,
          orderBy: { name: 'asc' },
        }),
        prisma.shadowSubject.count({ where: { deletedAt: null } }),
      ]);
      return {
        data,
        pagination: {
          currentPage: page,
          totalPage: Math.ceil(totalData / limit) || 1,
          totalData,
          dataPerPage: limit,
        },
      };
    });

    return sendResponse(res, 200, 'OK', result.data, result.pagination);
  } catch (err) {
    next(err);
  }
});

shadowRoute.get('/shadow-subjects/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const cacheKey = `academic:shadow:subject:id:${id}`;
    const item = await withCache(cacheKey, 600, async () => {
      return prisma.shadowSubject.findFirst({
        where: { id, deletedAt: null },
      });
    });
    return sendResponse(res, item ? 200 : 404, item ? 'OK' : 'Data tidak ditemukan', item);
  } catch (err) {
    next(err);
  }
});
