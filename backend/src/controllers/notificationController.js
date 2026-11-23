import Notification from '../models/Notification.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const getMyNotifications = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const query = { recipient: req.user._id };

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({ recipient: req.user._id, isRead: false });

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return sendSuccess(res, 'Notifications retrieved', {
      notifications,
      unreadCount
    }, 200, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1
    });
  } catch (err) {
    next(err);
  }
};

export const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      recipient: req.user._id
    });

    if (!notification) {
      return sendError(res, 'Notification not found', 404);
    }

    notification.isRead = true;
    await notification.save();

    return sendSuccess(res, 'Notification marked as read', notification);
  } catch (err) {
    next(err);
  }
};

export const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { $set: { isRead: true } }
    );

    return sendSuccess(res, 'All notifications marked as read');
  } catch (err) {
    next(err);
  }
};
