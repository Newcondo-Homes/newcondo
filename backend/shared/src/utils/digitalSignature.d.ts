export interface DigitalSignatureConfig {
    privateKey: string;
    publicKey: string;
    algorithm?: 'RS256' | 'ES256' | 'PS256';
}
export interface DocumentSignatureData {
    documentId: string;
    userId: string;
    documentHash: string;
    timestamp: Date;
    ipAddress?: string;
    userAgent?: string;
    location?: {
        latitude: number;
        longitude: number;
    };
}
export interface SignedDocument {
    signature: string;
    signedAt: Date;
    signatureId: string;
    algorithm: string;
    publicKeyFingerprint: string;
}
export interface SignatureVerificationResult {
    isValid: boolean;
    signedAt?: Date;
    signatureId?: string;
    error?: string;
}
declare class DigitalSignatureService {
    private config;
    constructor(config: DigitalSignatureConfig);
    /**
     * Generate a SHA-256 hash of document content
     */
    generateDocumentHash(content: Buffer | string): string;
    /**
     * Generate a unique signature ID
     */
    generateSignatureId(): string;
    /**
     * Get public key fingerprint for signature verification
     */
    getPublicKeyFingerprint(): string;
    /**
     * Create a digital signature for a document
     */
    signDocument(signatureData: DocumentSignatureData): SignedDocument;
    /**
     * Verify a digital signature
     */
    verifySignature(signature: string): SignatureVerificationResult;
    /**
     * Extract signature payload without verification (for inspection)
     */
    inspectSignature(signature: string): any;
    /**
     * Create a signature chain for multiple related documents
     */
    createSignatureChain(documents: DocumentSignatureData[]): SignedDocument[];
    /**
     * Generate a compliance certificate for a signed document
     */
    generateComplianceCertificate(signedDoc: SignedDocument, documentInfo: {
        title: string;
        type: string;
        userId: string;
        userName: string;
    }): string;
}
export declare const createDigitalSignatureService: (config: DigitalSignatureConfig) => DigitalSignatureService;
export declare const signatureUtils: {
    /**
     * Create a simple document signature payload
     */
    createSignaturePayload: (documentId: string, userId: string, content: string | Buffer, metadata?: Partial<DocumentSignatureData>) => DocumentSignatureData;
    /**
     * Validate signature format
     */
    isValidSignatureFormat: (signature: string) => boolean;
    /**
     * Extract basic info from signature without verification
     */
    getSignatureInfo: (signature: string) => {
        documentId?: string;
        userId?: string;
        signedAt?: string;
        signatureId?: string;
    } | null;
};
export default DigitalSignatureService;
//# sourceMappingURL=digitalSignature.d.ts.map