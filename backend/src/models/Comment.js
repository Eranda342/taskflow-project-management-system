const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      required: [true, 'Task reference is required'],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
    },
    message: {
      type: String,
      required: [true, 'Comment message is required'],
      trim: true,
      maxlength: [2000, 'Comment message cannot exceed 2000 characters'],
    },
  },
  {
    timestamps: true,
  }
);

// Chronological task comment retrieval index
commentSchema.index({ task: 1, createdAt: 1 });

const Comment = mongoose.model('Comment', commentSchema);

module.exports = Comment;
