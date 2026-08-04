import { type PrismaClient } from '#exam/database/index.js';
import { redisClient } from '#exam/configs/redis.config.js';
import { getOrchestrator } from '#app/orchestrator.js';
import {
  type ChatMessage,
  type CreateChatMessageDto,
  type ConversationSummary,
  type ChatContact,
} from './chat.types.js';

type Party = { id: string; fullname: string; role: string; email: string | null; pictureUrl: string | null };

export class ChatRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Resolve a sentri user id to { id, fullname, role, email, pictureUrl } lazily.
   * Order: shadowTeacher (teacher) -> shadowStudent (student) -> sentri super_admin
   */
  private resolveParty = async (userId: string, cache: Map<string, Party>): Promise<Party> => {
    const cached = cache.get(userId);
    if (cached) return cached;

    const teacher = await this.prisma.shadowTeacher.findFirst({
      where: { userId, deletedAt: null },
    });
    if (teacher) {
      const party: Party = {
        id: userId,
        fullname: teacher.fullname,
        role: 'teacher',
        email: teacher.email ?? null,
        pictureUrl: teacher.pictureUrl ?? null,
      };
      cache.set(userId, party);
      return party;
    }

    const student = await this.prisma.shadowStudent.findFirst({
      where: { userId, deletedAt: null },
    });
    if (student) {
      const party: Party = {
        id: userId,
        fullname: student.fullname,
        role: 'student',
        email: null,
        pictureUrl: student.pictureUrl ?? null,
      };
      cache.set(userId, party);
      return party;
    }

    try {
      const orchestrator = getOrchestrator();
      const admins = await orchestrator.authData.findAllByRoles(['super_admin']);
      const admin = admins.find((a) => a.id === userId);
      if (admin) {
        const party: Party = {
          id: userId,
          fullname: 'Super Admin',
          role: 'super_admin',
          email: admin.email ?? null,
          pictureUrl: null,
        };
        cache.set(userId, party);
        return party;
      }
    } catch {
      /* ignore */
    }

    const party: Party = {
      id: userId,
      fullname: 'Super Admin',
      role: 'super_admin',
      email: null,
      pictureUrl: null,
    };
    cache.set(userId, party);
    return party;
  };

  getConversation = async (
    userId: string,
    otherUserId: string,
    limit = 200,
  ): Promise<ChatMessage[]> => {
    const keyUser1 = userId < otherUserId ? userId : otherUserId;
    const keyUser2 = userId < otherUserId ? otherUserId : userId;
    const cacheKey = `chat_conversation:${keyUser1}:${keyUser2}`;

    const cached = await redisClient.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const rows = await this.prisma.examChat.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: userId },
        ],
      },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });

    const partyCache = new Map<string, Party>();
    const userIds = new Set<string>();
    const replyToIds = new Set<string>();

    for (const row of rows) {
      userIds.add(row.senderId);
      userIds.add(row.receiverId);
      if (row.replyToId) replyToIds.add(row.replyToId);
    }

    const replyToRows =
      replyToIds.size > 0
        ? await this.prisma.examChat.findMany({
            where: { id: { in: [...replyToIds] } },
            select: { id: true, senderId: true, message: true },
          })
        : [];

    for (const reply of replyToRows) userIds.add(reply.senderId);

    for (const id of userIds) await this.resolveParty(id, partyCache);

    const replyPreviews = new Map<string, ChatMessage['replyTo']>();
    for (const reply of replyToRows) {
      replyPreviews.set(reply.id, {
        id: reply.id,
        senderName: partyCache.get(reply.senderId)?.fullname ?? reply.senderId,
        message: reply.message,
      });
    }

    const data: ChatMessage[] = rows.map((row) => ({
      id: row.id,
      senderId: row.senderId,
      receiverId: row.receiverId,
      message: row.message,
      replyToId: row.replyToId,
      replyTo: row.replyToId ? (replyPreviews.get(row.replyToId) ?? null) : null,
      read: row.read,
      createdAt: row.createdAt,
      sender: partyCache.get(row.senderId)!,
      receiver: partyCache.get(row.receiverId)!,
    }));

    await redisClient.set(cacheKey, JSON.stringify(data), { EX: 1800 });
    return data;
  };

  create = async (dto: CreateChatMessageDto): Promise<ChatMessage> => {
    const row = await this.prisma.examChat.create({ data: dto });

    const partyCache = new Map<string, Party>();
    await this.resolveParty(row.senderId, partyCache);
    await this.resolveParty(row.receiverId, partyCache);

    let replyTo: ChatMessage['replyTo'] = null;
    if (row.replyToId) {
      const replyRow = await this.prisma.examChat.findUnique({
        where: { id: row.replyToId },
        select: { id: true, senderId: true, message: true },
      });
      if (replyRow) {
        const replySender = await this.resolveParty(replyRow.senderId, partyCache);
        replyTo = { id: replyRow.id, senderName: replySender.fullname, message: replyRow.message };
      }
    }

    const data: ChatMessage = {
      id: row.id,
      senderId: row.senderId,
      receiverId: row.receiverId,
      message: row.message,
      replyToId: row.replyToId,
      replyTo,
      read: row.read,
      createdAt: row.createdAt,
      sender: partyCache.get(row.senderId)!,
      receiver: partyCache.get(row.receiverId)!,
    };

    const keyUser1 = dto.senderId < dto.receiverId ? dto.senderId : dto.receiverId;
    const keyUser2 = dto.senderId < dto.receiverId ? dto.receiverId : dto.senderId;
    await redisClient.del(`chat_conversation:${keyUser1}:${keyUser2}`);
    await redisClient.del(`chat_conversations:${dto.senderId}`);
    await redisClient.del(`chat_conversations:${dto.receiverId}`);

    return data;
  };

  markRead = async (userId: string, otherUserId: string): Promise<void> => {
    await this.prisma.examChat.updateMany({
      where: { receiverId: userId, senderId: otherUserId, read: false },
      data: { read: true },
    });

    const keyUser1 = userId < otherUserId ? userId : otherUserId;
    const keyUser2 = userId < otherUserId ? otherUserId : userId;
    await redisClient.del(`chat_conversation:${keyUser1}:${keyUser2}`);
    await redisClient.del(`chat_conversations:${userId}`);
  };

  getConversations = async (userId: string): Promise<ConversationSummary[]> => {
    const cacheKey = `chat_conversations:${userId}`;
    const cached = await redisClient.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const messages = await this.prisma.examChat.findMany({
      where: { OR: [{ senderId: userId }, { receiverId: userId }] },
      orderBy: { createdAt: 'asc' },
    });

    const partyCache = new Map<string, Party>();
    for (const message of messages) {
      await this.resolveParty(message.senderId, partyCache);
      await this.resolveParty(message.receiverId, partyCache);
    }

    const conversations = new Map<string, ConversationSummary>();

    for (const message of messages) {
      const isSender = message.senderId === userId;
      const otherId = isSender ? message.receiverId : message.senderId;
      const other = partyCache.get(otherId)!;
      const unreadDelta = !isSender && !message.read ? 1 : 0;
      const existing = conversations.get(other.id);

      if (!existing) {
        conversations.set(other.id, {
          otherUserId: other.id,
          otherUserName: other.fullname,
          otherUserRole: other.role,
          otherUserPictureUrl: other.pictureUrl,
          otherUserEmail: other.email,
          lastMessage: message.message,
          lastSenderId: message.senderId,
          lastAt: message.createdAt,
          unreadCount: unreadDelta,
        });
      } else {
        existing.lastMessage = message.message;
        existing.lastSenderId = message.senderId;
        existing.lastAt = message.createdAt;
        existing.unreadCount += unreadDelta;
      }
    }

    const data = Array.from(conversations.values()).sort(
      (a, b) => b.lastAt.getTime() - a.lastAt.getTime(),
    );

    await redisClient.set(cacheKey, JSON.stringify(data), { EX: 1800 });
    return data;
  };

  getContacts = async (role: 'super_admin' | 'teacher'): Promise<ChatContact[]> => {
    if (role === 'teacher') {
      const teachers = await this.prisma.shadowTeacher.findMany({
        where: { deletedAt: null },
        select: { fullname: true, userId: true, email: true, pictureUrl: true },
        orderBy: { fullname: 'asc' },
      });
      return teachers.map((teacher) => ({
        id: teacher.userId,
        fullname: teacher.fullname,
        username: teacher.fullname,
        email: teacher.email ?? null,
        pictureUrl: teacher.pictureUrl ?? null,
        role: 'teacher',
      }));
    }

    const orchestrator = getOrchestrator();
    const admins = await orchestrator.authData.findAllByRoles(['super_admin']);
    return admins.map((admin) => ({
      id: admin.id,
      fullname: 'Super Admin',
      username: 'Super Admin',
      email: admin.email ?? null,
      pictureUrl: null,
      role: 'super_admin',
    }));
  };
}
