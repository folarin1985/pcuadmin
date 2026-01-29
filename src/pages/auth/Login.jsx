import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import Logo from '../../assets/images/pculogo.png';
import Button from '../../components/common/Button';
import { IoMailOutline, IoLockClosedOutline } from 'react-icons/io5';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsSubmitting(true);
    const success = await login(email, password);
    setIsSubmitting(false);

    if (success) {
      navigate('/admin/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pcu-purple-dark via-pcu-purple to-pcu-red/80 overflow-hidden relative">
      
      {/* Background Decorative Blobs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-pcu-red/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-pcu-purple-light/20 rounded-full blur-3xl translate-x-1/3 translate-y-1/3"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md p-1 relative z-10"
      >
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl overflow-hidden">
          <div className="p-8 md:p-10">
            
            {/* Logo Section */}
            <div className="text-center mb-8">
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-24 h-24 bg-white rounded-full mx-auto p-3 shadow-lg mb-4 flex items-center justify-center"
              >
                <img src={Logo} alt="PCU Logo" className="w-full h-full object-contain" />
              </motion.div>
              <h1 className="text-2xl font-bold text-white tracking-wide">Admin Portal</h1>
              <p className="text-white/70 text-sm mt-1">Sign in to manage the university website</p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              
              <div className="relative group">
                <IoMailOutline className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 group-focus-within:text-white transition-colors text-xl" />
                <input 
                  type="email" 
                  placeholder="Email Address"
                  className="w-full pl-12 pr-4 py-3.5 bg-black/20 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:bg-black/30 focus:border-white/30 transition-all"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="relative group">
                <IoLockClosedOutline className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 group-focus-within:text-white transition-colors text-xl" />
                <input 
                  type="password" 
                  placeholder="Password"
                  className="w-full pl-12 pr-4 py-3.5 bg-black/20 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:bg-black/30 focus:border-white/30 transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="pt-2">
                <Button 
                  type="submit" 
                  isLoading={isSubmitting} 
                  className="w-full py-4 text-lg font-semibold shadow-lg shadow-pcu-red/20 !bg-gradient-to-r !from-pcu-red !to-pink-600 hover:!to-pcu-red"
                >
                  Access Dashboard
                </Button>
              </div>

            </form>
          </div>
          
          {/* Footer */}
          <div className="bg-black/20 p-4 text-center">
            <p className="text-white/40 text-xs">
              &copy; {new Date().getFullYear()} Precious Cornerstone University.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;