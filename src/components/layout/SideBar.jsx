import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  IoGridOutline, 
  IoSchoolOutline, 
  IoPeopleOutline, 
  IoNewspaperOutline, 
  IoCalendarOutline, 
  IoSettingsOutline, 
  IoLogOutOutline,
  IoBusinessOutline,
  IoPricetagsOutline,
  IoDocumentTextOutline,
  IoImageOutline,
  IoList,
  IoShapesOutline,
  IoShieldCheckmarkOutline,
  IoMailOutline,
  IoPersonAddOutline,
  IoWalletOutline,
  IoShieldOutline,
} from 'react-icons/io5';
import Logo from '../../assets/images/pculogo.png';
import { useAuth } from '../../contexts/AuthContext';
import ConfirmModal from '../common/ConfirmModal';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const { user, logout } = useAuth();
  
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // --- DEBUGGING LOGS ---
  // Look for these in your browser console (F12)
  /*console.group("🔍 DEBUG SIDEBAR USER");
  console.log("Full User Object:", user);
  console.log("User Roles (Array?):", user?.roles);
  console.log("User Role (String/Obj?):", user?.role);
  console.groupEnd();*/

  const handleLogoutConfirm = async () => {
    setIsLoggingOut(true);
    try {
      await logout(); 
    } catch (error) {
      console.error("Logout failed", error);
      setIsLoggingOut(false);
      setIsLogoutModalOpen(false);
    }
  };

  // --- ROLE EXTRACTION ---
  const userRole = (() => {
    if (!user) return '';

    // 1. Check for 'roles' array (Laravel Spatie style)
    // This matches your Users.jsx: row.roles?.[0]?.name
    if (user.roles && Array.isArray(user.roles) && user.roles.length > 0) {
      return user.roles[0].name; // e.g. "Super Admin"
    }

    // 2. Check for direct 'role' string (Simple auth)
    if (typeof user.role === 'string') return user.role;

    // 3. Check for 'role' object (some setups)
    if (user.role?.name) return user.role.name;
    
    return '';
  })();

  // --- MENU DEFINITIONS ---
  const menuItems = [
    { 
      path: '/admin/dashboard', 
      name: 'Overview', 
      icon: IoGridOutline, 
      roles: ['Super Admin', 'Content Editor', 'Event Manager', 'Academic Admin', 'Staff Manager'] 
    },
    { 
      path: '/admin/bot', 
      name: 'Board of Trustees', 
      icon: IoShieldOutline, 
      roles: ['Super Admin'] 
    },
    { 
      path: '/admin/sliders', 
      name: 'Homepage Banners', 
      icon: IoImageOutline, 
      roles: ['Super Admin', 'Content Editor'] 
    },
    { 
      path: '/admin/widgets', 
      name: 'Homepage Widgets', 
      icon: IoShapesOutline, 
      roles: ['Super Admin', 'Content Editor'] 
    },
    { 
      path: '/admin/faculties', 
      name: 'Faculties', 
      icon: IoSchoolOutline, 
      roles: ['Super Admin', 'Academic Admin'] 
    },
    { 
      path: '/admin/departments', 
      name: 'Departments', 
      icon: IoBusinessOutline, 
      roles: ['Super Admin', 'Academic Admin'] 
    },
    { 
      path: '/admin/programs', 
      name: 'Programs', 
      icon: IoSchoolOutline, 
      roles: ['Super Admin', 'Academic Admin'] 
    },
    { 
      path: '/admin/admissions', 
      name: 'Admissions', 
      icon: IoPersonAddOutline, 
      roles: ['Super Admin', 'Academic Admin'] 
    },
    { 
      path: '/admin/academic-calendar', 
      name: 'Academic Calendar', 
      icon: IoCalendarOutline, 
      roles: ['Super Admin', 'Academic Admin', 'Event Manager'] 
    },
    { 
      path: '/admin/fees', 
      name: 'Tuition & Fees', 
      icon: IoWalletOutline, 
      roles: ['Super Admin', 'Academic Admin'] 
    },
    { 
      path: '/admin/scholarships', 
      name: 'Scholarships', 
      icon: IoSchoolOutline, 
      roles: ['Super Admin', 'Academic Admin'] 
    }, 
    { 
      path: '/admin/staff', 
      name: 'Staff', 
      icon: IoPeopleOutline, 
      roles: ['Super Admin', 'Staff Manager'] 
    },
    { 
      path: '/admin/categories', 
      name: 'Categories Manager', 
      icon: IoPricetagsOutline, 
      roles: ['Super Admin', 'Content Editor'] 
    },
    { 
      path: '/admin/posts', 
      name: 'News', 
      icon: IoNewspaperOutline, 
      roles: ['Super Admin', 'Content Editor'] 
    },
    { 
      path: '/admin/events', 
      name: 'Events', 
      icon: IoCalendarOutline, 
      roles: ['Super Admin', 'Content Editor', 'Event Manager'] 
    },
    { 
      path: '/admin/settings', 
      name: 'Settings', 
      icon: IoSettingsOutline, 
      roles: ['Super Admin'] 
    },
    { 
      path: '/admin/users', 
      name: 'User Management', 
      icon: IoShieldCheckmarkOutline, 
      roles: ['Super Admin'] 
    },
  ];

  // --- FILTER LOGIC ---
  const allowedMenuItems = menuItems.filter(item => {
    // 1. If user not loaded yet, hide everything (or show safe default)
    if (!userRole) return false; 
    
    // 2. Super Admin sees ALL, regardless of item.roles
    if (userRole === 'Super Admin') return true;

    // 3. Strict Check: Item must have roles defined, and user must have one of them
    return item.roles && item.roles.includes(userRole);
  });

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden backdrop-blur-sm"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`fixed inset-y-0 left-0 z-30 w-64 glass-sidebar text-white transform transition-transform duration-300 ease-in-out flex flex-col h-full lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header Area */}
        <div className="p-6 flex flex-col items-center border-b border-white/10 shrink-0">
          <div className="w-16 h-16 bg-white rounded-full p-2 mb-3 shadow-lg flex items-center justify-center">
            <img src={Logo} alt="PCU Logo" className="w-full h-full object-contain" />
          </div>
          <h2 className="text-lg font-bold tracking-wide">PCU ADMIN</h2>
          
          {/* VISUAL DEBUG: Shows what the code "thinks" the role is */}
          <div className="mt-2 text-center">
            {userRole ? (
                <span className="text-[10px] bg-green-500/20 text-green-200 px-2 py-0.5 rounded uppercase tracking-widest border border-green-500/30">
                    {userRole}
                </span>
            ) : (
                <span className="text-[10px] bg-red-500/20 text-red-200 px-2 py-0.5 rounded uppercase tracking-widest border border-red-500/30">
                    No Role Detect
                </span>
            )}
          </div>
        </div>

        {/* Navigation Area */}
        <nav className="flex-1 overflow-y-auto custom-sidebar-scrollbar p-4 space-y-2">
          {allowedMenuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => window.innerWidth < 1024 && toggleSidebar()}
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group text-sm font-medium
                ${isActive 
                  ? 'bg-white text-pcu-purple shadow-lg translate-x-1' 
                  : 'text-gray-300 hover:bg-white/10 hover:text-white hover:translate-x-1'}
              `}
            >
              <item.icon className="text-lg shrink-0" />
              <span className="truncate">{item.name}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer Area */}
        <div className="p-4 border-t border-white/10 bg-pcu-purple-dark/30 shrink-0">
          <button 
            onClick={() => setIsLogoutModalOpen(true)}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-red-300 hover:bg-red-500/20 hover:text-white transition-all duration-200 group"
          >
            <IoLogOutOutline className="text-xl group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Confirmation Modal */}
      <ConfirmModal 
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleLogoutConfirm}
        title="Sign Out?"
        message="Are you sure you want to end your current session?"
        isLoading={isLoggingOut}
      />
    </>
  );
};

export default Sidebar;