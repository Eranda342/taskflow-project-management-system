const NOTIFICATION_TYPE = Object.freeze({
  TASK_ASSIGNED: 'task_assigned',
  TASK_STATUS_UPDATED: 'task_status_updated',
  COMMENT_ADDED: 'comment_added',
  PROJECT_MEMBER_ADDED: 'project_member_added',
  PROJECT_MEMBER_REMOVED: 'project_member_removed',
  PROJECT_OWNERSHIP_TRANSFERRED: 'project_ownership_transferred',
});

const NOTIFICATION_TYPE_LIST = Object.freeze(Object.values(NOTIFICATION_TYPE));

module.exports = {
  NOTIFICATION_TYPE,
  NOTIFICATION_TYPE_LIST,
};
