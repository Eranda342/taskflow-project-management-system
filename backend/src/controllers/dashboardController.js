const User = require('../models/User');
const Project = require('../models/Project');
const Task = require('../models/Task');
const Comment = require('../models/Comment');
const Notification = require('../models/Notification');
const { ROLES } = require('../utils/roles');
const { PROJECT_STATUSES } = require('../utils/projectStatus');
const { TASK_STATUS, TASK_PRIORITY } = require('../utils/taskConstants');

const USER_SAFE_FIELDS = '_id name email role profileImage';
const USER_BASIC_FIELDS = '_id name profileImage';
const PROJECT_BASIC_FIELDS = '_id name status';

/**
 * Helper to build Project Manager Dashboard
 */
const getProjectManagerDashboard = async (userId) => {
  const now = new Date();

  // Find all accessible projects (owned or member)
  const accessibleProjects = await Project.find({
    $or: [{ owner: userId }, { members: userId }],
  })
    .select('_id status owner')
    .lean();

  const accessibleProjectIds = accessibleProjects.map((p) => p._id);
  const ownedProjectCount = accessibleProjects.filter(
    (p) => p.owner.toString() === userId.toString()
  ).length;
  const activeProjectCount = accessibleProjects.filter(
    (p) => p.status === PROJECT_STATUSES.ACTIVE
  ).length;
  const completedProjectCount = accessibleProjects.filter(
    (p) => p.status === PROJECT_STATUSES.COMPLETED
  ).length;

  const projectFilter = { project: { $in: accessibleProjectIds } };

  const [
    totalTasks,
    assignedToMe,
    todoTasks,
    inProgressTasks,
    reviewTasks,
    completedTasks,
    overdueTasks,
    unreadNotifications,
    recentProjects,
    recentTasks,
    upcomingDeadlines,
  ] = await Promise.all([
    Task.countDocuments(projectFilter),
    Task.countDocuments({ ...projectFilter, assignedTo: userId }),
    Task.countDocuments({ ...projectFilter, status: TASK_STATUS.TODO }),
    Task.countDocuments({ ...projectFilter, status: TASK_STATUS.IN_PROGRESS }),
    Task.countDocuments({ ...projectFilter, status: TASK_STATUS.REVIEW }),
    Task.countDocuments({ ...projectFilter, status: TASK_STATUS.COMPLETED }),
    Task.countDocuments({
      ...projectFilter,
      dueDate: { $ne: null, $lt: now },
      status: { $ne: TASK_STATUS.COMPLETED },
    }),
    Notification.countDocuments({ recipient: userId, read: false }),
    // Recent 5 projects
    Project.find({ _id: { $in: accessibleProjectIds } })
      .sort({ updatedAt: -1 })
      .limit(5)
      .populate('owner', USER_SAFE_FIELDS)
      .select('_id name description status deadline updatedAt owner members')
      .lean(),
    // Recent 5 tasks
    Task.find(projectFilter)
      .sort({ updatedAt: -1 })
      .limit(5)
      .populate('project', PROJECT_BASIC_FIELDS)
      .populate('assignedTo', USER_BASIC_FIELDS)
      .populate('createdBy', USER_BASIC_FIELDS)
      .select('_id title description status priority dueDate updatedAt project assignedTo createdBy')
      .lean(),
    // Top 5 upcoming deadlines
    Task.find({
      ...projectFilter,
      dueDate: { $gte: now },
      status: { $ne: TASK_STATUS.COMPLETED },
    })
      .sort({ dueDate: 1 })
      .limit(5)
      .populate('project', PROJECT_BASIC_FIELDS)
      .populate('assignedTo', USER_BASIC_FIELDS)
      .populate('createdBy', USER_BASIC_FIELDS)
      .select('_id title status priority dueDate project assignedTo createdBy')
      .lean(),
  ]);

  return {
    role: ROLES.PROJECT_MANAGER,
    projects: {
      totalAccessible: accessibleProjects.length,
      owned: ownedProjectCount,
      active: activeProjectCount,
      completed: completedProjectCount,
    },
    tasks: {
      totalAccessible: totalTasks,
      assignedToMe,
      todo: todoTasks,
      inProgress: inProgressTasks,
      review: reviewTasks,
      completed: completedTasks,
      overdue: overdueTasks,
    },
    notifications: {
      unread: unreadNotifications,
    },
    recentProjects,
    recentTasks,
    upcomingDeadlines,
  };
};

/**
 * Helper to build Team Member Dashboard
 */
