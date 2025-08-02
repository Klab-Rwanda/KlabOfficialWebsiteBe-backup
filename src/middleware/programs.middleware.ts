import { Request, Response, NextFunction } from "express";
import { body, param, query, validationResult } from "express-validator";

// Validation middleware for creating a program (form-data version)
export const validateCreateProgramFormData = [
  body("title")
    .notEmpty()
    .withMessage("Title is required")
    .isLength({ min: 3, max: 255 })
    .withMessage("Title must be between 3 and 255 characters")
    .trim(),
  
  body("description")
    .notEmpty()
    .withMessage("Description is required")
    .isLength({ min: 10 })
    .withMessage("Description must be at least 10 characters")
    .trim(),
  
  body("details")
    .optional()
    .isLength({ max: 5000 })
    .withMessage("Details must not exceed 5000 characters")
    .trim(),
  
  body("stats")
    .custom((value) => {
      if (!value) {
        throw new Error("Stats object is required");
      }
      
      // Check if it's already parsed (object) or needs parsing (string)
      let stats = value;
      if (typeof value === 'string') {
        try {
          stats = JSON.parse(value);
        } catch (error) {
          throw new Error("Stats must be valid JSON");
        }
      }
      
      if (!stats.duration || !stats.graduates || !stats.period) {
        throw new Error("Stats must include duration, graduates, and period");
      }
      
      return true;
    }),
  
  body("features")
    .custom((value) => {
      if (!value) {
        throw new Error("Features are required");
      }
      
      let features = value;
      if (typeof value === 'string') {
        try {
          features = JSON.parse(value);
        } catch (error) {
          // Try comma-separated
          features = value.split(',').map((f: string) => f.trim()).filter((f: string) => f.length > 0);
        }
      }
      
      if (!Array.isArray(features) || features.length === 0) {
        throw new Error("Features must be an array with at least one item");
      }
      
      // Validate each feature
      for (const feature of features) {
        if (typeof feature !== 'string' || feature.trim().length < 3 || feature.trim().length > 500) {
          throw new Error("Each feature must be between 3 and 500 characters");
        }
      }
      
      return true;
    }),
  
  body("why_choose")
    .optional()
    .isLength({ max: 2000 })
    .withMessage("Why choose must not exceed 2000 characters")
    .trim(),
  
  body("tags")
    .custom((value) => {
      if (!value) {
        throw new Error("Tags are required");
      }
      
      let tags = value;
      if (typeof value === 'string') {
        try {
          tags = JSON.parse(value);
        } catch (error) {
          // Try comma-separated
          tags = value.split(',').map((t: string) => t.trim()).filter((t: string) => t.length > 0);
        }
      }
      
      if (!Array.isArray(tags) || tags.length === 0) {
        throw new Error("Tags must be an array with at least one item");
      }
      
      // Validate each tag
      for (const tag of tags) {
        if (typeof tag !== 'string' || tag.trim().length < 2 || tag.trim().length > 50) {
          throw new Error("Each tag must be between 2 and 50 characters");
        }
      }
      
      return true;
    }),
  
  handleValidationErrors
];

// Validation middleware for updating a program
export const validateUpdateProgram = [
  param("id")
    .isInt({ min: 1 })
    .withMessage("Program ID must be a positive integer"),
  
  body("title")
    .optional()
    .isLength({ min: 3, max: 255 })
    .withMessage("Title must be between 3 and 255 characters")
    .trim(),
  
  body("description")
    .optional()
    .isLength({ min: 10 })
    .withMessage("Description must be at least 10 characters")
    .trim(),
  
  body("image")
    .optional()
    .isURL()
    .withMessage("Image must be a valid URL"),
  
  body("details")
    .optional()
    .isLength({ max: 5000 })
    .withMessage("Details must not exceed 5000 characters")
    .trim(),
  
  body("stats")
    .optional()
    .isObject()
    .withMessage("Stats must be an object"),
  
  body("stats.duration")
    .optional()
    .notEmpty()
    .withMessage("Duration cannot be empty if provided")
    .trim(),
  
  body("stats.graduates")
    .optional()
    .notEmpty()
    .withMessage("Graduates cannot be empty if provided")
    .trim(),
  
  body("stats.period")
    .optional()
    .notEmpty()
    .withMessage("Period cannot be empty if provided")
    .trim(),
  
  body("features")
    .optional()
    .isArray({ min: 1 })
    .withMessage("Features must be an array with at least one item"),
  
  body("features.*")
    .optional()
    .notEmpty()
    .withMessage("Each feature must not be empty")
    .isLength({ min: 3, max: 500 })
    .withMessage("Each feature must be between 3 and 500 characters")
    .trim(),
  
  body("why_choose")
    .optional()
    .isLength({ max: 2000 })
    .withMessage("Why choose must not exceed 2000 characters")
    .trim(),
  
  body("tags")
    .optional()
    .isArray({ min: 1 })
    .withMessage("Tags must be an array with at least one item"),
  
  body("tags.*")
    .optional()
    .notEmpty()
    .withMessage("Each tag must not be empty")
    .isLength({ min: 2, max: 50 })
    .withMessage("Each tag must be between 2 and 50 characters")
    .trim(),
  
  handleValidationErrors
];

