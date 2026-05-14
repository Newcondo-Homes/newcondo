// apps/platform/store/complianceStore.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { Role } from '@newcondo/db';

const RoleValues = {
  OWNER: 'OWNER',
  AGENT: 'AGENT',
  RENTER: 'RENTER',
  ADMIN: 'ADMIN',
} as const;

import {
  ComplianceWarningLevel,
  ComplianceReportType,
  ComplianceReportPeriod,
  ComplianceReportScope,
  ComplianceRequirementStatus,
  ComplianceLevel
} from '../types/compliance';

import type {
  ComplianceRequirement,
  ComplianceReport,
  ComplianceIssue,
  ComplianceCheck,
  TermsAcceptance,
  PrivacyConsent,
  ComplianceRoleStats,
} from '../types/compliance';

type OverallStatus = 'COMPLIANT' | 'NON_COMPLIANT' | 'PENDING' | 'PARTIAL';
type ZustandComplianceLevel = 'BASIC' | 'STANDARD' | 'ADVANCED' | 'PREMIUM';

interface ComplianceState {
  complianceChecks: ComplianceCheck[];
  requirements: ComplianceRequirement[];
  overallStatus: OverallStatus;
  complianceLevel: ZustandComplianceLevel;
  termsAcceptance: TermsAcceptance[];
  privacyConsents: PrivacyConsent[];
  issues: ComplianceIssue[];
  reports: ComplianceReport[];
  lastCheck: string | null;
  isChecking: boolean;
  isGeneratingReport: boolean;
  showComplianceModal: boolean;
  selectedRequirement: ComplianceRequirement | null;
  error: string | null;
}

interface ComplianceActions {
  setComplianceChecks: (checks: ComplianceCheck[]) => void;
  updateComplianceCheck: (id: string, updates: Partial<ComplianceCheck>) => void;
  addComplianceCheck: (check: ComplianceCheck) => void;
  setRequirements: (requirements: ComplianceRequirement[]) => void;
  updateRequirement: (id: string, updates: Partial<ComplianceRequirement>) => void;
  setOverallStatus: (status: OverallStatus) => void;
  setComplianceLevel: (level: ZustandComplianceLevel) => void;
  calculateOverallStatus: () => void;
  setTermsAcceptance: (acceptance: TermsAcceptance[]) => void;
  addTermsAcceptance: (acceptance: TermsAcceptance) => void;
  setPrivacyConsents: (consents: PrivacyConsent[]) => void;
  addPrivacyConsent: (consent: PrivacyConsent) => void;
  setIssues: (issues: ComplianceIssue[]) => void;
  addIssue: (issue: ComplianceIssue) => void;
  resolveIssue: (id: string) => void;
  setReports: (reports: ComplianceReport[]) => void;
  addReport: (report: ComplianceReport) => void;
  setChecking: (checking: boolean) => void;
  setGeneratingReport: (generating: boolean) => void;
  setShowComplianceModal: (show: boolean) => void;
  setSelectedRequirement: (requirement: ComplianceRequirement | null) => void;
  setError: (error: string | null) => void;
  getRequirementsByStatus: (status: ComplianceRequirementStatus) => ComplianceRequirement[];
  getPendingRequirements: () => ComplianceRequirement[];
  getFailedRequirements: () => ComplianceRequirement[];
  getCriticalIssues: () => ComplianceIssue[];
  isCompliant: () => boolean;
  getComplianceScore: () => number;
  hasValidTermsAcceptance: (version: string) => boolean;
  hasValidPrivacyConsent: (version: string) => boolean;
  performComplianceCheck: () => void;
  generateComplianceReport: () => void;
  // signature typed as unknown — callers can pass anything, stored object is always typed
  acceptTerms: (version: string, signature?: unknown) => void;
  grantPrivacyConsent: (version: string, consentData: Record<string, unknown>) => void;
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

        setComplianceChecks: (checks) => set((state) => {
          state.complianceChecks = checks;
          state.lastCheck = new Date().toISOString();
        }),

        updateComplianceCheck: (id, updates) => set((state) => {
          const index = state.complianceChecks.findIndex(
            (check: ComplianceCheck) => check.id === id);
          if (index !== -1) {
            Object.assign(state.complianceChecks[index], updates);
          }
        }),

        addComplianceCheck: (check) => set((state) => {
          state.complianceChecks.push(check);
        }),

        setRequirements: (requirements) => set((state) => {
          state.requirements = requirements;
        }),

        updateRequirement: (id, updates) => set((state) => {
          const index = state.requirements.findIndex(
            (req: ComplianceRequirement) => req.id === id);
          if (index !== -1) {
            Object.assign(state.requirements[index], updates);
          }
        }),

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

          const passedRequirements = requirements.filter(
            (req: ComplianceRequirement) => req.status === 'COMPLETED').length;

          const failedRequirements = requirements.filter(
            (req: ComplianceRequirement) => req.status === 'REJECTED' || req.status === 'EXPIRED').length;