const getTeamMemberDashboard = async (userId) => {
  const now = new Date();

  // Find all projects where user is a member
  const memberProjects = await Project.find({ members: userId })
    .select('_id status')
    .lean();

  const memberProjectIds = memberProjects.map((p) => p._id);
  const activeProjectCount = memberProjects.filter(
    (p) => p.status === PROJECT_STATUSES.ACTIVE
  ).length;
  const completedProjectCount = memberProjects.filter(
    (p) => p.status === PROJECT_STATUSES.COMPLETED
  ).length;

  const myTaskFilter = {
    assignedTo: userId,
    project: { $in: memberProjectIds },
  };

  const [
    totalMyTasks,
    todoTasks,
    inProgressTasks,
    reviewTasks,
    completedTasks,
    overdueTasks,
    unreadNotifications,
    recentAssignedTasks,
    upcomingDeadlines,
    recentProjects,
  ] = await Promise.all([
    Task.countDocuments(myTaskFilter),
    Task.countDocuments({ ...myTaskFilter, status: TASK_STATUS.TODO }),
    Task.countDocuments({ ...myTaskFilter, status: TASK_STATUS.IN_PROGRESS }),
    Task.countDocuments({ ...myTaskFilter, status: TASK_STATUS.REVIEW }),
    Task.countDocuments({ ...myTaskFilter, status: TASK_STATUS.COMPLETED }),
    Task.countDocuments({
      ...myTaskFilter,
      dueDate: { $ne: null, $lt: now },
      status: { $ne: TASK_STATUS.COMPLETED },
    }),
    Notification.countDocuments({ recipient: userId, read: false }),
    // Recent 5 assigned tasks
    Task.find(myTaskFilter)
      .sort({ updatedAt: -1 })
      .limit(5)
      .populate('project', PROJECT_BASIC_FIELDS)
      .select('_id title description status priority dueDate updatedAt project assignedTo')
      .lean(),
    // Upcoming deadlines for assigned tasks
    Task.find({
      ...myTaskFilter,
      dueDate: { $gte: now },
      status: { $ne: TASK_STATUS.COMPLETED },
    })
      .sort({ dueDate: 1 })
      .limit(5)
      .populate('project', PROJECT_BASIC_FIELDS)
      .select('_id title status priority dueDate project assignedTo')
      .lean(),
    // Recent 5 member projects
    Project.find({ _id: { $in: memberProjectIds } })
      .sort({ updatedAt: -1 })
      .limit(5)
      .select('_id name description status deadline updatedAt')
      .lean(),
  ]);

  return {
    role: ROLES.TEAM_MEMBER,
    projects: {
      total: memberProjects.length,
      active: activeProjectCount,
      completed: completedProjectCount,
    },
    myTasks: {
      total: totalMyTasks,
      todo: todoTasks,
      inProgress: inProgressTasks,
      review: reviewTasks,
      completed: completedTasks,
      overdue: overdueTasks,
    },
    notifications: {
      unread: unreadNotifications,
    },
    recentAssignedTasks,
    upcomingDeadlines,
    recentProjects,
  };
};

/**
 * Helper to build Admin General Dashboard
 */
const getAdminDashboard = async (adminUserId) => {
  const [
    totalUsers,
    activeUsers,
    inactiveUsers,
    totalProjects,
    activeProjects,
    completedProjects,
    totalTasks,
    todoTasks,
    inProgressTasks,
    reviewTasks,
    completedTasks,
    unreadNotifications,
    recentProjects,
    recentUsers,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ status: 'active' }),
    User.countDocuments({ status: 'inactive' }),
    Project.countDocuments(),
    Project.countDocuments({ status: PROJECT_STATUSES.ACTIVE }),
    Project.countDocuments({ status: PROJECT_STATUSES.COMPLETED }),
    Task.countDocuments(),
    Task.countDocuments({ status: TASK_STATUS.TODO }),
    Task.countDocuments({ status: TASK_STATUS.IN_PROGRESS }),
    Task.countDocuments({ status: TASK_STATUS.REVIEW }),
    Task.countDocuments({ status: TASK_STATUS.COMPLETED }),
    Notification.countDocuments({ recipient: adminUserId, read: false }),
    // Recent 5 projects
    Project.find()
      .sort({ updatedAt: -1 })
      .limit(5)
      .populate('owner', USER_SAFE_FIELDS)
      .select('_id name description status deadline updatedAt owner')
      .lean(),
    // Recent 5 users
    User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('_id name email role status profileImage createdAt')
      .lean(),
  ]);

  return {
    role: ROLES.ADMIN,
    users: {
      total: totalUsers,
      active: activeUsers,
      inactive: inactiveUsers,
    },
    projects: {
      total: totalProjects,
      active: activeProjects,
      completed: completedProjects,
    },
    tasks: {
      total: totalTasks,
      todo: todoTasks,
      inProgress: inProgressTasks,
      review: reviewTasks,
      completed: completedTasks,
    },
    notifications: {
      unread: unreadNotifications,
    },
    recentProjects,
    recentUsers,
  };
};

