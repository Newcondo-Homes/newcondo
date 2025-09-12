import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

export interface VerificationTask {
  id: string
  userId: string
  documentIds: string[]
  assignedTo?: string
  priority: VerificationPriority
  status: VerificationTaskStatus
  deadline: Date
  notes?: string
  completedAt?: Date
  estimatedCompletionTime: number // in minutes
  actualCompletionTime?: number // in minutes
}

export interface VerificationWorkflow {
  id: string
  name: string
  steps: VerificationStep[]
  documentTypes: string[]
  isActive: boolean
  averageCompletionTime: number
  createdAt: Date
}

export interface VerificationStep {
  id: string
  name: string
  description: string
  isRequired: boolean
  order: number
  checklistItems: string[]
  automationRules?: AutomationRule[]
}

export interface AutomationRule {
  id: string
  condition: string
  action: string
  parameters: Record<string, any>
}

export interface VerificationMetrics {
  totalDocuments: number
  pendingDocuments: number
  approvedDocuments: number
  rejectedDocuments: number
  averageProcessingTime: number
  verificationAccuracy: number
  backlogSize: number
  dailyThroughput: number
}

export interface VerificationHistory {
  id: string
  documentId: string
  verifierId: string
  action: VerificationAction
  previousStatus: string
  newStatus: string
  notes?: string
  timestamp: Date
  duration?: number
}

export type VerificationPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
export type VerificationTaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
export type VerificationAction = 'APPROVE' | 'REJECT' | 'REQUEST_CLARIFICATION' | 'ESCALATE'

export interface VerificationFilters {
  priority?: VerificationPriority[]
  status?: VerificationTaskStatus[]
  assignedTo?: string
  documentType?: string[]
  dateRange?: {
    start: Date
    end: Date
  }
  deadline?: Date
}

interface DocumentVerificationStore {
  // State
  tasks: VerificationTask[]
  workflows: VerificationWorkflow[]
  metrics: VerificationMetrics | null
  history: VerificationHistory[]
  selectedTask: VerificationTask | null
  selectedWorkflow: VerificationWorkflow | null
  filters: VerificationFilters
  loading: boolean
  error: string | null
  
  // Queue Management
  queueStats: {
    totalInQueue: number
    averageWaitTime: number
    expectedCompletionTime: Date | null
  }
  
  // Performance Tracking
  verifierPerformance: Array<{
    verifierId: string
    verifierName: string
    documentsProcessed: number
    averageTime: number
    accuracyRate: number
    activeTasksCount: number
  }>

  // Actions
  setTasks: (tasks: VerificationTask[]) => void
  setWorkflows: (workflows: VerificationWorkflow[]) => void
  setMetrics: (metrics: VerificationMetrics) => void
  setHistory: (history: VerificationHistory[]) => void
  setSelectedTask: (task: VerificationTask | null) => void
  setSelectedWorkflow: (workflow: VerificationWorkflow | null) => void
  setFilters: (filters: VerificationFilters) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setQueueStats: (stats: any) => void
  setVerifierPerformance: (performance: any[]) => void
  
  // Task Management
  assignTask: (taskId: string, verifierId: string) => void
  unassignTask: (taskId: string) => void
  updateTaskStatus: (taskId: string, status: VerificationTaskStatus) => void
  updateTaskPriority: (taskId: string, priority: VerificationPriority) => void
  addTaskNote: (taskId: string, note: string) => void
  completeTask: (taskId: string, duration: number) => void
  escalateTask: (taskId: string, reason: string) => void
  
  // Workflow Management
  createWorkflow: (workflow: Omit<VerificationWorkflow, 'id' | 'createdAt'>) => void
  updateWorkflow: (workflow: VerificationWorkflow) => void
  deleteWorkflow: (workflowId: string) => void
  activateWorkflow: (workflowId: string) => void
  deactivateWorkflow: (workflowId: string) => void
  
