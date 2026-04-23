import React from 'react';
import { useSettings } from '../contexts/SettingsContext';

interface PolicyProps {
  type: 'privacy' | 'terms';
}

const Policy: React.FC<PolicyProps> = ({ type }) => {
  const { settings } = useSettings();

  const title = type === 'privacy' ? 'Privacy Policy' : 'Terms of Service';
  const content = type === 'privacy' ? settings.privacyPolicy : settings.termsOfService;

  return (
    <div className="py-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 min-h-[70vh]">
      <h1 className="text-4xl font-display font-black text-white italic uppercase tracking-tighter mb-12 border-b border-white/10 pb-6">
        {title}
      </h1>
      
      <div className="prose prose-invert prose-p:text-gray-300 prose-headings:text-white max-w-none whitespace-pre-wrap">
        {content}
      </div>
    </div>
  );
};

export default Policy;