/**
 * GET /api/dashboard
 * Role-scoped dashboard summary
 */
const getDashboard = async (req, res) => {
  try {
    const userRole = req.user.role;
    const userId = req.user._id;

    let dashboardData;

    if (userRole === ROLES.ADMIN) {
      dashboardData = await getAdminDashboard(userId);
    } else if (userRole === ROLES.PROJECT_MANAGER) {
      dashboardData = await getProjectManagerDashboard(userId);
    } else {
      dashboardData = await getTeamMemberDashboard(userId);
    }

    return res.status(200).json({
      success: true,
      data: dashboardData,
    });
  } catch (error) {
    console.error('getDashboard error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving dashboard data',
    });
  }
};

/**
 * GET /api/admin/stats
 * Platform-wide analytics and distribution metrics
 */
const getAdminStats = async (req, res) => {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      // Users by role
      adminUsers,
      pmUsers,
      tmUsers,
      // Users by status
      activeUsers,
      inactiveUsers,
      // Projects by status
      planningProjects,
      activeProjects,
      onHoldProjects,
      completedProjects,
      cancelledProjects,
      // Tasks by status
      todoTasks,
      inProgressTasks,
      reviewTasks,
      completedTasks,
      // Tasks by priority
      lowPriorityTasks,
      mediumPriorityTasks,
      highPriorityTasks,
      urgentPriorityTasks,
      // Totals
      totalUsers,
      totalProjects,
      totalTasks,
      totalComments,
      totalNotifications,
      // Recent activity (last 7 days)
      usersCreatedLast7Days,
      projectsCreatedLast7Days,
      tasksCreatedLast7Days,
      commentsCreatedLast7Days,
    ] = await Promise.all([
      User.countDocuments({ role: ROLES.ADMIN }),
      User.countDocuments({ role: ROLES.PROJECT_MANAGER }),
      User.countDocuments({ role: ROLES.TEAM_MEMBER }),
      User.countDocuments({ status: 'active' }),
      User.countDocuments({ status: 'inactive' }),
      Project.countDocuments({ status: PROJECT_STATUSES.PLANNING }),
      Project.countDocuments({ status: PROJECT_STATUSES.ACTIVE }),
      Project.countDocuments({ status: PROJECT_STATUSES.ON_HOLD }),
      Project.countDocuments({ status: PROJECT_STATUSES.COMPLETED }),
      Project.countDocuments({ status: PROJECT_STATUSES.CANCELLED }),
      Task.countDocuments({ status: TASK_STATUS.TODO }),
      Task.countDocuments({ status: TASK_STATUS.IN_PROGRESS }),
      Task.countDocuments({ status: TASK_STATUS.REVIEW }),
      Task.countDocuments({ status: TASK_STATUS.COMPLETED }),
      Task.countDocuments({ priority: TASK_PRIORITY.LOW }),
      Task.countDocuments({ priority: TASK_PRIORITY.MEDIUM }),
      Task.countDocuments({ priority: TASK_PRIORITY.HIGH }),
      Task.countDocuments({ priority: TASK_PRIORITY.URGENT }),
      User.countDocuments(),
      Project.countDocuments(),
      Task.countDocuments(),
      Comment.countDocuments(),
      Notification.countDocuments(),
      User.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      Project.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      Task.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      Comment.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        usersByRole: {
          admin: adminUsers,
          project_manager: pmUsers,
          team_member: tmUsers,
        },
        usersByStatus: {
          active: activeUsers,
          inactive: inactiveUsers,
        },
        projectsByStatus: {
          planning: planningProjects,
          active: activeProjects,
          on_hold: onHoldProjects,
          completed: completedProjects,
          cancelled: cancelledProjects,
        },
        tasksByStatus: {
          todo: todoTasks,
          in_progress: inProgressTasks,
          review: reviewTasks,
          completed: completedTasks,
        },
        tasksByPriority: {
          low: lowPriorityTasks,
          medium: mediumPriorityTasks,
          high: highPriorityTasks,
          urgent: urgentPriorityTasks,
        },
        totals: {
          users: totalUsers,
          projects: totalProjects,
          tasks: totalTasks,
          comments: totalComments,
          notifications: totalNotifications,
        },
        recentActivity: {
          usersCreatedLast7Days,
          projectsCreatedLast7Days,
          tasksCreatedLast7Days,
          commentsCreatedLast7Days,
        },
      },
    });
  } catch (error) {
    console.error('getAdminStats error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving admin statistics',
    });
  }
};

module.exports = {
  getDashboard,
  getAdminStats,
};