  // Bulk Operations
  bulkAssignTasks: (taskIds: string[], verifierId: string) => void
  bulkUpdatePriority: (taskIds: string[], priority: VerificationPriority) => void
  bulkUpdateStatus: (taskIds: string[], status: VerificationTaskStatus) => void
  
  // Analytics
  getVerificationStats: (dateRange: { start: Date; end: Date }) => any
  getVerifierPerformanceReport: (verifierId: string) => any
  getProcessingTimeAnalysis: () => any
  
  // Reset
  reset: () => void
}

const initialState = {
  tasks: [],
  workflows: [],
  metrics: null,
  history: [],
  selectedTask: null,
  selectedWorkflow: null,
  filters: {},
  loading: false,
  error: null,
  queueStats: {
    totalInQueue: 0,
    averageWaitTime: 0,
    expectedCompletionTime: null,
  },
  verifierPerformance: [],
}

export const useDocumentVerificationStore = create<DocumentVerificationStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // Setters
      setTasks: (tasks) => set({ tasks }),
      setWorkflows: (workflows) => set({ workflows }),
      setMetrics: (metrics) => set({ metrics }),
      setHistory: (history) => set({ history }),
      setSelectedTask: (selectedTask) => set({ selectedTask }),
      setSelectedWorkflow: (selectedWorkflow) => set({ selectedWorkflow }),
      setFilters: (filters) => set({ filters }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      setQueueStats: (queueStats) => set({ queueStats }),
      setVerifierPerformance: (verifierPerformance) => set({ verifierPerformance }),

      // Task Management
      assignTask: (taskId, verifierId) => {
        const { tasks } = get()
        const updatedTasks = tasks.map(task =>
          task.id === taskId 
            ? { ...task, assignedTo: verifierId, status: 'IN_PROGRESS' as VerificationTaskStatus }
            : task
        )
        set({ tasks: updatedTasks })
      },

      unassignTask: (taskId) => {
        const { tasks } = get()
        const updatedTasks = tasks.map(task =>
          task.id === taskId 
            ? { ...task, assignedTo: undefined, status: 'PENDING' as VerificationTaskStatus }
            : task
        )
        set({ tasks: updatedTasks })
      },

      updateTaskStatus: (taskId, status) => {
        const { tasks } = get()
        const updatedTasks = tasks.map(task =>
          task.id === taskId 
            ? { 
                ...task, 
                status, 
                completedAt: status === 'COMPLETED' ? new Date() : task.completedAt
              }
            : task
        )
        set({ tasks: updatedTasks })
      },

      updateTaskPriority: (taskId, priority) => {
        const { tasks } = get()
        const updatedTasks = tasks.map(task =>
          task.id === taskId ? { ...task, priority } : task
        )
        set({ tasks: updatedTasks })
      },

      addTaskNote: (taskId, note) => {
        const { tasks } = get()
        const updatedTasks = tasks.map(task =>
          task.id === taskId 
            ? { ...task, notes: task.notes ? `${task.notes}\n\n${note}` : note }
            : task
        )
        set({ tasks: updatedTasks })
      },

      completeTask: (taskId, duration) => {
        const { tasks } = get()
        const updatedTasks = tasks.map(task =>
          task.id === taskId 
            ? { 
                ...task, 
                status: 'COMPLETED' as VerificationTaskStatus,
                actualCompletionTime: duration,
                completedAt: new Date()
              }
            : task
        )
        set({ tasks: updatedTasks })
      },

      escalateTask: (taskId, reason) => {
        const { tasks } = get()
        const updatedTasks = tasks.map(task =>
          task.id === taskId 
            ? { 
                ...task, 
                priority: 'URGENT' as VerificationPriority,
                notes: task.notes ? `${task.notes}\n\nESCALATED: ${reason}` : `ESCALATED: ${reason}`
              }
            : task
        )
        set({ tasks: updatedTasks })
      },

      // Workflow Management
      createWorkflow: (workflowData) => {
        const { workflows } = get()
        const newWorkflow: VerificationWorkflow = {
          ...workflowData,
          id: Date.now().toString(),
          createdAt: new Date(),
        }
        set({ workflows: [newWorkflow, ...workflows] })
      },

      updateWorkflow: (updatedWorkflow) => {
        const { workflows } = get()
        const updatedWorkflows = workflows.map(workflow =>
          workflow.id === updatedWorkflow.id ? updatedWorkflow : workflow
        )
        set({ workflows: updatedWorkflows })
      },

      deleteWorkflow: (workflowId) => {
        const { workflows } = get()
        set({ workflows: workflows.filter(workflow => workflow.id !== workflowId) })
      },

      activateWorkflow: (workflowId) => {
        const { workflows } = get()
        const updatedWorkflows = workflows.map(workflow =>
          workflow.id === workflowId ? { ...workflow, isActive: true } : workflow
        )
        set({ workflows: updatedWorkflows })
      },

      deactivateWorkflow: (workflowId) => {
        const { workflows } = get()
        const updatedWorkflows = workflows.map(workflow =>
          workflow.id === workflowId ? { ...workflow, isActive: false } : workflow
        )
        set({ workflows: updatedWorkflows })
      },

      // Bulk Operations
      bulkAssignTasks: (taskIds, verifierId) => {
        const { tasks } = get()
        const updatedTasks = tasks.map(task =>
          taskIds.includes(task.id)
            ? { ...task, assignedTo: verifierId, status: 'IN_PROGRESS' as VerificationTaskStatus }
            : task
        )
        set({ tasks: updatedTasks })
      },

      bulkUpdatePriority: (taskIds, priority) => {
        const { tasks } = get()
        const updatedTasks = tasks.map(task =>
          taskIds.includes(task.id) ? { ...task, priority } : task
        )
        set({ tasks: updatedTasks })
      },

      bulkUpdateStatus: (taskIds, status) => {
        const { tasks } = get()
        const updatedTasks = tasks.map(task =>
          taskIds.includes(task.id) 
            ? { 
                ...task, 
                status,
                completedAt: status === 'COMPLETED' ? new Date() : task.completedAt
              }
            : task
        )
        set({ tasks: updatedTasks })
      },

      // Analytics
      getVerificationStats: (dateRange) => {
        const { history } = get()
        const filteredHistory = history.filter(h => 
          h.timestamp >= dateRange.start && h.timestamp <= dateRange.end
        )
        
        return {
          totalProcessed: filteredHistory.length,
          approved: filteredHistory.filter(h => h.action === 'APPROVE').length,
          rejected: filteredHistory.filter(h => h.action === 'REJECT').length,
          averageProcessingTime: filteredHistory.reduce((acc, h) => 
            acc + (h.duration || 0), 0) / filteredHistory.length,
        }
      },

      getVerifierPerformanceReport: (verifierId) => {
        const { history } = get()
        const verifierActions = history.filter(h => h.verifierId === verifierId)
        
        return {
          totalDocuments: verifierActions.length,
          averageTime: verifierActions.reduce((acc, h) => 
            acc + (h.duration || 0), 0) / verifierActions.length,
          approvalRate: verifierActions.filter(h => 
            h.action === 'APPROVE').length / verifierActions.length,
        }
      },

      getProcessingTimeAnalysis: () => {
        const { tasks } = get()
        const completedTasks = tasks.filter(t => t.status === 'COMPLETED')
        
        return {
          averageTime: completedTasks.reduce((acc, t) => 
            acc + (t.actualCompletionTime || 0), 0) / completedTasks.length,
          estimatedVsActual: completedTasks.map(t => ({
            estimated: t.estimatedCompletionTime,
            actual: t.actualCompletionTime || 0,
            variance: (t.actualCompletionTime || 0) - t.estimatedCompletionTime,
          })),
        }
      },

      reset: () => set(initialState),
    }),
    {
      name: 'document-verification-store',
    }
  )
)