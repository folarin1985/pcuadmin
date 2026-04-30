// pages/dashboard/GoverningCouncil.jsx
import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import DataTable from 'react-data-table-component';
import { toast } from 'react-hot-toast';
import { IoAdd, IoPencil, IoTrash, IoPersonOutline, IoImageOutline } from 'react-icons/io5';
import { useAuth } from '../../contexts/AuthContext';

import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import ConfirmModal from '../../components/common/ConfirmModal';
import { glossyTableStyles } from '../../styles/tableStyles';

// Manages the Governing Council data similarly to Board of Trustees
const GoverningCouncil = () => {
  const { getImageUrl } = useAuth();
  const [councils, setCouncils] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [selectedCouncil, setSelectedCouncil] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const initialForm = { name: '', position: 'Member', bio: '', image: '', order_weight: 0, is_active: true };
  const [formData, setFormData] = useState(initialForm);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/admin/governing-councils');
      setCouncils(res.data.data);
    } catch (error) { toast.error('Failed to load Governing Council'); } 
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFormData(prev => ({ ...prev, image: reader.result }));
      reader.readAsDataURL(file);
    }
  };

  const openCreateModal = () => {
    setSelectedCouncil(null);
    setFormData(initialForm);
    setIsFormOpen(true);
  };

  const openEditModal = (council) => {
    setSelectedCouncil(council);
    setFormData({ 
      name: council.name, position: council.position, bio: council.bio || '',
      image: council.image || '', order_weight: council.order_weight || 0, is_active: Boolean(council.is_active)
    });
    setIsFormOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (selectedCouncil) {
        await axios.put(`/admin/governing-councils/${selectedCouncil.id}`, formData);
        toast.success('Council Member updated');
      } else {
        await axios.post('/admin/governing-councils', formData);
        toast.success('Member added to council');
      }
      setIsFormOpen(false);
      fetchData();
    } catch (error) { toast.error('Operation failed'); } 
    finally { setIsSubmitting(false); }
  };

  const handleDelete = async () => {
    setIsSubmitting(true);
    try {
      await axios.delete(`/admin/governing-councils/${deleteId}`);
      toast.success('Member removed');
      setIsDeleteOpen(false);
      fetchData();
    } catch (error) { toast.error('Failed to delete member'); } 
    finally { setIsSubmitting(false); }
  };

  const filteredItems = useMemo(() => councils.filter(c => c.name.toLowerCase().includes(search.toLowerCase())), [councils, search]);

  const columns = [
    {
      name: 'Member', grow: 2,
      cell: row => (
        <div className="flex items-center gap-3 py-2">
          <div className="w-10 h-10 rounded-lg overflow-hidden border border-gray-200 bg-gray-100 flex-shrink-0">
             {row.image ? <img src={getImageUrl(row.image)} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full flex items-center justify-center text-gray-400"><IoPersonOutline /></div>}
          </div>
          <div><span className="font-semibold text-gray-700 block">{row.name}</span><span className="text-xs text-pcu-purple font-medium uppercase tracking-wider">{row.position}</span></div>
        </div>
      ),
    },
    { name: 'Weight', width: '100px', selector: row => row.order_weight, sortable: true, cell: row => <span className="font-mono text-xs text-gray-400">#{row.order_weight}</span> },
    { name: 'Status', width: '100px', cell: row => <span className={`text-xs px-2 py-1 rounded-full ${row.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{row.is_active ? 'Active' : 'Hidden'}</span> },
    { name: 'Actions', cell: row => (
        <div className="flex gap-2">
          <button onClick={() => openEditModal(row)} className="p-2 text-gray-500 hover:text-pcu-purple hover:bg-purple-50 rounded-lg transition-colors"><IoPencil size={18} /></button>
          <button onClick={() => { setDeleteId(row.id); setIsDeleteOpen(true); }} className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><IoTrash size={18} /></button>
        </div>
      ), ignoreRowClick: true, button: true,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div><h1 className="text-2xl font-bold text-gray-800">Governing Council</h1><p className="text-gray-500 text-sm">Manage the university's governing council members.</p></div>
        <Button onClick={openCreateModal}><IoAdd className="mr-2 text-xl" /> Add Member</Button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-end">
           <input type="text" placeholder="Search by name..." className="input-field max-w-xs py-2" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <DataTable columns={columns} data={filteredItems} pagination progressPending={loading} customStyles={glossyTableStyles} highlightOnHover />
      </div>

      <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={selectedCouncil ? "Edit Member" : "New Member"} size="lg">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label><input type="text" className="input-field" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Position</label><input type="text" className="input-field" placeholder="e.g. Chairman" value={formData.position} onChange={e => setFormData({...formData, position: e.target.value})} required /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Order Weight</label><input type="number" className="input-field" value={formData.order_weight} onChange={e => setFormData({...formData, order_weight: e.target.value})} /></div>
                <div className="flex items-end mb-2"><label className="flex items-center gap-2 cursor-pointer bg-gray-50 px-4 py-2.5 rounded-xl border border-gray-200 w-full shadow-sm"><input type="checkbox" className="accent-pcu-purple w-4 h-4" checked={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.checked})} /><span className="text-sm font-medium text-gray-700">Active?</span></label></div>
              </div>
            </div>
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Member Photo</label>
              <div className="relative w-full h-44 bg-gray-200 rounded-2xl overflow-hidden border-2 border-dashed border-gray-300 group">
                 {formData.image ? <img src={getImageUrl(formData.image)} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full flex flex-col items-center justify-center text-gray-400"><IoImageOutline size={40} /><span className="text-xs mt-2 font-medium uppercase tracking-wider">Click to upload</span></div>}
                 <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer text-white font-bold">Change Image<input type="file" className="hidden" accept="image/*" onChange={handleFileChange} /></label>
              </div>
            </div>
          </div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Biography</label><textarea className="input-field min-h-[150px]" placeholder="Profile..." value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} /></div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100"><Button variant="secondary" onClick={() => setIsFormOpen(false)}>Cancel</Button><Button type="submit" isLoading={isSubmitting}>Save Member</Button></div>
        </form>
      </Modal>

      <ConfirmModal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} onConfirm={handleDelete} title="Remove Member?" message="This will permanently delete this member." isLoading={isSubmitting} />
    </div>
  );
};
export default GoverningCouncil;