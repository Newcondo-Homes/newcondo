"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.encryptMarkingLink = encryptMarkingLink;
exports.decryptMarkingLink = decryptMarkingLink;
exports.generateSecureToken = generateSecureToken;
exports.hashToken = hashToken;
exports.verifyToken = verifyToken;
exports.createSignedUrl = createSignedUrl;
exports.verifySignedUrl = verifySignedUrl;
exports.generateShortCode = generateShortCode;
exports.encryptTempData = encryptTempData;
exports.decryptTempData = decryptTempData;
exports.decryptShareableLink = decryptShareableLink;
exports.validateShareableLink = validateShareableLink;
const crypto_1 = __importDefault(require("crypto"));
// Encryption configuration
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 64;
// Get encryption key from environment or generate one
function getEncryptionKey() {
    const key = process.env.LINK_ENCRYPTION_KEY;
    if (!key) {
        throw new Error('LINK_ENCRYPTION_KEY environment variable is required for link encryption');
    }
    // Derive a key from the environment variable
    return crypto_1.default.scryptSync(key, 'salt', KEY_LENGTH);
}
/**
 * Encrypt marking job data for shareable link
 */
function encryptMarkingLink(data, baseUrl = process.env.FRONTEND_URL || 'https://newcondo.com') {
    try {
        const key = getEncryptionKey();
        const iv = crypto_1.default.randomBytes(IV_LENGTH);
        // Create cipher
        const cipher = crypto_1.default.createCipheriv(ALGORITHM, key, iv);
        // Prepare data with timestamp
        const payload = JSON.stringify({
            ...data,
            timestamp: new Date().toISOString(),
        });
        // Encrypt data
        let encrypted = cipher.update(payload, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        // Get auth tag
        const authTag = cipher.getAuthTag();
        // Combine IV + encrypted data + auth tag
        const combined = Buffer.concat([
            iv,
            Buffer.from(encrypted, 'hex'),
            authTag,
        ]);
        // Base64 encode for URL safety
        const encryptedData = combined.toString('base64url');
        // Generate shareable URL
        const shareableUrl = `${baseUrl}/mark-property/${encryptedData}`;
        return {
            encryptedData,
            shareableUrl,
        };
    }
    catch (error) {
        console.error('Error encrypting marking link:', error);
        throw new Error('Failed to encrypt marking link');
    }
}
/**
 * Decrypt marking link data
 */
function decryptMarkingLink(encryptedData) {
    try {
        const key = getEncryptionKey();
        // Decode from base64url
        const combined = Buffer.from(encryptedData, 'base64url');
        // Extract IV, encrypted data, and auth tag
        const iv = combined.subarray(0, IV_LENGTH);
        const authTag = combined.subarray(combined.length - AUTH_TAG_LENGTH);
        const encrypted = combined.subarray(IV_LENGTH, combined.length - AUTH_TAG_LENGTH);
        // Create decipher
        const decipher = crypto_1.default.createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(authTag);
        // Decrypt
        let decrypted = decipher.update(encrypted.toString('hex'), 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        // Parse JSON
        const data = JSON.parse(decrypted);
        // Check expiration
        const expiresAt = new Date(data.expiresAt);
        const isExpired = expiresAt < new Date();
        return {
            markingJobId: data.markingJobId,
            propertyId: data.propertyId,
            requestedBy: data.requestedBy,
            expiresAt,
            metadata: data.metadata,
            isExpired,
            isValid: !isExpired,
        };
    }
    catch (error) {
        console.error('Error decrypting marking link:', error);
        return null;
    }
}
/**
 * Generate a secure token for one-time use links
 */
function generateSecureToken(length = 32) {
    return crypto_1.default.randomBytes(length).toString('base64url');
}
/**
 * Hash a token for storage (for verification without storing plain token)
 */
function hashToken(token) {
    return crypto_1.default.createHash('sha256').update(token).digest('hex');
}
/**
 * Verify a token against its hash
 */
function verifyToken(token, hash) {
    const tokenHash = hashToken(token);
    return crypto_1.default.timingSafeEqual(Buffer.from(tokenHash), Buffer.from(hash));
}
/**
 * Create a signed URL with expiration
 */
function createSignedUrl(baseUrl, params, expiresInSeconds = 3600) {
    const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;
    const urlParams = new URLSearchParams({
        ...params,
        expires: expiresAt.toString(),
    });
    const signature = crypto_1.default
        .createHmac('sha256', getEncryptionKey())
        .update(`${baseUrl}?${urlParams.toString()}`)
        .digest('base64url');
    urlParams.set('signature', signature);
    return `${baseUrl}?${urlParams.toString()}`;
}
/**
 * Verify a signed URL
 */
function verifySignedUrl(url) {
    try {
        const urlObj = new URL(url);
        const params = Object.fromEntries(urlObj.searchParams.entries());
        const { expires, signature, ...otherParams } = params;
        if (!expires || !signature) {
            return { isValid: false, isExpired: false, params: {} };
        }
        // Check expiration
        const expiresAt = parseInt(expires, 10);
        const isExpired = Date.now() / 1000 > expiresAt;
        // Reconstruct URL without signature
        const baseUrl = `${urlObj.origin}${urlObj.pathname}`;
        const urlParamsWithoutSig = new URLSearchParams({
            ...otherParams,
            expires,
        });
        // Calculate expected signature
        const expectedSignature = crypto_1.default
            .createHmac('sha256', getEncryptionKey())
            .update(`${baseUrl}?${urlParamsWithoutSig.toString()}`)
            .digest('base64url');
        // Verify signature
        const isValid = crypto_1.default.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
        return {
            isValid,
            isExpired,
            params: otherParams,
        };
    }
    catch (error) {
        console.error('Error verifying signed URL:', error);
        return { isValid: false, isExpired: false, params: {} };
    }
}
/**
 * Generate a short code for easy sharing (e.g., via SMS)
 */
function generateShortCode(length = 6) {
    const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude similar looking chars
    let code = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = crypto_1.default.randomInt(0, characters.length);
        code += characters[randomIndex];
    }
    return code;
}
/**
 * Encrypt data for temporary storage (e.g., Redis cache)
 */
function encryptTempData(data) {
    const key = getEncryptionKey();
    const iv = crypto_1.default.randomBytes(IV_LENGTH);
    const cipher = crypto_1.default.createCipheriv(ALGORITHM, key, iv);
    const payload = JSON.stringify(data);
    let encrypted = cipher.update(payload, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();
    const combined = Buffer.concat([
        iv,
        Buffer.from(encrypted, 'hex'),
        authTag,
    ]);
    return combined.toString('base64');
}
/**
 * Decrypt data from temporary storage
 */
function decryptTempData(encryptedData) {
    try {
        const key = getEncryptionKey();
        const combined = Buffer.from(encryptedData, 'base64');
        const iv = combined.subarray(0, IV_LENGTH);
        const authTag = combined.subarray(combined.length - AUTH_TAG_LENGTH);
        const encrypted = combined.subarray(IV_LENGTH, combined.length - AUTH_TAG_LENGTH);
        const decipher = crypto_1.default.createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(authTag);
        let decrypted = decipher.update(encrypted.toString('hex'), 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return JSON.parse(decrypted);
    }
    catch (error) {
        console.error('Error decrypting temp data:', error);
        return null;
    }
}
/**
 * Alias compatibility function mapping back to decryptMarkingLink
 */
function decryptShareableLink(encryptedData) {
    return decryptMarkingLink(encryptedData);
}
/**
 * Standalone validation helper mapping directly against payload object states
 */
function validateShareableLink(data) {
    return !!data && data.isValid && !data.isExpired;
}
//# sourceMappingURL=linkEncryption.js.map