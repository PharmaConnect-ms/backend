import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { NotificationService } from './notification.service';
import { FiredNotificationStatus } from './entities/fired-notification.entity';
import { Notification } from './entities/notification.entity';

@Injectable()
export class NotificationSchedulerService {
  private readonly logger = new Logger(NotificationSchedulerService.name);

  constructor(private readonly notificationService: NotificationService) {}

  /**
   * Runs every 10 minutes to check for due notifications and expired notifications
   */
  @Cron('0 */10 * * * *', {
    name: 'processNotifications',
    timeZone: 'UTC',
  })
  async processNotifications() {
    this.logger.log('Starting notification processing...');

    try {
      await this.processDueNotifications();
      await this.processExpiredNotifications();
      this.logger.log('Notification processing completed successfully');
    } catch (error) {
      this.logger.error('Error during notification processing:', error);
    }
  }

  /**
   * Process notifications that are due to be fired
   */
  private async processDueNotifications() {
    const dueNotifications = await this.notificationService.findDueNotifications();
    this.logger.log(`Found ${dueNotifications.length} due notifications`);

    for (const notification of dueNotifications) {
      try {
        // Create fired notification record
        await this.notificationService.createFiredNotification(
          notification,
          FiredNotificationStatus.SENT
        );

        // Mark original notification as fired
        await this.notificationService.markAsFired(notification.id);

        this.logger.log(`Fired notification ${notification.id}: ${notification.title}`);

        // Sending Notification
        await this.sendNotification(notification);

      } catch (error: any) {
        this.logger.error(`Failed to fire notification ${notification.id}:`, error);
        
        // Create failed fired notification record
        await this.notificationService.createFiredNotification(
          notification,
          FiredNotificationStatus.FAILED,
          (error instanceof Error) ? error.message : 'Unknown error occurred'
        );
      }
    }
  }

  /**
   * Process notifications that have expired (past their reminder time by more than 24 hours)
   */
  private async processExpiredNotifications() {
    const expiredNotifications = await this.notificationService.findExpiredNotifications();
    this.logger.log(`Found ${expiredNotifications.length} expired notifications`);

    if (expiredNotifications.length > 0) {
      const expiredIds = expiredNotifications.map(n => n.id);
      await this.notificationService.markAsExpired(expiredIds);
      
      this.logger.log(`Marked ${expiredIds.length} notifications as expired`);
    }
  }

  /**
   * Send notification through various channels
   * This is where you would implement actual notification delivery
   */
  private async sendNotification(notification: Notification) {
    // TODO: Implement actual notification sending logic
    // Examples:
    // - Email notification
    // - Push notification
    // - SMS notification
    // - In-app notification
    // - WebSocket real-time notification

    this.logger.debug(`Sending notification: ${notification.title} to user ${notification.userId}`);
    
    // Placeholder for actual implementation
    // You might want to use services like:
    // - Nodemailer for emails
    // - Firebase for push notifications
    // - Twilio for SMS
    // - WebSocket for real-time notifications
    
    return Promise.resolve();
  }

  /**
   * Manual trigger for processing notifications (useful for testing)
   */
  async triggerNotificationProcessing() {
    this.logger.log('Manually triggering notification processing...');
    await this.processNotifications();
  }

  /**
   * Get scheduler statistics
   */
  async getSchedulerStats() {
    const activeNotifications = await this.notificationService.findActiveNotifications();
    const dueNotifications = await this.notificationService.findDueNotifications();
    const expiredNotifications = await this.notificationService.findExpiredNotifications();

    return {
      activeNotifications: activeNotifications.length,
      dueNotifications: dueNotifications.length,
      expiredNotifications: expiredNotifications.length,
      lastProcessed: new Date(),
    };
  }
}
