import mongoose from 'mongoose';

const leaveTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Leave type name is required'],
    unique: true,
    trim: true
  },
  code: {
    type: String,
    required: [true, 'Leave code is required (e.g. CL, SL, EL)'],
    unique: true,
    uppercase: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  yearlyQuota: {
    type: Number,
    required: [true, 'Yearly quota is required'],
    min: [0, 'Quota cannot be negative'],
    default: 0
  },
  isPaid: {
    type: Boolean,
    default: true
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  }
}, {
  timestamps: true
});

const LeaveType = mongoose.model('LeaveType', leaveTypeSchema);
export default LeaveType;
