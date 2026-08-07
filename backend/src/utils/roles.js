const ROLES = Object.freeze({
  ADMIN: 'admin',
  PROJECT_MANAGER: 'project_manager',
  TEAM_MEMBER: 'team_member',
});

const ROLE_LIST = Object.freeze(Object.values(ROLES));

module.exports = {
  ROLES,
  ROLE_LIST,
};
