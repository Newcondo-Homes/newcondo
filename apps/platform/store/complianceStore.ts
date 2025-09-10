// apps/platform/store/complianceStore.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { 
  ComplianceStatus,
  ComplianceRequirement,
  ComplianceReport,
  ComplianceIssue,
  ComplianceLevel,
  CompliancePriority,
  ComplianceRequirementStatus,
  ComplianceWarningLevel
} from '../types/compliance';

// A placeholder type since it's not defined in the provided 'compliance.ts'
interface ComplianceCheck {
  id: string;
  requirementId: string;
  status: 'COMPLIANT' | 'NON_COMPLIANT' | 'PENDING';
  lastChecked: string;
}

// Placeholder types for the store
interface TermsAcceptance {
  version: string;
  acceptedAt: string;
  signature: any;
}

interface PrivacyConsent {
  version: string;
  consentedAt: string;
  consentData: any;
}

// Specific types for the store's internal state
type OverallStatus = 'COMPLIANT' | 'NON_COMPLIANT' | 'PENDING' | 'PARTIAL';
type ZustandComplianceLevel = 'BASIC' | 'STANDARD' | 'ADVANCED' | 'PREMIUM';


interface ComplianceState {
  // Compliance checks
  complianceChecks: ComplianceCheck[];
  requirements: ComplianceRequirement[];
  overallStatus: OverallStatus;
  complianceLevel: ZustandComplianceLevel;
  
  // Terms and Privacy
  termsAcceptance: TermsAcceptance[];
  privacyConsents: PrivacyConsent[];
  
  // Issues and Reports
  issues: ComplianceIssue[];
  reports: ComplianceReport[];
  lastCheck: string | null;
  
  // UI state
  isChecking: boolean;
  isGeneratingReport: boolean;
  showComplianceModal: boolean;
  selectedRequirement: ComplianceRequirement | null;
  
  // Error state
  error: string | null;
}

interface ComplianceActions {
  // Compliance checks
  setComplianceChecks: (checks: ComplianceCheck[]) => void;
  updateComplianceCheck: (id: string, updates: Partial<ComplianceCheck>) => void;
  addComplianceCheck: (check: ComplianceCheck) => void;
  
  // Requirements
  setRequirements: (requirements: ComplianceRequirement[]) => void;
  updateRequirement: (id: string, updates: Partial<ComplianceRequirement>) => void;
  
  // Status management
  setOverallStatus: (status: OverallStatus) => void;
  setComplianceLevel: (level: ZustandComplianceLevel) => void;
  calculateOverallStatus: () => void;
  
  // Terms and Privacy
  setTermsAcceptance: (acceptance: TermsAcceptance[]) => void;
  addTermsAcceptance: (acceptance: TermsAcceptance) => void;
  setPrivacyConsents: (consents: PrivacyConsent[]) => void;
  addPrivacyConsent: (consent: PrivacyConsent) => void;
  
  // Issues and Reports
  setIssues: (issues: ComplianceIssue[]) => void;
  addIssue: (issue: ComplianceIssue) => void;
  resolveIssue: (id: string) => void;
  setReports: (reports: ComplianceReport[]) => void;
  addReport: (report: ComplianceReport) => void;
  
  // UI state
  setChecking: (checking: boolean) => void;
  setGeneratingReport: (generating: boolean) => void;
  setShowComplianceModal: (show: boolean) => void;
  setSelectedRequirement: (requirement: ComplianceRequirement | null) => void;
  setError: (error: string | null) => void;
  
  // Utilities
  getRequirementsByStatus: (status: ComplianceRequirementStatus) => ComplianceRequirement[];
  getPendingRequirements: () => ComplianceRequirement[];
  getFailedRequirements: () => ComplianceRequirement[];
  getCriticalIssues: () => ComplianceIssue[];
  isCompliant: () => boolean;
  getComplianceScore: () => number;
  hasValidTermsAcceptance: (version: string) => boolean;
  hasValidPrivacyConsent: (version: string) => boolean;
  
  // Actions
  performComplianceCheck: () => void;
  generateComplianceReport: () => void;
  acceptTerms: (version: string, signature?: any) => void;
  grantPrivacyConsent: (version: string, consentData: any) => void;
  
  // Reset
  reset: () => void;
  resetError: () => void;
}

