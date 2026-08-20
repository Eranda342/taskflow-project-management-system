require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./src/models/User');
const Project = require('./src/models/Project');
const Task = require('./src/models/Task');

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    const salt = await bcrypt.genSalt(10);
    const password = await bcrypt.hash('password123', salt);

    // Create users
    await User.deleteMany({ email: { $in: ['admin_audit@example.com', 'pm_audit@example.com', 'tm_audit@example.com'] } });
    
    const admin = await User.create({ name: 'Admin Audit', email: 'admin_audit@example.com', password, role: 'admin' });
    const pm = await User.create({ name: 'PM Audit', email: 'pm_audit@example.com', password, role: 'project_manager' });
    const tm = await User.create({ name: 'TM Audit', email: 'tm_audit@example.com', password, role: 'team_member' });

    // Clear old audit projects
    await Project.deleteMany({ name: 'Audit Project' });
    
    // Create a project owned by PM, containing TM
    const project = await Project.create({
      name: 'Audit Project',
      description: 'Project for E2E Audit',
      owner: pm._id,
      members: [tm._id],
      status: 'active'
    });

    // Create a task
    await Task.deleteMany({ project: project._id });
    await Task.create({
      title: 'Audit Task',
      description: 'This is a task for auditing.',
      status: 'todo',
      priority: 'high',
      project: project._id,
      assignee: tm._id,
      createdBy: pm._id
    });

    console.log('Audit data seeded successfully.');
    console.log('Admin: admin_audit@example.com / password123');
    console.log('PM: pm_audit@example.com / password123');
    console.log('TM: tm_audit@example.com / password123');

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
})();
