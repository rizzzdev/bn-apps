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
  sender: { id: string; fullname: string; role: string; email?: string | null; pictureUrl?: string | null };
  receiver: { id: string; fullname: string; role: string; email?: string | null; pictureUrl?: string | null };
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
  email: string | null;
  pictureUrl?: string | null;
  role: string;
};

export type ConversationSummary = {
  otherUserId: string;
  otherUserName: string;
  otherUserRole: string;
  otherUserPictureUrl?: string | null;
  otherUserEmail?: string | null;
  lastMessage: string;
  lastSenderId: string;
  lastAt: Date;
  unreadCount: number;
};
