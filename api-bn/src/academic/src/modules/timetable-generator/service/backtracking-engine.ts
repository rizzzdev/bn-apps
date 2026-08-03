import type { GeneratorPreviewResult, GeneratedSlot, UnassignedUnit } from '../domain';

export interface LessonUnit {
  id: string;
  classIds: string[];
  classNames: string[];
  subjectId: string;
  subjectName: string;
  teacherIds: string[];
  teacherNames: string[];
  duration: number;
  maxHoursPerDay: number;
}

export interface EngineRequirementInput {
  classId: string;
  className: string;
  subjectId: string;
  subjectName: string;
  teacherId: string;
  teacherName: string;
  weeklyHours: number;
  maxHoursPerDay: number;
}

export interface EngineUnavailabilityInput {
  teacherId: string;
  day: string;
  lessonHourId: string;
}

export interface EngineLessonHourInput {
  id: string;
  name: string;
  order: number;
  startTime: string;
  endTime: string;
}

export interface EngineInput {
  requirements: EngineRequirementInput[];
  unavailabilities: EngineUnavailabilityInput[];
  lessonHours: EngineLessonHourInput[];
  workingDays: string[];
  options?: {
    timeoutMs?: number;
    maxAttempts?: number;
    enableBatchTeaching?: boolean;
  };
}

interface SlotAssignment {
  day: string;
  startHourIndex: number;
}

