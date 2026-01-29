import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import DataTable from 'react-data-table-component';
import { toast } from 'react-hot-toast';
import { 
  IoAdd, IoPencil, IoTrash, IoSearch, IoBusinessOutline, IoRefresh, IoArrowUndo, IoImageOutline
} from 'react-icons/io5';
import { useAuth } from '../../contexts/AuthContext';

import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import ConfirmModal from '../../components/common/ConfirmModal';
import Spinner from '../../components/common/Spinner';
import { glossyTableStyles } from '../../styles/tableStyles';

const Departments = () => {
  // --- Hooks & Context ---
  const { getImageUrl } = useAuth();

  // --- States ---
  const [departments, setDepartments] = useState([]);
  const [faculties, setFaculties] = useState([]); 
  const [trashItems, setTrashItems] = useState([]); 
  
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isTrashOpen, setIsTrashOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Selection
  const [selectedDept, setSelectedDept] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [restoringId, setRestoringId] = useState(null);

  // Form Data
  const initialForm = { 
    name: '', 
    description: '', 
    faculty_id: '',
    banner_image: '',
    banner_caption: ''
  };
  const [formData, setFormData] = useState(initialForm);

  // --- Fetch Data ---
  const fetchData = async () => {
    try {
      setLoading(true);
      const [deptRes, facRes] = await Promise.all([
        axios.get('/departments'),
        axios.get('/faculties')
      ]);
      setDepartments(deptRes.data.data);
      setFaculties(facRes.data.data);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchTrash = async () => {
    try {
      const res = await axios.get('/admin/departments/trash');
      setTrashItems(res.data.data);
    } catch (error) {
      toast.error('Failed to load trash bin');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- Handlers ---
  const handleSearch = (e) => setSearch(e.target.value);

  // Image Uploader
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, banner_image: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const openCreateModal = () => {
    setSelectedDept(null);
    setFormData(initialForm);
    setIsFormOpen(true);
  };

  const openEditModal = (dept) => {
    setSelectedDept(dept);
    setFormData({ 
      name: dept.name, 
      description: dept.description || '',
      faculty_id: dept.faculty_id,
      banner_image: dept.banner_image || '',
      banner_caption: dept.banner_caption || ''
    });
    setIsFormOpen(true);
  };

  const openTrashModal = () => {
    fetchTrash();
    setIsTrashOpen(true);
  };

  // --- CRUD Operations ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.faculty_id) {
      toast.error('Please select a faculty');
      return;
    }

    setIsSubmitting(true);
    try {
      if (selectedDept) {
        await axios.put(`/departments/${selectedDept.id}`, formData);
        toast.success('Department updated');
      } else {
        await axios.post('/departments', formData);
        toast.success('Department created');
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
      await axios.delete(`/departments/${deleteId}`);
      toast.success('Department moved to trash');
      setIsDeleteOpen(false);
      fetchData();
    } catch (error) {
      toast.error('Failed to delete department');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRestore = async (id) => {
    setRestoringId(id);
    try {
      await axios.post(`/admin/departments/${id}/restore`);
      toast.success('Department restored');
      fetchTrash(); // Refresh trash list
      fetchData(); // Refresh main list
    } catch (error) {
      toast.error('Failed to restore item');
    } finally {
      setRestoringId(null);
    }
  };

  // --- Table Config ---
  const filteredItems = useMemo(() => {
    return departments.filter(d => 
      d.name.toLowerCase().includes(search.toLowerCase()) || 
      d.faculty?.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [departments, search]);

  const columns = [
    {
      name: 'Department',
      selector: row => row.name,
      sortable: true,
      cell: row => (
        <div className="py-2">
          <p className="font-semibold text-gray-700">{row.name}</p>
          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-md mt-1 inline-block">
            {row.faculty?.name || 'No Faculty'}
          </span>
        </div>
      ),
      grow: 2,
    },
    {
      name: 'Banner',
      cell: row => (
        row.banner_image ? (
          <div className="w-16 h-8 rounded-md overflow-hidden border border-gray-200">
             <img src={getImageUrl(row.banner_image)} alt="Banner" className="w-full h-full object-cover" />
          </div>
        ) : <span className="text-xs text-gray-400">None</span>
      )
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Departments</h1>
          <p className="text-gray-500 text-sm">Manage academic departments under faculties.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={openTrashModal}>
            <IoTrash className="mr-2" />
            Recycle Bin
          </Button>
          <Button onClick={openCreateModal}>
            <IoAdd className="mr-2 text-xl" />
            Add Department
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-end">
          <div className="relative w-full md:w-64">
            <IoSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search departments..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:border-pcu-purple outline-none text-sm"
              value={search}
              onChange={handleSearch}
            />
          </div>
        </div>

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
      <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={selectedDept ? "Edit Department" : "New Department"} size="lg">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Left Column: Details */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Parent Faculty</label>
                <div className="relative">
                  <select 
                    className="input-field appearance-none"
                    value={formData.faculty_id}
                    onChange={e => setFormData({...formData, faculty_id: e.target.value})}
                    required
                  >
                    <option value="">Select Faculty...</option>
                    {faculties.map(fac => (
                      <option key={fac.id} value={fac.id}>{fac.name}</option>
                    ))}
                  </select>
                  <IoBusinessOutline className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department Name</label>
                <input 
                  type="text" className="input-field" 
                  value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea 
                  className="input-field min-h-[100px]" 
                  value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>
            </div>

            {/* Right Column: Banner Image */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department Page Banner</label>
                <div className="relative w-full h-40 bg-gray-200 rounded-xl overflow-hidden border border-gray-200 group">
                   {formData.banner_image ? (
                     <img src={getImageUrl(formData.banner_image)} className="w-full h-full object-cover" />
                   ) : (
                     <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                        <IoImageOutline size={32} />
                        <span className="text-sm mt-2">No Banner Selected</span>
                     </div>
                   )}
                   <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <span className="text-white font-medium flex items-center gap-2">
                        <IoImageOutline /> Upload Banner
                      </span>
                      <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                   </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Banner Caption</label>
                <input 
                  type="text" className="input-field" placeholder="e.g. Innovating the Future"
                  value={formData.banner_caption} 
                  onChange={e => setFormData({...formData, banner_caption: e.target.value})}
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
            <Button variant="secondary" onClick={() => setIsFormOpen(false)}>Cancel</Button>
            <Button type="submit" isLoading={isSubmitting}>Save Department</Button>
          </div>
        </form>
      </Modal>

      {/* --- Recycle Bin Modal --- */}
      <Modal isOpen={isTrashOpen} onClose={() => setIsTrashOpen(false)} title="Recycle Bin">
        <div className="space-y-4">
          {trashItems.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <IoTrash className="mx-auto text-4xl mb-2 opacity-20" />
              <p>No deleted departments found.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {trashItems.map(item => (
                <div key={item.id} className="py-3 flex items-center justify-between group">
                  <div>
                    <p className="font-medium text-gray-800">{item.name}</p>
                    <p className="text-xs text-gray-500">Deleted: {new Date(item.deleted_at).toLocaleDateString()}</p>
                  </div>
                  <button 
                    onClick={() => handleRestore(item.id)}
                    disabled={restoringId === item.id}
                    className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-all duration-200 ${
                        restoringId === item.id 
                            ? 'bg-gray-100 text-gray-400 cursor-wait' 
                            : 'bg-green-50 text-green-700 hover:bg-green-100'
                    }`}
                  >
                     {restoringId === item.id ? (
                      <>
                        <Spinner size="sm" color="purple" /> 
                        <span>Restoring...</span>
                      </>
                     ) : (
                      <>
                        <IoArrowUndo /> Restore
                      </>
                     )}
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="pt-4 border-t border-gray-100 flex justify-end">
             <Button variant="secondary" onClick={() => setIsTrashOpen(false)}>Close</Button>
          </div>
        </div>
      </Modal>

      {/* --- Delete Confirmation --- */}
      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Department?"
        message="This will move the department to the Recycle Bin. You can restore it later."
        isLoading={isSubmitting}
      />
    </div>
  );
};

export default Departments;