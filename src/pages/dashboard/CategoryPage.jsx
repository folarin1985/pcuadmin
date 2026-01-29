import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import DataTable from 'react-data-table-component';
import { toast } from 'react-hot-toast';
import { 
  IoAdd, IoPencil, IoTrash, IoSearch, IoNewspaperOutline, IoCalendarOutline, IoPricetagsOutline
} from 'react-icons/io5';

import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import ConfirmModal from '../../components/common/ConfirmModal';
import Spinner from '../../components/common/Spinner';
import { glossyTableStyles } from '../../styles/tableStyles';

const CategoryPage = () => {
  // --- States ---
  const [activeTab, setActiveTab] = useState('post'); // 'post' | 'event'
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Selection
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  // Form Data
  const [name, setName] = useState('');

  // --- Dynamic Endpoint Logic ---
  const endpoint = activeTab === 'post' ? '/categories' : '/event-categories';
  const title = activeTab === 'post' ? 'News Categories' : 'Event Categories';

  // --- Fetch Data ---
  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(endpoint);
      setCategories(response.data.data);
    } catch (error) {
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch when tab changes
  useEffect(() => {
    setSearch(''); // Clear search on tab switch
    fetchData();
  }, [activeTab]);

  // --- Handlers ---
  const handleSearch = (e) => setSearch(e.target.value);

  const openCreateModal = () => {
    setSelectedCategory(null);
    setName('');
    setIsFormOpen(true);
  };

  const openEditModal = (category) => {
    setSelectedCategory(category);
    setName(category.name);
    setIsFormOpen(true);
  };

  // --- CRUD Operations ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (selectedCategory) {
        await axios.put(`${endpoint}/${selectedCategory.id}`, { name });
        toast.success('Category updated');
      } else {
        await axios.post(endpoint, { name });
        toast.success('Category created');
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
      await axios.delete(`${endpoint}/${deleteId}`);
      toast.success('Category deleted');
      setIsDeleteOpen(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete category');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Table Config ---
  const filteredItems = useMemo(() => {
    return categories.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
  }, [categories, search]);

  const columns = [
    {
      name: 'Name',
      selector: row => row.name,
      sortable: true,
      cell: row => <span className="font-semibold text-gray-700">{row.name}</span>,
      grow: 2,
    },
    {
      name: 'Slug',
      selector: row => row.slug,
      sortable: true,
      cell: row => <span className="text-gray-500 text-xs font-mono bg-gray-100 px-2 py-1 rounded">{row.slug}</span>
    },
    {
      name: 'Created',
      selector: row => row.created_at,
      sortable: true,
      cell: row => <span className="text-xs text-gray-400">{new Date(row.created_at).toLocaleDateString()}</span>
    },
    {
      name: 'Actions',
      cell: row => (
        <div className="flex gap-2">
          <button onClick={() => openEditModal(row)} className="p-2 text-gray-500 hover:text-pcu-purple hover:bg-purple-50 rounded-lg transition-colors">
            <IoPencil size={18} />
          </button>
          <button onClick={() => { setDeleteId(row.id); setIsDeleteOpen(true); }} className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
            <IoTrash size={18} />
          </button>
        </div>
      ),
      ignoreRowClick: true,
      button: true,
    },
  ];

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Category Manager</h1>
          <p className="text-gray-500 text-sm">Organize posts and events.</p>
        </div>
        <Button onClick={openCreateModal}>
          <IoAdd className="mr-2 text-xl" /> New {activeTab === 'post' ? 'Post' : 'Event'} Category
        </Button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        
        {/* Tabs & Search Toolbar */}
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row justify-between gap-4">
          
          {/* Tabs */}
          <div className="flex bg-gray-200/50 p-1 rounded-xl w-fit">
            <button 
              onClick={() => setActiveTab('post')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'post' ? 'bg-white text-pcu-purple shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <IoNewspaperOutline /> News Categories
            </button>
            <button 
              onClick={() => setActiveTab('event')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'event' ? 'bg-white text-pcu-purple shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <IoCalendarOutline /> Event Categories
            </button>
          </div>

          {/* Search */}
          <div className="w-full md:w-64">
            <input 
              type="text" 
              placeholder={`Search ${activeTab} categories...`} 
              className="input-field py-2"
              value={search}
              onChange={handleSearch}
            />
          </div>
        </div>

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={filteredItems}
          pagination
          progressPending={loading}
          progressComponent={<div className="p-10"><Spinner size="lg" color="purple" /></div>}
          customStyles={glossyTableStyles}
          highlightOnHover
        />
      </div>

      {/* --- Create/Edit Modal --- */}
      <Modal 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)} 
        title={selectedCategory ? `Edit ${title}` : `Create ${title}`} 
        size="sm"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category Name</label>
            <input 
              type="text" 
              className="input-field" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              placeholder="e.g. Sports, Convocation, General" 
              required 
            />
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
            <Button variant="secondary" onClick={() => setIsFormOpen(false)}>Cancel</Button>
            <Button type="submit" isLoading={isSubmitting}>Save Category</Button>
          </div>
        </form>
      </Modal>

      {/* --- Delete Modal --- */}
      <ConfirmModal 
        isOpen={isDeleteOpen} 
        onClose={() => setIsDeleteOpen(false)} 
        onConfirm={handleDelete} 
        title="Delete Category?" 
        message="Items attached to this category might become uncategorized." 
        isLoading={isSubmitting} 
      />
    </div>
  );
};

export default CategoryPage;