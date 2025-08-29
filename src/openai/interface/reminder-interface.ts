import { NotificationType } from "@/notification/entities/notification.entity";

export interface ReminderInterface {
  title: string;
  description: string;
  reminderTime: string;
  type: NotificationType;
}
