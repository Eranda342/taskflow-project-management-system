const mongoose = require('mongoose');
const { PROJECT_STATUS_LIST } = require('../utils/projectStatus');

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
      maxlength: [150, 'Project name cannot exceed 150 characters'],
    },
    description: {
      type: String,
      required: [true, 'Project description is required'],
      trim: true,
      maxlength: [2000, 'Project description cannot exceed 2000 characters'],
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Project owner is required'],
      index: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    startDate: {
      type: Date,
      default: null,
    },
    deadline: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: {
        values: PROJECT_STATUS_LIST,
        message: '{VALUE} is not a valid project status',
      },
      default: 'planning',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for query performance
projectSchema.index({ members: 1 });
projectSchema.index({ status: 1 });
projectSchema.index({ createdAt: -1 });

const Project = mongoose.model('Project', projectSchema);

module.exports = Project;
