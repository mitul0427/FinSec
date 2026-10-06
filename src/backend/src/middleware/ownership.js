import prisma from '../config/prisma.js';

// Middleware to ensure resource ownership (IDOR defense)
// Usage: ensureOwnership(prisma.transaction, 'id')
export const ensureOwnership = (model, paramName = 'id', foreignKey = 'userId') => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params[paramName];
      if (!resourceId) {
        return res.status(400).json({ error: 'MISSING_RESOURCE_ID', message: 'Resource ID parameter is missing.' });
      }

      const resource = await model.findUnique({
        where: { id: resourceId }
      });

      if (!resource) {
        return res.status(404).json({ error: 'NOT_FOUND', message: 'Resource not found.' });
      }

      // Strict ownership check: req.user.id must match resource.userId (unless ADMIN)
      if (resource[foreignKey] !== req.user.id && req.user.role !== 'ADMIN') {
        return res.status(403).json({
          error: 'FORBIDDEN_IDOR_VIOLATION',
          message: 'ZeroTrust Violation: You do not have permission to access or modify this resource.'
        });
      }

      req.resource = resource;
      next();
    } catch (err) {
      console.error('ensureOwnership error:', err);
      return res.status(500).json({ error: 'Failed to verify resource ownership.' });
    }
  };
};
