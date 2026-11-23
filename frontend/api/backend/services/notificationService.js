import Notification from '../models/Notification.js';

export const createNotification = async ({ recipient, title, message, type = 'system', relatedId = null }) => {
  try {
    const notification = await Notification.create({
      recipient,
      title,
      message,
      type,
      relatedId
    });
    return notification;
  } catch (err) {
    console.error('[NotificationService] Error creating notification:', err.message);
    // Notifications should not break primary transactional workflows
    return null;
  }
};
