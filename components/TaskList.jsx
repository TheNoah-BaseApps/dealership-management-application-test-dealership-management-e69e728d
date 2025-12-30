'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Calendar, User } from 'lucide-react';
import { formatDate } from '@/lib/utils/date';
import { toast } from 'sonner';

export default function TaskList({ tasks, onRefresh }) {
  const handleToggleComplete = async (task) => {
    try {
      const token = localStorage.getItem('token');
      const newStatus = task.status === 'Completed' ? 'Pending' : 'Completed';
      
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error('Failed to update task');

      toast.success(`Task ${newStatus === 'Completed' ? 'completed' : 'reopened'}`);
      onRefresh();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return 'destructive';
      case 'Medium': return 'default';
      case 'Low': return 'secondary';
      default: return 'default';
    }
  };

  const isOverdue = (task) => {
    if (task.status === 'Completed') return false;
    return new Date(task.due_date) < new Date();
  };

  if (tasks.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-slate-500">
          No tasks assigned
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <Card key={task.task_id} className={task.status === 'Completed' ? 'opacity-60' : ''}>
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <Checkbox
                checked={task.status === 'Completed'}
                onCheckedChange={() => handleToggleComplete(task)}
                className="mt-1"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className={`font-medium ${task.status === 'Completed' ? 'line-through' : ''}`}>
                    {task.title}
                  </h4>
                  <Badge variant={getPriorityColor(task.priority)}>{task.priority}</Badge>
                </div>
                {task.description && (
                  <p className="text-sm text-slate-600 mb-2">{task.description}</p>
                )}
                <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span className={isOverdue(task) ? 'text-red-600 font-medium' : ''}>
                      {formatDate(task.due_date)}
                      {isOverdue(task) && ' (Overdue)'}
                    </span>
                  </div>
                  {task.assigned_to_name && (
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      <span>{task.assigned_to_name}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}