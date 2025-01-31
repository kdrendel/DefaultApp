import React from 'react';
import { useAuth } from '../hooks/useAuth';

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-semibold text-gray-900">Welcome back!</h1>
        <p className="mt-2 text-gray-600">
          You are signed in as {user?.email}
        </p>
      </div>
    </div>
  );
}