// Validation middleware for program ID parameter
export const validateProgramId = [
  param("id")
    .isInt({ min: 1 })
    .withMessage("Program ID must be a positive integer"),
  
  handleValidationErrors
];

// Validation middleware for tag parameter
export const validateTag = [
  param("tag")
    .notEmpty()
    .withMessage("Tag is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("Tag must be between 2 and 50 characters")
    .trim(),
  
  handleValidationErrors
];

// Validation middleware for query parameters
export const validateQueryParams = [
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
  
  query("offset")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Offset must be non-negative"),
  
  query("tags")
    .optional()
    .custom((value) => {
      if (typeof value === 'string') {
        const tags = value.split(',');
        for (const tag of tags) {
          if (!tag.trim() || tag.trim().length < 2 || tag.trim().length > 50) {
            throw new Error("Each tag must be between 2 and 50 characters");
          }
        }
      }
      return true;
    }),
  
  query("duration")
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage("Duration must be between 1 and 100 characters")
    .trim(),
  
  query("search")
    .optional()
    .isLength({ min: 1, max: 200 })
    .withMessage("Search query must be between 1 and 200 characters")
    .trim(),
  
  handleValidationErrors
];

// Validation middleware for adding/removing features
export const validateFeature = [
  param("id")
    .isInt({ min: 1 })
    .withMessage("Program ID must be a positive integer"),
  
  body("feature")
    .notEmpty()
    .withMessage("Feature is required")
    .isLength({ min: 3, max: 500 })
    .withMessage("Feature must be between 3 and 500 characters")
    .trim(),
  
  handleValidationErrors
];

// Sanitization middleware
export const sanitizeInput = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // Sanitize strings to prevent XSS
    const sanitizeString = (str: string): string => {
      return str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    };

    // Recursively sanitize object properties
    const sanitizeObject = (obj: any): any => {
      if (typeof obj === 'string') {
        return sanitizeString(obj);
      }
      if (Array.isArray(obj)) {
        return obj.map(sanitizeObject);
      }
      if (obj && typeof obj === 'object') {
        const sanitized: any = {};
        for (const [key, value] of Object.entries(obj)) {
          sanitized[key] = sanitizeObject(value);
        }
        return sanitized;
      }
      return obj;
    };

    // Sanitize request body
    if (req.body) {
      req.body = sanitizeObject(req.body);
    }

    // Sanitize query parameters by modifying individual properties
    if (req.query) {
      for (const [key, value] of Object.entries(req.query)) {
        if (typeof value === 'string') {
          (req.query as any)[key] = sanitizeString(value);
        } else if (Array.isArray(value)) {
          (req.query as any)[key] = value.map(v => typeof v === 'string' ? sanitizeString(v) : v);
        }
      }
    }

    // Sanitize params
    if (req.params) {
      for (const [key, value] of Object.entries(req.params)) {
        if (typeof value === 'string') {
          req.params[key] = sanitizeString(value);
        }
      }
    }

    next();
  } catch (error) {
    console.error("Error in sanitization middleware:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during input sanitization"
    });
  }
};

// Rate limiting middleware (simple implementation)
const requestCounts: Map<string, { count: number; resetTime: number }> = new Map();

export const rateLimit = (maxRequests: number = 100, windowMs: number = 15 * 60 * 1000) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
      const now = Date.now();
      
      const clientData = requestCounts.get(clientIp);
      
      if (!clientData || now > clientData.resetTime) {
        // Reset or initialize count
        requestCounts.set(clientIp, {
          count: 1,
          resetTime: now + windowMs
        });
        next();
        return;
      }
      
      if (clientData.count >= maxRequests) {
        res.status(429).json({
          success: false,
          message: "Too many requests, please try again later",
          retryAfter: Math.ceil((clientData.resetTime - now) / 1000)
        });
        return;
      }
      
      clientData.count++;
      next();
    } catch (error) {
      console.error("Error in rate limiting middleware:", error);
      next(); // Continue on error to avoid blocking requests
    }
  };
};

// Handle validation errors
function handleValidationErrors(req: Request, res: Response, next: NextFunction): void {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(error => ({
      field: error.type === 'field' ? (error as any).path : 'unknown',
      message: error.msg,
      value: error.type === 'field' ? (error as any).value : undefined
    }));
    
    res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: formattedErrors
    });
    return;
  }
  
  next();
}

// Logging middleware for programs
export const logProgramActions = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  
  // Override res.json to log response
  const originalJson = res.json;
  res.json = function(body: any) {
    const duration = Date.now() - start;
    
    console.log(`[PROGRAM API] ${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`, {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      body: req.method !== 'GET' ? req.body : undefined,
      query: Object.keys(req.query).length > 0 ? req.query : undefined
    });
    
    return originalJson.call(this, body);
  };
  
  next();
};