import type { LucideIcon } from 'lucide-react';

interface DashboardCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  onClick: () => void;
  color: string;
}

const colorClasses = {
  blue: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'hover:border-blue-500 dark:hover:border-blue-400',
    accent: 'bg-blue-500 dark:bg-blue-400',
  },
  green: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-600 dark:text-green-400',
    border: 'hover:border-green-500 dark:hover:border-green-400',
    accent: 'bg-green-500 dark:bg-green-400',
  },
  purple: {
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    text: 'text-purple-600 dark:text-purple-400',
    border: 'hover:border-purple-500 dark:hover:border-purple-400',
    accent: 'bg-purple-500 dark:bg-purple-400',
  },
  orange: {
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    text: 'text-orange-600 dark:text-orange-400',
    border: 'hover:border-orange-500 dark:hover:border-orange-400',
    accent: 'bg-orange-500 dark:bg-orange-400',
  },
};

export const DashboardCard = ({
  title,
  description,
  icon: Icon,
  onClick,
  color,
}: DashboardCardProps) => {
  const colors = colorClasses[color as keyof typeof colorClasses] || colorClasses.blue;

  return (
    <button
      onClick={onClick}
      className={`group relative bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl dark:shadow-gray-900/50 transition-all duration-300 p-6 text-left border-2 border-transparent ${colors.border} hover:-translate-y-1`}
    >
      <div className={`inline-flex p-3 rounded-lg ${colors.bg} ${colors.text} mb-4 transition-colors duration-200`}>
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 transition-colors duration-200">
        {title}
      </h3>
      <p className="text-gray-600 dark:text-gray-400 text-sm transition-colors duration-200">
        {description}
      </p>
      <div className={`absolute bottom-0 left-0 right-0 h-1 ${colors.accent} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 rounded-b-xl`}></div>
    </button>
  );
};
