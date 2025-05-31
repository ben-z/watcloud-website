import React from 'react';
import { Link } from 'nextra-theme-docs';
import { cn } from '@/lib/utils';

interface FeatureCardProps {
  icon?: string;
  title: string;
  description: string;
  link?: string;
  linkText?: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, link, linkText }) => {
  const content = (
    <div style={{
      border: '1px solid #ddd', // Updated
      borderRadius: '8px',
      padding: '20px',
      margin: '10px',
      flex: '1 1 300px', // Updated
      boxShadow: '0 2px 5px rgba(0,0,0,0.1)', // Added
      backgroundColor: 'white' // Assuming a light theme default for cards
    }}>
      {icon && <div style={{ fontSize: '2rem', marginBottom: '10px', textAlign: 'center' }}>{icon}</div>}
      <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '10px', color: '#444', textAlign: 'center' }}>{title}</h3>
      <p style={{ marginBottom: '15px', color: '#666', lineHeight: '1.6' }}>{description}</p>
      {link && linkText && (
        <div style={{ textAlign: 'center', marginTop: 'auto' }}> {/* Ensures button is at the bottom if cards vary in height */}
          <Link href={link}>
            <a className={cn('text-blue-600', 'hover:underline', 'inline-block', 'px-4', 'py-2', 'border', 'border-blue-600', 'rounded', 'hover:bg-blue-50')}>
              {linkText} <span>→</span>
            </a>
          </Link>
        </div>
      )}
    </div>
  );

  if (link && !linkText) {
    return (
      <Link href={link} style={{ textDecoration: 'none', color: 'inherit' }}>
        {content}
      </Link>
    );
  }

  return content;
};

const features: FeatureCardProps[] = [
  {
    icon: '⚙️',
    title: 'High-Performance Computing',
    description: 'Access powerful Slurm clusters for your demanding research and computational tasks.',
    link: '/docs/compute-cluster/slurm',
    linkText: 'Learn about Slurm',
  },
  {
    icon: '💡',
    title: 'GPU Resources',
    description: 'Utilize a variety of GPUs for machine learning, scientific simulations, and more.',
    link: '/machines',
    linkText: 'View Machine Specs',
  },
  {
    icon: '🌐',
    title: 'Easy Web Access',
    description: 'Connect to your resources and manage your work through convenient web interfaces and SSH.',
    link: '/docs/compute-cluster/getting-access',
    linkText: 'Getting Access',
  },
  {
    icon: '📚',
    title: 'Diverse Software Stack',
    description: 'Leverage a wide range of pre-installed scientific software, libraries, and tools.',
    // No specific link for now, can be added later
  },
];

export const KeyFeatures: React.FC = () => {
  return (
    <div style={{
      maxWidth: '90rem',
      margin: '40px auto',
      padding: '20px max(env(safe-area-inset-left),1.5rem)' // Updated
    }}>
      <h2 style={{
        fontSize: '2rem',
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: '30px',
        color: '#333' // Added
      }}>
        Key Features & Capabilities
      </h2>
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '20px' // Added for spacing between cards
      }}>
        {features.map((feature) => (
          <FeatureCard key={feature.title} {...feature} />
        ))}
      </div>
    </div>
  );
};

export default KeyFeatures;
