import React from 'react';

const Spinner = ({ size = 'md', color = 'white' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-10 h-10 border-3',
  };

  const colorClasses = {
    white: 'border-white border-t-transparent',
    purple: 'border-pcu-purple border-t-transparent',
    red: 'border-pcu-red border-t-transparent',
  };

  return (
    <div className={`rounded-full animate-spin ${sizeClasses[size]} ${colorClasses[color]}`} />
  );
};

export default Spinner;