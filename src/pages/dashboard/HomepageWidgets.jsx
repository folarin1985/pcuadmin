import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DataTable from 'react-data-table-component';
import { toast } from 'react-hot-toast';
import { 
  IoAdd, IoPencil, IoTrash, IoPeopleOutline, IoStatsChartOutline, IoLinkOutline, IoTextOutline
} from 'react-icons/io5';

import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import ConfirmModal from '../../components/common/ConfirmModal';
import Spinner from '../../components/common/Spinner';
import { glossyTableStyles } from '../../styles/tableStyles';

const HomepageWidgets = () => {
  const [activeTab, setActiveTab] = useState('stats'); // 'audience' | 'stats'
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]); // Stores the list for current tab
  
  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Selection
  const [selectedItem, setSelectedItem] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  // Forms
  const initialAudienceForm = { label: '', target_url: '', icon: '', order: 0 };
  const initialStatForm = { label: '', value: '', icon: '', order: 0, is_visible: true };
  
  const [audienceForm, setAudienceForm] = useState(initialAudienceForm);
  const [statForm, setStatForm] = useState(initialStatForm);

  // --- Helpers ---
  const endpoint = activeTab === 'audience' ? '/audience-links' : '/stats';
  const title = activeTab === 'audience' ? 'Audience Link' : 'Impact Stat';

  // --- Fetch Data ---
  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(endpoint);
      setData(response.data.data);
    } catch (error) {
      toast.error(`Failed to load ${activeTab} data`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  // --- Handlers ---
  const openCreateModal = () => {
    setSelectedItem(null);
    if(activeTab === 'audience') setAudienceForm(initialAudienceForm);
    else setStatForm(initialStatForm);
    setIsFormOpen(true);
  };

  const openEditModal = (item) => {
    setSelectedItem(item);
    if(activeTab === 'audience') {
        setAudienceForm({
            label: item.label, target_url: item.target_url, 
            icon: item.icon || '', order: item.order
        });
    } else {
        setStatForm({
            label: item.label, value: item.value, 
            icon: item.icon || '', order: item.order, 
            is_visible: Boolean(item.is_visible)
        });
    }
    setIsFormOpen(true);
  };

  // --- CRUD ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const payload = activeTab === 'audience' ? audienceForm : statForm;
    
    try {
      if (selectedItem) {
        await axios.put(`${endpoint}/${selectedItem.id}`, payload);
        toast.success(`${title} updated`);
      } else {
        await axios.post(endpoint, payload);
        toast.success(`${title} created`);
      }
      setIsFormOpen(false);
      fetchData();
    } catch (error) {
      toast.error('Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsSubmitting(true);
    try {
      await axios.delete(`${endpoint}/${deleteId}`);
      toast.success(`${title} deleted`);
      setIsDeleteOpen(false);
      fetchData();
    } catch (error) { toast.error('Failed to delete'); } 
    finally { setIsSubmitting(false); }
  };

  // --- Columns Configuration ---
  const audienceColumns = [
      { name: 'Label', selector: row => row.label, sortable: true, cell: row => <span className="font-semibold text-gray-700">{row.label}</span> },
      { name: 'Target URL', selector: row => row.target_url, cell: row => <span className="text-xs text-blue-500">{row.target_url}</span> },
      { name: 'Order', selector: row => row.order, sortable: true, width: '80px' },
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

  const statColumns = [
      { name: 'Value', selector: row => row.value, sortable: true, cell: row => <span className="font-bold text-xl text-pcu-purple">{row.value}</span> },
      { name: 'Label', selector: row => row.label, sortable: true, cell: row => <span className="text-gray-600">{row.label}</span> },
      { name: 'Status', selector: row => row.is_visible, cell: row => <span className={`text-xs px-2 py-1 rounded ${row.is_visible ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{row.is_visible ? 'Visible' : 'Hidden'}</span> },
      { name: 'Order', selector: row => row.order, sortable: true, width: '80px' },
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
            <h1 className="text-2xl font-bold text-gray-800">Homepage Widgets</h1>
            <p className="text-gray-500 text-sm">Manage "I Am..." navigation and Impact Stats.</p>
        </div>
        <Button onClick={openCreateModal}><IoAdd className="mr-2 text-xl" /> Add {title}</Button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-gray-200">
            {/*<button onClick={() => setActiveTab('audience')} className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors border-b-2 ${activeTab === 'audience' ? 'border-pcu-purple text-pcu-purple bg-purple-50/50' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                <IoPeopleOutline className="text-lg"/> "I Am..." Navigation
            </button>*/}
            <button onClick={() => setActiveTab('stats')} className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors border-b-2 ${activeTab === 'stats' ? 'border-pcu-purple text-pcu-purple bg-purple-50/50' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                <IoStatsChartOutline className="text-lg"/> PCU By The Numbers
            </button>
        </div>

        <DataTable 
            columns={activeTab === 'stats' ? statColumns : audienceColumns} 
            data={data} 
            pagination 
            progressPending={loading} 
            progressComponent={<div className="p-10"><Spinner size="lg" color="purple" /></div>}
            customStyles={glossyTableStyles} 
        />
      </div>

      {/* --- Create/Edit Modal --- */}
      <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={selectedItem ? `Edit ${title}` : `Create ${title}`} size="sm">
        <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* AUDIENCE FORM */}
            {activeTab === 'audience' && (
                <>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Label</label>
                        <input type="text" className="input-field" value={audienceForm.label} onChange={e => setAudienceForm({...audienceForm, label: e.target.value})} placeholder="e.g. A Prospective Student" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Target URL</label>
                        <input type="text" className="input-field" value={audienceForm.target_url} onChange={e => setAudienceForm({...audienceForm, target_url: e.target.value})} placeholder="/admissions" required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Icon Class</label>
                            <input type="text" className="input-field" value={audienceForm.icon} onChange={e => setAudienceForm({...audienceForm, icon: e.target.value})} placeholder="fa-user" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
                            <input type="number" className="input-field" value={audienceForm.order} onChange={e => setAudienceForm({...audienceForm, order: e.target.value})} />
                        </div>
                    </div>
                </>
            )}

            {/* STATS FORM */}
            {activeTab === 'stats' && (
                <>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Value (Big Text)</label>
                            <input type="text" className="input-field" value={statForm.value} onChange={e => setStatForm({...statForm, value: e.target.value})} placeholder="e.g. 15+" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Label (Small Text)</label>
                            <input type="text" className="input-field" value={statForm.label} onChange={e => setStatForm({...statForm, label: e.target.value})} placeholder="e.g. Faculties" required />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Icon Class (Optional)</label>
                        <input type="text" className="input-field" value={statForm.icon} onChange={e => setStatForm({...statForm, icon: e.target.value})} placeholder="fa-university" />
                    </div>
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
                            <input type="number" className="input-field" value={statForm.order} onChange={e => setStatForm({...statForm, order: e.target.value})} />
                        </div>
                        <div className="flex-1 flex items-end mb-2">
                            <label className="flex items-center gap-2 cursor-pointer bg-gray-50 px-3 py-2 rounded-lg w-full border border-gray-200">
                                <input type="checkbox" className="accent-pcu-purple w-4 h-4" checked={statForm.is_visible} onChange={e => setStatForm({...statForm, is_visible: e.target.checked})} />
                                <span className="text-sm">Visible?</span>
                            </label>
                        </div>
                    </div>
                </>
            )}

            <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                <Button variant="secondary" onClick={() => setIsFormOpen(false)}>Cancel</Button>
                <Button type="submit" isLoading={isSubmitting}>Save</Button>
            </div>
        </form>
      </Modal>

      <ConfirmModal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} onConfirm={handleDelete} title="Delete Item?" message="This action cannot be undone." isLoading={isSubmitting} />
    </div>
  );
};

export default HomepageWidgets;