export class BacktrackingEngine {
  public solve(input: EngineInput): GeneratorPreviewResult {
    const startTime = Date.now();
    const timeoutMs = input.options?.timeoutMs ?? 15000;
    const maxAttempts = input.options?.maxAttempts ?? 500000;

    const sortedLessonHours = [...input.lessonHours].sort((a, b) => a.order - b.order);
    const days = input.workingDays;

    // 1. Build Lesson Units — merge by (classId, subjectId) for team teaching,
    //    then merge across classes for batch teaching
    const teamGroups = new Map<string, EngineRequirementInput[]>();
    for (const req of input.requirements) {
      if (!req.teacherId) continue;
      const key = `${req.classId}_${req.subjectId}`;
      if (!teamGroups.has(key)) teamGroups.set(key, []);
      teamGroups.get(key)!.push(req);
    }

    // Intermediate: team-merged groups with single-class arrays
    interface MergedGroup {
      classIds: string[];
      classNames: string[];
      subjectId: string;
      subjectName: string;
      teacherIds: string[];
      teacherNames: string[];
      weeklyHours: number;
      maxHoursPerDay: number;
    }

    const mergedGroups: MergedGroup[] = [];

    for (const [, group] of teamGroups) {
      const teachers = new Map<string, EngineRequirementInput>();
      for (const req of group) {
        const existing = teachers.get(req.teacherId);
        if (existing) {
          existing.weeklyHours += req.weeklyHours;
        } else {
          teachers.set(req.teacherId, { ...req });
        }
      }

      const teacherList = Array.from(teachers.values());
      mergedGroups.push({
        classIds: [teacherList[0]!.classId],
        classNames: [teacherList[0]!.className],
        subjectId: teacherList[0]!.subjectId,
        subjectName: teacherList[0]!.subjectName,
        teacherIds: teacherList.map((r) => r.teacherId),
        teacherNames: teacherList.map((r) => r.teacherName),
        // Team teaching: semua guru pada (class, subject) yang sama berbagi total jam yang sama.
        weeklyHours: Math.max(...teacherList.map((r) => r.weeklyHours)),
        maxHoursPerDay: Math.min(...teacherList.map((r) => r.maxHoursPerDay || 2)),
      });
    }

    // Batch merge: combine groups with same (subjectId, teacherIds, weeklyHours, maxHoursPerDay)
    // across different classes into one unit that occupies all classes simultaneously
    const enableBatch = input.options?.enableBatchTeaching ?? true;
    if (enableBatch) {
      const batchMap = new Map<string, MergedGroup>();
      for (const g of mergedGroups) {
        const sortedTIds = [...g.teacherIds].sort();
        const key = `${g.subjectId}|${sortedTIds.join(',')}|${g.weeklyHours}|${g.maxHoursPerDay}`;
        if (batchMap.has(key)) {
          const existing = batchMap.get(key)!;
          existing.classIds = [...new Set([...existing.classIds, ...g.classIds])];
          existing.classNames = [...new Set([...existing.classNames, ...g.classNames])];
        } else {
          batchMap.set(key, { ...g, classIds: [...g.classIds], classNames: [...g.classNames] });
        }
      }
      mergedGroups.length = 0;
      mergedGroups.push(...batchMap.values());
    }

    const units: LessonUnit[] = [];
    let unitCounter = 1;

    // Split each (possibly batch-merged) group into units by maxHoursPerDay
    for (const g of mergedGroups) {
      let hoursLeft = g.weeklyHours;
      while (hoursLeft > 0) {
        const duration = Math.min(hoursLeft, g.maxHoursPerDay);
        units.push({
          id: `unit_${unitCounter++}`,
          classIds: g.classIds,
          classNames: g.classNames,
          subjectId: g.subjectId,
          subjectName: g.subjectName,
          teacherIds: g.teacherIds,
          teacherNames: g.teacherNames,
          duration,
          maxHoursPerDay: g.maxHoursPerDay,
        });
        hoursLeft -= duration;
      }
    }

    // 2. Pre-fill Teacher Unavailability Matrix
    const teacherUnavail = new Map<string, Map<string, Set<string>>>();
    for (const un of input.unavailabilities) {
      if (!teacherUnavail.has(un.teacherId)) {
        teacherUnavail.set(un.teacherId, new Map());
      }
      const dayMap = teacherUnavail.get(un.teacherId)!;
      if (!dayMap.has(un.day)) {
        dayMap.set(un.day, new Set());
      }
      dayMap.get(un.day)!.add(un.lessonHourId);
    }

    const isTeacherUnavailable = (teacherId: string, day: string, lessonHourId: string): boolean => {
      return teacherUnavail.get(teacherId)?.get(day)?.has(lessonHourId) ?? false;
    };

    // 3. Occupancy Tracking Matrices
    const classOccupied = new Map<string, Map<string, Set<string>>>();
    const teacherOccupied = new Map<string, Map<string, Set<string>>>();
    const classSubjectDayHours = new Map<string, Map<string, Map<string, number>>>();

    const setOccupied = (
      unit: LessonUnit,
      day: string,
      startHourIndex: number,
      occupy: boolean,
    ) => {
      for (let k = 0; k < unit.duration; k++) {
        const hour = sortedLessonHours[startHourIndex + k]!;

        for (const cId of unit.classIds) {
          if (!classOccupied.has(cId)) classOccupied.set(cId, new Map());
          const cDay = classOccupied.get(cId)!;
          if (!cDay.has(day)) cDay.set(day, new Set());
          if (occupy) cDay.get(day)!.add(hour.id);
          else cDay.get(day)!.delete(hour.id);
        }

        for (const tId of unit.teacherIds) {
          if (!teacherOccupied.has(tId)) teacherOccupied.set(tId, new Map());
          const tDay = teacherOccupied.get(tId)!;
          if (!tDay.has(day)) tDay.set(day, new Set());
          if (occupy) tDay.get(day)!.add(hour.id);
          else tDay.get(day)!.delete(hour.id);
        }
      }

      for (const cId of unit.classIds) {
        if (!classSubjectDayHours.has(cId)) classSubjectDayHours.set(cId, new Map());
        const csMap = classSubjectDayHours.get(cId)!;
        if (!csMap.has(unit.subjectId)) csMap.set(unit.subjectId, new Map());
        const sDayMap = csMap.get(unit.subjectId)!;
        const current = sDayMap.get(day) ?? 0;
        const next = occupy ? current + unit.duration : Math.max(0, current - unit.duration);
        sDayMap.set(day, next);
      }
    };

    const isValidSlot = (unit: LessonUnit, day: string, startHourIndex: number): boolean => {
      if (startHourIndex + unit.duration > sortedLessonHours.length) return false;

      for (const cId of unit.classIds) {
        const existingHours = classSubjectDayHours.get(cId)?.get(unit.subjectId)?.get(day) ?? 0;
        if (existingHours + unit.duration > unit.maxHoursPerDay) return false;
      }

      for (let k = 0; k < unit.duration; k++) {
        const hour = sortedLessonHours[startHourIndex + k]!;

        for (const cId of unit.classIds) {
          if (classOccupied.get(cId)?.get(day)?.has(hour.id)) return false;
        }
        for (const tId of unit.teacherIds) {
          if (teacherOccupied.get(tId)?.get(day)?.has(hour.id)) return false;
          if (isTeacherUnavailable(tId, day, hour.id)) return false;
        }
      }

      return true;
    };

    const getValidSlots = (unit: LessonUnit): SlotAssignment[] => {
      const validSlots: SlotAssignment[] = [];
      for (const day of days) {
        for (let i = 0; i <= sortedLessonHours.length - unit.duration; i++) {
          if (isValidSlot(unit, day, i)) {
            validSlots.push({ day, startHourIndex: i });
          }
        }
      }
      return validSlots;
    };

    const assignments = new Map<string, SlotAssignment>();
    let bestAssignments = new Map<string, SlotAssignment>();
    let maxAssignedHours = 0;
    let attempts = 0;

    const totalHours = units.reduce((sum, u) => sum + u.duration, 0);

    // 4. Backtracking Search
    const backtrack = (unassigned: LessonUnit[]): boolean => {
      attempts++;

      if (attempts >= maxAttempts || Date.now() - startTime >= timeoutMs) {
        return false;
      }

      const currentAssignedHours = Array.from(assignments.keys()).reduce((sum, uId) => {
        const u = units.find((x) => x.id === uId);
        return sum + (u ? u.duration : 0);
      }, 0);

      if (currentAssignedHours > maxAssignedHours) {
        maxAssignedHours = currentAssignedHours;
        bestAssignments = new Map(assignments);
      }

      if (unassigned.length === 0) {
        return true;
      }

      // MRV
      let bestUnit: LessonUnit | null = null;
      let minSlotsCount = Infinity;
      let bestUnitSlots: SlotAssignment[] = [];

      for (const unit of unassigned) {
        const slots = getValidSlots(unit);
        if (slots.length < minSlotsCount) {
          minSlotsCount = slots.length;
          bestUnit = unit;
          bestUnitSlots = slots;
        }
      }

      if (!bestUnit || minSlotsCount === 0) {
        return false;
      }

      const nextUnassigned = unassigned.filter((u) => u.id !== bestUnit!.id);

      bestUnitSlots.sort((a, b) => {
        const anchorId = bestUnit!.classIds[0]!;
        const loadA = classSubjectDayHours.get(anchorId)?.get(bestUnit!.subjectId)?.get(a.day) ?? 0;
        const loadB = classSubjectDayHours.get(anchorId)?.get(bestUnit!.subjectId)?.get(b.day) ?? 0;
        return loadA - loadB;
      });

      for (const slot of bestUnitSlots) {
        setOccupied(bestUnit, slot.day, slot.startHourIndex, true);
        assignments.set(bestUnit.id, slot);

        const success = backtrack(nextUnassigned);
        if (success) return true;

        setOccupied(bestUnit, slot.day, slot.startHourIndex, false);
        assignments.delete(bestUnit.id);
      }

      return false;
    };

    const initialUnits = [...units].sort((a, b) => b.duration - a.duration);
    const solved = backtrack(initialUnits);

    const finalAssignments = solved ? assignments : bestAssignments;

    const schedules: GeneratedSlot[] = [];
    const unassignedResult: UnassignedUnit[] = [];

    let assignedHours = 0;
    let assignedUnitsCount = 0;

    for (const unit of units) {
      const slot = finalAssignments.get(unit.id);
      if (slot) {
        assignedUnitsCount++;
        assignedHours += unit.duration;

        for (let k = 0; k < unit.duration; k++) {
          const hour = sortedLessonHours[slot.startHourIndex + k]!;
          schedules.push({
            day: slot.day,
            lessonHourId: hour.id,
            subjectId: unit.subjectId,
            subjectName: unit.subjectName,
            classId: unit.classIds[0]!,
            className: unit.classNames[0]!,
            teacherId: unit.teacherIds[0]!,
            teacherName: unit.teacherNames[0]!,
            classIds: unit.classIds,
            classNames: unit.classNames,
            teacherIds: unit.teacherIds,
            teacherNames: unit.teacherNames,
          });
        }
      } else {
        unassignedResult.push({
          classIds: unit.classIds,
          classNames: unit.classNames,
          subjectId: unit.subjectId,
          subjectName: unit.subjectName,
          teacherIds: unit.teacherIds,
          teacherNames: unit.teacherNames,
          duration: unit.duration,
          reason: 'Tidak menemukan slot waktu kosong tanpa bentrok guru/kelas/ketidaktersediaan.',
        });
      }
    }

    const durationMs = Date.now() - startTime;
    const qualityScore = totalHours > 0 ? Math.round((assignedHours / totalHours) * 100) : 100;

    return {
      schedules,
      unassigned: unassignedResult,
      qualityScore,
      stats: {
        totalUnits: units.length,
        assignedUnits: assignedUnitsCount,
        totalHours,
        assignedHours,
        attempts,
        durationMs,
      },
    };
  }
}

export const backtrackingEngine = new BacktrackingEngine();