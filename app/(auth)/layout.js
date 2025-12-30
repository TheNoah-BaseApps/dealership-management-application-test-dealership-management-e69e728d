import { Car } from 'lucide-react';

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Car className="h-10 w-10 text-blue-600" />
            <span className="text-3xl font-bold">DealershipPro</span>
          </div>
          <p className="text-slate-600">Dealership Management System</p>
        </div>
        {children}
      </div>
    </div>
  );
}