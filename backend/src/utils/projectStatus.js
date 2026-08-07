const PROJECT_STATUSES = Object.freeze({
  PLANNING: 'planning',
  ACTIVE: 'active',
  ON_HOLD: 'on_hold',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
});

const PROJECT_STATUS_LIST = Object.freeze(Object.values(PROJECT_STATUSES));

module.exports = {
  PROJECT_STATUSES,
  PROJECT_STATUS_LIST,
};
