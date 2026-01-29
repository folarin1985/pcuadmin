import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import DataTable from 'react-data-table-component';
import { toast } from 'react-hot-toast';
import { 
  IoAdd, IoPencil, IoTrash, IoSchoolOutline, IoImageOutline, 
  IoStarOutline, IoStar, IoArrowUndo, IoBookOutline, IoRibbonOutline, IoLayersOutline
} from 'react-icons/io5';
import { useAuth } from '../../contexts/AuthContext';

import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import ConfirmModal from '../../components/common/ConfirmModal';
import { glossyTableStyles } from '../../styles/tableStyles';

const Programs = () => {
  const { getImageUrl } = useAuth();
  
  // --- States ---
  const [activeTab, setActiveTab] = useState('programs'); // 'programs', 'degrees', 'categories'

  // Data
  const [programs, setPrograms] = useState([]);
  const [faculties, setFaculties] = useState([]); 
  const [departments, setDepartments] = useState([]); 
  const [degreeTypes, setDegreeTypes] = useState([]); 
  const [categories, setCategories] = useState([]); 
  const [trashItems, setTrashItems] = useState([]); 
  
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modals
  const [isProgramModalOpen, setIsProgramModalOpen] = useState(false);
  const [isDegreeModalOpen, setIsDegreeModalOpen] = useState(false); 
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false); 
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isTrashOpen, setIsTrashOpen] = useState(false); 
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Selection
  const [selectedItem, setSelectedItem] = useState(null); 
  const [deleteTarget, setDeleteTarget] = useState({ id: null, type: 'program' }); 
  const [restoringId, setRestoringId] = useState(null); 

  // Forms
  const initialProgramForm = { 
    title: '', degree_type_id: '', duration: '4 Years',
    overview: '', requirements: '', 
    faculty_id: '', department_id: '',
    banner_image: '', banner_caption: '',
    is_featured: false
  };
  const [programForm, setProgramForm] = useState(initialProgramForm);
  const [degreeForm, setDegreeForm] = useState({ name: '', abbr: '', program_category_id: '' });
  const [categoryForm, setCategoryForm] = useState({ name: '' });

  // --- Fetch Data ---
  const fetchData = async () => {
    try {
      setLoading(true);
      const [progRes, facRes, deptRes, degRes, catRes] = await Promise.all([
        axios.get('/programs'),
        axios.get('/faculties'),
        axios.get('/departments'),
        axios.get('/degree-types'),
        axios.get('/program-categories')
      ]);
      setPrograms(progRes.data.data);
      setFaculties(facRes.data.data);
      setDepartments(deptRes.data.data);
      setDegreeTypes(degRes.data.data);
      setCategories(catRes.data.data);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchTrash = async () => {
    try {
      const res = await axios.get('/admin/programs/trash');
      setTrashItems(res.data.data);
    } catch (error) {
      toast.error('Failed to load trash bin');
    }
  };

  useEffect(() => { fetchData(); }, []);

  // --- Handlers ---
  const handleSearch = (e) => setSearch(e.target.value);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setProgramForm(prev => ({ ...prev, banner_image: reader.result }));
      reader.readAsDataURL(file);
    }
  };

  // --- CRUD: Program ---
  const openCreateModal = () => {
    setSelectedItem(null);
    const defaultDegree = degreeTypes.length > 0 ? degreeTypes[0].id : '';
    setProgramForm({ ...initialProgramForm, degree_type_id: defaultDegree });
    setIsProgramModalOpen(true);
  };

  const openEditModal = (program) => {
    setSelectedItem(program);
    const dept = departments.find(d => d.id === program.department_id);
    const facultyId = dept ? dept.faculty_id : '';
    setProgramForm({ 
      title: program.title,
      degree_type_id: program.degree_type_id,
      duration: program.duration,
      overview: program.overview || '',
      requirements: program.requirements || '',
      department_id: program.department_id,
      faculty_id: facultyId,
      banner_image: program.banner_image || '',
      banner_caption: program.banner_caption || '',
      is_featured: Boolean(program.is_featured)
    });
    setIsProgramModalOpen(true);
  };

  const handleProgramSubmit = async (e) => {
    e.preventDefault();
    if (!programForm.department_id) return toast.error('Please select a department');
    setIsSubmitting(true);
    try {
      const payload = { ...programForm };
      if (payload.banner_image && !payload.banner_image.startsWith('data:')) delete payload.banner_image; 

      if (selectedItem) {
        await axios.put(`/programs/${selectedItem.id}`, payload);
        toast.success('Program updated');
      } else {
        await axios.post('/programs', payload);
        toast.success('Program created');
      }
      setIsProgramModalOpen(false);
      fetchData();
    } catch (error) { toast.error('Operation failed'); } 
    finally { setIsSubmitting(false); }
  };

  // --- CRUD: Degree ---
  const openDegreeModal = (degree = null) => {
      setSelectedItem(degree);
      const defaultCat = categories.length > 0 ? categories[0].id : '';
      setDegreeForm(degree 
        ? { name: degree.name, abbr: degree.abbr, program_category_id: degree.program_category_id || defaultCat } 
        : { name: '', abbr: '', program_category_id: defaultCat }
      );
      setIsDegreeModalOpen(true);
  };

  const handleDegreeSubmit = async (e) => {
      e.preventDefault();
      setIsSubmitting(true);
      try {
          if (selectedItem) {
              await axios.put(`/degree-types/${selectedItem.id}`, degreeForm);
              toast.success('Degree Type updated');
          } else {
              await axios.post(`/degree-types`, degreeForm);
              toast.success('Degree Type created');
          }
          setIsDegreeModalOpen(false);
          fetchData();
      } catch (e) { toast.error('Operation failed'); }
      finally { setIsSubmitting(false); }
  };

  // --- CRUD: Category ---
  const openCategoryModal = (cat = null) => {
      setSelectedItem(cat);
      setCategoryForm(cat ? { name: cat.name } : { name: '' });
      setIsCategoryModalOpen(true);
  };

  const handleCategorySubmit = async (e) => {
      e.preventDefault();
      setIsSubmitting(true);
      try {
          if (selectedItem) {
              await axios.put(`/program-categories/${selectedItem.id}`, categoryForm);
              toast.success('Category updated');
          } else {
              await axios.post(`/program-categories`, categoryForm);
              toast.success('Category created');
          }
          setIsCategoryModalOpen(false);
          fetchData();
      } catch(e) { toast.error("Operation failed"); }
      finally { setIsSubmitting(false); }
  };

  // --- Delete ---
  const handleDelete = async () => {
    setIsSubmitting(true);
    try {
      if (deleteTarget.type === 'program') {
          await axios.delete(`/programs/${deleteTarget.id}`);
          toast.success('Moved to Recycle Bin');
      } else if (deleteTarget.type === 'degree') {
          await axios.delete(`/degree-types/${deleteTarget.id}`);
          toast.success('Degree Type deleted');
      } else {
          await axios.delete(`/program-categories/${deleteTarget.id}`);
          toast.success('Category deleted');
      }
      setIsDeleteOpen(false);
      fetchData();
    } catch (error) { toast.error('Failed to delete'); } 
    finally { setIsSubmitting(false); }
  };

  // --- Trash ---
  const openTrashModal = () => { fetchTrash(); setIsTrashOpen(true); };
  const handleRestore = async (id) => {
    setRestoringId(id);
    try {
      await axios.post(`/admin/programs/${id}/restore`);
      toast.success('Program restored');
      fetchTrash(); fetchData(); 
    } catch (error) { toast.error('Failed to restore'); } 
    finally { setRestoringId(null); }
  };

  // --- Filters ---
  const filteredDepartments = useMemo(() => {
    if (!programForm.faculty_id) return [];
    return departments.filter(d => d.faculty_id === parseInt(programForm.faculty_id));
  }, [departments, programForm.faculty_id]);

  // UPDATED SEARCH LOGIC: Search by Title, Category Name, or Department
  const filteredPrograms = useMemo(() => {
      const s = search.toLowerCase();
      return programs.filter(p => 
          p.title.toLowerCase().includes(s) || 
          p.degree_type?.category?.name?.toLowerCase().includes(s) || 
          p.department?.name?.toLowerCase().includes(s)
      );
  }, [programs, search]);

  const filteredDegrees = useMemo(() => degreeTypes.filter(d => d.name.toLowerCase().includes(search.toLowerCase())), [degreeTypes, search]);
  const filteredCategories = useMemo(() => categories.filter(c => c.name.toLowerCase().includes(search.toLowerCase())), [categories, search]);

  // --- Columns ---
  const programColumns = [
  {
    name: 'Program',
    selector: row => row.title,
    sortable: true,
    cell: row => (
      <div className="py-2">
        <div className="flex items-center gap-2">
          {/* FIX: Add '!!' before row.is_featured to force a boolean check */}
          {!!row.is_featured && <IoStar className="text-amber-400 text-sm" />}
          
          <p className="font-semibold text-gray-700">{row.title}</p>
        </div>
        <div className="flex items-center gap-2 mt-1">
            <span className={`text-xs px-2 py-0.5 rounded border ${row.degree_type?.category?.name ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                {row.degree_type?.category?.name || 'Uncategorized'}
            </span>
            <span className="text-xs text-gray-400">•</span>
            <span className="text-xs font-bold text-gray-500">{row.degree_type?.abbr || 'N/A'}</span>
        </div>
      </div>
    ),
    grow: 2,
  },
    { name: 'Department', selector: row => row.department?.name, sortable: true, cell: row => <span className="text-sm text-gray-600">{row.department?.name}</span> },
    {
      name: 'Actions',
      cell: row => (
        <div className="flex gap-2">
          <button onClick={() => openEditModal(row)} className="p-2 text-gray-500 hover:text-pcu-purple hover:bg-purple-50 rounded-lg"><IoPencil size={18} /></button>
          <button onClick={() => { setDeleteTarget({id: row.id, type: 'program'}); setIsDeleteOpen(true); }} className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg"><IoTrash size={18} /></button>
        </div>
      ),
      ignoreRowClick: true,
      button: true,
    },
  ];

  const degreeColumns = [
      { name: 'Full Name', selector: row => row.name, sortable: true, grow: 2 },
      { name: 'Abbreviation', selector: row => row.abbr, sortable: true, cell: row => <span className="font-bold">{row.abbr}</span> },
      { name: 'Category', selector: row => row.category?.name, sortable: true, cell: row => <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded border border-blue-100">{row.category?.name || 'Uncategorized'}</span> },
      {
          name: 'Actions',
          cell: row => (
            <div className="flex gap-2">
              <button onClick={() => openDegreeModal(row)} className="p-2 text-gray-500 hover:text-pcu-purple rounded-lg"><IoPencil size={18} /></button>
              <button onClick={() => { setDeleteTarget({id: row.id, type: 'degree'}); setIsDeleteOpen(true); }} className="p-2 text-gray-500 hover:text-red-500 rounded-lg"><IoTrash size={18} /></button>
            </div>
          )
      }
  ];

  const categoryColumns = [
      { name: 'Category Name', selector: row => row.name, sortable: true, grow: 2, cell: row => <span className="font-bold text-gray-700">{row.name}</span> },
      {
          name: 'Actions',
          cell: row => (
            <div className="flex gap-2">
              <button onClick={() => openCategoryModal(row)} className="p-2 text-gray-500 hover:text-pcu-purple rounded-lg"><IoPencil size={18} /></button>
              <button onClick={() => { setDeleteTarget({id: row.id, type: 'category'}); setIsDeleteOpen(true); }} className="p-2 text-gray-500 hover:text-red-500 rounded-lg"><IoTrash size={18} /></button>
            </div>
          )
      }
  ];

  const handleAddClick = () => {
      if (activeTab === 'programs') openCreateModal();
      else if (activeTab === 'degrees') openDegreeModal();
      else openCategoryModal();
  };

  const renderAddButtonLabel = () => {
      if (activeTab === 'programs') return 'Add Program';
      if (activeTab === 'degrees') return 'Add Degree Type';
      return 'Add Category';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Academic Programs</h1>
          <p className="text-gray-500 text-sm">Manage courses, degrees, and categories.</p>
        </div>
        <div className="flex gap-3">
          {activeTab === 'programs' && (
              <Button variant="secondary" onClick={openTrashModal}>
                <IoTrash className="mr-2" /> Recycle Bin
              </Button>
          )}
          <Button onClick={handleAddClick}>
            <IoAdd className="mr-2 text-xl" /> {renderAddButtonLabel()}
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        
        {/* TABS HEADER */}
        <div className="flex border-b border-gray-200">
            <button onClick={() => setActiveTab('programs')} className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors border-b-2 ${activeTab === 'programs' ? 'border-pcu-purple text-pcu-purple bg-purple-50/50' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                <IoBookOutline className="text-lg"/> All Programs
            </button>
            <button onClick={() => setActiveTab('degrees')} className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors border-b-2 ${activeTab === 'degrees' ? 'border-pcu-purple text-pcu-purple bg-purple-50/50' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                <IoRibbonOutline className="text-lg"/> Degree Types
            </button>
            <button onClick={() => setActiveTab('categories')} className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors border-b-2 ${activeTab === 'categories' ? 'border-pcu-purple text-pcu-purple bg-purple-50/50' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                <IoLayersOutline className="text-lg"/> Categories
            </button>
        </div>

        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-end">
          <div className="w-full md:w-64">
            <input type="text" placeholder={`Search ${activeTab}...`} className="input-field py-2" value={search} onChange={handleSearch} />
          </div>
        </div>

        <DataTable 
            columns={activeTab === 'programs' ? programColumns : (activeTab === 'degrees' ? degreeColumns : categoryColumns)} 
            data={activeTab === 'programs' ? filteredPrograms : (activeTab === 'degrees' ? filteredDegrees : filteredCategories)} 
            pagination 
            progressPending={loading} 
            customStyles={glossyTableStyles} 
        />
      </div>

      {/* --- PROGRAM MODAL --- */}
      <Modal isOpen={isProgramModalOpen} onClose={() => setIsProgramModalOpen(false)} title={selectedItem ? "Edit Program" : "New Program"} size="lg">
        <form onSubmit={handleProgramSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Degree Type</label>
                <div className="flex flex-wrap gap-2">
                    {degreeTypes.length > 0 ? degreeTypes.map(dt => (
                        <button
                            key={dt.id}
                            type="button"
                            onClick={() => setProgramForm({...programForm, degree_type_id: dt.id})}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                                parseInt(programForm.degree_type_id) === dt.id 
                                ? 'bg-pcu-purple text-white border-pcu-purple shadow-sm' 
                                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
                            }`}
                        >
                            {dt.abbr}
                        </button>
                    )) : (
                        <span className="text-xs text-red-500 bg-red-50 px-2 py-1 rounded">No Degree Types found.</span>
                    )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Faculty</label>
                <select className="input-field" value={programForm.faculty_id} onChange={e => setProgramForm({...programForm, faculty_id: e.target.value, department_id: ''})}>
                  <option value="">Select Faculty...</option>
                  {faculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <select className="input-field" value={programForm.department_id} onChange={e => setProgramForm({...programForm, department_id: e.target.value})} disabled={!programForm.faculty_id}>
                  <option value="">{programForm.faculty_id ? 'Select Department...' : 'Select Faculty first'}</option>
                  {filteredDepartments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                {/*<input type="text" className="input-field" value={programForm.duration} onChange={e => setProgramForm({...programForm, duration: e.target.value})} placeholder="e.g. 4 Years" />*/}

                <textarea className="input-field min-h-[100px]" value={programForm.duration} onChange={e => setProgramForm({...programForm, duration: e.target.value})} placeholder="e.g. 4 Years" />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Program Title</label>
                <input type="text" className="input-field" value={programForm.title} onChange={e => setProgramForm({...programForm, title: e.target.value})} placeholder="e.g. Computer Science" required />
              </div>

               <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Course Page Banner</label>
                <div className="relative w-full h-32 bg-gray-200 rounded-xl overflow-hidden border border-gray-200 group">
                   {programForm.banner_image ? (
                     <img src={getImageUrl(programForm.banner_image)} className="w-full h-full object-cover" />
                   ) : (
                     <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                        <IoImageOutline size={24} />
                     </div>
                   )}
                   <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <span className="text-white font-medium text-sm">Upload</span>
                      <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                   </label>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                 <button 
                   type="button"
                   onClick={() => setProgramForm(prev => ({...prev, is_featured: !prev.is_featured}))}
                   className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                     programForm.is_featured ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-gray-50 border-gray-200 text-gray-600'
                   }`}
                 >
                   {programForm.is_featured ? <IoStar /> : <IoStarOutline />}
                   {programForm.is_featured ? 'Featured on Homepage' : 'Standard Course'}
                 </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Program Overview</label>
            <textarea className="input-field min-h-[100px]" value={programForm.overview} onChange={e => setProgramForm({...programForm, overview: e.target.value})} placeholder="Describe the program..." />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Admission Requirements</label>
            <textarea className="input-field min-h-[100px]" value={programForm.requirements} onChange={e => setProgramForm({...programForm, requirements: e.target.value})} placeholder="• 5 Credits in WAEC including..." />
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
            <Button variant="secondary" onClick={() => setIsProgramModalOpen(false)}>Cancel</Button>
            <Button type="submit" isLoading={isSubmitting}>Save Program</Button>
          </div>
        </form>
      </Modal>

      {/* --- DEGREE TYPE MODAL --- */}
      <Modal isOpen={isDegreeModalOpen} onClose={() => setIsDegreeModalOpen(false)} title={selectedItem ? "Edit Degree Type" : "Add Degree Type"} size="sm">
        <form onSubmit={handleDegreeSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input type="text" className="input-field" required value={degreeForm.name} onChange={e => setDegreeForm({...degreeForm, name: e.target.value})} placeholder="e.g. Bachelor of Science" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Abbreviation (Tab Label)</label>
                <input type="text" className="input-field" required value={degreeForm.abbr} onChange={e => setDegreeForm({...degreeForm, abbr: e.target.value})} placeholder="e.g. B.Sc" />
            </div>
            {/* New Category Link */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Program Category</label>
                <select className="input-field" required value={degreeForm.program_category_id} onChange={e => setDegreeForm({...degreeForm, program_category_id: e.target.value})}>
                    <option value="">Select Category...</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
            </div>
            <div className="pt-4 flex justify-end gap-2 border-t border-gray-100">
                <Button variant="secondary" onClick={() => setIsDegreeModalOpen(false)}>Cancel</Button>
                <Button type="submit" isLoading={isSubmitting}>Save Degree</Button>
            </div>
        </form>
      </Modal>

      {/* --- CATEGORY MODAL --- */}
      <Modal isOpen={isCategoryModalOpen} onClose={() => setIsCategoryModalOpen(false)} title={selectedItem ? "Edit Category" : "Add Category"} size="sm">
        <form onSubmit={handleCategorySubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category Name</label>
                <input type="text" className="input-field" required value={categoryForm.name} onChange={e => setCategoryForm({...categoryForm, name: e.target.value})} placeholder="e.g. Undergraduate" />
            </div>
            <div className="pt-4 flex justify-end gap-2 border-t border-gray-100">
                <Button variant="secondary" onClick={() => setIsCategoryModalOpen(false)}>Cancel</Button>
                <Button type="submit" isLoading={isSubmitting}>Save Category</Button>
            </div>
        </form>
      </Modal>

      {/* --- RECYCLE BIN --- */}
      <Modal isOpen={isTrashOpen} onClose={() => setIsTrashOpen(false)} title="Recycle Bin" size="lg">
        <div className="space-y-4">
            {trashItems.length === 0 ? <div className="text-center py-10 text-gray-400">Bin is empty.</div> : (
                <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
                    {trashItems.map(item => (
                        <div key={item.id} className="flex justify-between items-center p-3 border-b border-gray-200 last:border-0 bg-white">
                            <div><p className="font-semibold text-gray-700">{item.title}</p><p className="text-xs text-gray-400">Deleted: {new Date(item.deleted_at).toLocaleDateString()}</p></div>
                            <Button size="sm" variant="secondary" onClick={() => handleRestore(item.id)} isLoading={restoringId === item.id}><IoArrowUndo className="mr-1"/> Restore</Button>
                        </div>
                    ))}
                </div>
            )}
            <div className="flex justify-end pt-2"><Button variant="secondary" onClick={() => setIsTrashOpen(false)}>Close</Button></div>
        </div>
      </Modal>

      {/* --- CONFIRM DELETE --- */}
      <ConfirmModal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} onConfirm={handleDelete} title="Confirm Delete?" message="This action cannot be undone." isLoading={isSubmitting} />
    </div>
  );
};

export default Programs;