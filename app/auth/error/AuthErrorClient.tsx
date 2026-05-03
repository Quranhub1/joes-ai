'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const errorMessages: Record<string, string> = {
    OAuthSignin: 'Error connecting to Google. Please try again.',
    OAuthCallback: 'Error during Google callback. Please try again.',
    OAuthCreateAccount: 'Could not create account with Google.',
    EmailCreateAccount: 'Could not create account with email.',
    Callback: 'Error in callback route. Please try again.',
    EmailSignin: 'Email sign in is not enabled.',
    EmailSigninError: 'Email sign in error. Please try again.',
    SessionCallback: 'Session callback error.',
    SessionExpiresCallback: 'Session expires callback error.',
    AccessDenied: 'Access denied. Please try again.',
    Verification: 'Verification link error.',
  };

  const message =
    error && errorMessages[error]
      ? errorMessages[error]
      : 'An error occurred during authentication.';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-red-600 text-xl">!</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Authentication Error</h1>
        <p className="text-gray-600 mb-6">{message}</p>
        <Link
          href="/auth/signin"
          className="inline-block px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Back to Sign In
        </Link>
      </div>
    </div>
  );
}

function AuthErrorLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4 animate-pulse">
          <span className="text-white font-bold text-xl">AI</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-800">Loading...</h1>
      </div>
    </div>
  );
}

export default function AuthErrorClient() {
  return (
    <Suspense fallback={<AuthErrorLoading />}>
      <AuthErrorContent />
    </Suspense>
  );
}