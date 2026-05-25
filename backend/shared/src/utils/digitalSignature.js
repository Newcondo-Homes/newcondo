"use strict";
// backend/shared/src/utils/digitalSignature.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signatureUtils = exports.createDigitalSignatureService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
class DigitalSignatureService {
    constructor(config) {
        this.config = config;
    }
    /**
     * Generate a SHA-256 hash of document content
     */
    generateDocumentHash(content) {
        const hash = crypto_1.default.createHash('sha256');
        hash.update(content);
        return hash.digest('hex');
    }
    /**
     * Generate a unique signature ID
     */
    generateSignatureId() {
        return crypto_1.default.randomUUID();
    }
    /**
     * Get public key fingerprint for signature verification
     */
    getPublicKeyFingerprint() {
        const hash = crypto_1.default.createHash('sha256');
        hash.update(this.config.publicKey);
        return hash.digest('hex').substring(0, 16);
    }
    /**
     * Create a digital signature for a document
     */
    signDocument(signatureData) {
        const signatureId = this.generateSignatureId();
        const algorithm = this.config.algorithm || 'RS256';
        const payload = {
            documentId: signatureData.documentId,
            userId: signatureData.userId,
            documentHash: signatureData.documentHash,
            timestamp: signatureData.timestamp.toISOString(),
            signatureId,
            ipAddress: signatureData.ipAddress,
            userAgent: signatureData.userAgent,
            location: signatureData.location,
            publicKeyFingerprint: this.getPublicKeyFingerprint()
        };
        const options = {
            algorithm: algorithm,
            issuer: 'newcondo-platform',
            audience: 'newcondo-legal',
            expiresIn: '10y', // Long-lived for legal compliance
        };
        const signature = jsonwebtoken_1.default.sign(payload, this.config.privateKey, options);
        return {
            signature,
            signedAt: signatureData.timestamp,
            signatureId,
            algorithm,
            publicKeyFingerprint: this.getPublicKeyFingerprint()
        };
    }
    /**
     * Verify a digital signature
     */
    verifySignature(signature) {
        try {
            const decoded = jsonwebtoken_1.default.verify(signature, this.config.publicKey, {
                issuer: 'newcondo-platform',
                audience: 'newcondo-legal'
            });
            // Verify public key fingerprint matches
            if (decoded.publicKeyFingerprint !== this.getPublicKeyFingerprint()) {
                return {
                    isValid: false,
                    error: 'Public key fingerprint mismatch'
                };
            }
            return {
                isValid: true,
                signedAt: new Date(decoded.timestamp),
                signatureId: decoded.signatureId
            };
        }
        catch (error) {
            return {
                isValid: false,
                error: error instanceof Error ? error.message : 'Signature verification failed'
            };
        }
    }
    /**
     * Extract signature payload without verification (for inspection)
     */
    inspectSignature(signature) {
        try {
            return jsonwebtoken_1.default.decode(signature);
        }
        catch (error) {
            return null;
        }
    }
    /**
     * Create a signature chain for multiple related documents
     */
    createSignatureChain(documents) {
        const signatures = [];
        let previousHash = '';
        for (const doc of documents) {
            // Include previous signature hash in current signature for chaining
            const chainData = {
                ...doc,
                previousSignatureHash: previousHash,
                chainPosition: signatures.length
            };
            const payload = {
                ...chainData,
                timestamp: doc.timestamp.toISOString(),
                signatureId: this.generateSignatureId(),
                publicKeyFingerprint: this.getPublicKeyFingerprint()
            };
            const signature = jsonwebtoken_1.default.sign(payload, this.config.privateKey, {
                algorithm: this.config.algorithm || 'RS256',
                issuer: 'newcondo-platform',
                audience: 'newcondo-legal',
                expiresIn: '10y'
            });
            const signedDoc = {
                signature,
                signedAt: doc.timestamp,
                signatureId: payload.signatureId,
                algorithm: this.config.algorithm || 'RS256',
                publicKeyFingerprint: this.getPublicKeyFingerprint()
            };
            signatures.push(signedDoc);
            previousHash = this.generateDocumentHash(signature);
        }
        return signatures;
    }
    /**
     * Generate a compliance certificate for a signed document
     */
    generateComplianceCertificate(signedDoc, documentInfo) {
        const certificate = {
            certificateId: crypto_1.default.randomUUID(),
            documentTitle: documentInfo.title,
            documentType: documentInfo.type,
            signedBy: {
                userId: documentInfo.userId,
                name: documentInfo.userName
            },
            signedAt: signedDoc.signedAt,
            signatureId: signedDoc.signatureId,
            algorithm: signedDoc.algorithm,
            publicKeyFingerprint: signedDoc.publicKeyFingerprint,
            issuer: 'NewCondo Legal Compliance System',
            issuedAt: new Date(),
            validUntil: new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000) // 10 years
        };
        return jsonwebtoken_1.default.sign(certificate, this.config.privateKey, {
            algorithm: this.config.algorithm || 'RS256',
            issuer: 'newcondo-compliance',
            audience: 'legal-authorities',
            expiresIn: '10y'
        });
    }
}
// Export singleton instance
const createDigitalSignatureService = (config) => {
    return new DigitalSignatureService(config);
};
exports.createDigitalSignatureService = createDigitalSignatureService;
// Utility functions for common signature operations
exports.signatureUtils = {
    /**
     * Create a simple document signature payload
     */
    createSignaturePayload: (documentId, userId, content, metadata) => {
        const hash = crypto_1.default.createHash('sha256').update(content).digest('hex');
        return {
            documentId,
            userId,
            documentHash: hash,
            timestamp: new Date(),
            ...metadata
        };
    },
    /**
     * Validate signature format
     */
    isValidSignatureFormat: (signature) => {
        try {
            const parts = signature.split('.');
            return parts.length === 3; // JWT format: header.payload.signature
        }
        catch {
            return false;
        }
    },
    /**
     * Extract basic info from signature without verification
     */
    getSignatureInfo: (signature) => {
        try {
            const decoded = jsonwebtoken_1.default.decode(signature);
            return {
                documentId: decoded?.documentId,
                userId: decoded?.userId,
                signedAt: decoded?.timestamp,
                signatureId: decoded?.signatureId
            };
        }
        catch {
            return null;
        }
    }
};
exports.default = DigitalSignatureService;
//# sourceMappingURL=digitalSignature.js.map