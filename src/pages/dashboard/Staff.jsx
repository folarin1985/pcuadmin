import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import DataTable from 'react-data-table-component';
import { toast } from 'react-hot-toast';
import { 
  IoAdd, IoPencil, IoTrash, IoPerson, IoArrowUndo
} from 'react-icons/io5';
import { useAuth } from '../../contexts/AuthContext';

import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import ConfirmModal from '../../components/common/ConfirmModal';
import Spinner from '../../components/common/Spinner';
import { glossyTableStyles } from '../../styles/tableStyles';

const Staff = () => {
  const { getImageUrl } = useAuth();
  const [staffList, setStaffList] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [trashItems, setTrashItems] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('academic'); 
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isTrashOpen, setIsTrashOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [restoringId, setRestoringId] = useState(null);

  const initialForm = { 
    first_name: '', last_name: '', title: '', 
    position: '', email: '', staff_type: 'academic', 
    department_id: '', bio: '', profile_image: '',
    order: 100 
  };
  const [formData, setFormData] = useState(initialForm);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [staffRes, deptRes] = await Promise.all([
        axios.get('/staff'),
        axios.get('/departments')
      ]);
      setStaffList(staffRes.data.data);
      setDepartments(deptRes.data.data);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchTrash = async () => {
    try {
      const res = await axios.get('/admin/staff/trash');
      setTrashItems(res.data.data);
    } catch (error) {
      toast.error('Failed to load trash bin');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSearch = (e) => setSearch(e.target.value);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, profile_image: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const openCreateModal = () => {
    setSelectedStaff(null);
    setFormData(initialForm);
    setIsFormOpen(true);
  };

  const openEditModal = (staff) => {
    setSelectedStaff(staff);
    setFormData({ 
      first_name: staff.first_name,
      last_name: staff.last_name,
      title: staff.title || '',
      position: staff.position,
      email: staff.email || '',
      staff_type: staff.staff_type,
      department_id: staff.department_id || '',
      bio: staff.bio || '',
      profile_image: staff.profile_image || '',
      order: staff.order || 100
    });
    setIsFormOpen(true);
  };

  const openTrashModal = () => {
    fetchTrash();
    setIsTrashOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (selectedStaff) {
        await axios.put(`/staff/${selectedStaff.id}`, formData);
        toast.success('Staff updated');
      } else {
        await axios.post('/staff', formData);
        toast.success('Staff created');
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
      await axios.delete(`/staff/${deleteId}`);
      toast.success('Moved to Recycle Bin');
      setIsDeleteOpen(false);
      fetchData();
    } catch (error) {
      toast.error('Failed to delete staff');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRestore = async (id) => {
    setRestoringId(id);
    try {
      await axios.post(`/admin/staff/${id}/restore`);
      toast.success('Staff restored');
      fetchTrash(); 
      fetchData(); 
    } catch (error) {
      toast.error('Failed to restore');
    } finally {
      setRestoringId(null);
    }
  };

  const filteredItems = useMemo(() => {
    return staffList.filter(s => {
      if (activeTab === 'academic' && s.staff_type !== 'academic') return false;
      if (activeTab === 'management' && s.staff_type === 'academic') return false;
      const searchLower = search.toLowerCase();
      return (
        s.first_name.toLowerCase().includes(searchLower) || 
        s.last_name.toLowerCase().includes(searchLower) ||
        s.position.toLowerCase().includes(searchLower)
      );
    });
  }, [staffList, search, activeTab]);

  const columns = [
    {
      name: 'Profile',
      width: '80px',
      cell: row => (
        <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-200 bg-gray-100">
          {row.profile_image ? (
            <img src={getImageUrl(row.profile_image)} alt="profile" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400"><IoPerson /></div>
          )}
        </div>
      )
    },
    {
      name: 'Name & Position',
      selector: row => row.last_name,
      sortable: true,
      cell: row => (
        <div className="py-2">
          <p className="font-semibold text-gray-700">{row.title} {row.first_name} {row.last_name}</p>
          <p className="text-xs text-gray-500">{row.position}</p>
        </div>
      ),
      grow: 2,
    },
    {
      name: 'Department',
      selector: row => row.department?.name,
      sortable: true,
      cell: row => (
        <span className="text-sm text-gray-600">
          {row.department?.name || '-'}
        </span>
      )
    },
    {
      name: 'Type',
      selector: row => row.staff_type,
      sortable: true,
      cell: row => (
        <span className={`px-2 py-1 rounded-full text-xs capitalize ${
          row.staff_type === 'management' ? 'bg-purple-100 text-purple-700' :
          row.staff_type === 'administrative' ? 'bg-blue-50 text-blue-700' :
          'bg-gray-100 text-gray-600'
        }`}>
          {row.staff_type}
        </span>
      )
    },
    {
      name: 'Order',
      selector: row => row.order,
      sortable: true,
      width: '80px',
      cell: row => <span className="text-gray-400 font-mono text-xs">#{row.order}</span>
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Staff Directory</h1>
          <p className="text-gray-500 text-sm">Manage Principal Officers, Academic & Non-Academic Staff.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={openTrashModal}>
            <IoTrash className="mr-2" /> Recycle Bin
          </Button>
          <Button onClick={openCreateModal}>
            <IoAdd className="mr-2 text-xl" /> Add Staff Member
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row justify-between gap-4">
          <div className="flex bg-gray-200/50 p-1 rounded-xl w-fit">
            <button 
              onClick={() => setActiveTab('academic')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'academic' ? 'bg-white text-pcu-purple shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Academic Staff
            </button>
            <button 
              onClick={() => setActiveTab('management')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'management' ? 'bg-white text-pcu-purple shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Management & Admin
            </button>
          </div>

          <div className="w-full md:w-64">
            <input 
              type="text" placeholder="Search staff..." className="input-field py-2"
              value={search} onChange={handleSearch}
            />
          </div>
        </div>

        <DataTable columns={columns} data={filteredItems} pagination progressPending={loading} customStyles={glossyTableStyles} />
      </div>

      <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={selectedStaff ? "Edit Profile" : "New Staff Member"} size="lg">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-xl hover:bg-gray-50 transition-colors bg-gray-50/30">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 mb-3 shadow-md border-2 border-white">
                  {formData.profile_image ? (
                    <img src={getImageUrl(formData.profile_image)} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400"><IoPerson size={40} /></div>
                  )}
                </div>
                <label className="cursor-pointer">
                  <span className="text-sm text-pcu-purple font-semibold hover:underline">Upload Photo</span>
                  <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role / Type</label>
                <select 
                  className="input-field" 
                  value={formData.staff_type}
                  onChange={e => setFormData({...formData, staff_type: e.target.value})}
                >
                  <option value="academic">Academic Staff</option>
                  <option value="administrative">Administrative Staff</option>
                  <option value="management">Principal Officer / Management</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
                <input 
                  type="number" className="input-field"
                  placeholder="Lower numbers appear first (e.g. 1)"
                  value={formData.order} onChange={e => setFormData({...formData, order: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <select 
                  className="input-field" 
                  value={formData.department_id}
                  onChange={e => setFormData({...formData, department_id: e.target.value})}
                >
                  <option value="">No Department (or General)</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <select 
                    className="input-field px-2" 
                    value={formData.title} 
                    onChange={e => setFormData({...formData, title: e.target.value})}
                  >
                    <option value="">-</option>
                    <option value="Dr.">Dr.</option>
                    <option value="Prof.">Prof.</option>
                    <option value="Mr.">Mr.</option>
                    <option value="Mrs.">Mrs.</option>
                    <option value="Ms.">Ms.</option>
                    <option value="Engr.">Engr.</option>
                    <option value="Rev.">Rev.</option>
                    <option value="Very Rev.">Very Rev.</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input 
                    type="text" className="input-field" required
                    value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                <input 
                  type="text" className="input-field" required
                  value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Position / Job Title</label>
                <input 
                  type="text" className="input-field" placeholder="e.g. Senior Lecturer, Dean" required
                  value={formData.position} onChange={e => setFormData({...formData, position: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input 
                  type="email" className="input-field"
                  value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                />
              </div>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Biography</label>
            <textarea 
              className="input-field min-h-[100px]" placeholder="Brief professional biography..."
              value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})}
            />
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
            <Button variant="secondary" onClick={() => setIsFormOpen(false)}>Cancel</Button>
            <Button type="submit" isLoading={isSubmitting}>Save Profile</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isTrashOpen} onClose={() => setIsTrashOpen(false)} title="Recycle Bin">
        <div className="space-y-4">
          {trashItems.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <IoTrash className="mx-auto text-4xl mb-2 opacity-20" />
              <p>No deleted staff found.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {trashItems.map(item => (
                <div key={item.id} className="py-3 flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden">
                       {item.profile_image ? <img src={getImageUrl(item.profile_image)} className="w-full h-full object-cover" /> : null}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{item.first_name} {item.last_name}</p>
                      <p className="text-xs text-gray-500">Role: {item.staff_type}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleRestore(item.id)}
                    disabled={restoringId === item.id}
                    className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-all ${
                        restoringId === item.id 
                            ? 'bg-gray-100 text-gray-400' 
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
          <div className="flex justify-end pt-4"><Button variant="secondary" onClick={() => setIsTrashOpen(false)}>Close</Button></div>
        </div>
      </Modal>

      <ConfirmModal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} onConfirm={handleDelete} title="Remove Staff?" message="Move to Recycle Bin?" isLoading={isSubmitting} />
    </div>
  );
};

export default Staff;