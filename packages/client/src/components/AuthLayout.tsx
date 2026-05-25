import type { ReactNode } from "react";

export default function AuthLayout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-sm border p-6">
        <h1 className="text-xl font-bold mb-6 text-center">{title}</h1>
        {children}
      </div>
    </div>
  );
}
