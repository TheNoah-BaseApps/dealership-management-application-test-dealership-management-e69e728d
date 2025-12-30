'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils/date';
import { User, FileText, Edit, Trash2, Plus } from 'lucide-react';

export default function AuditLogViewer({ logs }) {
  const getActionIcon = (action) => {
    switch (action) {
      case 'CREATE': return Plus;
      case 'UPDATE': return Edit;
      case 'DELETE': return Trash2;
      default: return FileText;
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'CREATE': return 'default';
      case 'UPDATE': return 'secondary';
      case 'DELETE': return 'destructive';
      default: return 'outline';
    }
  };

  if (logs.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-slate-500">
          No audit logs found
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {logs.map((log) => {
        const ActionIcon = getActionIcon(log.action);
        
        return (
          <Card key={log.id}>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center">
                    <ActionIcon className="h-5 w-5 text-slate-600" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={getActionColor(log.action)}>{log.action}</Badge>
                    <span className="text-sm font-medium">{log.entity_type}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                    <User className="h-4 w-4" />
                    <span>{log.user_name || 'System'}</span>
                    <span>•</span>
                    <span>{formatDate(log.created_at)}</span>
                  </div>
                  {log.ip_address && (
                    <p className="text-xs text-slate-500">IP: {log.ip_address}</p>
                  )}
                  {(log.old_value || log.new_value) && (
                    <details className="mt-2">
                      <summary className="text-sm text-blue-600 cursor-pointer">
                        View Details
                      </summary>
                      <div className="mt-2 p-3 bg-slate-50 rounded text-xs">
                        {log.old_value && (
                          <div className="mb-2">
                            <p className="font-medium">Previous Value:</p>
                            <pre className="mt-1 overflow-x-auto">
                              {JSON.stringify(log.old_value, null, 2)}
                            </pre>
                          </div>
                        )}
                        {log.new_value && (
                          <div>
                            <p className="font-medium">New Value:</p>
                            <pre className="mt-1 overflow-x-auto">
                              {JSON.stringify(log.new_value, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </details>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}