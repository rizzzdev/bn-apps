import { AttendanceRepository } from '../repository/index.js';
import { CreateAttendanceDto } from '../domain/dtos.js';
import { calculateDistance } from '@/utils/geo.js';
import { prisma } from '@/database/index.js';
import { NotFoundError, BadRequestError } from '@/errors/index.js';
import { activityService } from '@/modules/activity/service/index.js';
import { getAdminName } from '@/utils/activity-helper.js';
import { Prisma } from '@/database/generated/client/index.js';

export class AttendanceService {
  constructor(private repository: AttendanceRepository) {}

  async create(data: CreateAttendanceDto, actorId?: string) {
    // Fetch placement with company to get location and schedule
    const placement = await prisma.internshipPlacement.findUnique({
      where: { id: data.placementId },
      include: { company: true, student: true, teacher: true, industryMentor: true }
    });

    if (!placement) {
      throw new NotFoundError('Data penempatan magang tidak ditemukan');
    }

    if (placement.studentId !== data.studentId) {
      throw new BadRequestError('Student ID tidak cocok dengan data penempatan');
    }

    let status: 'accepted' | 'declined' = 'accepted';
    let description = 'Presensi diterima';

    // 1. Distance validation (Radius 100m)
    const companyLocation = placement.company.locationMetadata as { latitude?: number, longitude?: number } | null;
    if (companyLocation?.latitude && companyLocation?.longitude) {
      const distance = calculateDistance(
        companyLocation.latitude,
        companyLocation.longitude,
        data.locationMetadata.latitude,
        data.locationMetadata.longitude
      );

      if (distance > 100) {
        status = 'declined';
        description = `Lokasi presensi berada di luar radius magang (Jarak: ${Math.round(distance)}m > 100m)`;
      }
    } else {
      // If company has no location set, we might accept or reject. We will accept but note it.
      // Assuming it's accepted by default if company hasn't set location.
    }

    // 2. Time validation
    const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;
    
    // Normalisasi tanggal
    const rawDate = new Date(data.date);
    const wibDateObj = new Date(rawDate.getTime() + WIB_OFFSET_MS);
    const normalizedDate = new Date(Date.UTC(
      wibDateObj.getUTCFullYear(), 
      wibDateObj.getUTCMonth(), 
      wibDateObj.getUTCDate()
    ));

    // Validasi duplikat presensi pada hari yang sama
    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        placementId: data.placementId,
        studentId: data.studentId,
        type: data.type,
        date: normalizedDate,
        deletedAt: null
      }
    });

    if (existingAttendance) {
      const typeStr = data.type === 'check_in' ? 'masuk' : 'keluar';
      throw new BadRequestError(`Anda sudah melakukan presensi ${typeStr} pada hari ini`);
    }

    // Normalisasi waktu
    const rawTime = new Date(data.time);
    const wibTimeObj = new Date(rawTime.getTime() + WIB_OFFSET_MS);
    const wibHours = wibTimeObj.getUTCHours();
    const wibMinutes = wibTimeObj.getUTCMinutes();
    const wibSeconds = wibTimeObj.getUTCSeconds();
    
    const normalizedTime = new Date(Date.UTC(1970, 0, 1, wibHours, wibMinutes, wibSeconds));
    
    const attendanceMinutes = wibHours * 60 + wibMinutes;

    if (data.type === 'check_in') {
      let startMinutes: number | null = null;
      if (placement.company.checkInTime) {
        const [h = 0, m = 0] = placement.company.checkInTime.split(':').map(Number);
        startMinutes = h * 60 + m;
      } else if (placement.startTime) {
        const startTime = new Date(placement.startTime);
        startMinutes = startTime.getUTCHours() * 60 + startTime.getUTCMinutes();
      }

      if (startMinutes !== null && attendanceMinutes > startMinutes && status === 'accepted') {
        status = 'declined';
        description = 'Terlambat masuk';
      }
    }

    if (data.type === 'check_out') {
      let endMinutes: number | null = null;
      if (placement.company.checkOutTime) {
        const [h = 0, m = 0] = placement.company.checkOutTime.split(':').map(Number);
        endMinutes = h * 60 + m;
      } else if (placement.endTime) {
        const endTime = new Date(placement.endTime);
        endMinutes = endTime.getUTCHours() * 60 + endTime.getUTCMinutes();
      }

      if (endMinutes !== null && attendanceMinutes < endMinutes && status === 'accepted') {
        status = 'declined';
        description = 'Pulang lebih cepat';
      }
    }

    // Save to database
    const saved = await this.repository.create({
      placementId: data.placementId,
      studentId: data.studentId,
      type: data.type,
      date: normalizedDate,
      time: normalizedTime,
      locationMetadata: data.locationMetadata,
      status,
      description
    });

    if (actorId) {
      const isCheckIn = data.type === 'check_in';
      const actionName = isCheckIn ? 'ATTENDANCE_CHECKIN' : 'ATTENDANCE_CHECKOUT';
      const timeStr = new Date(data.time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      const actionTxt = isCheckIn ? 'masuk' : 'pulang';
      const studentName = placement?.student?.name || 'Siswa';
      const companyName = placement?.company?.name || 'Perusahaan';
      
      await activityService.create({
        actorId,
        description: `Murid ${studentName} melakukan presensi ${actionTxt} pada pukul ${timeStr} di perusahaan ${companyName}.`,
        action: actionName,
        isForAdmin: true
      });
      
      await activityService.create({
        actorId,
        description: `Kamu telah melakukan presensi ${actionTxt} pada pukul ${timeStr} di perusahaan ${companyName}.`,
        action: actionName,
        isForAdmin: false
      });
      
      if (placement?.teacher?.userId) {
        await activityService.create({ actorId, targetId: placement.teacher.userId, description: `Murid ${studentName} melakukan presensi ${actionTxt} pada pukul ${timeStr} di perusahaan ${companyName}.`, action: actionName, isForAdmin: false });
      }
      if (placement?.industryMentor?.userId) {
        await activityService.create({ actorId, targetId: placement.industryMentor.userId, description: `Murid ${studentName} melakukan presensi ${actionTxt} pada pukul ${timeStr} di perusahaan ${companyName}.`, action: actionName, isForAdmin: false });
      }
    }

    return saved;
  }

  async getAll(page: number, limit: number, search?: string, studentId?: string, teacherId?: string, companyId?: string, mentorId?: string) {
    const skip = (page - 1) * limit;
    let whereClause: Prisma.AttendanceWhereInput = {};
    if (studentId) {
      whereClause.studentId = studentId;
    }
    
    if (teacherId || companyId || mentorId) {
      whereClause.placement = {};
      if (teacherId) whereClause.placement.teacherId = teacherId;
      if (companyId) whereClause.placement.companyId = companyId;
      if (mentorId) whereClause.placement.industryMentorId = mentorId;
    }

    if (search) {
      whereClause.OR = [
        { student: { name: { contains: search, mode: 'insensitive' } } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    const finalWhere = Object.keys(whereClause).length > 0 ? whereClause : undefined;
    const [data, total] = await Promise.all([
      this.repository.findAll(skip, limit, finalWhere),
      this.repository.count(finalWhere)
    ]);
    return { data, total };
  }

  async update(id: string, data: Prisma.AttendanceUpdateInput, actorId?: string) {
    const existing = await this.getById(id);
    // Ideally use repository, but since we just need simple update:
    const updated = await prisma.attendance.update({
      where: { id },
      data
    });
    
    if (actorId) {
      const adminName = await getAdminName(actorId);
      const placement = await prisma.internshipPlacement.findUnique({
        where: { id: updated.placementId },
        include: { student: true, teacher: true, industryMentor: true, company: true }
      });
      const dateStr = new Date(updated.date).toLocaleDateString('id-ID');
      const actionTxt = updated.type === 'check_in' ? 'masuk' : 'pulang';
      const studentName = placement?.student?.name || 'Siswa';
      const companyName = placement?.company?.name || 'Perusahaan';
      
      await activityService.create({
        actorId,
        description: `${adminName} memperbarui data presensi ${actionTxt} murid ${studentName} di perusahaan ${companyName} tanggal ${dateStr} menjadi ${data.status}.`,
        action: 'ATTENDANCE_UPDATED',
        isForAdmin: true
      });
      
      if (placement?.student?.userId) {
        await activityService.create({ actorId, targetId: placement.student.userId, description: `Data presensi ${actionTxt} milikmu di perusahaan ${companyName} tanggal ${dateStr} diperbarui menjadi ${data.status} oleh ${adminName}.`, action: 'ATTENDANCE_UPDATED', isForAdmin: false });
      }
      if (placement?.teacher?.userId) {
        await activityService.create({ actorId, targetId: placement.teacher.userId, description: `Data presensi ${actionTxt} murid ${studentName} di perusahaan ${companyName} tanggal ${dateStr} diperbarui menjadi ${data.status} oleh ${adminName}.`, action: 'ATTENDANCE_UPDATED', isForAdmin: false });
      }
      if (placement?.industryMentor?.userId) {
        await activityService.create({ actorId, targetId: placement.industryMentor.userId, description: `Data presensi ${actionTxt} murid ${studentName} di perusahaan ${companyName} tanggal ${dateStr} diperbarui menjadi ${data.status} oleh ${adminName}.`, action: 'ATTENDANCE_UPDATED', isForAdmin: false });
      }
    }
    return updated;
  }

  async getById(id: string) {
    const item = await this.repository.findById(id);
    if (!item) throw new NotFoundError('Data presensi tidak ditemukan');
    return item;
  }
}

import { attendanceRepository } from '../repository/index.js';
export const attendanceService = new AttendanceService(attendanceRepository);
