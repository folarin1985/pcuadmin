import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  IoSchoolOutline, 
  IoNewspaperOutline, 
  IoDocumentTextOutline, 
  IoAddCircleOutline,
  IoCalendarOutline,
  IoArrowForward
} from 'react-icons/io5';
import { useAuth } from '../../contexts/AuthContext'; // 1. Import useAuth

import StatCard from '../../components/dashboard/StatCard';
import Spinner from '../../components/common/Spinner';
import Button from '../../components/common/Button';

const Overview = () => {
  const { getImageUrl } = useAuth(); // 2. Get the helper

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    posts_count: 0,
    programs_count: 0,
    pages_count: 0,
    recent_posts: []
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get('/dashboard/stats');
      setStats(response.data.data);
    } catch (error) {
      console.error('Failed to fetch stats', error);
      toast.error('Could not load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" color="purple" />
      </div>
    );
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  };

  return (
    <div className="space-y-8">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard Overview</h1>
          <p className="text-gray-500">Welcome to the PCU Content Management System.</p>
        </div>
        <div className="flex gap-3">
          <Link to="/admin/posts">
            <Button variant="primary" className="text-sm">
              <IoAddCircleOutline className="mr-2 text-lg" />
              New Post
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Total Programs" 
          value={stats.programs_count} 
          icon={IoSchoolOutline} 
          color="purple" 
          delay={0.1}
        />
        <StatCard 
          title="Published News" 
          value={stats.posts_count} 
          icon={IoNewspaperOutline} 
          color="red" 
          delay={0.2}
        />
        <StatCard 
          title="Events" 
          value={stats.events_count} 
          icon={IoDocumentTextOutline} 
          color="blue" 
          delay={0.3}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Recent News Column */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <IoNewspaperOutline className="text-pcu-purple" />
            Recent News
          </h2>
          
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {stats.recent_posts.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {stats.recent_posts.map((post) => (
                  <div key={post.id} className="p-4 hover:bg-gray-50 transition-colors flex items-start gap-4">
                    {/* Thumbnail Fallback */}
                    <div className="w-16 h-16 rounded-lg bg-gray-200 flex-shrink-0 overflow-hidden border border-gray-100">
                       {post.featured_image ? (
                         // 3. USE HELPER HERE
                         <img src={getImageUrl(post.featured_image)} alt="" className="w-full h-full object-cover" />
                       ) : (
                         <div className="w-full h-full flex items-center justify-center text-gray-400">
                           <IoNewspaperOutline />
                         </div>
                       )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-800 truncate">{post.title}</h4>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-1">{post.excerpt || 'No description provided.'}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <IoCalendarOutline />
                          {formatDate(post.published_at)}
                        </span>
                        {/*<span className={`px-2 py-0.5 rounded-full ${post.is_featured ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>
                          {post.is_featured ? 'Featured' : 'Standard'}
                        </span>*/}
                      </div>
                    </div>

                    {/*<Link to={`/admin/posts/${post.id}`} className="text-gray-400 hover:text-pcu-purple transition-colors p-2">
                      <IoArrowForward />
                    </Link>*/}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                No posts found. Start by creating one!
              </div>
            )}
            
            <div className="p-3 bg-gray-50 border-t border-gray-100 text-center">
              <Link to="/admin/posts" className="text-sm font-medium text-pcu-purple hover:text-pcu-purple-dark transition-colors">
                View All News
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Links Column */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <IoAddCircleOutline className="text-pcu-red" />
            Quick Actions
          </h2>
          
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-3">
            <QuickActionLink 
              to="/admin/programs" 
              label="Add Academic Program" 
              desc="Create a new course"
              icon={IoSchoolOutline}
              color="text-blue-600 bg-blue-50"
            />
            <QuickActionLink 
              to="/admin/staff" 
              label="Add Staff Member" 
              desc="Update directory"
              icon={IoAddCircleOutline}
              color="text-emerald-600 bg-emerald-50"
            />
            <QuickActionLink 
              to="/admin/settings" 
              label="Site Settings" 
              desc="Update logo or contact"
              icon={IoAddCircleOutline}
              color="text-pcu-purple bg-purple-50"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const QuickActionLink = ({ to, label, desc, icon: Icon, color }) => (
  <Link to={to} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100 group">
    <div className={`p-3 rounded-lg ${color} group-hover:scale-110 transition-transform`}>
      <Icon size={20} />
    </div>
    <div>
      <h4 className="font-semibold text-gray-800 text-sm">{label}</h4>
      <p className="text-xs text-gray-500">{desc}</p>
    </div>
    <IoArrowForward className="ml-auto text-gray-300 group-hover:text-gray-500" />
  </Link>
);

export default Overview;