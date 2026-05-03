import { Suspense } from 'react';
import AuthErrorClient from './AuthErrorClient';

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading authentication error...</div>}>
      <AuthErrorClient />
    </Suspense>
  );
}
