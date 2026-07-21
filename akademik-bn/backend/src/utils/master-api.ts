import { env } from '@/configs/env';
import { studentsService } from '@/modules/students/service';
import { webhookStudentSchema } from '@/modules/students/domain';

const MASTER_BASE = env.MASTER_API_URL.replace(/\/$/, '');
const AUTH_HEADERS = {
  'Content-Type': 'application/json',
  'X-Api-Key': env.API_KEY,
} as const;

/**
 * Update student status in the master API via PUT.
 * Non-blocking – failures are logged but never thrown.
 */
async function putStudentStatusInMaster(studentId: string, status: string): Promise<void> {
  try {
    const url = `${MASTER_BASE}/api/v1/students/${studentId}`;
    const response = await fetch(url, {
      method: 'PUT',
      headers: { ...AUTH_HEADERS },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      console.warn(
        `[master-api] PUT student ${studentId} returned ${response.status}`,
      );
    }
  } catch (error) {
    console.error(`[master-api] Failed to PUT student ${studentId}:`, error);
  }
}

/**
 * Pull the latest student data from the master API via webhook sync endpoint
 * and upsert it into the local database.
 * Non-blocking – failures are logged but never thrown.
 */
async function syncStudentsFromMaster(): Promise<void> {
  try {
    const syncUrl = `${MASTER_BASE}/api/v1/webhook/students/sync`;
    const response = await fetch(syncUrl, {
      method: 'POST',
      headers: { ...AUTH_HEADERS },
    });

    if (!response.ok) {
      console.warn(`[master-api] Sync students returned ${response.status}`);
      return;
    }

    const body = (await response.json()) as { data?: unknown[] };
    const items = body.data;

    if (!Array.isArray(items) || items.length === 0) {
      return;
    }

    const validated = items.map((item) => webhookStudentSchema.parse(item));
    await studentsService.upsertFromWebhook(validated);
  } catch (error) {
    console.error('[master-api] Failed to sync students:', error);
  }
}

/**
 * Mark a student as "Lulus" in the master API, then refresh local student data.
 *
 * Both steps are resilient – errors are logged but never propagated,
 * so the caller's transaction is never rolled back due to master API issues.
 */
export async function graduateStudentInMaster(studentId: string): Promise<void> {
  await putStudentStatusInMaster(studentId, 'Lulus');
}

/**
 * Sync all student data from master API to local database.
 */
export async function syncStudents(): Promise<void> {
  await syncStudentsFromMaster();
}
