const mongoose = require('mongoose');
require('dotenv').config();

/**
 * Validates and retrieves the dedicated test database URI with strict safety guards.
 * @returns {string}
 */
const getTestMongoUri = () => {
  const testUri = process.env.MONGO_URI_TEST || 'mongodb://127.0.0.1:27017/taskflow_test';
  const devUri = process.env.MONGO_URI;

  if (!testUri || testUri.trim() === '') {
    throw new Error(
      'FATAL: MONGO_URI_TEST is not defined. Integration tests will not run against an undefined test database.'
    );
  }

  if (devUri && testUri.trim().toLowerCase() === devUri.trim().toLowerCase()) {
    throw new Error(
      'FATAL: MONGO_URI_TEST cannot be identical to MONGO_URI. Refusing to run destructive tests against development database.'
    );
  }

  if (!/test/i.test(testUri)) {
    throw new Error(
      'FATAL: MONGO_URI_TEST database name must explicitly contain "test" to prevent accidental data corruption.'
    );
  }

  return testUri;
};

/**
 * Connect to the dedicated test database
 */
const connectTestDb = async () => {
  const uri = getTestMongoUri();
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  await mongoose.connect(uri);
};

/**
 * Clean all collections in the test database
 */
const cleanTestDb = async () => {
  if (mongoose.connection.readyState !== 1) return;
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
};

/**
 * Clean and cleanly disconnect from the test database
 */
const disconnectTestDb = async () => {
  if (mongoose.connection.readyState !== 0) {
    await cleanTestDb();
    await mongoose.disconnect();
  }
};

module.exports = {
  getTestMongoUri,
  connectTestDb,
  cleanTestDb,
  disconnectTestDb,
};
