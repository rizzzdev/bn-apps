import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  console.log('Students:', await prisma.student.count());
  console.log('AcademicYears:', await prisma.academicYear.count());
  console.log('Teachers:', await prisma.teacher.count());
  console.log('ClassStudents:', await prisma.classStudent.count());
}
main().finally(() => prisma.$disconnect());
