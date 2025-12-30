'use client';

import { Card } from '@/components/ui/card';

export default function ChartWidget({ type, data, title }) {
  // Simplified chart visualization
  if (type === 'line') {
    const maxValue = Math.max(...data.map(d => d.value || 0), 1);
    
    return (
      <div className="space-y-4">
        {title && <h3 className="font-medium">{title}</h3>}
        <div className="h-64 flex items-end justify-around gap-2">
          {data.map((item, index) => (
            <div key={index} className="flex-1 flex flex-col items-center gap-2">
              <div
                className="w-full bg-blue-500 rounded-t"
                style={{ height: `${(item.value / maxValue) * 100}%` }}
              />
              <div className="text-xs text-slate-600 text-center">
                <div>{item.label}</div>
                <div className="font-medium">${item.value?.toLocaleString()}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === 'pie') {
    const total = data.reduce((sum, item) => sum + (item.value || 0), 0);
    
    return (
      <div className="space-y-4">
        {title && <h3 className="font-medium">{title}</h3>}
        <div className="space-y-3">
          {data.map((item, index) => {
            const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : 0;
            return (
              <div key={index}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span>{item.label}</span>
                  <span className="font-medium">{percentage}%</span>
                </div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return null;
}