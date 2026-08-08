const mongoose = require('mongoose');
const { ROLES } = require('../../src/utils/roles');
const {
  isProjectOwner,
  isProjectMember,
  canViewProject,
  canManageProject,
} = require('../../src/utils/projectAccess');

describe('Project Access Utilities (src/utils/projectAccess.js)', () => {
  const ownerId = new mongoose.Types.ObjectId().toString();
  const memberId = new mongoose.Types.ObjectId().toString();
  const outsiderId = new mongoose.Types.ObjectId().toString();
  const adminId = new mongoose.Types.ObjectId().toString();

  const mockProject = {
    _id: new mongoose.Types.ObjectId().toString(),
    name: 'TaskFlow Alpha',
    owner: ownerId,
    members: [ownerId, memberId],
  };

  const mockProjectPopulated = {
    _id: new mongoose.Types.ObjectId().toString(),
    name: 'TaskFlow Beta',
    owner: { _id: ownerId, name: 'Owner User' },
    members: [
      { _id: ownerId, name: 'Owner User' },
      { _id: memberId, name: 'Member User' },
    ],
  };

  describe('isProjectOwner', () => {
    it('returns true when user ID matches unpopulated string project owner', () => {
      expect(isProjectOwner(mockProject, ownerId)).toBe(true);
      expect(isProjectOwner(mockProject, { _id: ownerId })).toBe(true);
    });

    it('returns true when user ID matches populated object project owner', () => {
      expect(isProjectOwner(mockProjectPopulated, ownerId)).toBe(true);
      expect(isProjectOwner(mockProjectPopulated, { _id: ownerId })).toBe(true);
    });

    it('returns false when user is not the project owner', () => {
      expect(isProjectOwner(mockProject, memberId)).toBe(false);
      expect(isProjectOwner(mockProject, outsiderId)).toBe(false);
    });

    it('returns false when project or userId is null/undefined', () => {
      expect(isProjectOwner(null, ownerId)).toBe(false);
      expect(isProjectOwner(mockProject, null)).toBe(false);
      expect(isProjectOwner({}, ownerId)).toBe(false);
    });
  });

  describe('isProjectMember', () => {
    it('returns true when user ID is present in unpopulated project members array', () => {
      expect(isProjectMember(mockProject, memberId)).toBe(true);
      expect(isProjectMember(mockProject, { _id: memberId })).toBe(true);
    });

    it('returns true when user ID is present in populated project members array', () => {
      expect(isProjectMember(mockProjectPopulated, memberId)).toBe(true);
      expect(isProjectMember(mockProjectPopulated, { _id: memberId })).toBe(true);
    });

    it('returns false when user ID is absent from project members', () => {
      expect(isProjectMember(mockProject, outsiderId)).toBe(false);
      expect(isProjectMember(mockProjectPopulated, outsiderId)).toBe(false);
    });

    it('returns false when project or members array is missing or invalid', () => {
      expect(isProjectMember(null, memberId)).toBe(false);
      expect(isProjectMember({}, memberId)).toBe(false);
      expect(isProjectMember({ members: 'invalid' }, memberId)).toBe(false);
      expect(isProjectMember(mockProject, null)).toBe(false);
    });
  });

  describe('canViewProject', () => {
    it('allows an administrator to view any project, even if not an owner or member', () => {
      const adminUser = { _id: adminId, role: ROLES.ADMIN };
      expect(canViewProject(mockProject, adminUser)).toBe(true);
    });

    it('allows the project owner to view the project', () => {
      const ownerUser = { _id: ownerId, role: ROLES.PROJECT_MANAGER };
      expect(canViewProject(mockProject, ownerUser)).toBe(true);
    });

    it('allows a regular project member to view the project', () => {
      const memberUser = { _id: memberId, role: ROLES.TEAM_MEMBER };
      expect(canViewProject(mockProject, memberUser)).toBe(true);
    });

    it('denies viewing access to an outsider user who is not owner or member', () => {
      const outsiderUser = { _id: outsiderId, role: ROLES.TEAM_MEMBER };
      expect(canViewProject(mockProject, outsiderUser)).toBe(false);

      const outsiderPM = { _id: outsiderId, role: ROLES.PROJECT_MANAGER };
      expect(canViewProject(mockProject, outsiderPM)).toBe(false);
    });

    it('returns false when project or user is null/undefined', () => {
      expect(canViewProject(null, { _id: ownerId, role: ROLES.ADMIN })).toBe(false);
      expect(canViewProject(mockProject, null)).toBe(false);
    });
  });

  describe('canManageProject', () => {
    it('allows an administrator to manage any project', () => {
      const adminUser = { _id: adminId, role: ROLES.ADMIN };
      expect(canManageProject(mockProject, adminUser)).toBe(true);
    });

    it('allows the designated project owner to manage the project', () => {
      const ownerUser = { _id: ownerId, role: ROLES.PROJECT_MANAGER };
      expect(canManageProject(mockProject, ownerUser)).toBe(true);
    });

    it('rejects a project manager who is a project member but not the owner', () => {
      const nonOwnerPM = { _id: memberId, role: ROLES.PROJECT_MANAGER };
      expect(canManageProject(mockProject, nonOwnerPM)).toBe(false);
    });

    it('rejects an ordinary team member even if they are in the members list', () => {
      const teamMember = { _id: memberId, role: ROLES.TEAM_MEMBER };
      expect(canManageProject(mockProject, teamMember)).toBe(false);
    });

    it('rejects an outsider non-member user', () => {
      const outsiderUser = { _id: outsiderId, role: ROLES.TEAM_MEMBER };
      expect(canManageProject(mockProject, outsiderUser)).toBe(false);
    });

    it('returns false when project or user is missing', () => {
      expect(canManageProject(null, { _id: ownerId, role: ROLES.ADMIN })).toBe(false);
      expect(canManageProject(mockProject, null)).toBe(false);
    });
  });
});
