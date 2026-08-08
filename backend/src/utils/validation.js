const mongoose = require('mongoose');

/**
 * Validate MongoDB ObjectId
 * @param {any} id
 * @returns {boolean}
 */
const isValidObjectId = (id) => {
  if (!id) return false;
  return mongoose.Types.ObjectId.isValid(id.toString());
};

/**
 * Validate and parse pagination parameters
 * @param {Object} query - Express req.query
 * @param {number} defaultLimit - default page size (e.g. 10 or 20)
 * @param {number} maxLimit - maximum allowed page size (default 100)
 * @returns {{ valid: boolean, message?: string, page?: number, limit?: number, skip?: number }}
 */
const parsePagination = (query = {}, defaultLimit = 10, maxLimit = 100) => {
  let page = 1;
  let limit = defaultLimit;

  if (query.page !== undefined) {
    const parsedPage = Number(query.page);
    if (!Number.isInteger(parsedPage) || parsedPage < 1) {
      return {
        valid: false,
        message: 'Invalid page number. Must be an integer >= 1',
      };
    }
    page = parsedPage;
  }

  if (query.limit !== undefined) {
    const parsedLimit = Number(query.limit);
    if (!Number.isInteger(parsedLimit) || parsedLimit < 1 || parsedLimit > maxLimit) {
      return {
        valid: false,
        message: `Invalid limit parameter. Must be an integer between 1 and ${maxLimit}`,
      };
    }
    limit = parsedLimit;
  }

  const skip = (page - 1) * limit;

  return {
    valid: true,
    page,
    limit,
    skip,
  };
};

/**
 * Validate and parse boolean query parameter
 * @param {any} val - Query value
 * @param {string} fieldName - Field name for error messages
 * @returns {{ valid: boolean, message?: string, value?: boolean }}
 */
const parseBooleanQuery = (val, fieldName = 'filter') => {
  if (val === undefined) {
    return { valid: true, value: undefined };
  }
  if (val === 'true') {
    return { valid: true, value: true };
  }
  if (val === 'false') {
    return { valid: true, value: false };
  }
  return {
    valid: false,
    message: `Invalid ${fieldName} query parameter. Must be "true" or "false"`,
  };
};

/**
 * Validate enum value against allowed list
 * @param {any} value
 * @param {Array<string>} allowedList
 * @param {string} fieldName
 * @returns {{ valid: boolean, message?: string, value?: string }}
 */
const validateEnum = (value, allowedList, fieldName = 'filter') => {
  if (value === undefined) {
    return { valid: true, value: undefined };
  }
  if (typeof value === 'string' && allowedList.includes(value)) {
    return { valid: true, value };
  }
  return {
    valid: false,
    message: `Invalid ${fieldName} value`,
  };
};

/**
 * Check if a date string is valid
 * @param {any} dateStr
 * @returns {boolean}
 */
const isValidDate = (dateStr) => {
  if (!dateStr) return false;
  const parsed = new Date(dateStr);
  return !isNaN(parsed.getTime());
};

/**
 * Validate date ranges (startDate & deadline)
 * @param {any} startDate
 * @param {any} deadline
 * @returns {{ valid: boolean, message?: string }}
 */
const validateDates = (startDate, deadline) => {
  if (startDate !== undefined && startDate !== null && startDate !== '') {
    const parsedStart = new Date(startDate);
    if (isNaN(parsedStart.getTime())) {
      return { valid: false, message: 'Invalid start date format' };
    }
  }

  if (deadline !== undefined && deadline !== null && deadline !== '') {
    const parsedDeadline = new Date(deadline);
    if (isNaN(parsedDeadline.getTime())) {
      return { valid: false, message: 'Invalid deadline format' };
    }
  }

  if (startDate && deadline) {
    if (new Date(deadline) < new Date(startDate)) {
      return { valid: false, message: 'Deadline cannot be earlier than start date' };
    }
  }

  return { valid: true };
};

module.exports = {
  isValidObjectId,
  parsePagination,
  parseBooleanQuery,
  validateEnum,
  isValidDate,
  validateDates,
};
