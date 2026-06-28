import React from 'react';

export function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Privacy Policy</h1>
        <div className="prose prose-emerald max-w-none text-gray-600">
          <p className="mb-4">Last updated: June 2026</p>
          
          <h2 className="text-xl font-semibold text-gray-800 mt-8 mb-4">1. Information We Collect</h2>
          <p className="mb-4">
            We collect information you provide directly to us when you create an account, update your profile, or use our scheduling services. This may include your name, email address, and any tasks or schedules you create within the application.
          </p>

          <h2 className="text-xl font-semibold text-gray-800 mt-8 mb-4">2. How We Use Your Information</h2>
          <p className="mb-4">
            We use the information we collect to provide, maintain, and improve our services, including to sync your schedules across devices, send you notifications (if enabled), and personalize your experience.
          </p>

          <h2 className="text-xl font-semibold text-gray-800 mt-8 mb-4">3. Third-Party Services</h2>
          <p className="mb-4">
            Our application integrates with Google services (such as Google Tasks and Google Calendar) and Telegram for enhanced functionality. When you use these integrations, your data is also subject to the privacy policies of those respective services. We only request the minimum permissions necessary to provide these features.
          </p>

          <h2 className="text-xl font-semibold text-gray-800 mt-8 mb-4">4. Data Security</h2>
          <p className="mb-4">
            We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
          </p>

          <h2 className="text-xl font-semibold text-gray-800 mt-8 mb-4">5. Contact Us</h2>
          <p className="mb-4">
            If you have any questions about this Privacy Policy, please contact us at privacy@growup.web.id.
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
