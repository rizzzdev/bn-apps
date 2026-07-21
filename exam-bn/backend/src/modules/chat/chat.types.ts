export type ReplyPreview = {
  id: string;
  senderName: string;
  message: string;
};

export type ChatMessage = {
  id: string;
  senderId: string;
  receiverId: string;
  message: string;
  replyToId: string | null;
  replyTo: ReplyPreview | null;
  read: boolean;
  createdAt: Date;
  sender: { id: string; fullname: string; role: string };
  receiver: { id: string; fullname: string; role: string };
};

export type CreateChatMessageDto = {
  senderId: string;
  receiverId: string;
  message: string;
  replyToId?: string | null;
};

export type ChatContact = {
  id: string;
  fullname: string;
  username: string;
  role: string;
};

export type ConversationSummary = {
  otherUserId: string;
  otherUserName: string;
  otherUserRole: string;
  lastMessage: string;
  lastSenderId: string;
  lastAt: Date;
  unreadCount: number;
};
