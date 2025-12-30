'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar, User } from 'lucide-react';
import { formatDate } from '@/lib/utils/date';

export default function TaskCard({ task, onToggle, onClick }) {
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return 'destructive';
      case 'Medium': return 'default';
      case 'Low': return 'secondary';
      default: return 'default';
    }
  };

  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onClick}>
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <Checkbox
            checked={task.status === 'Completed'}
            onCheckedChange={onToggle}
            onClick={(e) => e.stopPropagation()}
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
                <span>{formatDate(task.due_date)}</span>
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
  );
}