          const criticalFailed = requirements.filter(
            (req: ComplianceRequirement) =>
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

        setIssues: (issues) => set((state) => {
          state.issues = issues;
        }),

        addIssue: (issue) => set((state) => {
          state.issues.push(issue);
        }),

        resolveIssue: (type) => set((state) => {
          const index = state.issues.findIndex((issue: ComplianceIssue) => issue.type === type);
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
          return get().issues.filter(
            (issue: ComplianceIssue) =>
              issue.severity === ComplianceWarningLevel.CRITICAL
          );
        },

        isCompliant: () => {
          return get().overallStatus === 'COMPLIANT';
        },

        getComplianceScore: () => {
          const requirements: ComplianceRequirement[] = get().requirements;
          if (requirements.length === 0) return 0;

          const totalWeight = requirements.reduce((sum: number, req: ComplianceRequirement) => {
            return sum + (req.isCritical ? 3 : (req.weight || 1));
          }, 0);

          const passedWeight = requirements
            .filter((req: ComplianceRequirement) => req.status === 'COMPLETED')
            .reduce((sum: number, req: ComplianceRequirement) => {
              return sum + (req.isCritical ? 3 : (req.weight || 1));
            }, 0);

          return (passedWeight / totalWeight) * 100;
        },

        hasValidTermsAcceptance: (version) => {
          const latest = get().termsAcceptance
            .sort((a, b) => new Date(b.acceptedAt).getTime() - new Date(a.acceptedAt).getTime())[0];
          return latest?.version === version;
        },

        hasValidPrivacyConsent: (version) => {
          const latest = get().privacyConsents
            .sort((a, b) => new Date(b.grantedAt!).getTime() - new Date(a.grantedAt!).getTime())[0];
          return latest?.version === version;
        },

        performComplianceCheck: () => {
          set({ isChecking: true });
          setTimeout(() => {
            set((state) => {
              state.complianceChecks = [
                {
                  id: '1',
                  entityId: 'user-1',
                  entityType: 'user',
                  checkTypes: ['identity'],
                  status: ComplianceRequirementStatus.COMPLETED,
                  result: {
                    id: 'result-1',
                    status: 'COMPLIANT',
                    isCompliant: true,
                    checkedAt: new Date(),
                    completedRequirements: [],
                  },
                  createdAt: new Date(),
                  updatedAt: new Date(),
                },
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
              const roleStats = (role: Role): ComplianceRoleStats => ({
                role,
                totalUsers: 0,
                compliantUsers: 0,
                averageScore: 0,
                commonIssues: [],
              });

              const newReport: ComplianceReport = {
                id: `report-${Date.now()}`,
                reportType: ComplianceReportType.OVERALL_COMPLIANCE,
                generatedBy: 'System',
                generatedAt: new Date(),
                period: ComplianceReportPeriod.WEEKLY,
                scope: ComplianceReportScope.ALL_USERS,
                status: 'COMPLIANT',
                isCompliant: true,
                level: ComplianceLevel.HIGH,
                completedRequirements: [],
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
                    averageProcessingDays: 2.5,
                  },
                  complianceByRole: {
                    [RoleValues.OWNER]: roleStats(RoleValues.OWNER),
                    [RoleValues.AGENT]: roleStats(RoleValues.AGENT),
                    [RoleValues.RENTER]: roleStats(RoleValues.RENTER),
                    [RoleValues.ADMIN]: roleStats(RoleValues.ADMIN),
                  },
                  trendData: [],
                  topIssues: [],
                },
                summary: {
                  overallComplianceRate: 75,
                  criticalIssues: 5,
                  warnings: 10,
                  improvements: ['Improved document verification process'],
                  recommendations: ['Educate users on compliance requirements'],
                },
              };
              state.reports.push(newReport);
              state.isGeneratingReport = false;
            });
          }, 2000);
        },

        // ── Fixed: push objects that exactly match TermsAcceptance / PrivacyConsent ──

        acceptTerms: (version, _signature) => {
          set((state) => {
            const acceptance: TermsAcceptance = {
              id: `terms-${Date.now()}`,
              userId: '',           // pass userId in or resolve from auth store
              version,
              acceptedAt: new Date(),   // Date, not string
              createdAt: new Date(),
            };
            state.termsAcceptance.push(acceptance);
          });
        },

        grantPrivacyConsent: (version, consentData) => {
          set((state) => {
            const consent: PrivacyConsent = {
              id: `consent-${Date.now()}`,
              userId: '',           // pass userId in or resolve from auth store
              consentType: (consentData?.consentType as string) || 'general',
              version,
              isGranted: true,
              grantedAt: new Date(),    // Date, not string; field is grantedAt not consentedAt
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            state.privacyConsents.push(consent);
          });
        },

        reset: () => set(initialState),
        resetError: () => set((state) => { state.error = null; }),
      })),
      {
        name: 'compliance-store',
      }
    )
  )
);