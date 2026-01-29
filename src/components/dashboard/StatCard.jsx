import React from 'react';
import { motion } from 'framer-motion';

const StatCard = ({ title, value, icon: Icon, color, delay }) => {
  // Color mapping for dynamic styling
  const colorStyles = {
    purple: 'bg-pcu-purple text-white shadow-pcu-purple/30',
    red: 'bg-pcu-red text-white shadow-pcu-red/30',
    blue: 'bg-blue-600 text-white shadow-blue-600/30',
    green: 'bg-emerald-600 text-white shadow-emerald-600/30',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay, duration: 0.4 }}
      className="glossy-card p-6 relative overflow-hidden group"
    >
      <div className="relative z-10 flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm font-medium uppercase tracking-wider">{title}</p>
          <h3 className="text-3xl font-bold text-gray-800 mt-2">{value}</h3>
        </div>
        <div className={`p-3 rounded-2xl shadow-lg ${colorStyles[color]} transform group-hover:scale-110 transition-transform duration-300`}>
          <Icon size={24} />
        </div>
      </div>

      {/* Decorative background blob */}
      <div className={`absolute -bottom-4 -right-4 w-24 h-24 rounded-full opacity-10 blur-2xl ${colorStyles[color].split(' ')[0]}`} />
    </motion.div>
  );
};

export default StatCard;