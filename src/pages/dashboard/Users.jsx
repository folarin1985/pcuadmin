import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import DataTable from 'react-data-table-component';
import { toast } from 'react-hot-toast';
import { 
  IoAdd, IoPencil, IoTrash, IoPersonOutline, IoShieldCheckmarkOutline, 
  IoKeyOutline, IoRibbonOutline, IoPeopleOutline, IoAlertCircleOutline, IoMailOutline
} from 'react-icons/io5';
import { useAuth } from '../../contexts/AuthContext';

import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import ConfirmModal from '../../components/common/ConfirmModal';
import Spinner from '../../components/common/Spinner';
import { glossyTableStyles } from '../../styles/tableStyles';

const Users = () => {
  const { user: currentUser } = useAuth();
  
  // --- States ---
  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'roles'
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modals
  const [isUserFormOpen, setIsUserFormOpen] = useState(false);
  const [isRoleFormOpen, setIsRoleFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Selection
  const [selectedItem, setSelectedItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState({ id: null, type: 'user' });
  const [isResending, setIsResending] = useState(null); // ID of user being reset

  // Forms
  const [userForm, setUserForm] = useState({ name: '', email: '', password: '', role: '' });
  const [roleForm, setRoleForm] = useState({ name: '' });

  // Predefined System Roles for Quick Select
  const systemRoles = [
      { label: 'Super Admin (Full Access)', value: 'Super Admin' },
      { label: 'Content Editor (News & Pages)', value: 'Content Editor' },
      { label: 'Event Manager (Events & Calendar)', value: 'Event Manager' },
      { label: 'Academic Admin (Faculties & Courses)', value: 'Academic Admin' },
      { label: 'Staff Manager (Directory & HR)', value: 'Staff Manager' },
  ];

  // --- Fetch Data (Robust) ---
  const fetchData = async () => {
    setLoading(true);
    try {
      // Parallel fetch, catching errors individually so one failure doesn't break the page
      const [usersRes, rolesRes] = await Promise.allSettled([
          axios.get('/users'),
          axios.get('/roles')
      ]);

      if (usersRes.status === 'fulfilled') {
          setUsers(Array.isArray(usersRes.value.data.data) ? usersRes.value.data.data : []);
      }
      
      if (rolesRes.status === 'fulfilled') {
          setRoles(Array.isArray(rolesRes.value.data.data) ? rolesRes.value.data.data : []);
      }

    } catch (error) {
      toast.error('Network error. Please check connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // --- Handlers ---
  const handleSearch = (e) => setSearch(e.target.value);

  // --- User Logic ---
  const openUserCreate = () => {
      setSelectedItem(null);
      // Default to first role if available
      const defaultRole = roles.length > 0 ? roles[0].slug : '';
      setUserForm({ name: '', email: '', password: '', role: defaultRole });
      setIsUserFormOpen(true);
  };

  const openUserEdit = (user) => {
      setSelectedItem(user);
      // Extract first role slug if exists
      const userRole = user.roles && user.roles.length > 0 ? user.roles[0].slug : '';
      setUserForm({ 
          name: user.name, 
          email: user.email, 
          role: userRole, 
          password: '' 
      });
      setIsUserFormOpen(true);
  };

  const handleUserSubmit = async (e) => {
      e.preventDefault();
      setIsSubmitting(true);
      try {
          const payload = { ...userForm };
          if (!payload.password) delete payload.password; // Don't send empty pwd on update

          if (selectedItem) {
              await axios.put(`/users/${selectedItem.id}`, payload);
              toast.success('User updated');
          } else {
              await axios.post('/users', payload);
              toast.success('User created & credentials emailed');
          }
          setIsUserFormOpen(false);
          fetchData();
      } catch (e) { toast.error(e.response?.data?.message || 'Operation failed'); }
      finally { setIsSubmitting(false); }
  };

  const handleResendLogin = async (id) => {
      if(!confirm("This will reset the user's password and email them a new one. Continue?")) return;
      
      setIsResending(id);
      try {
          await axios.post(`/users/${id}/resend-login`);
          toast.success('New credentials sent to user email');
      } catch (error) {
          toast.error('Failed to send email');
      } finally {
          setIsResending(null);
      }
  };

  // --- Role Logic ---
  const openRoleCreate = () => {
      setSelectedItem(null);
      setRoleForm({ name: '' });
      setIsRoleFormOpen(true);
  };

  const openRoleEdit = (role) => {
      setSelectedItem(role);
      setRoleForm({ name: role.name });
      setIsRoleFormOpen(true);
  };

  const handleRoleSelectHelper = (e) => {
      setRoleForm({ name: e.target.value });
  };

  const handleRoleSubmit = async (e) => {
      e.preventDefault();
      setIsSubmitting(true);
      try {
          if (selectedItem) {
              await axios.put(`/roles/${selectedItem.id}`, roleForm);
              toast.success('Role updated');
          } else {
              await axios.post('/roles', roleForm);
              toast.success('Role created');
          }
          setIsRoleFormOpen(false);
          fetchData();
      } catch (e) { toast.error(e.response?.data?.message || 'Operation failed'); }
      finally { setIsSubmitting(false); }
  };

  // --- Delete Logic ---
  const handleDelete = async () => {
      setIsSubmitting(true);
      try {
          const endpoint = deleteTarget.type === 'user' ? `/users/${deleteTarget.id}` : `/roles/${deleteTarget.id}`;
          await axios.delete(endpoint);
          toast.success(`${deleteTarget.type === 'user' ? 'User' : 'Role'} deleted`);
          setIsDeleteOpen(false);
          fetchData();
      } catch (e) { toast.error(e.response?.data?.message || 'Delete failed'); }
      finally { setIsSubmitting(false); }
  };

  // --- Columns ---
  const userColumns = [
    {
      name: 'User',
      selector: row => row.name,
      cell: row => (
        <div className="flex items-center gap-3 py-2">
            <div className="w-8 h-8 rounded-full bg-purple-50 text-pcu-purple flex items-center justify-center shrink-0 border border-purple-100"><IoPersonOutline/></div>
            <div>
                <p className="font-semibold text-gray-700">{row.name}</p>
                <p className="text-xs text-gray-500">{row.email}</p>
            </div>
        </div>
      ),
      grow: 2
    },
    {
      name: 'Role',
      cell: row => {
          const roleName = row.roles?.[0]?.name || 'No Role';
          return <span className={`text-xs px-2 py-1 rounded border ${roleName === 'Super Admin' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>{roleName}</span>
      }
    },
    {
        name: 'Actions',
        cell: row => (
            <div className="flex gap-2">
                {/* Resend Button */}
                <button 
                    onClick={() => handleResendLogin(row.id)} 
                    disabled={isResending === row.id}
                    title="Reset & Resend Password"
                    className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all"
                >
                    {isResending === row.id ? <Spinner size="sm" color="blue" /> : <IoMailOutline size={18} />}
                </button>

                <button onClick={() => openUserEdit(row)} className="p-2 text-gray-500 hover:text-pcu-purple rounded-lg"><IoPencil size={18}/></button>
                
                {currentUser?.email !== row.email && (
                    <button onClick={() => { setDeleteTarget({id: row.id, type: 'user'}); setIsDeleteOpen(true); }} className="p-2 text-gray-500 hover:text-red-500 rounded-lg"><IoTrash size={18}/></button>
                )}
            </div>
        )
    }
  ];

  const roleColumns = [
      { name: 'Role Name', selector: row => row.name, sortable: true, cell: row => <span className="font-semibold text-gray-700">{row.name}</span> },
      { name: 'Slug', selector: row => row.slug, cell: row => <span className="text-xs font-mono text-gray-500 bg-gray-50 px-2 py-1 rounded">{row.slug}</span> },
      { name: 'Users Assigned', selector: row => row.users_count, cell: row => <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded border border-blue-100">{row.users_count} Users</span> },
      {
          name: 'Actions',
          cell: row => (
            <div className="flex gap-2">
                {row.slug !== 'super-admin' && (
                    <>
                        <button onClick={() => openRoleEdit(row)} className="p-2 text-gray-500 hover:text-pcu-purple rounded-lg"><IoPencil size={18}/></button>
                        <button onClick={() => { setDeleteTarget({id: row.id, type: 'role'}); setIsDeleteOpen(true); }} className="p-2 text-gray-500 hover:text-red-500 rounded-lg"><IoTrash size={18}/></button>
                    </>
                )}
            </div>
          )
      }
  ];

  // --- Filtering ---
  const filteredUsers = useMemo(() => users.filter(u => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())), [users, search]);
  const filteredRoles = useMemo(() => roles.filter(r => r.name.toLowerCase().includes(search.toLowerCase())), [roles, search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h1 className="text-2xl font-bold text-gray-800">Admin Management</h1>
            <p className="text-gray-500 text-sm">Manage administrators and their access roles.</p>
        </div>
        <Button onClick={activeTab === 'users' ? openUserCreate : openRoleCreate}>
            <IoAdd className="mr-2 text-xl" /> New {activeTab === 'users' ? 'Admin' : 'Role'}
        </Button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        
        {/* Tabs */}
        <div className="flex border-b border-gray-200">
            <button onClick={() => setActiveTab('users')} className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors border-b-2 ${activeTab === 'users' ? 'border-pcu-purple text-pcu-purple bg-purple-50/50' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                <IoPeopleOutline className="text-lg"/> Administrators
            </button>
            <button onClick={() => setActiveTab('roles')} className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors border-b-2 ${activeTab === 'roles' ? 'border-pcu-purple text-pcu-purple bg-purple-50/50' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                <IoRibbonOutline className="text-lg"/> Role Definitions
            </button>
        </div>

        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-end">
          <div className="w-full md:w-64">
            <input type="text" placeholder={`Search ${activeTab}...`} className="input-field py-2" value={search} onChange={handleSearch} />
          </div>
        </div>

        <DataTable 
            columns={activeTab === 'users' ? userColumns : roleColumns} 
            data={activeTab === 'users' ? filteredUsers : filteredRoles} 
            pagination 
            progressPending={loading} 
            customStyles={glossyTableStyles} 
            noDataComponent={<div className="p-8 text-center text-gray-500">No records found.</div>}
        />
      </div>

      {/* --- USER MODAL --- */}
      <Modal isOpen={isUserFormOpen} onClose={() => setIsUserFormOpen(false)} title={selectedItem ? "Edit Admin" : "New Admin"} size="sm">
        <form onSubmit={handleUserSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input type="text" className="input-field" required value={userForm.name} onChange={e => setUserForm({...userForm, name: e.target.value})} />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" className="input-field" required value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assign Role</label>
                {roles.length > 0 ? (
                    <select className="input-field" value={userForm.role} onChange={e => setUserForm({...userForm, role: e.target.value})} required>
                        <option value="">Select Role...</option>
                        {roles.map(r => (
                            <option key={r.id} value={r.slug}>{r.name}</option>
                        ))}
                    </select>
                ) : (
                    <div className="p-3 bg-amber-50 text-amber-800 text-xs rounded-lg border border-amber-100 flex items-start gap-2">
                        <IoAlertCircleOutline className="text-lg shrink-0"/>
                        <div>No roles found. Please go to the <strong>Role Definitions</strong> tab and create a role first.</div>
                    </div>
                )}
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2"><IoKeyOutline/> {selectedItem ? 'New Password (Optional)' : 'Password'}</label>
                <input type="password" className="input-field" placeholder={selectedItem ? "Leave blank to keep" : "Secure password"} value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} required={!selectedItem} minLength={6} />
            </div>
            <div className="pt-4 flex justify-end gap-2 border-t border-gray-100">
                <Button variant="secondary" type="button" onClick={() => setIsUserFormOpen(false)}>Cancel</Button>
                <Button type="submit" isLoading={isSubmitting}>Save User</Button>
            </div>
        </form>
      </Modal>

      {/* --- ROLE MODAL --- */}
      <Modal isOpen={isRoleFormOpen} onClose={() => setIsRoleFormOpen(false)} title={selectedItem ? "Edit Role" : "New Role"} size="sm">
        <form onSubmit={handleRoleSubmit} className="space-y-4">
            
            <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
                <label className="block text-xs font-bold text-blue-800 mb-1">
                    {selectedItem ? 'Switch to Standard Role' : 'Quick Select Standard Role'}
                </label>
                <select className="input-field py-1 text-sm bg-white" onChange={handleRoleSelectHelper} value="">
                    <option value="" disabled>-- Choose a System Role --</option>
                    {systemRoles.map((role, idx) => (
                        <option key={idx} value={role.value}>{role.label}</option>
                    ))}
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role Name</label>
                <input type="text" className="input-field" required value={roleForm.name} onChange={e => setRoleForm({...roleForm, name: e.target.value})} placeholder="e.g. Content Editor" />
            </div>
            <div className="pt-4 flex justify-end gap-2 border-t border-gray-100">
                <Button variant="secondary" type="button" onClick={() => setIsRoleFormOpen(false)}>Cancel</Button>
                <Button type="submit" isLoading={isSubmitting}>Save Role</Button>
            </div>
        </form>
      </Modal>

      <ConfirmModal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} onConfirm={handleDelete} title="Confirm Action" message="This action cannot be undone. Are you sure?" isLoading={isSubmitting} />
    </div>
  );
};

export default Users;