import React, { useState, useEffect } from 'react';
import { Outlet, Navigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { 
  IoMenu, IoPersonCircleOutline, IoNotificationsOutline, IoKeyOutline 
} from 'react-icons/io5';
import { useAuth } from '../../contexts/AuthContext';

import Sidebar from './SideBar';
import Spinner from '../common/Spinner';
import Modal from '../common/Modal';
import Button from '../common/Button';

const AdminLayout = () => {
  const { user, loading, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Notification State
  const [unreadCount, setUnreadCount] = useState(0);

  // Profile Modal State
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: '', password: '', password_confirmation: '' });
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // --- 1. Notification Polling Logic ---
  useEffect(() => {
    if (!user) return;

    const fetchCount = async () => {
        try {
            const res = await axios.get('/inbox/count');
            setUnreadCount(res.data.data.count);
        } catch (e) {
            // Silently fail on polling errors to avoid annoying toasts
            console.error("Polling failed", e);
        }
    };

    fetchCount(); // Initial fetch immediately on load
    const interval = setInterval(fetchCount, 30000); // Poll every 30 seconds

    return () => clearInterval(interval); // Cleanup on unmount
  }, [user]);

  // --- 2. Profile Handlers ---
  const openProfile = () => {
      setProfileForm({ 
          name: user.name, 
          password: '', 
          password_confirmation: '' 
      });
      setIsProfileOpen(true);
  };

  const handleProfileUpdate = async (e) => {
      e.preventDefault();
      setIsSavingProfile(true);
      try {
          // Send only filled fields
          const payload = { name: profileForm.name };
          if (profileForm.password) {
              payload.password = profileForm.password;
              payload.password_confirmation = profileForm.password_confirmation;
          }

          await axios.post('/profile', payload);
          toast.success('Profile updated successfully');
          // Note: In a real app, you might want to update the local 'user' context here
          setIsProfileOpen(false);
      } catch (error) {
          toast.error(error.response?.data?.message || 'Failed to update profile');
      } finally {
          setIsSavingProfile(false);
      }
  };

  // --- 3. Loading & Auth Check ---
  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50">
        <Spinner size="lg" color="purple" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      
      {/* Sidebar Component */}
      <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-64 transition-all duration-300">
        
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-20 px-6 py-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSidebarOpen(true)} 
              className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <IoMenu size={24} />
            </button>
            <h2 className="text-lg font-semibold text-gray-800 hidden md:block">
              Dashboard
            </h2>
          </div>

          <div className="flex items-center gap-4">
            
            {/* Notification Bell (Inbox Link) */}
            {/*<Link 
              to="/admin/messages" 
              className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors group"
              title="Inbox"
            >
              <IoNotificationsOutline size={22} className="group-hover:text-pcu-purple transition-colors" />
              {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-pcu-red text-[10px] text-white font-bold items-center justify-center border-2 border-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  </span>
              )}
            </Link>*/}

            {/* Profile Dropdown Trigger */}
            <div 
                className="flex items-center gap-3 pl-4 border-l border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={openProfile}
                title="Edit Profile"
            >
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-gray-800">{user.name}</p>
                <p className="text-xs text-gray-500 capitalize">{user.role || 'Admin'}</p>
              </div>
              <IoPersonCircleOutline className="text-4xl text-gray-300" />
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* --- Profile Modal --- */}
      <Modal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} title="My Profile" size="sm">
          <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input 
                    type="text" className="input-field" 
                    value={profileForm.name} 
                    onChange={e => setProfileForm({...profileForm, name: e.target.value})} 
                    required 
                  />
              </div>
              
              <div className="pt-4 border-t border-gray-100">
                  <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                      <IoKeyOutline className="text-pcu-purple"/> Change Password
                  </h4>
                  <div className="space-y-3">
                      <div>
                          <input 
                            type="password" className="input-field text-sm" 
                            placeholder="New Password (min 6 chars)" 
                            value={profileForm.password} 
                            onChange={e => setProfileForm({...profileForm, password: e.target.value})} 
                            minLength={6}
                          />
                      </div>
                      <div>
                          <input 
                            type="password" className="input-field text-sm" 
                            placeholder="Confirm New Password" 
                            value={profileForm.password_confirmation} 
                            onChange={e => setProfileForm({...profileForm, password_confirmation: e.target.value})} 
                          />
                      </div>
                  </div>
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-gray-100 mt-2">
                  <Button variant="secondary" type="button" onClick={() => setIsProfileOpen(false)}>Cancel</Button>
                  <Button type="submit" isLoading={isSavingProfile}>Update Profile</Button>
              </div>
          </form>
      </Modal>

    </div>
  );
};

export default AdminLayout;