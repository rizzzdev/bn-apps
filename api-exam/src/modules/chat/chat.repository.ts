import { type PrismaClient } from "../../app/database/generated/client.js";
import {
  type ChatMessage,
  type CreateChatMessageDto,
  type ConversationSummary,
  type ChatContact,
} from "./chat.types.js";
import { redisClient } from "../../configs/redis.config.js";

const replySelect = { id: true, message: true, sender: { select: { fullname: true } } };
const partySelect = { id: true, fullname: true, role: true };

export class ChatRepository {
  constructor(private readonly prisma: PrismaClient) {}

  getConversation = async (userId: string, otherUserId: string, limit = 200): Promise<ChatMessage[]> => {
    const keyUser1 = userId < otherUserId ? userId : otherUserId;
    const keyUser2 = userId < otherUserId ? otherUserId : userId;
    const cacheKey = `chat_conversation:${keyUser1}:${keyUser2}`;
    
    const cached = await redisClient.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const data = await this.prisma.examChat.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: userId },
        ],
      },
      orderBy: { createdAt: "asc" },
      take: limit,
      include: {
        sender: { select: partySelect },
        receiver: { select: partySelect },
        replyTo: { select: replySelect },
      },
    }) as unknown as Promise<ChatMessage[]>;

    await redisClient.set(cacheKey, JSON.stringify(data), { EX: 1800 });
    return data;
  };

  create = async (dto: CreateChatMessageDto): Promise<ChatMessage> => {
    const data = await this.prisma.examChat.create({
      data: dto,
      include: {
        sender: { select: partySelect },
        receiver: { select: partySelect },
        replyTo: { select: replySelect },
      },
    }) as unknown as Promise<ChatMessage>;

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
      orderBy: { createdAt: "asc" },
      include: {
        sender: { select: partySelect },
        receiver: { select: partySelect },
      },
    });

    const conversations = new Map<string, ConversationSummary>();

    for (const m of messages) {
      const isSender = m.senderId === userId;
      const other = isSender ? m.receiver : m.sender;
      const unreadDelta = !isSender && !m.read ? 1 : 0;
      const existing = conversations.get(other.id);

      if (!existing) {
        conversations.set(other.id, {
          otherUserId: other.id,
          otherUserName: other.fullname,
          otherUserRole: other.role,
          lastMessage: m.message,
          lastSenderId: m.senderId,
          lastAt: m.createdAt,
          unreadCount: unreadDelta,
        });
      } else {
        existing.lastMessage = m.message;
        existing.lastSenderId = m.senderId;
        existing.lastAt = m.createdAt;
        existing.unreadCount += unreadDelta;
      }
    }

    const data = Array.from(conversations.values()).sort(
      (a, b) => b.lastAt.getTime() - a.lastAt.getTime(),
    );

    await redisClient.set(cacheKey, JSON.stringify(data), { EX: 1800 });
    return data;
  };

  getContacts = async (role: "ADMIN" | "SUPERVISOR"): Promise<ChatContact[]> => {
    return this.prisma.user.findMany({
      where: { role, deletedAt: null },
      select: { id: true, fullname: true, username: true, role: true },
      orderBy: { fullname: "asc" },
    });
  };
}