type ComplianceStore = ComplianceState & ComplianceActions;

const initialState: ComplianceState = {
  complianceChecks: [],
  requirements: [],
  overallStatus: 'PENDING',
  complianceLevel: 'BASIC',
  termsAcceptance: [],
  privacyConsents: [],
  issues: [],
  reports: [],
  lastCheck: null,
  isChecking: false,
  isGeneratingReport: false,
  showComplianceModal: false,
  selectedRequirement: null,
  error: null,
};

export const useComplianceStore = create<ComplianceStore>()(
  devtools(
    persist(
      immer((set, get) => ({
        ...initialState,

        // Compliance checks
        setComplianceChecks: (checks) => set((state) => {
          state.complianceChecks = checks;
          state.lastCheck = new Date().toISOString();
        }),

        updateComplianceCheck: (id, updates) => set((state) => {
          const index = state.complianceChecks.findIndex(check => check.id === id);
          if (index !== -1) {
            Object.assign(state.complianceChecks[index], updates);
          }
        }),

        addComplianceCheck: (check) => set((state) => {
          state.complianceChecks.push(check);
        }),

        // Requirements
        setRequirements: (requirements) => set((state) => {
          state.requirements = requirements;
        }),

        updateRequirement: (id, updates) => set((state) => {
          const index = state.requirements.findIndex(req => req.id === id);
          if (index !== -1) {
            Object.assign(state.requirements[index], updates);
          }
        }),

        // Status management
        setOverallStatus: (status) => set((state) => {
          state.overallStatus = status;
        }),

        setComplianceLevel: (level) => set((state) => {
          state.complianceLevel = level;
        }),

        calculateOverallStatus: () => set((state) => {
          const { requirements } = state;
          const totalRequirements = requirements.length;
          
          if (totalRequirements === 0) {
            state.overallStatus = 'PENDING';
            return;
          }

          const passedRequirements = requirements.filter(req => req.status === 'COMPLETED').length;
          const failedRequirements = requirements.filter(req => req.status === 'REJECTED' || req.status === 'EXPIRED').length;
          const criticalFailed = requirements.filter(req => 
            (req.status === 'REJECTED' || req.status === 'EXPIRED') && req.isCritical
          ).length;

          if (criticalFailed > 0) {
            state.overallStatus = 'NON_COMPLIANT';
          } else if (failedRequirements > 0) {
            state.overallStatus = 'PARTIAL';
          } else if (passedRequirements === totalRequirements) {
            state.overallStatus = 'COMPLIANT';
          } else {
            state.overallStatus = 'PENDING';
          }

          // Determine compliance level
          const score = get().getComplianceScore();
          if (score >= 95) {
            state.complianceLevel = 'PREMIUM';
          } else if (score >= 80) {
            state.complianceLevel = 'ADVANCED';
          } else if (score >= 60) {
            state.complianceLevel = 'STANDARD';
          } else {
            state.complianceLevel = 'BASIC';
          }
        }),

        // Terms and Privacy
        setTermsAcceptance: (acceptance) => set((state) => {
          state.termsAcceptance = acceptance;
        }),

        addTermsAcceptance: (acceptance) => set((state) => {
          state.termsAcceptance.push(acceptance);
        }),

        setPrivacyConsents: (consents) => set((state) => {
          state.privacyConsents = consents;
        }),

        addPrivacyConsent: (consent) => set((state) => {
          state.privacyConsents.push(consent);
        }),

        // Issues and Reports
        setIssues: (issues) => set((state) => {
          state.issues = issues;
        }),

        addIssue: (issue) => set((state) => {
          state.issues.push(issue);
        }),

        resolveIssue: (id) => set((state) => {
          const index = state.issues.findIndex(issue => issue.id === id);
          if (index !== -1) {
            state.issues.splice(index, 1);
          }
        }),

        setReports: (reports) => set((state) => {
          state.reports = reports;
        }),

        addReport: (report) => set((state) => {
          state.reports.push(report);
        }),

        // UI state
        setChecking: (checking) => set((state) => {
          state.isChecking = checking;
        }),

        setGeneratingReport: (generating) => set((state) => {
          state.isGeneratingReport = generating;
        }),

        setShowComplianceModal: (show) => set((state) => {
          state.showComplianceModal = show;
        }),

        setSelectedRequirement: (requirement) => set((state) => {
          state.selectedRequirement = requirement;
        }),

        setError: (error) => set((state) => {
          state.error = error;
        }),

        // Utilities
        getRequirementsByStatus: (status) => {
          return get().requirements.filter(req => req.status === status);
        },

        getPendingRequirements: () => {
          return get().requirements.filter(req => req.status === 'PENDING');
        },

        getFailedRequirements: () => {
          return get().requirements.filter(req => req.status === 'REJECTED' || req.status === 'EXPIRED');
        },

        getCriticalIssues: () => {
          return get().issues.filter(issue => 
            issue.severity === ComplianceWarningLevel.CRITICAL
          );
        },

        isCompliant: () => {
          const { overallStatus } = get();
          return overallStatus === 'COMPLIANT';
        },

        getComplianceScore: () => {
          const { requirements } = get();
          if (requirements.length === 0) return 0;

          const totalWeight = requirements.reduce((sum, req) => {
            const priorityWeight = req.isCritical ? 3 : (req.weight || 1);
            return sum + priorityWeight;
          }, 0);

          const passedWeight = requirements
            .filter(req => req.status === 'COMPLETED')
            .reduce((sum, req) => {
              const priorityWeight = req.isCritical ? 3 : (req.weight || 1);
              return sum + priorityWeight;
            }, 0);
          
          return (passedWeight / totalWeight) * 100;
        },

        hasValidTermsAcceptance: (version) => {
          const latestAcceptance = get().termsAcceptance.sort((a, b) => new Date(b.acceptedAt).getTime() - new Date(a.acceptedAt).getTime())[0];
          return latestAcceptance?.version === version;
        },

        hasValidPrivacyConsent: (version) => {
          const latestConsent = get().privacyConsents.sort((a, b) => new Date(b.consentedAt).getTime() - new Date(a.consentedAt).getTime())[0];
          return latestConsent?.version === version;
        },
        
        // Actions (placeholder implementations)
        performComplianceCheck: () => {
          set({ isChecking: true });
          // Simulating an async check
          setTimeout(() => {
            set((state) => {
              // Simulating check results
              state.complianceChecks = [
                { id: '1', requirementId: 'req1', status: 'COMPLIANT', lastChecked: new Date().toISOString() },
                { id: '2', requirementId: 'req2', status: 'PENDING', lastChecked: new Date().toISOString() },
              ];
              state.isChecking = false;
              get().calculateOverallStatus();
            });
          }, 1500);
        },

        generateComplianceReport: () => {
          set({ isGeneratingReport: true });
          setTimeout(() => {
            set((state) => {
              // Simulating report generation
              const newReport: ComplianceReport = {
                id: `report-${Date.now()}`,
                reportType: 'OVERALL_COMPLIANCE',
                generatedBy: 'System',
                generatedAt: new Date(),
                period: 'WEEKLY',
                scope: 'ALL_USERS',
                data: {
                  totalUsers: 100,
                  compliantUsers: 75,
                  nonCompliantUsers: 25,
                  documentStats: {
                    totalDocuments: 200,
                    verifiedDocuments: 150,
                    expiredDocuments: 10,
                    pendingDocuments: 40,
                    rejectedDocuments: 0,
                    averageProcessingDays: 2.5
                  },
                  complianceByRole: {},
                  trendData: [],
                  topIssues: []
                },
                summary: {
                  overallComplianceRate: 75,
                  criticalIssues: 5,
                  warnings: 10,
                  improvements: ['Improved document verification process'],
                  recommendations: ['Educate users on compliance requirements']
                }
              };
              state.reports.push(newReport);
              state.isGeneratingReport = false;
            });
          }, 2000);
        },

        acceptTerms: (version, signature) => {
          set((state) => {
            state.termsAcceptance.push({ version, acceptedAt: new Date().toISOString(), signature });
          });
        },

        grantPrivacyConsent: (version, consentData) => {
          set((state) => {
            state.privacyConsents.push({ version, consentedAt: new Date().toISOString(), consentData });
          });
        },

        // Reset
        reset: () => set(initialState),
        resetError: () => set((state) => { state.error = null; }),
      })),
      {
        name: 'compliance-store', // name of the item in storage
      }
    )
  )
);