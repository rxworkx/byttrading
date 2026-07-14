import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from '../database/entities';

interface AdminNotificationInput {
  title: string;
  body: string;
  type?: NotificationType;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
  ) {}

  findForUser(userId: string) {
    return this.notificationRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }

  createForUser(userId: string, input: AdminNotificationInput) {
    return this.notificationRepo.save(
      this.notificationRepo.create({
        userId,
        type: input.type ?? NotificationType.INFO,
        title: input.title,
        body: input.body,
        metadata: input.metadata ?? null,
      }),
    );
  }

  createForUsers(userIds: string[], input: AdminNotificationInput) {
    return this.notificationRepo.save(
      userIds.map((userId) =>
        this.notificationRepo.create({
          userId,
          type: input.type ?? NotificationType.INFO,
          title: input.title,
          body: input.body,
          metadata: input.metadata ?? null,
        }),
      ),
    );
  }

  async markRead(userId: string, id: string) {
    await this.notificationRepo.update({ id, userId }, { isRead: true });
    return this.notificationRepo.findOneBy({ id });
  }

  async markAllRead(userId: string) {
    await this.notificationRepo.update(
      { userId, isRead: false },
      { isRead: true },
    );
    return { message: 'All notifications marked as read' };
  }
}
