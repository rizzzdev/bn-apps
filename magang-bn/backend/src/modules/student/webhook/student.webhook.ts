import { env } from '@/configs/env.js';
import { prisma } from '@/database/index.js';
import { clearCachePattern, setCache } from '@/utils/cache.js';

export const studentWebhook = async (data: any) => {

  const student = await prisma.student.upsert({
    where: { id: data.id },
    update: {
      userId: data.userId,
      email: data.email,
      name: data.fullname,
      nisn: data?.nisn || null,
      className: data?.currentClass?.name || null,
      major: data?.currentMajor?.name || null,
      updatedAt: data.updatedAt,
      createdAt: data.createdAt,
      deletedAt: data.deletedAt,
    },
    create: {
      id: data.id,
      userId: data.userId,
      email: data.email,
      name: data.fullname,
      nisn: data?.nisn || null,
      className: data?.currentClass?.name || null,
      major: data?.currentMajor?.name || null,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      deletedAt: data.deletedAt,
    },
  });


  await clearCachePattern('student:all:*');
  await setCache(`student:id:${student.id}`, student, 600);
}

export const studentSyncWebhook = async () => {
  const response = await fetch(env.MASTER_API_URL + "/webhook/students/sync", {
    method: "POST",
    headers: {
      "X-Api-Key": env.MASTER_API_KEY!
    },
  })
  const data = await response.json()
  const students = data.data

  const promises = students.map( async (student: any) => {
    await studentWebhook(student)
  })

  await Promise.all(promises)
}
