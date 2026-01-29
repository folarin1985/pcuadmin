import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import DataTable from 'react-data-table-component';
import { toast } from 'react-hot-toast';
import { 
  IoAdd, IoPencil, IoTrash, IoSearch, IoCalendarOutline, IoLocationOutline, 
  IoImageOutline, IoArrowUndo, IoPeopleOutline, IoCloseCircleOutline, 
  IoListOutline, IoPricetagOutline
} from 'react-icons/io5';
import { useAuth } from '../../contexts/AuthContext';

import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import ConfirmModal from '../../components/common/ConfirmModal';
import Spinner from '../../components/common/Spinner';
import { glossyTableStyles } from '../../styles/tableStyles';

const Events = () => {
  const { getImageUrl } = useAuth();

  // --- States ---
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]); 
  const [trashItems, setTrashItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
   
  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isTrashOpen, setIsTrashOpen] = useState(false);
  const [isRegModalOpen, setIsRegModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
   
  // Quick Category Add
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);

  // Selection
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [restoringId, setRestoringId] = useState(null);
  const [registrations, setRegistrations] = useState([]); 

  // Form Data
  const initialForm = { 
    title: '', description: '', location: '',
    start_time: '', end_time: '',
    event_category_id: '', 
    banner_image: '',
    has_form: false,
    form_schema: [] 
  };
  const [formData, setFormData] = useState(initialForm);

  // --- Fetch Data ---
  const fetchData = async () => {
    try {
      setLoading(true);
      const [evtRes, catRes] = await Promise.all([
        axios.get('/events'),
        axios.get('/event-categories')
      ]);
      setEvents(evtRes.data.data);
      setCategories(catRes.data.data);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchTrash = async () => {
    try {
      const res = await axios.get('/admin/events/trash');
      setTrashItems(res.data.data);
    } catch (error) {
      toast.error('Failed to load trash bin');
    }
  };

  const fetchRegistrations = async (eventId) => {
    try {
      const res = await axios.get(`/admin/events/${eventId}/registrations`);
      setRegistrations(res.data.data);
      setIsRegModalOpen(true);
    } catch (error) {
      toast.error('Failed to load registrations');
    }
  };

  useEffect(() => { fetchData(); }, []);

  // --- Handlers ---
  const handleSearch = (e) => setSearch(e.target.value);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFormData(prev => ({ ...prev, banner_image: reader.result }));
      reader.readAsDataURL(file);
    }
  };

  // Quick Add Category Logic
  const handleAddCategory = async () => {
    if (!newCategoryName) return;
    setIsAddingCategory(true);
    try {
        const res = await axios.post('/event-categories', { name: newCategoryName });
        setCategories([...categories, res.data.data]);
        setFormData(prev => ({ ...prev, event_category_id: res.data.data.id })); 
        setNewCategoryName('');
        toast.success('Category added');
    } catch (error) {
        toast.error('Failed to add category');
    } finally {
        setIsAddingCategory(false);
    }
  };

  // --- Form Builder Logic (Updated) ---

  const addField = () => {
    setFormData(prev => ({
      ...prev,
      form_schema: [
        ...prev.form_schema, 
        // Default new field structure
        { label: '', type: 'text', required: true, options: [] }
      ]
    }));
  };

  const removeField = (index) => {
    const newSchema = [...formData.form_schema];
    newSchema.splice(index, 1);
    setFormData(prev => ({ ...prev, form_schema: newSchema }));
  };

  const updateField = (index, key, value) => {
    const newSchema = [...formData.form_schema];
    newSchema[index][key] = value;

    // If switching to a choice-based type, ensure options array exists and has at least one empty option
    if (['select', 'radio', 'checkbox'].includes(value)) {
        if (!newSchema[index].options || newSchema[index].options.length === 0) {
            newSchema[index].options = ['']; 
        }
    }
    
    setFormData(prev => ({ ...prev, form_schema: newSchema }));
  };

  // -- Option Handlers (For Select/Radio/Checkbox) --
  const addOption = (fieldIndex) => {
    const newSchema = [...formData.form_schema];
    newSchema[fieldIndex].options = [...(newSchema[fieldIndex].options || []), '']; 
    setFormData(prev => ({ ...prev, form_schema: newSchema }));
  };

  const updateOption = (fieldIndex, optionIndex, value) => {
    const newSchema = [...formData.form_schema];
    newSchema[fieldIndex].options[optionIndex] = value;
    setFormData(prev => ({ ...prev, form_schema: newSchema }));
  };

  const removeOption = (fieldIndex, optionIndex) => {
    const newSchema = [...formData.form_schema];
    newSchema[fieldIndex].options = newSchema[fieldIndex].options.filter((_, i) => i !== optionIndex);
    setFormData(prev => ({ ...prev, form_schema: newSchema }));
  };

  // --- Modals ---
  const openCreateModal = () => {
    setSelectedEvent(null);
    setFormData(initialForm);
    setIsFormOpen(true);
  };

  const openEditModal = (event) => {
    setSelectedEvent(event);
    const formatDateTime = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
    };

    setFormData({ 
      title: event.title,
      description: event.description || '',
      location: event.location || '',
      start_time: formatDateTime(event.start_time),
      end_time: formatDateTime(event.end_time),
      event_category_id: event.event_category_id || '',
      banner_image: event.banner_image || '',
      has_form: event.form ? true : false,
      form_schema: event.form ? event.form.schema : []
    });
    setIsFormOpen(true);
  };

  const openTrashModal = () => { fetchTrash(); setIsTrashOpen(true); };

  // --- CRUD ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (selectedEvent) {
        await axios.put(`/events/${selectedEvent.id}`, formData);
        toast.success('Event updated');
      } else {
        await axios.post('/events', formData);
        toast.success('Event scheduled');
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
      await axios.delete(`/events/${deleteId}`);
      toast.success('Moved to Recycle Bin');
      setIsDeleteOpen(false);
      fetchData();
    } catch (error) { toast.error('Failed to delete event'); } 
    finally { setIsSubmitting(false); }
  };

  const handleRestore = async (id) => {
    setRestoringId(id);
    try {
      await axios.post(`/admin/events/${id}/restore`);
      toast.success('Event restored');
      fetchTrash(); fetchData(); 
    } catch (error) { toast.error('Failed to restore'); } 
    finally { setRestoringId(null); }
  };

  // --- Table ---
  const filteredItems = useMemo(() => {
    return events.filter(e => e.title.toLowerCase().includes(search.toLowerCase()));
  }, [events, search]);

  const columns = [
    {
      name: 'Event Details',
      selector: row => row.title,
      sortable: true,
      cell: row => (
        <div className="flex items-center gap-3 py-2">
           <div className="w-12 h-12 rounded-lg bg-purple-50 flex-shrink-0 overflow-hidden border border-purple-100 flex flex-col items-center justify-center text-pcu-purple">
                {row.banner_image ? (
                    <img src={getImageUrl(row.banner_image)} className="w-full h-full object-cover" alt="Banner" />
                ) : (
                    <>
                        <span className="text-xs font-bold">{new Date(row.start_time).getDate()}</span>
                        <span className="text-[10px] uppercase">{new Date(row.start_time).toLocaleString('default', { month: 'short' })}</span>
                    </>
                )}
            </div>
            <div>
                <p className="font-semibold text-gray-700">{row.title}</p>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                     {row.location || 'Online'}
                </div>
            </div>
        </div>
      ),
      grow: 2,
    },
    {
      name: 'Category',
      selector: row => row.category?.name,
      sortable: true,
      cell: row => <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">{row.category?.name || 'Uncategorized'}</span>
    },
    {
      name: 'Registrations',
      cell: row => (
         <button 
           onClick={() => fetchRegistrations(row.id)}
           className="flex items-center gap-1 text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded hover:bg-blue-100 transition-colors"
         >
            <IoPeopleOutline /> View ({row.submissions_count})
         </button>
      )
    },
    {
      name: 'Date',
      selector: row => row.start_time,
      sortable: true,
      cell: row => <span className="text-xs text-gray-600">{new Date(row.start_time).toLocaleDateString()}</span>
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

  const regColumns = [
      { name: 'Submitted At', selector: row => new Date(row.created_at).toLocaleString(), sortable: true },
      { 
          name: 'Data', 
          cell: row => (
              <div className="text-xs py-2">
                  {Object.entries(row.data).map(([key, value]) => (
                      <div key={key}><span className="font-bold">{key}:</span> {Array.isArray(value) ? value.join(', ') : value}</div>
                  ))}
              </div>
          )
      }
  ];


  // --- Dynamic Registration Columns ---
  const dynamicRegColumns = useMemo(() => {
    if (registrations.length === 0) return [];

    // 1. Helper to format headers (e.g., "student_id" -> "Student Id")
    const formatHeader = (str) => {
        if (!str) return '';
        return str
            .replace(/_/g, ' ') // Replace underscore with space
            .replace(/\b\w/g, char => char.toUpperCase()); // Capitalize first letter of words
    };

    // 2. Base Column (Timestamp)
    const columns = [
        {
            name: 'Submitted At',
            selector: row => new Date(row.created_at).toLocaleString(),
            sortable: true,
            width: '180px', // Fixed width for date
            wrap: true
        }
    ];

    // 3. Extract keys from the first registration entry to build columns
    // (We assume all registrations for an event follow the same schema)
    const firstEntry = registrations[0]?.data || {};
    const dataKeys = Object.keys(firstEntry);

    // 4. Create a column for each data field
    dataKeys.forEach(key => {
        columns.push({
            name: formatHeader(key), // Apply formatting here
            selector: row => {
                const value = row.data[key];
                // Handle arrays (checkboxes) and empty values
                if (Array.isArray(value)) return value.join(', ');
                return value || '-';
            },
            sortable: true,
            wrap: true, // Allow text to wrap if it's long
            minWidth: '150px' 
        });
    });

    return columns;
  }, [registrations]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Events Calendar</h1>
          <p className="text-gray-500 text-sm">Manage upcoming university events.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={openTrashModal}> <IoTrash className="mr-2" /> Recycle Bin </Button>
          <Button onClick={openCreateModal}> <IoAdd className="mr-2 text-xl" /> Schedule Event </Button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-end">
          <div className="w-full md:w-64">
            <input type="text" placeholder="Search events..." className="input-field py-2" value={search} onChange={handleSearch} />
          </div>
        </div>
        <DataTable columns={columns} data={filteredItems} pagination progressPending={loading} customStyles={glossyTableStyles} />
      </div>

      {/* --- Main Modal --- */}
      <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={selectedEvent ? "Edit Event" : "Schedule Event"} size="xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Left Col */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Event Title</label>
                <input type="text" className="input-field" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. Convocation" required />
              </div>

              {/* Category Selector with Quick Add */}
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <IoPricetagOutline /> Event Category
                </label>
                <select 
                  className="input-field mb-2 text-sm" 
                  value={formData.event_category_id}
                  onChange={e => setFormData({...formData, event_category_id: e.target.value})}
                >
                  <option value="">Uncategorized</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        placeholder="New Category..." 
                        className="flex-1 px-3 py-1 text-sm border border-gray-300 rounded-lg"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                    />
                    <button 
                        type="button"
                        onClick={handleAddCategory}
                        disabled={isAddingCategory || !newCategoryName}
                        className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm transition-colors"
                    >
                        {isAddingCategory ? <Spinner size="sm" color="purple" /> : <IoAdd />}
                    </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                    <input type="datetime-local" className="input-field px-2 text-sm" value={formData.start_time} onChange={e => setFormData({...formData, start_time: e.target.value})} required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                    <input type="datetime-local" className="input-field px-2 text-sm" value={formData.end_time} onChange={e => setFormData({...formData, end_time: e.target.value})} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Venue / Location</label>
                <input type="text" className="input-field" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} placeholder="e.g. Auditorium" />
              </div>

              {/* Dynamic Form Builder (Updated) */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-bold text-gray-700 flex items-center gap-2">
                        <IoListOutline /> Registration Form
                    </span>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={formData.has_form} onChange={e => setFormData({...formData, has_form: e.target.checked})} />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pcu-purple"></div>
                    </label>
                </div>

                {formData.has_form && (
                  <div className="space-y-4">
                    {formData.form_schema.map((field, index) => (
                      <div key={index} className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm relative group">
                        
                        {/* Field Header */}
                        <div className="flex items-center gap-2 mb-2">
                           <input 
                              type="text" 
                              placeholder="Label (e.g. Full Name)" 
                              className="flex-1 text-sm border border-gray-300 rounded px-2 py-1.5 focus:ring-1 focus:ring-pcu-purple"
                              value={field.label}
                              onChange={(e) => updateField(index, 'label', e.target.value)}
                              required
                           />
                           <select 
                              className="text-xs border-gray-300 rounded px-2 py-1.5 bg-gray-50"
                              value={field.type}
                              onChange={(e) => updateField(index, 'type', e.target.value)}
                           >
                              <option value="text">Short Text</option>
                              <option value="textarea">Paragraph / Long Text</option>
                              <option value="email">Email Address</option>
                              {/*<option value="number">Number</option>
                              <option value="date">Date</option>*/}
                              <hr />
                              <option value="select">Dropdown (Select)</option>
                              {/*<option value="radio">Radio Buttons (Single Choice)</option>
                              <option value="checkbox">Checkboxes (Multi Choice)</option>*/}
                           </select>
                           <button type="button" onClick={() => removeField(index)} className="text-red-400 hover:text-red-600 p-1">
                              <IoCloseCircleOutline size={20} />
                           </button>
                        </div>

                        {/* Options Builder (Conditional) */}
                        {['select', 'radio', 'checkbox'].includes(field.type) && (
                           <div className="ml-1 pl-3 border-l-2 border-purple-100 mt-2 space-y-2">
                              <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                                 {field.type === 'checkbox' ? 'Options (User can pick multiple)' : 'Options (User picks one)'}
                              </p>
                              
                              {field.options && field.options.map((option, optIndex) => (
                                 <div key={optIndex} className="flex items-center gap-2">
                                    {/* Visual Icons */}
                                    {field.type === 'radio' && <div className="w-3 h-3 rounded-full border border-gray-300"></div>}
                                    {field.type === 'checkbox' && <div className="w-3 h-3 rounded border border-gray-300"></div>}
                                    {field.type === 'select' && <span className="text-gray-400 text-xs">{optIndex + 1}.</span>}

                                    <input 
                                       type="text" 
                                       placeholder={`Option ${optIndex + 1}`}
                                       className="flex-1 text-xs bg-gray-50 border-b border-gray-200 focus:border-purple-500 outline-none py-1"
                                       value={option}
                                       onChange={(e) => updateOption(index, optIndex, e.target.value)}
                                    />
                                    <button type="button" onClick={() => removeOption(index, optIndex)} className="text-gray-400 hover:text-red-500">
                                       <IoCloseCircleOutline size={16} />
                                    </button>
                                 </div>
                              ))}

                              <button 
                                 type="button" 
                                 onClick={() => addOption(index)} 
                                 className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-1"
                              >
                                 <IoAdd /> Add Option
                              </button>
                           </div>
                        )}
                      </div>
                    ))}
                    
                    <button type="button" onClick={addField} className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-pcu-purple hover:text-pcu-purple transition-colors flex items-center justify-center gap-2">
                        <IoAdd /> Add New Form Field
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Right Col */}
            <div className="space-y-4">
               <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Event Flyer / Banner</label>
                <div className="relative w-full h-48 bg-gray-200 rounded-xl overflow-hidden border border-gray-200 group">
                   {formData.banner_image ? (
                     <img src={getImageUrl(formData.banner_image)} className="w-full h-full object-cover" alt="Banner Preview" />
                   ) : (
                     <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                        <IoImageOutline size={32} />
                        <span className="text-sm mt-2">Upload Flyer</span>
                     </div>
                   )}
                   <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <span className="text-white font-medium text-sm">Change Image</span>
                      <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                   </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea className="input-field min-h-[120px]" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Event details..." />
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
            <Button variant="secondary" onClick={() => setIsFormOpen(false)}>Cancel</Button>
            <Button type="submit" isLoading={isSubmitting}>Schedule Event</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isRegModalOpen} onClose={() => setIsRegModalOpen(false)} title="Event Registrations" size="xl">
          <div className="max-h-[60vh] overflow-y-auto">
             {registrations.length === 0 ? (
                 <div className="text-center py-10 text-gray-500">No registrations found.</div>
             ) : (
                 <DataTable 
                    columns={dynamicRegColumns} 
                    data={registrations} 
                    pagination 
                    customStyles={glossyTableStyles} 
                    dense 
                    highlightOnHover
                    striped
                 />
             )}
          </div>
          <div className="pt-4 border-t border-gray-100 flex justify-end">
             {/* Optional: Add an Export CSV button here in the future */}
             <Button variant="secondary" onClick={() => setIsRegModalOpen(false)}>Close</Button>
          </div>
      </Modal>

      <Modal isOpen={isTrashOpen} onClose={() => setIsTrashOpen(false)} title="Recycle Bin">
        <div className="space-y-4">
          {trashItems.length === 0 ? <p className="text-center text-gray-500">No items.</p> : (
            trashItems.map(item => (
                <div key={item.id} className="flex justify-between items-center border-b pb-2">
                    <span>{item.title}</span>
                    <button onClick={() => handleRestore(item.id)} disabled={restoringId === item.id} className="text-green-600 text-sm">
                        {restoringId === item.id ? <Spinner size="sm" color="purple"/> : 'Restore'}
                    </button>
                </div>
            ))
          )}
          <Button variant="secondary" onClick={() => setIsTrashOpen(false)} className="w-full mt-2">Close</Button>
        </div>
      </Modal>

      <ConfirmModal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} onConfirm={handleDelete} title="Delete Event?" message="Move to Recycle Bin?" isLoading={isSubmitting} />
    </div>
  );
};

export default Events;