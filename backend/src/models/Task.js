const mongoose = require('mongoose');
const { TASK_STATUS, TASK_STATUS_LIST, TASK_PRIORITY, TASK_PRIORITY_LIST } = require('../utils/taskConstants');

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      maxlength: [200, 'Task title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [3000, 'Task description cannot exceed 3000 characters'],
      default: '',
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project reference is required'],
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creator reference is required'],
    },
    priority: {
      type: String,
      enum: {
        values: TASK_PRIORITY_LIST,
        message: '{VALUE} is not a valid task priority',
      },
      default: TASK_PRIORITY.MEDIUM,
    },
    status: {
      type: String,
      enum: {
        values: TASK_STATUS_LIST,
        message: '{VALUE} is not a valid task status',
      },
      default: TASK_STATUS.TODO,
    },
    dueDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Query indexes
taskSchema.index({ project: 1, status: 1 });
taskSchema.index({ assignedTo: 1 });
taskSchema.index({ createdBy: 1 });
taskSchema.index({ dueDate: 1 });
taskSchema.index({ createdAt: -1 });

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;
