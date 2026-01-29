import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import DataTable from 'react-data-table-component';
import { toast } from 'react-hot-toast';
import { IoAdd, IoPencil, IoTrash, IoSearch, IoImageOutline, IoColorPaletteOutline } from 'react-icons/io5';
import { useAuth } from '../../contexts/AuthContext'; // Import this

import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import ConfirmModal from '../../components/common/ConfirmModal';
import Spinner from '../../components/common/Spinner';
import { glossyTableStyles } from '../../styles/tableStyles';

const Faculties = () => {
  const { getImageUrl } = useAuth(); // Get image helper
  const [faculties, setFaculties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  // Updated Form Data Structure
  const initialForm = { 
    name: '', description: '', 
    color_code: '#5c1885', // Default PCU Purple
    image_path: '', // Thumbnail
    banner_image: '', // Hero Banner
    banner_caption: '' 
  };
  const [formData, setFormData] = useState(initialForm);

  const fetchFaculties = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/faculties');
      setFaculties(response.data.data);
    } catch (error) {
      toast.error('Failed to load faculties');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaculties();
  }, []);

  const handleSearch = (e) => setSearch(e.target.value);

  // Image Handler
  const handleFileChange = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, [field]: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const openCreateModal = () => {
    setSelectedFaculty(null);
    setFormData(initialForm);
    setIsFormOpen(true);
  };

  const openEditModal = (faculty) => {
    setSelectedFaculty(faculty);
    setFormData({ 
      name: faculty.name, 
      description: faculty.description || '',
      color_code: faculty.color_code || '#5c1885',
      image_path: faculty.image_path || '',
      banner_image: faculty.banner_image || '',
      banner_caption: faculty.banner_caption || ''
    });
    setIsFormOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (selectedFaculty) {
        await axios.put(`/faculties/${selectedFaculty.id}`, formData);
        toast.success('Faculty updated successfully');
      } else {
        await axios.post('/faculties', formData);
        toast.success('Faculty created successfully');
      }
      setIsFormOpen(false);
      fetchFaculties();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsSubmitting(true);
    try {
      await axios.delete(`/faculties/${deleteId}`);
      toast.success('Faculty deleted');
      setIsDeleteOpen(false);
      fetchFaculties();
    } catch (error) {
      toast.error('Failed to delete faculty');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredItems = useMemo(() => {
    return faculties.filter(f => f.name.toLowerCase().includes(search.toLowerCase()));
  }, [faculties, search]);

  const columns = [
    {
      name: 'Faculty',
      grow: 2,
      cell: row => (
        <div className="flex items-center gap-3 py-2">
          {/* Thumbnail Preview in Table */}
          <div className="w-10 h-10 rounded-lg overflow-hidden border border-gray-200 bg-gray-100 flex-shrink-0">
             {row.image_path ? (
               <img src={getImageUrl(row.image_path)} className="w-full h-full object-cover" />
             ) : (
               <div className="w-full h-full bg-gray-200" style={{ backgroundColor: row.color_code }}></div>
             )}
          </div>
          <div>
            <span className="font-semibold text-gray-700 block">{row.name}</span>
            <span className="text-xs text-gray-400 block">{row.slug}</span>
          </div>
        </div>
      ),
    },
    {
      name: 'Color',
      width: '80px',
      cell: row => (
        <div className="w-6 h-6 rounded-full border border-gray-200 shadow-sm" style={{ backgroundColor: row.color_code }}></div>
      )
    },
    {
      name: 'Depts',
      selector: row => row.departments_count,
      sortable: true,
      cell: row => (
        <span className="bg-purple-50 text-pcu-purple px-3 py-1 rounded-full text-xs font-medium border border-purple-100">
          {row.departments_count}
        </span>
      )
    },
    {
      name: 'Actions',
      cell: row => (
        <div className="flex gap-2">
          <button onClick={() => openEditModal(row)} className="p-2 text-gray-500 hover:text-pcu-purple hover:bg-purple-50 rounded-lg"><IoPencil size={18} /></button>
          <button onClick={() => { setDeleteId(row.id); setIsDeleteOpen(true); }} className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg"><IoTrash size={18} /></button>
        </div>
      ),
      ignoreRowClick: true,
      button: true,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Faculties</h1>
        <Button onClick={openCreateModal}><IoAdd className="mr-2 text-xl" /> Add Faculty</Button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-end">
           <input type="text" placeholder="Search..." className="input-field max-w-xs py-2" value={search} onChange={handleSearch} />
        </div>
        <DataTable columns={columns} data={filteredItems} pagination progressPending={loading} customStyles={glossyTableStyles} />
      </div>

      <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={selectedFaculty ? "Edit Faculty" : "Create Faculty"} size="lg">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Col */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Faculty Name</label>
                <input type="text" className="input-field" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Brand Color</label>
                <div className="flex items-center gap-3">
                  <input 
                    type="color" 
                    className="w-12 h-12 rounded-lg border border-gray-200 cursor-pointer p-1"
                    value={formData.color_code} 
                    onChange={e => setFormData({...formData, color_code: e.target.value})} 
                  />
                  <span className="text-sm text-gray-500">{formData.color_code}</span>
                </div>
              </div>

              {/* Thumbnail Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Grid Thumbnail</label>
                <div className="flex items-center gap-4 p-3 border border-gray-200 rounded-xl bg-gray-50">
                  <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                    {formData.image_path ? <img src={getImageUrl(formData.image_path)} className="w-full h-full object-cover" /> : <div className="flex items-center justify-center h-full text-gray-400"><IoImageOutline /></div>}
                  </div>
                  <label className="cursor-pointer">
                    <span className="text-sm text-pcu-purple font-semibold">Upload Image</span>
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'image_path')} />
                  </label>
                </div>
              </div>
            </div>

            {/* Right Col */}
            <div className="space-y-4">
              {/* Banner Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Page Hero Banner</label>
                <div className="relative w-full h-32 bg-gray-200 rounded-xl overflow-hidden border border-gray-200 group">
                   {formData.banner_image ? (
                     <img src={getImageUrl(formData.banner_image)} className="w-full h-full object-cover" />
                   ) : (
                     <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                        <IoImageOutline size={24} />
                        <span className="text-xs">No Banner</span>
                     </div>
                   )}
                   <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <span className="text-white font-medium text-sm">Change Banner</span>
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'banner_image')} />
                   </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Banner Caption</label>
                <input type="text" className="input-field" placeholder="e.g. Excellence in Science" value={formData.banner_caption} onChange={e => setFormData({...formData, banner_caption: e.target.value})} />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea className="input-field min-h-[80px]" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button variant="secondary" onClick={() => setIsFormOpen(false)}>Cancel</Button>
            <Button type="submit" isLoading={isSubmitting}>Save Faculty</Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} onConfirm={handleDelete} title="Delete Faculty?" message="This cannot be undone." isLoading={isSubmitting} />
    </div>
  );
};

export default Faculties;