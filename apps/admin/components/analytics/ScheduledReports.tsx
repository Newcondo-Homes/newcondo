"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { 
  Clock, 
  Plus, 
  Edit, 
  Trash2, 
  Play,
  Pause,
  Mail,
  Calendar as CalendarIcon,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';

interface ScheduledReport {
  id: string;
  name: string;
  templateId: string;
  templateName: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  dayOfWeek?: number; // 0-6 for weekly
  dayOfMonth?: number; // 1-31 for monthly
  time: string; // HH:mm format
  recipients: string[];
  isActive: boolean;
  lastRun?: string;
  nextRun: string;
  runCount: number;
  format: string;
  createdAt: string;
}

const FREQUENCIES = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' }
];

const DAYS_OF_WEEK = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
];

export default function ScheduledReports() {
  const { toast } = useToast();
  const [schedules, setSchedules] = useState<ScheduledReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduledReport | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    templateId: '',
    frequency: 'weekly' as ScheduledReport['frequency'],
    dayOfWeek: 1,
    dayOfMonth: 1,
    time: '09:00',
    recipients: '',
    format: 'pdf'
  });

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/reports/scheduled');
      const data = await response.json();
      setSchedules(data.schedules);
    } catch (error) {
      console.error('Failed to fetch schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSchedule = async () => {
    try {
      const response = await fetch('/api/admin/reports/scheduled', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          recipients: formData.recipients.split(',').map(e => e.trim()).filter(Boolean),
          isActive: true
        }),
      });

      if (!response.ok) throw new Error('Failed to create schedule');

      toast({
        title: 'Success',
        description: 'Report schedule created successfully.',
      });

      setShowCreateDialog(false);
      fetchSchedules();
      resetForm();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create schedule.',
        variant: 'destructive',
      });
    }
  };

  const handleToggleSchedule = async (scheduleId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/reports/scheduled/${scheduleId}/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      });

      if (!response.ok) throw new Error('Failed to toggle schedule');

      setSchedules(schedules.map(s => 
        s.id === scheduleId ? { ...s, isActive: !isActive } : s
      ));

      toast({
        title: 'Success',
        description: `Schedule ${!isActive ? 'activated' : 'paused'}.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update schedule.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    try {
      const response = await fetch(`/api/admin/reports/scheduled/${scheduleId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete schedule');

      setSchedules(schedules.filter(s => s.id !== scheduleId));

      toast({
        title: 'Success',
        description: 'Schedule deleted successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete schedule.',
        variant: 'destructive',
      });
    }
  };

  const handleRunNow = async (scheduleId: string) => {
    try {
      const response = await fetch(`/api/admin/reports/scheduled/${scheduleId}/run`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to run report');

      toast({
        title: 'Success',
        description: 'Report generation started. You will receive an email when complete.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to run report.',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      templateId: '',
      frequency: 'weekly',
      dayOfWeek: 1,
      dayOfMonth: 1,
      time: '09:00',
      recipients: '',
      format: 'pdf'
    });
  };

  const getFrequencyBadge = (frequency: ScheduledReport['frequency']) => {
    const colors = {
      daily: 'bg-blue-100 text-blue-700',
      weekly: 'bg-green-100 text-green-700',
      monthly: 'bg-purple-100 text-purple-700',
      quarterly: 'bg-orange-100 text-orange-700'
    };

    return (
      <Badge className={colors[frequency]}>
        {frequency.charAt(0).toUpperCase() + frequency.slice(1)}
      </Badge>
    );
  };

  const getScheduleDescription = (schedule: ScheduledReport) => {
    const parts = [];
    
    if (schedule.frequency === 'daily') {
      parts.push('Every day');
    } else if (schedule.frequency === 'weekly' && schedule.dayOfWeek !== undefined) {
      parts.push(`Every ${DAYS_OF_WEEK[schedule.dayOfWeek]}`);
    } else if (schedule.frequency === 'monthly' && schedule.dayOfMonth) {
      parts.push(`Day ${schedule.dayOfMonth} of every month`);
    } else if (schedule.frequency === 'quarterly') {
      parts.push('First day of every quarter');
    }
    
    parts.push(`at ${schedule.time}`);
    
    return parts.join(' ');
  };

  const activeSchedules = schedules.filter(s => s.isActive);
  const pausedSchedules = schedules.filter(s => !s.isActive);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Scheduled Reports</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {activeSchedules.length} active · {pausedSchedules.length} paused
          </p>
        </div>

        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Schedule Report
        </Button>
      </div>

      {/* Active Schedules */}
      {activeSchedules.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Active Schedules
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activeSchedules.map((schedule) => (
                <ScheduleCard
                  key={schedule.id}
                  schedule={schedule}
                  onToggle={handleToggleSchedule}
                  onDelete={handleDeleteSchedule}
                  onRunNow={handleRunNow}
                  onEdit={(s) => {
                    setSelectedSchedule(s);
                    setShowEditDialog(true);
                  }}
                  getFrequencyBadge={getFrequencyBadge}
                  getScheduleDescription={getScheduleDescription}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Paused Schedules */}
      {pausedSchedules.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              Paused Schedules
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pausedSchedules.map((schedule) => (
                <ScheduleCard
                  key={schedule.id}
                  schedule={schedule}
                  onToggle={handleToggleSchedule}
                  onDelete={handleDeleteSchedule}
                  onRunNow={handleRunNow}
                  onEdit={(s) => {
                    setSelectedSchedule(s);
                    setShowEditDialog(true);
                  }}
                  getFrequencyBadge={getFrequencyBadge}
                  getScheduleDescription={getScheduleDescription}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {schedules.length === 0 && !loading && (
        <Card>
          <CardContent className="py-12 text-center">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">No scheduled reports yet</p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Schedule
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Schedule Report</DialogTitle>
            <DialogDescription>
              Automatically generate and send reports on a recurring schedule.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Schedule Name</Label>
              <Input
                id="name"
                placeholder="e.g., Weekly User Report"
                className="mt-2"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div>
              <Label>Report Template</Label>
              <Select 
                value={formData.templateId} 
                onValueChange={(value) => setFormData({ ...formData, templateId: value })}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Monthly User Growth</SelectItem>
                  <SelectItem value="2">Revenue Summary</SelectItem>
                  <SelectItem value="3">Agent Performance</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Frequency</Label>
                <Select 
                  value={formData.frequency} 
                  onValueChange={(value: any) => setFormData({ ...formData, frequency: value })}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FREQUENCIES.map((freq) => (
                      <SelectItem key={freq.value} value={freq.value}>
                        {freq.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.frequency === 'weekly' && (
                <div>
                  <Label>Day of Week</Label>
                  <Select 
                    value={formData.dayOfWeek.toString()} 
                    onValueChange={(value) => setFormData({ ...formData, dayOfWeek: parseInt(value) })}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DAYS_OF_WEEK.map((day, index) => (
                        <SelectItem key={index} value={index.toString()}>
                          {day}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {formData.frequency === 'monthly' && (
                <div>
                  <Label>Day of Month</Label>
                  <Input
                    type="number"
                    min="1"
                    max="31"
                    className="mt-2"
                    value={formData.dayOfMonth}
                    onChange={(e) => setFormData({ ...formData, dayOfMonth: parseInt(e.target.value) })}
                  />
                </div>
              )}
            </div>

            <div>
              <Label>Time (24-hour format)</Label>
              <Input
                type="time"
                className="mt-2"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              />
            </div>

            <div>
              <Label>Email Recipients (comma-separated)</Label>
              <Input
                placeholder="admin@newcondo.com, manager@newcondo.com"
                className="mt-2"
                value={formData.recipients}
                onChange={(e) => setFormData({ ...formData, recipients: e.target.value })}
              />
            </div>

            <div>
              <Label>Format</Label>
              <Select 
                value={formData.format} 
                onValueChange={(value) => setFormData({ ...formData, format: value })}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="excel">Excel</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateSchedule}>
              Create Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Schedule Card Component
interface ScheduleCardProps {
  schedule: ScheduledReport;
  onToggle: (id: string, isActive: boolean) => void;
  onDelete: (id: string) => void;
  onRunNow: (id: string) => void;
  onEdit: (schedule: ScheduledReport) => void;
  getFrequencyBadge: (frequency: ScheduledReport['frequency']) => React.ReactNode;
  getScheduleDescription: (schedule: ScheduledReport) => string;
}

function ScheduleCard({
  schedule,
  onToggle,
  onDelete,
  onRunNow,
  onEdit,
  getFrequencyBadge,
  getScheduleDescription
}: ScheduleCardProps) {
  return (
    <div className="flex items-start gap-4 p-4 border rounded-lg">
      <div className="flex-grow space-y-2">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold">{schedule.name}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {getScheduleDescription(schedule)}
            </p>
          </div>
          {getFrequencyBadge(schedule.frequency)}
        </div>

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Mail className="h-3 w-3" />
            {schedule.recipients.length} recipients
          </span>
          <span className="flex items-center gap-1">
            <CalendarIcon className="h-3 w-3" />
            Next: {format(new Date(schedule.nextRun), 'PPp')}
          </span>
          {schedule.lastRun && (
            <span>Last: {format(new Date(schedule.lastRun), 'PPp')}</span>
          )}
          <span>Runs: {schedule.runCount}</span>
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onToggle(schedule.id, schedule.isActive)}
        >
          {schedule.isActive ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
        </Button>

        <Button
          size="sm"
          variant="ghost"
          onClick={() => onRunNow(schedule.id)}
        >
          Run Now
        </Button>

        <Button
          size="sm"
          variant="ghost"
          onClick={() => onEdit(schedule)}
        >
          <Edit className="h-4 w-4" />
        </Button>

        <Button
          size="sm"
          variant="ghost"
          onClick={() => onDelete(schedule.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}