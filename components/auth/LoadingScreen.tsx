import React from 'react';

export default function LoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-4 border-[--template-gray-200] border-t-[--template-primary] animate-spin"></div>
        </div>
        <p className="text-lg font-medium text-[--template-gray-700]">Loading...</p>
      </div>
    </div>
  );
}
