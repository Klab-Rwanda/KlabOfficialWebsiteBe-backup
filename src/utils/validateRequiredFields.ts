/**
 * Validation result interface
 */
interface ValidationResult {
    isValid: boolean;
    error?: string;
    missingFields?: string[];
}

/**
 * Validates that required fields are present and not empty
 * @param fields - Object containing field names and their values
 * @param customMessages - Optional custom error messages for specific fields
 * @returns ValidationResult object
 */
export const validateRequiredFields = (
    fields: Record<string, any>,
    customMessages?: Record<string, string>
): ValidationResult => {
    const missingFields: string[] = [];
    const fieldNames = Object.keys(fields);

    for (const fieldName of fieldNames) {
        const value = fields[fieldName];

        // Check if field is missing, null, undefined, or empty string
        if (value === null || value === undefined || value === '') {
            missingFields.push(fieldName);
        }

        // For strings, also check if it's just whitespace
        if (typeof value === 'string' && value.trim() === '') {
            if (!missingFields.includes(fieldName)) {
                missingFields.push(fieldName);
            }
        }
    }

    if (missingFields.length > 0) {
        // Use custom message if provided, otherwise generate default message
        let errorMessage = 'Required fields are missing';

        if (customMessages && missingFields.length === 1) {
            const field = missingFields[0];
            errorMessage = customMessages[field] || `${field} is required`;
        } else if (missingFields.length === 1) {
            errorMessage = `${missingFields[0]} is required`;
        } else {
            errorMessage = `The following fields are required: ${missingFields.join(', ')}`;
        }

        return {
            isValid: false,
            error: errorMessage,
            missingFields
        };
    }

    return {
        isValid: true
    };
};

/**
 * Validates email format
 * @param email - Email string to validate
 * @returns boolean indicating if email is valid
 */
export const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Validates phone number format (basic validation)
 * @param phone - Phone number string to validate
 * @returns boolean indicating if phone number is valid
 */
export const validatePhoneNumber = (phone: string): boolean => {
    // Basic phone validation - accepts numbers, spaces, hyphens, and parentheses
    const phoneRegex = /^[\+]?[\d\s\-\(\)]{10,}$/;
    return phoneRegex.test(phone);
};

/**
 * Validates password strength
 * @param password - Password string to validate
 * @returns ValidationResult with detailed feedback
 */
export const validatePassword = (password: string): ValidationResult => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const errors: string[] = [];

    if (password.length < minLength) {
        errors.push(`Password must be at least ${minLength} characters long`);
    }
    if (!hasUpperCase) {
        errors.push('Password must contain at least one uppercase letter');
    }
    if (!hasLowerCase) {
        errors.push('Password must contain at least one lowercase letter');
    }
    if (!hasNumbers) {
        errors.push('Password must contain at least one number');
    }
    if (!hasSpecialChar) {
        errors.push('Password must contain at least one special character');
    }

    if (errors.length > 0) {
        return {
            isValid: false,
            error: errors.join('. ')
        };
    }

    return {
        isValid: true
    };
};

/**
 * Validates user registration data
 * @param userData - Object containing user registration data
 * @returns ValidationResult
 */
export const validateUserRegistration = (userData: {
    firstname: string;
    lastname: string;
    email: string;
    password: string;
}): ValidationResult => {
    // First check required fields
    const requiredFieldsValidation = validateRequiredFields(userData);
    if (!requiredFieldsValidation.isValid) {
        return requiredFieldsValidation;
    }

    // Validate email format
    if (!validateEmail(userData.email)) {
        return {
            isValid: false,
            error: 'Please provide a valid email address'
        };
    }

    // Validate password strength
    const passwordValidation = validatePassword(userData.password);
    if (!passwordValidation.isValid) {
        return passwordValidation;
    }

    return {
        isValid: true
    };
};