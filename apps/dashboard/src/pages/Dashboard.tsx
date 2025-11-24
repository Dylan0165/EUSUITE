import { useNavigate } from 'react-router-dom';
import { DashboardCard } from '../components/DashboardCard';
import { Cloud, Type, User, Settings } from 'lucide-react';
import { EUCLOUD_URL, EUTYPE_URL } from '../config/constants';

export const Dashboard = () => {
  const navigate = useNavigate();

  const apps = [
    {
      title: 'EUType',
      description: 'Maak en bewerk documenten met de tekstverwerker',
      icon: Type,
      color: 'rose',
      onClick: () => window.location.href = EUTYPE_URL,
    },
    {
      title: 'EUCloud',
      description: 'Beheer je cloud opslag en bestanden',
      icon: Cloud,
      color: 'blue',
      onClick: () => window.location.href = EUCLOUD_URL,
    },
    {
      title: 'Profiel',
      description: 'Beheer je account instellingen',
      icon: User,
      color: 'amber',
      onClick: () => navigate('/profile'),
    },
    {
      title: 'Instellingen',
      description: 'Configureer je voorkeuren',
      icon: Settings,
      color: 'emerald',
      onClick: () => navigate('/settings'),
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10">
        <h2 className="text-3xl font-bold text-emerald-900 dark:text-amber-400 mb-3 transition-colors duration-200">
          Welkom bij EUsuite
        </h2>
        <p className="text-stone-600 dark:text-stone-400 text-lg transition-colors duration-200">
          Selecteer een applicatie om te beginnen
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {apps.map((app) => (
          <DashboardCard
            key={app.title}
            title={app.title}
            description={app.description}
            icon={app.icon}
            color={app.color}
            onClick={app.onClick}
          />
        ))}
      </div>
    </div>
  );
};
