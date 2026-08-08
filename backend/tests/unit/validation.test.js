const {
  isValidObjectId,
  parsePagination,
  parseBooleanQuery,
  validateEnum,
  isValidDate,
  validateDates,
} = require('../../src/utils/validation');

describe('Validation Utilities (src/utils/validation.js)', () => {
  describe('isValidObjectId', () => {
    it('returns true for a valid 24-character hexadecimal MongoDB ObjectId string', () => {
      expect(isValidObjectId('507f1f77bcf86cd799439011')).toBe(true);
      expect(isValidObjectId('65bf9d8f3a1b2c3d4e5f6a7b')).toBe(true);
    });

    it('returns false for an invalid short ID', () => {
      expect(isValidObjectId('12345')).toBe(false);
      expect(isValidObjectId('abc')).toBe(false);
    });

    it('returns false for an invalid non-hexadecimal ID of length 24', () => {
      expect(isValidObjectId('507f1f77bcf86cd79943901z')).toBe(false);
      expect(isValidObjectId('zzzzzzzzzzzzzzzzzzzzzzzz')).toBe(false);
    });

    it('returns false for null, undefined, empty string, or non-string invalid types', () => {
      expect(isValidObjectId(null)).toBe(false);
      expect(isValidObjectId(undefined)).toBe(false);
      expect(isValidObjectId('')).toBe(false);
    });
  });

  describe('parsePagination', () => {
    it('returns default page 1 and default limit 10 when called with default parameters', () => {
      const result = parsePagination();
      expect(result).toEqual({
        valid: true,
        page: 1,
        limit: 10,
        skip: 0,
      });
    });

    it('respects a custom defaultLimit when query limit is omitted', () => {
      const result = parsePagination({}, 20, 100);
      expect(result).toEqual({
        valid: true,
        page: 1,
        limit: 20,
        skip: 0,
      });
    });

    it('correctly parses valid string page and limit parameters and computes skip offset', () => {
      const result = parsePagination({ page: '3', limit: '15' });
      expect(result).toEqual({
        valid: true,
        page: 3,
        limit: 15,
        skip: 30,
      });
    });

    it('rejects page = 0 with descriptive error message', () => {
      const result = parsePagination({ page: '0' });
      expect(result.valid).toBe(false);
      expect(result.message).toBe('Invalid page number. Must be an integer >= 1');
    });

    it('rejects negative page numbers', () => {
      const result = parsePagination({ page: '-5' });
      expect(result.valid).toBe(false);
      expect(result.message).toBe('Invalid page number. Must be an integer >= 1');
    });

    it('rejects non-integer page values', () => {
      const floatResult = parsePagination({ page: '2.5' });
      expect(floatResult.valid).toBe(false);

      const strResult = parsePagination({ page: 'abc' });
      expect(strResult.valid).toBe(false);
    });

    it('rejects limit = 0', () => {
      const result = parsePagination({ limit: '0' }, 10, 100);
      expect(result.valid).toBe(false);
      expect(result.message).toBe('Invalid limit parameter. Must be an integer between 1 and 100');
    });

    it('rejects negative limit values', () => {
      const result = parsePagination({ limit: '-10' });
      expect(result.valid).toBe(false);
    });

    it('rejects limit exceeding maxLimit boundary', () => {
      const result = parsePagination({ limit: '101' }, 10, 100);
      expect(result.valid).toBe(false);
      expect(result.message).toBe('Invalid limit parameter. Must be an integer between 1 and 100');
    });

    it('rejects non-integer limit values', () => {
      const result = parsePagination({ limit: '10.5' });
      expect(result.valid).toBe(false);
    });
  });

  describe('parseBooleanQuery', () => {
    it('returns undefined value with valid: true when query param is undefined', () => {
      const result = parseBooleanQuery(undefined, 'read');
      expect(result).toEqual({ valid: true, value: undefined });
    });

    it('parses string "true" to boolean true', () => {
      const result = parseBooleanQuery('true');
      expect(result).toEqual({ valid: true, value: true });
    });

    it('parses string "false" to boolean false', () => {
      const result = parseBooleanQuery('false');
      expect(result).toEqual({ valid: true, value: false });
    });

    it('rejects invalid boolean strings with custom fieldName in error message', () => {
      const result = parseBooleanQuery('yes', 'read');
      expect(result.valid).toBe(false);
      expect(result.message).toBe('Invalid read query parameter. Must be "true" or "false"');
    });
  });

  describe('validateEnum', () => {
    const allowedRoles = ['admin', 'project_manager', 'team_member'];

    it('returns valid: true and value: undefined when input is undefined', () => {
      const result = validateEnum(undefined, allowedRoles);
      expect(result).toEqual({ valid: true, value: undefined });
    });

    it('returns valid: true and matching value when input is in the allowed list', () => {
      const result = validateEnum('project_manager', allowedRoles);
      expect(result).toEqual({ valid: true, value: 'project_manager' });
    });

    it('rejects values not included in the allowed list', () => {
      const result = validateEnum('superadmin', allowedRoles, 'role');
      expect(result.valid).toBe(false);
      expect(result.message).toBe('Invalid role value');
    });

    it('rejects non-string types such as numbers or objects', () => {
      const numResult = validateEnum(123, allowedRoles, 'role');
      expect(numResult.valid).toBe(false);

      const objResult = validateEnum({}, allowedRoles, 'role');
      expect(objResult.valid).toBe(false);
    });
  });

  describe('isValidDate', () => {
    it('returns true for valid ISO date format strings', () => {
      expect(isValidDate('2026-08-20')).toBe(true);
      expect(isValidDate('2026-08-20T14:30:00.000Z')).toBe(true);
    });

    it('returns false for invalid date strings', () => {
      expect(isValidDate('invalid-date')).toBe(false);
      expect(isValidDate('2026-13-45')).toBe(false);
    });

    it('returns false for null, undefined, or empty strings', () => {
      expect(isValidDate(null)).toBe(false);
      expect(isValidDate(undefined)).toBe(false);
      expect(isValidDate('')).toBe(false);
    });
  });

  describe('validateDates', () => {
    it('returns valid: true when valid startDate and deadline are provided in correct chronological order', () => {
      const result = validateDates('2026-08-01', '2026-08-20');
      expect(result).toEqual({ valid: true });
    });

    it('returns valid: true when startDate and deadline are on the same date', () => {
      const result = validateDates('2026-08-20', '2026-08-20');
      expect(result).toEqual({ valid: true });
    });

    it('returns valid: true when only startDate is provided', () => {
      const result = validateDates('2026-08-01', undefined);
      expect(result).toEqual({ valid: true });
    });

    it('returns valid: true when only deadline is provided', () => {
      const result = validateDates(undefined, '2026-08-20');
      expect(result).toEqual({ valid: true });
    });

    it('returns valid: true when neither date is provided', () => {
      const result = validateDates(undefined, undefined);
      expect(result).toEqual({ valid: true });
    });

    it('rejects when deadline is chronologically earlier than startDate', () => {
      const result = validateDates('2026-08-20', '2026-08-01');
      expect(result.valid).toBe(false);
      expect(result.message).toBe('Deadline cannot be earlier than start date');
    });

    it('rejects invalid startDate string format', () => {
      const result = validateDates('invalid-start', '2026-08-20');
      expect(result.valid).toBe(false);
      expect(result.message).toBe('Invalid start date format');
    });

    it('rejects invalid deadline string format', () => {
      const result = validateDates('2026-08-01', 'invalid-deadline');
      expect(result.valid).toBe(false);
      expect(result.message).toBe('Invalid deadline format');
    });
  });
});
