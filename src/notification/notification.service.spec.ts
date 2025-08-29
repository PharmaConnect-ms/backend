import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotificationService } from './notification.service';
import { Notification, NotificationStatus } from './entities/notification.entity';
import { FiredNotification } from './entities/fired-notification.entity';

describe('NotificationService', () => {
  let service: NotificationService;

  const mockNotificationRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockFiredNotificationRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        {
          provide: getRepositoryToken(Notification),
          useValue: mockNotificationRepository,
        },
        {
          provide: getRepositoryToken(FiredNotification),
          useValue: mockFiredNotificationRepository,
        },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create and save a notification', async () => {
      const createDto = {
        title: 'Test Notification',
        description: 'Test Description',
        reminderTime: '2024-01-01T10:00:00Z',
        userId: 1,
      };

      const mockNotification = { id: 1, ...createDto, reminderTime: new Date(createDto.reminderTime) };

      mockNotificationRepository.create.mockReturnValue(mockNotification);
      mockNotificationRepository.save.mockResolvedValue(mockNotification);

      const result = await service.create(createDto);

      expect(mockNotificationRepository.create).toHaveBeenCalledWith({
        ...createDto,
        reminderTime: new Date(createDto.reminderTime),
      });
      expect(mockNotificationRepository.save).toHaveBeenCalledWith(mockNotification);
      expect(result).toEqual(mockNotification);
    });
  });

  describe('findDueNotifications', () => {
    it('should find notifications that are due', async () => {
      const dueNotifications = [
        { id: 1, title: 'Due Notification', status: NotificationStatus.ACTIVE },
      ];

      mockNotificationRepository.find.mockResolvedValue(dueNotifications);

      const result = await service.findDueNotifications();

      expect(mockNotificationRepository.find).toHaveBeenCalled();
      expect(result).toEqual(dueNotifications);
    });
  });

  describe('markAsFired', () => {
    it('should mark notification as fired', async () => {
      const notificationId = 1;

      await service.markAsFired(notificationId);

      expect(mockNotificationRepository.update).toHaveBeenCalledWith(
        notificationId,
        { status: NotificationStatus.FIRED }
      );
    });
  });
});
