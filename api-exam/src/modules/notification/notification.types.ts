export type Notification = {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  meta: string | null;
  read: boolean;
  createdAt: Date;
  deletedAt: Date | null;
};

export type CreateNotificationDto = {
  userId: string;
  type: string;
  title: string;
  message: string;
  meta?: string | null;
};
