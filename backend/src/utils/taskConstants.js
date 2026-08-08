const TASK_STATUS = Object.freeze({
  TODO: 'todo',
  IN_PROGRESS: 'in_progress',
  REVIEW: 'review',
  COMPLETED: 'completed',
});

const TASK_STATUS_LIST = Object.freeze(Object.values(TASK_STATUS));

const TASK_PRIORITY = Object.freeze({
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
});

const TASK_PRIORITY_LIST = Object.freeze(Object.values(TASK_PRIORITY));

module.exports = {
  TASK_STATUS,
  TASK_STATUS_LIST,
  TASK_PRIORITY,
  TASK_PRIORITY_LIST,
};
