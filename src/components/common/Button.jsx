import React from 'react';
import Spinner from './Spinner';

const Button = ({ 
  children, 
  isLoading, 
  variant = 'primary', 
  className = '', 
  onClick, 
  type = 'button',
  disabled 
}) => {
  const baseStyle = "relative flex items-center justify-center px-6 py-2.5 rounded-xl font-medium transition-all duration-200 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed shadow-sm";
  
  const variants = {
    primary: "bg-gradient-to-r from-pcu-purple to-pcu-purple-light text-white hover:shadow-pcu-purple/30 hover:shadow-lg",
    secondary: "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300",
    danger: "bg-red-50 text-red-600 border border-red-100 hover:bg-red-100",
    ghost: "bg-transparent text-gray-600 hover:bg-gray-100",
  };

  return (
    <button
      type={type}
      className={`${baseStyle} ${variants[variant]} ${className}`}
      onClick={onClick}
      disabled={disabled || isLoading}
    >
      {isLoading ? (
        <div className="flex items-center gap-2">
          <Spinner size="sm" color={variant === 'primary' ? 'white' : 'purple'} />
          <span>Processing...</span>
        </div>
      ) : (
        children
      )}
    </button>
  );
};

export default Button;