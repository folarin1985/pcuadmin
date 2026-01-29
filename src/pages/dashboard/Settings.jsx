import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { 
  IoSaveOutline, IoImagesOutline, IoCallOutline, IoShareSocialOutline, IoMegaphoneOutline, IoCloudUploadOutline
} from 'react-icons/io5';
import { useAuth } from '../../contexts/AuthContext';

import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';

const Settings = () => {
  const { getImageUrl } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  // General Settings State
  const [settings, setSettings] = useState({
    site_name: '',
    site_description: '',
    site_logo_header: '',
    site_logo_footer: '',
    site_favicon: '',
    contact_email: '',
    contact_phone: '',
    contact_address: '',
    social_facebook: '',
    social_twitter: '',
    social_instagram: '',
    social_linkedin: ''
  });

  // Alert State
  const [alertData, setAlertData] = useState({
    message: '', link_text: '', link_url: '', type: 'info', is_active: false, id: null
  });

  // --- Fetch Data ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // 1. Fetch Settings
        const settingsRes = await axios.get('/settings');
        setSettings(prev => ({ ...prev, ...settingsRes.data.data }));

        // 2. Fetch Active Alert (We use the public endpoint to get the current one, or admin list)
        // Ideally, we should fetch the specific alert to edit. For now, let's fetch 'alerts' list and pick the active one.
        const alertsRes = await axios.get('/alerts');
        const active = alertsRes.data.data.find(a => a.is_active);
        if (active) {
            setAlertData({ ...active, id: active.id });
        }
      } catch (error) {
        toast.error('Failed to load settings');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // --- Handlers ---
  const handleSettingChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e, key) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettings(prev => ({ ...prev, [key]: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAlertChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAlertData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
    }));
  };

  // --- Save Operations ---
  const saveSettings = async () => {
    setIsSubmitting(true);
    try {
      await axios.post('/settings', settings);
      toast.success('Site settings updated');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setIsSubmitting(false);
    }
  };

  const saveAlert = async () => {
    setIsSubmitting(true);
    try {
        if (alertData.id) {
            await axios.put(`/alerts/${alertData.id}`, alertData);
        } else {
            const res = await axios.post('/alerts', alertData);
            setAlertData(prev => ({ ...prev, id: res.data.data.id }));
        }
        toast.success('Alert banner updated');
    } catch (error) {
        toast.error('Failed to update alert');
    } finally {
        setIsSubmitting(false);
    }
  };

  if (loading) return <div className="p-10 flex justify-center"><Spinner size="lg" color="purple"/></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Global Configuration</h1>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        
        {/* Tabs */}
        <div className="flex border-b border-gray-200 overflow-x-auto">
            {[
                { id: 'general', label: 'Branding & SEO', icon: IoImagesOutline },
                { id: 'contact', label: 'Contact Info', icon: IoCallOutline },
                { id: 'social', label: 'Social Media', icon: IoShareSocialOutline },
                //{ id: 'alert', label: 'Top Bar Alert', icon: IoMegaphoneOutline },
            ].map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                        activeTab === tab.id 
                        ? 'border-pcu-purple text-pcu-purple bg-purple-50/50' 
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                >
                    <tab.icon className="text-lg" />
                    {tab.label}
                </button>
            ))}
        </div>

        <div className="p-6 md:p-8">
            
            {/* --- TAB 1: GENERAL & BRANDING --- */}
            {activeTab === 'general' && (
                <div className="space-y-6 max-w-4xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Site Name</label>
                            <input type="text" name="site_name" className="input-field" value={settings.site_name} onChange={handleSettingChange} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Site Description (SEO)</label>
                            <input type="text" name="site_description" className="input-field" value={settings.site_description} onChange={handleSettingChange} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-gray-100">
                        {/* Header Logo */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">Header Logo</label>
                            <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 flex flex-col items-center justify-center bg-gray-50 h-40 relative group">
                                {settings.site_logo_header ? (
                                    <img src={getImageUrl(settings.site_logo_header)} className="h-full object-contain" alt="Header Logo" />
                                ) : (
                                    <span className="text-xs text-gray-400">No Logo</span>
                                )}
                                <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer rounded-xl text-white font-medium text-sm">
                                    <IoCloudUploadOutline className="mr-2"/> Upload
                                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'site_logo_header')} />
                                </label>
                            </div>
                        </div>

                        {/* Footer Logo */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">Footer Logo (White/Transparent)</label>
                            <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 flex flex-col items-center justify-center bg-gray-800 h-40 relative group">
                                {settings.site_logo_footer ? (
                                    <img src={getImageUrl(settings.site_logo_footer)} className="h-full object-contain" alt="Footer Logo" />
                                ) : (
                                    <span className="text-xs text-gray-500">No Logo</span>
                                )}
                                <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer rounded-xl text-white font-medium text-sm">
                                    <IoCloudUploadOutline className="mr-2"/> Upload
                                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'site_logo_footer')} />
                                </label>
                            </div>
                        </div>

                        {/* Favicon */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">Favicon</label>
                            <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 flex flex-col items-center justify-center bg-gray-50 h-40 relative group">
                                {settings.site_favicon ? (
                                    <img src={getImageUrl(settings.site_favicon)} className="w-16 h-16 object-contain" alt="Favicon" />
                                ) : (
                                    <span className="text-xs text-gray-400">No Icon</span>
                                )}
                                <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer rounded-xl text-white font-medium text-sm">
                                    <IoCloudUploadOutline className="mr-2"/> Upload
                                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'site_favicon')} />
                                </label>
                            </div>
                        </div>
                    </div>
                    
                    <div className="pt-4">
                        <Button onClick={saveSettings} isLoading={isSubmitting}><IoSaveOutline className="mr-2"/> Save Branding</Button>
                    </div>
                </div>
            )}

            {/* --- TAB 2: CONTACT --- */}
            {activeTab === 'contact' && (
                <div className="space-y-6 max-w-2xl">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Official Email</label>
                        <input type="email" name="contact_email" className="input-field" value={settings.contact_email} onChange={handleSettingChange} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                        <input type="text" name="contact_phone" className="input-field" value={settings.contact_phone} onChange={handleSettingChange} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Physical Address</label>
                        <textarea name="contact_address" className="input-field min-h-[100px]" value={settings.contact_address} onChange={handleSettingChange} />
                    </div>
                    <Button onClick={saveSettings} isLoading={isSubmitting}><IoSaveOutline className="mr-2"/> Save Contact Info</Button>
                </div>
            )}

            {/* --- TAB 3: SOCIAL --- */}
            {activeTab === 'social' && (
                <div className="space-y-6 max-w-2xl">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Facebook URL</label>
                        <input type="text" name="social_facebook" className="input-field" value={settings.social_facebook} onChange={handleSettingChange} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Twitter / X URL</label>
                        <input type="text" name="social_twitter" className="input-field" value={settings.social_twitter} onChange={handleSettingChange} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Instagram URL</label>
                        <input type="text" name="social_instagram" className="input-field" value={settings.social_instagram} onChange={handleSettingChange} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn URL</label>
                        <input type="text" name="social_linkedin" className="input-field" value={settings.social_linkedin} onChange={handleSettingChange} />
                    </div>
                    <Button onClick={saveSettings} isLoading={isSubmitting}><IoSaveOutline className="mr-2"/> Save Social Links</Button>
                </div>
            )}

            {/* --- TAB 4: ALERT --- */}
            {activeTab === 'alert' && (
                <div className="space-y-6 max-w-2xl">
                    <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-amber-800 text-sm mb-4">
                        This alert appears at the very top of every page on the public website. Use it for urgent announcements like "Resumption Date" or "Convocation Live Stream".
                    </div>

                    <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl border border-gray-200">
                        <span className="font-bold text-gray-700">Enable Alert Bar</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" name="is_active" className="sr-only peer" checked={alertData.is_active} onChange={handleAlertChange} />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pcu-purple"></div>
                        </label>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Alert Message</label>
                        <input type="text" name="message" className="input-field" placeholder="e.g. 2025/2026 Admission is now Open!" value={alertData.message} onChange={handleAlertChange} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Link Text (Optional)</label>
                            <input type="text" name="link_text" className="input-field" placeholder="e.g. Apply Now" value={alertData.link_text || ''} onChange={handleAlertChange} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Link URL</label>
                            <input type="text" name="link_url" className="input-field" placeholder="/admissions" value={alertData.link_url || ''} onChange={handleAlertChange} />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Alert Type (Color)</label>
                        <div className="flex gap-4">
                            {['info', 'warning', 'danger'].map(type => (
                                <label key={type} className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" name="type" value={type} checked={alertData.type === type} onChange={handleAlertChange} className="accent-pcu-purple" />
                                    <span className={`capitalize px-2 py-1 rounded text-xs font-bold ${
                                        type === 'info' ? 'bg-blue-100 text-blue-700' : 
                                        type === 'warning' ? 'bg-amber-100 text-amber-700' : 
                                        'bg-red-100 text-red-700'
                                    }`}>{type}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <Button onClick={saveAlert} isLoading={isSubmitting} variant="primary"><IoSaveOutline className="mr-2"/> Update Alert</Button>
                </div>
            )}

        </div>
      </div>
    </div>
  );
};

export default Settings;