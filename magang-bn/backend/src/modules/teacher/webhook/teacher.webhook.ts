import { env } from '@/configs/env.js';
import { prisma } from '@/database/index.js';
import { clearCachePattern, setCache } from '@/utils/cache.js';

export const teacherWebhook = async (data: any) => {
  const teacher = await prisma.teacher.upsert({
    where: { id: data.id },
    update: {
      userId: data.userId,
      email: data.email,
      name: data.fullname,
      prefixTitle: data.prefixTitle,
      suffixTitle: data.suffixTitle,
      nip: data.nip,
      updatedAt: data.updatedAt,
      createdAt: data.createdAt,
      deletedAt: data.deletedAt,
    },
    create: {
      id: data.id,
      userId: data.userId,
      email: data.email,
      name: data.fullname,
      prefixTitle: data.prefixTitle,
      suffixTitle: data.suffixTitle,
      nip: data.nip,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      deletedAt: data.deletedAt,
    },
  });


  await clearCachePattern('teacher:all:*');
  await setCache(`teacher:id:${teacher.id}`, teacher, 600);
}

export const teacherSyncWebhook = async () => {
  const response = await fetch(env.MASTER_API_URL + "/webhook/teachers/sync", {
    method: "POST",
    headers: {
      "X-Api-Key": env.MASTER_API_KEY!
    },
  })
  const data = await response.json()
  const teachers = data.data


  const promises = teachers.map( async (teacher: any) => {
    await teacherWebhook(teacher)
  })

  await Promise.all(promises)
}
