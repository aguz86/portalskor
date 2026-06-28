import React from 'react';

export function TermsOfService() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Terms of Service</h1>
        <div className="prose prose-emerald max-w-none text-gray-600">
          <p className="mb-4">Last updated: June 2026</p>
          
          <h2 className="text-xl font-semibold text-gray-800 mt-8 mb-4">1. Acceptance of Terms</h2>
          <p className="mb-4">
            By accessing or using our application, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
          </p>

          <h2 className="text-xl font-semibold text-gray-800 mt-8 mb-4">2. Use of Services</h2>
          <p className="mb-4">
            You agree to use our services only for lawful purposes and in accordance with these Terms. You are responsible for maintaining the confidentiality of your account and password and for restricting access to your computer or device.
          </p>

          <h2 className="text-xl font-semibold text-gray-800 mt-8 mb-4">3. User Content</h2>
          <p className="mb-4">
            You retain all rights to the schedules, tasks, and other content you create within the app. By using the app, you grant us a license to store and process this content solely for the purpose of providing the service to you.
          </p>

          <h2 className="text-xl font-semibold text-gray-800 mt-8 mb-4">4. Modifications to Service</h2>
          <p className="mb-4">
            We reserve the right to withdraw or amend our service, and any service or material we provide, in our sole discretion without notice. We will not be liable if for any reason all or any part of the service is unavailable at any time or for any period.
          </p>

          <h2 className="text-xl font-semibold text-gray-800 mt-8 mb-4">5. Contact Information</h2>
          <p className="mb-4">
            If you have any questions about these Terms, please contact us at support@growup.web.id.
          </p>
          
          <div className="mt-12 pt-6 border-t border-gray-100">
            <a href="/" className="text-emerald-600 hover:text-emerald-700 font-medium">
              &larr; Back to App
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
