import { Test, TestingModule } from '@nestjs/testing';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { NotificationSchedulerService } from './notification-scheduler.service';

describe('NotificationController', () => {
  let controller: NotificationController;

  const mockNotificationService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findByUserId: jest.fn(),
    findActiveNotifications: jest.fn(),
    findDueNotifications: jest.fn(),
    findExpiredNotifications: jest.fn(),
    getFiredNotificationsByUserId: jest.fn(),
    getFiredNotificationsByNotificationId: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockSchedulerService = {
    getSchedulerStats: jest.fn(),
    triggerNotificationProcessing: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationController],
      providers: [
        {
          provide: NotificationService,
          useValue: mockNotificationService,
        },
        {
          provide: NotificationSchedulerService,
          useValue: mockSchedulerService,
        },
      ],
    }).compile();

    controller = module.get<NotificationController>(NotificationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a notification', async () => {
      const createDto = {
        title: 'Test Notification',
        description: 'Test Description',
        reminderTime: '2024-01-01T10:00:00Z',
        userId: 1,
      };

      mockNotificationService.create.mockResolvedValue({ id: 1, ...createDto });

      const result = await controller.create(createDto);
      expect(mockNotificationService.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual({ id: 1, ...createDto });
    });
  });

  describe('getSchedulerStats', () => {
    it('should return scheduler statistics', async () => {
      const stats = {
        activeNotifications: 5,
        dueNotifications: 2,
        expiredNotifications: 1,
        lastProcessed: new Date(),
      };

      mockSchedulerService.getSchedulerStats.mockResolvedValue(stats);

      const result = await controller.getSchedulerStats();
      expect(mockSchedulerService.getSchedulerStats).toHaveBeenCalled();
      expect(result).toEqual(stats);
    });
  });

  describe('triggerScheduler', () => {
    it('should trigger notification processing', async () => {
      mockSchedulerService.triggerNotificationProcessing.mockResolvedValue(undefined);

      const result = await controller.triggerScheduler();
      expect(mockSchedulerService.triggerNotificationProcessing).toHaveBeenCalled();
      expect(result).toEqual({ message: 'Notification processing triggered successfully' });
    });
  });
});
