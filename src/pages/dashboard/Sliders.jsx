import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import DataTable from 'react-data-table-component';
import { toast } from 'react-hot-toast';
import { 
  IoAdd, IoPencil, IoTrash, IoImageOutline, IoVideocamOutline, IoPlayCircleOutline
} from 'react-icons/io5';
import { useAuth } from '../../contexts/AuthContext';

import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import ConfirmModal from '../../components/common/ConfirmModal';
import Spinner from '../../components/common/Spinner';
import { glossyTableStyles } from '../../styles/tableStyles';

const Sliders = () => {
  const { getImageUrl } = useAuth();
  const [sliders, setSliders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Selection
  const [selectedSlider, setSelectedSlider] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  // Form Data
  const initialForm = { 
    title: '', 
    subtitle: '', 
    media_type: 'image', // 'image' or 'video'
    media_path: '', 
    cta_text: '', 
    cta_link: '', 
    order: 0,
    is_active: true
  };
  const [formData, setFormData] = useState(initialForm);

  // --- Fetch Data ---
  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/sliders');
      setSliders(response.data.data);
    } catch (error) {
      toast.error('Failed to load sliders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // --- Handlers ---
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate type based on selection
      if (formData.media_type === 'video' && !file.type.startsWith('video/')) {
          return toast.error("Please select a valid video file (MP4/WebM)");
      }
      if (formData.media_type === 'image' && !file.type.startsWith('image/')) {
          return toast.error("Please select a valid image file");
      }

      const reader = new FileReader();
      reader.onloadend = () => setFormData(prev => ({ ...prev, media_path: reader.result }));
      reader.readAsDataURL(file);
    }
  };

  const openCreateModal = () => {
    setSelectedSlider(null);
    setFormData(initialForm);
    setIsFormOpen(true);
  };

  const openEditModal = (slider) => {
    setSelectedSlider(slider);
    setFormData({ 
      title: slider.title,
      subtitle: slider.subtitle || '',
      media_type: slider.media_type,
      media_path: slider.media_path || '',
      cta_text: slider.cta_text || '',
      cta_link: slider.cta_link || '',
      order: slider.order || 0,
      is_active: Boolean(slider.is_active)
    });
    setIsFormOpen(true);
  };

  // --- CRUD ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.media_path) return toast.error("Please upload media");

    setIsSubmitting(true);
    try {
      if (selectedSlider) {
        await axios.put(`/sliders/${selectedSlider.id}`, formData);
        toast.success('Slider updated');
      } else {
        await axios.post('/sliders', formData);
        toast.success('Slider created');
      }
      setIsFormOpen(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsSubmitting(true);
    try {
      await axios.delete(`/sliders/${deleteId}`);
      toast.success('Slider deleted');
      setIsDeleteOpen(false);
      fetchData();
    } catch (error) { toast.error('Failed to delete'); } 
    finally { setIsSubmitting(false); }
  };

  const columns = [
    {
      name: 'Preview',
      width: '120px',
      cell: row => (
        <div className="w-20 h-12 rounded-lg bg-gray-100 overflow-hidden border border-gray-200 flex items-center justify-center relative">
           {row.media_type === 'image' ? (
             <img src={getImageUrl(row.media_path)} className="w-full h-full object-cover" />
           ) : (
             <>
                <video src={getImageUrl(row.media_path)} className="w-full h-full object-cover opacity-80" muted />
                <div className="absolute inset-0 flex items-center justify-center text-white"><IoPlayCircleOutline size={24} /></div>
             </>
           )}
        </div>
      )
    },
    {
      name: 'Title & Subtitle',
      selector: row => row.title,
      cell: row => (
        <div className="py-2">
            <p className="font-semibold text-gray-700">{row.title}</p>
            <p className="text-xs text-gray-500">{row.subtitle}</p>
        </div>
      ),
      grow: 2
    },
    {
      name: 'Type',
      selector: row => row.media_type,
      sortable: true,
      cell: row => (
          <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded ${row.media_type === 'video' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
              {row.media_type === 'video' ? <IoVideocamOutline/> : <IoImageOutline/>} {row.media_type}
          </span>
      )
    },
    {
      name: 'Order',
      selector: row => row.order,
      sortable: true,
      width: '80px',
      cell: row => <span className="font-mono text-xs">#{row.order}</span>
    },
    {
      name: 'Status',
      width: '100px',
      cell: row => (
          <span className={`text-xs px-2 py-1 rounded-full ${row.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              {row.is_active ? 'Active' : 'Draft'}
          </span>
      )
    },
    {
      name: 'Actions',
      cell: row => (
        <div className="flex gap-2">
          <button onClick={() => openEditModal(row)} className="p-2 text-gray-500 hover:text-pcu-purple rounded-lg"><IoPencil size={18} /></button>
          <button onClick={() => { setDeleteId(row.id); setIsDeleteOpen(true); }} className="p-2 text-gray-500 hover:text-red-500 rounded-lg"><IoTrash size={18} /></button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-2xl font-bold text-gray-800">Homepage Banners</h1>
            <p className="text-gray-500 text-sm">Manage the hero video/image slider.</p>
        </div>
        <Button onClick={openCreateModal}><IoAdd className="mr-2 text-xl" /> Add Slide</Button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <DataTable columns={columns} data={sliders} pagination progressPending={loading} customStyles={glossyTableStyles} />
      </div>

      <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={selectedSlider ? "Edit Slide" : "New Slide"} size="lg">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Headline</label>
                <input type="text" className="input-field" placeholder="e.g. Your Journey Begins Here" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
                <textarea className="input-field min-h-[80px]" placeholder="Brief description..." value={formData.subtitle} onChange={e => setFormData({...formData, subtitle: e.target.value})} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CTA Button Text</label>
                    <input type="text" className="input-field" placeholder="e.g. Apply Now" value={formData.cta_text} onChange={e => setFormData({...formData, cta_text: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CTA Link</label>
                    <input type="text" className="input-field" placeholder="/admissions" value={formData.cta_link} onChange={e => setFormData({...formData, cta_link: e.target.value})} />
                  </div>
              </div>
            </div>

            <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Media Type</label>
                    <div className="flex gap-4 mb-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="media_type" value="image" checked={formData.media_type === 'image'} onChange={() => setFormData({...formData, media_type: 'image'})} className="accent-pcu-purple" />
                            <span className="text-sm">Image</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="media_type" value="video" checked={formData.media_type === 'video'} onChange={() => setFormData({...formData, media_type: 'video'})} className="accent-pcu-purple" />
                            <span className="text-sm">Video (MP4)</span>
                        </label>
                    </div>

                    <div className="relative w-full h-40 bg-white rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center overflow-hidden hover:border-pcu-purple transition-colors group">
                        {formData.media_path ? (
                            formData.media_type === 'image' ? (
                                <img src={getImageUrl(formData.media_path)} className="w-full h-full object-cover" />
                            ) : (
                                <video src={getImageUrl(formData.media_path)} className="w-full h-full object-cover" muted autoPlay loop />
                            )
                        ) : (
                            <div className="text-center text-gray-400">
                                {formData.media_type === 'image' ? <IoImageOutline size={32} className="mx-auto mb-1"/> : <IoVideocamOutline size={32} className="mx-auto mb-1"/>}
                                <span className="text-xs">Click to upload</span>
                            </div>
                        )}
                        <input 
                            type="file" 
                            className="absolute inset-0 opacity-0 cursor-pointer" 
                            accept={formData.media_type === 'image' ? "image/*" : "video/*"}
                            onChange={handleFileChange} 
                        />
                    </div>
                </div>

                <div className="flex gap-4">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
                        <input type="number" className="input-field" value={formData.order} onChange={e => setFormData({...formData, order: e.target.value})} />
                    </div>
                    <div className="flex-1 flex items-end mb-2">
                        <label className="flex items-center gap-2 cursor-pointer bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm w-full">
                            <input type="checkbox" className="accent-pcu-purple w-4 h-4" checked={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.checked})} />
                            <span className="text-sm font-medium text-gray-700">Active?</span>
                        </label>
                    </div>
                </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
            <Button variant="secondary" onClick={() => setIsFormOpen(false)}>Cancel</Button>
            <Button type="submit" isLoading={isSubmitting}>Save Slide</Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} onConfirm={handleDelete} title="Delete Slide?" message="This will remove the banner from the homepage." isLoading={isSubmitting} />
    </div>
  );
};

export default Sliders;