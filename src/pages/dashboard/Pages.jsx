import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DataTable from 'react-data-table-component';
import { toast } from 'react-hot-toast';
import { 
  IoAdd, IoPencil, IoTrash, IoCloudUploadOutline, IoImageOutline, 
  IoTextOutline, IoListOutline, IoCloseCircleOutline, IoGridOutline, 
  IoOptionsOutline, IoSettingsOutline, IoGitNetworkOutline, IoSaveOutline, IoWarningOutline
} from 'react-icons/io5';
import { useAuth } from '../../contexts/AuthContext';

import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import ConfirmModal from '../../components/common/ConfirmModal';
import { glossyTableStyles } from '../../styles/tableStyles';

const Pages = () => {
  const { getImageUrl } = useAuth();
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modals & Confirmation
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // General Confirmation State (Replaces window.confirm)
  const [confirmState, setConfirmState] = useState({ 
    isOpen: false, 
    title: '', 
    message: '', 
    action: null 
  });
  
  // Selection & Tabs
  const [selectedPage, setSelectedPage] = useState(null);
  const [deleteId, setDeleteId] = useState(null); // For delete modal
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('content');

  // Initial Empty State
  const emptyForm = { 
    title: '', slug: '', 
    content: '', 
    banner_image: '', banner_caption: '',
    sections: [] 
  };

  const [formData, setFormData] = useState(emptyForm);
  const [hasSavedDraft, setHasSavedDraft] = useState(false);

  // --- 1. Data Fetching & Draft System ---
  
  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/pages');
      setPages(response.data.data);
    } catch (error) { toast.error('Failed to load pages'); } 
    finally { setLoading(false); }
  };

  useEffect(() => { 
      fetchData(); 
      const savedDraft = localStorage.getItem('page_builder_draft');
      if (savedDraft) setHasSavedDraft(true);
  }, []);

  useEffect(() => {
      if (isFormOpen && !selectedPage) { 
          const timer = setTimeout(() => {
              localStorage.setItem('page_builder_draft', JSON.stringify(formData));
          }, 1000);
          return () => clearTimeout(timer);
      }
  }, [formData, isFormOpen, selectedPage]);

  // --- 2. Handlers ---

  const handleConfirmAction = () => {
      if (confirmState.action) confirmState.action();
      setConfirmState({ ...confirmState, isOpen: false });
  };

  const loadDraft = () => {
      const draft = localStorage.getItem('page_builder_draft');
      if (draft) {
          setFormData(JSON.parse(draft));
          setIsFormOpen(true);
          setSelectedPage(null);
          toast.success("Draft restored!");
      }
  };

  const discardDraft = () => {
      localStorage.removeItem('page_builder_draft');
      setHasSavedDraft(false);
      setFormData(emptyForm);
      // If triggered from "Create Page", proceed to open empty form
      setIsFormOpen(true);
      setSelectedPage(null);
      setActiveTab('content');
      toast.success("Draft discarded");
  };

  const handleTitleChange = (e) => {
      const title = e.target.value;
      if (!selectedPage) {
          const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
          setFormData(prev => ({ ...prev, title, slug }));
      } else {
          setFormData(prev => ({ ...prev, title }));
      }
  };

  const handleBannerChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFormData(prev => ({ ...prev, banner_image: reader.result }));
      reader.readAsDataURL(file);
    }
  };

  // --- 3. SECTION BUILDER ---
  const addSection = (type) => {
      const newSection = {
          id: -Date.now(), 
          layout_type: type,
          columns_count: 1, 
          column_data: [{ type: 'empty' }],
          order: formData.sections.length,
      };
      setFormData(prev => ({ ...prev, sections: [...prev.sections, newSection] }));
  };

  const removeSection = (index) => {
      const updated = [...formData.sections];
      updated.splice(index, 1);
      setFormData(prev => ({ ...prev, sections: updated }));
  };

  const updateColumnCount = (sectionIndex, count) => {
      const updated = [...formData.sections];
      const currentData = updated[sectionIndex].column_data || [];
      let newData = [...currentData];
      if (count > currentData.length) {
          for(let i = currentData.length; i < count; i++) newData.push({ type: 'empty' });
      } else {
          newData = newData.slice(0, count);
      }
      updated[sectionIndex].columns_count = count;
      updated[sectionIndex].column_data = newData;
      setFormData(prev => ({ ...prev, sections: updated }));
  };

  const updateColumnContent = (sectionIndex, colIndex, field, value) => {
      const updated = [...formData.sections];
      if(!updated[sectionIndex].column_data[colIndex]) updated[sectionIndex].column_data[colIndex] = {};
      
      updated[sectionIndex].column_data[colIndex][field] = value;
      
      if (field === 'type' && value === 'form' && !updated[sectionIndex].column_data[colIndex].form_schema) {
          updated[sectionIndex].column_data[colIndex].form_schema = [];
      }
      setFormData(prev => ({ ...prev, sections: updated }));
  };

  const handleColumnFile = (e, sectionIndex, colIndex, fieldKey) => {
      const file = e.target.files[0];
      if(file) {
          const reader = new FileReader();
          reader.onloadend = () => updateColumnContent(sectionIndex, colIndex, fieldKey, reader.result);
          reader.readAsDataURL(file);
      }
  };

  const addDownloadToFileList = (sectionIndex, colIndex, fileObj) => {
      const updated = [...formData.sections];
      const colData = updated[sectionIndex].column_data[colIndex];
      const currentList = colData.files_list || [];
      const reader = new FileReader();
      reader.onloadend = () => {
          currentList.push({ title: fileObj.title, file_data: reader.result });
          updated[sectionIndex].column_data[colIndex].files_list = currentList;
          setFormData(prev => ({ ...prev, sections: updated }));
      };
      reader.readAsDataURL(fileObj.file);
  };

  // --- 4. ADVANCED FORM BUILDER ---
  const addFieldToColumn = (sectionIndex, colIndex) => {
      const updated = [...formData.sections];
      const col = updated[sectionIndex].column_data[colIndex];
      if (!col.form_schema) col.form_schema = [];
      
      col.form_schema.push({ 
          id: Date.now(), 
          label: '', type: 'text', options: '', required: false,
          logic_target: '', logic_value: '' 
      });
      setFormData(prev => ({ ...prev, sections: updated }));
  };

  const updateFieldInColumn = (sectionIndex, colIndex, fieldIndex, key, value) => {
      const updated = [...formData.sections];
      updated[sectionIndex].column_data[colIndex].form_schema[fieldIndex][key] = value;
      setFormData(prev => ({ ...prev, sections: updated }));
  };

  const removeFieldFromColumn = (sectionIndex, colIndex, fieldIndex) => {
      const updated = [...formData.sections];
      updated[sectionIndex].column_data[colIndex].form_schema.splice(fieldIndex, 1);
      setFormData(prev => ({ ...prev, sections: updated }));
  };

  // --- 5. Modal Ops ---
  const handleCloseFormModal = () => {
      // Trigger confirmation instead of window.confirm
      setConfirmState({
          isOpen: true,
          title: 'Close without saving?',
          message: 'Any unsaved changes will be stored in your draft.',
          action: () => setIsFormOpen(false)
      });
  };

  const openCreateModal = () => {
    if (hasSavedDraft && !selectedPage) {
        // Trigger confirmation for draft
        setConfirmState({
            isOpen: true,
            title: 'Resume Draft?',
            message: 'You have an unsaved draft from a previous session. Do you want to continue editing it?',
            action: loadDraft, // Confirm = Load
            onCancel: discardDraft // Cancel = Discard & New
        });
    } else {
        setSelectedPage(null);
        setFormData(emptyForm);
        setActiveTab('content');
        setIsFormOpen(true);
    }
  };

  const openEditModal = (page) => {
    setSelectedPage(page);
    setFormData({ 
      title: page.title,
      slug: page.slug,
      content: page.content || '',
      banner_image: page.banner_image || '',
      banner_caption: page.banner_caption || '',
      sections: page.sections || [] 
    });
    setActiveTab('content');
    setIsFormOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (selectedPage) {
        await axios.put(`/pages/${selectedPage.id}`, formData);
        toast.success('Page updated');
      } else {
        await axios.post('/pages', formData);
        toast.success('Page created');
        localStorage.removeItem('page_builder_draft');
        setHasSavedDraft(false);
      }
      setIsFormOpen(false);
      fetchData();
    } catch (error) { toast.error('Operation failed'); } 
    finally { setIsSubmitting(false); }
  };

  const handleDelete = async () => {
    setIsSubmitting(true);
    try {
      await axios.delete(`/pages/${deleteId}`);
      toast.success('Page deleted');
      setIsDeleteOpen(false);
      fetchData();
    } catch (error) { toast.error('Failed to delete'); } 
    finally { setIsSubmitting(false); }
  };

  const columns = [
    { name: 'Page Title', selector: row => row.title, sortable: true, cell: row => <div className="font-semibold text-gray-700 py-2">{row.title}</div> },
    { name: 'URL Slug', selector: row => row.slug, cell: row => <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">/{row.slug}</span> },
    { name: 'Actions', cell: row => (
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
            <h1 className="text-2xl font-bold text-gray-800">Web Pages</h1>
            <p className="text-gray-500 text-sm">Manage generic pages.</p>
        </div>
        <div className="flex gap-3">
            {hasSavedDraft && (
                <Button variant="secondary" onClick={loadDraft} className="border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100">
                    <IoWarningOutline className="mr-2"/> Resume Draft
                </Button>
            )}
            <Button onClick={openCreateModal}><IoAdd className="mr-2 text-xl" /> Create Page</Button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <DataTable columns={columns} data={pages} pagination progressPending={loading} customStyles={glossyTableStyles} />
      </div>

      {/* Main Builder Modal */}
      <Modal isOpen={isFormOpen} onClose={handleCloseFormModal} title={selectedPage ? "Edit Page" : "Create Page"} size="2xl">
        <form onSubmit={handleSubmit} className="space-y-6 h-[85vh] flex flex-col w-full">
          
          <div className="flex border-b border-gray-200 shrink-0 overflow-x-auto">
              {['content', 'builder'].map((tab) => (
                  <button key={tab} type="button" onClick={() => setActiveTab(tab)} className={`px-6 py-3 text-sm font-medium capitalize transition-colors border-b-2 whitespace-nowrap ${activeTab === tab ? 'border-pcu-purple text-pcu-purple' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                      {tab === 'builder' ? 'Page Builder' : 'Main Content'}
                  </button>
              ))}
          </div>

          <div className="flex-1 overflow-y-auto p-1 custom-scrollbar">
              
              {/* TAB 1: CONTENT */}
              {activeTab === 'content' && (
                  <div className="space-y-4 p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div><label className="block text-sm font-medium text-gray-700 mb-1">Page Title</label><input type="text" className="input-field" value={formData.title} onChange={handleTitleChange} required /></div>
                          <div><label className="block text-sm font-medium text-gray-700 mb-1">URL Slug</label><input type="text" className="input-field" value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} placeholder="about-us" /></div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div><label className="block text-sm font-medium text-gray-700 mb-1">Banner Image</label><input type="file" className="input-field p-2" onChange={handleBannerChange} />{formData.banner_image && <img src={getImageUrl(formData.banner_image)} className="h-24 mt-2 rounded-lg object-cover border w-full" />}</div>
                          <div><label className="block text-sm font-medium text-gray-700 mb-1">Banner Caption</label><input type="text" className="input-field h-[46px]" placeholder="e.g. Excellence in Education" value={formData.banner_caption} onChange={e => setFormData({...formData, banner_caption: e.target.value})} /></div>
                      </div>
                      <div><label className="block text-sm font-medium text-gray-700 mb-1">Intro Content (Optional)</label><textarea className="input-field min-h-[150px]" value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} /></div>
                  </div>
              )}

              {/* TAB 2: PAGE BUILDER */}
              {activeTab === 'builder' && (
                  <div className="space-y-6 p-4">
                      <div className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-200">
                          <div><h3 className="font-bold text-gray-700">Section Builder</h3><p className="text-xs text-gray-500">Create flexible rows and columns.</p></div>
                          <Button type="button" onClick={() => addSection('custom')} size="sm"><IoAdd/> Add Row</Button>
                      </div>

                      <div className="space-y-6">
                          {formData.sections.map((section, sIndex) => (
                              <div key={section.id || sIndex} className="border border-gray-300 rounded-xl bg-white shadow-sm overflow-hidden">
                                  {/* Row Header */}
                                  <div className="bg-gray-100 p-2 flex justify-between items-center border-b border-gray-200">
                                      <div className="flex items-center gap-4">
                                          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-2">Row {sIndex + 1}</span>
                                          <div className="flex items-center gap-1 bg-white rounded border border-gray-300 p-1">
                                              <span className="text-[10px] text-gray-500 font-medium px-1">Columns:</span>
                                              {[1, 2, 3, 4].map(num => (
                                                  <button key={num} type="button" onClick={() => updateColumnCount(sIndex, num)} className={`w-6 h-6 text-xs rounded flex items-center justify-center transition-colors ${section.columns_count === num ? 'bg-pcu-purple text-white' : 'hover:bg-gray-100 text-gray-600'}`}>{num}</button>
                                              ))}
                                          </div>
                                      </div>
                                      <button type="button" onClick={() => removeSection(sIndex)} className="text-red-500 hover:text-red-700 p-2"><IoTrash size={16}/></button>
                                  </div>

                                  {/* Columns Grid */}
                                  <div className="p-4 grid gap-4" style={{ gridTemplateColumns: `repeat(${section.columns_count}, minmax(0, 1fr))` }}>
                                      {section.column_data && section.column_data.map((col, cIndex) => (
                                          <div key={cIndex} className="border border-gray-200 rounded-lg p-3 bg-gray-50 flex flex-col gap-3 min-h-[350px]">
                                              
                                              {/* Content Type Selector */}
                                              <div className="flex flex-col gap-1 mb-2">
                                                  <label className="text-[10px] font-bold text-gray-400 uppercase">Column Content</label>
                                                  <select className="input-field text-xs py-1" value={col.type || 'empty'} onChange={(e) => updateColumnContent(sIndex, cIndex, 'type', e.target.value)}>
                                                      <option value="empty">-- Empty --</option>
                                                      <option value="text">Text & Content</option>
                                                      <option value="image">Image Only</option>
                                                      <option value="hero">Hero Card</option>
                                                      <option value="form">Dynamic Form</option>
                                                      <option value="files">Downloadable Files</option>
                                                  </select>
                                              </div>

                                              {/* 1. TEXT */}
                                              {col.type === 'text' && (
                                                  <div className="flex-1 flex flex-col gap-2">
                                                      <input type="text" className="input-field text-xs font-bold" placeholder="Headline" value={col.heading || ''} onChange={(e) => updateColumnContent(sIndex, cIndex, 'heading', e.target.value)} />
                                                      <textarea className="input-field text-xs flex-1" placeholder="Body text..." value={col.content || ''} onChange={(e) => updateColumnContent(sIndex, cIndex, 'content', e.target.value)} />
                                                      <div className="flex gap-2">
                                                          <input type="text" className="input-field text-xs flex-1" placeholder="Btn Text" value={col.btn_text || ''} onChange={(e) => updateColumnContent(sIndex, cIndex, 'btn_text', e.target.value)} />
                                                          <input type="text" className="input-field text-xs flex-1" placeholder="Btn Link" value={col.btn_url || ''} onChange={(e) => updateColumnContent(sIndex, cIndex, 'btn_url', e.target.value)} />
                                                      </div>
                                                  </div>
                                              )}

                                              {/* 2. IMAGE */}
                                              {col.type === 'image' && (
                                                  <div className="flex-1 flex flex-col gap-2">
                                                      <div className="relative flex-1 bg-white border border-dashed border-gray-300 rounded flex items-center justify-center overflow-hidden hover:border-blue-400">
                                                          {col.image ? <img src={getImageUrl(col.image)} className="w-full h-full object-cover"/> : <span className="text-xs text-gray-400"><IoImageOutline/> Upload</span>}
                                                          <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleColumnFile(e, sIndex, cIndex, 'image')} />
                                                      </div>
                                                      <input type="text" className="input-field text-xs" placeholder="Caption" value={col.caption || ''} onChange={(e) => updateColumnContent(sIndex, cIndex, 'caption', e.target.value)} />
                                                  </div>
                                              )}

                                              {/* 3. HERO */}
                                              {col.type === 'hero' && (
                                                  <div className="flex-1 flex flex-col gap-2 relative bg-gray-800 rounded overflow-hidden p-2 text-white">
                                                      {col.bg_image && <img src={getImageUrl(col.bg_image)} className="absolute inset-0 w-full h-full object-cover opacity-50"/>}
                                                      <div className="relative z-10 flex flex-col gap-2 h-full justify-center">
                                                          <div className="text-center">
                                                              <input type="file" className="text-[10px] text-gray-300 mb-1 mx-auto" onChange={(e) => handleColumnFile(e, sIndex, cIndex, 'bg_image')} />
                                                          </div>
                                                          <input type="text" className="bg-transparent border border-white/30 rounded text-xs px-2 py-1 text-white placeholder-gray-300 text-center font-bold" placeholder="Hero Title" value={col.heading || ''} onChange={(e) => updateColumnContent(sIndex, cIndex, 'heading', e.target.value)} />
                                                          <textarea className="bg-transparent border border-white/30 rounded text-xs px-2 py-1 flex-1 text-white placeholder-gray-300 text-center" placeholder="Overlay Text..." value={col.content || ''} onChange={(e) => updateColumnContent(sIndex, cIndex, 'content', e.target.value)} />
                                                          <input type="text" className="bg-white/20 border border-white/30 rounded text-xs px-2 py-1 text-white placeholder-gray-300 text-center" placeholder="Btn Text" value={col.btn_text || ''} onChange={(e) => updateColumnContent(sIndex, cIndex, 'btn_text', e.target.value)} />
                                                      </div>
                                                  </div>
                                              )}

                                              {/* 4. DYNAMIC FORM (Improved UI - Side by Side) */}
                                              {col.type === 'form' && (
                                                  <div className="flex-1 flex flex-col bg-purple-50 p-2 rounded border border-purple-100 h-full">
                                                      <div className="flex justify-between items-center mb-2 pb-2 border-b border-purple-200">
                                                          <span className="text-[10px] font-bold text-purple-800 uppercase flex items-center gap-1"><IoSettingsOutline/> Form Builder</span>
                                                          <button type="button" onClick={() => addFieldToColumn(sIndex, cIndex)} className="text-[10px] bg-white border border-purple-300 text-purple-700 px-2 rounded flex items-center gap-1 hover:bg-purple-100"><IoAdd/> Field</button>
                                                      </div>
                                                      <div className="overflow-y-auto flex-1 space-y-3 custom-scrollbar pr-1">
                                                          {col.form_schema && col.form_schema.map((field, fIdx) => (
                                                              <div key={fIdx} className="bg-white p-3 rounded border border-purple-200 shadow-sm flex flex-col gap-2">
                                                                  
                                                                  {/* ROW 1: Label and Type (Side by Side) */}
                                                                  <div className="flex gap-2">
                                                                      <input 
                                                                        type="text" 
                                                                        className="input-field py-1 text-xs w-2/3 font-medium" 
                                                                        placeholder="Label (e.g. Full Name)" 
                                                                        value={field.label} 
                                                                        onChange={(e) => updateFieldInColumn(sIndex, cIndex, fIdx, 'label', e.target.value)} 
                                                                      />
                                                                      <select 
                                                                        className="input-field py-1 text-xs w-1/3" 
                                                                        value={field.type} 
                                                                        onChange={(e) => updateFieldInColumn(sIndex, cIndex, fIdx, 'type', e.target.value)}
                                                                      >
                                                                          <option value="text">Text</option>
                                                                          <option value="email">Email</option>
                                                                          <option value="number">Number</option>
                                                                          <option value="textarea">Area</option>
                                                                          <option value="select">Select</option>
                                                                          <option value="radio">Radio</option>
                                                                          <option value="checkbox">Check</option>
                                                                          <option value="file">File</option>
                                                                      </select>
                                                                  </div>
                                                                  
                                                                  {/* ROW 2: Options (Conditional) */}
                                                                  {['select', 'radio', 'checkbox'].includes(field.type) && (
                                                                      <div className="bg-blue-50 p-2 rounded">
                                                                          <label className="block text-[9px] font-bold text-blue-700 uppercase mb-1">Options (comma separated)</label>
                                                                          <input type="text" className="input-field text-xs py-1" placeholder="e.g. Option A, Option B, Option C" value={field.options || ''} onChange={(e) => updateFieldInColumn(sIndex, cIndex, fIdx, 'options', e.target.value)} />
                                                                      </div>
                                                                  )}

                                                                  {/* ROW 3: Settings & Logic */}
                                                                  <div className="flex items-center justify-between gap-2 mt-1">
                                                                      {/* Required Toggle */}
                                                                      <label className="flex items-center text-[10px] gap-1 cursor-pointer select-none bg-gray-50 px-2 py-1 rounded border">
                                                                          <input type="checkbox" checked={field.required} onChange={(e) => updateFieldInColumn(sIndex, cIndex, fIdx, 'required', e.target.checked)}/> Req
                                                                      </label>
                                                                      
                                                                      {/* Conditional Logic Trigger */}
                                                                      <div className="flex items-center gap-1 bg-gray-50 p-1 rounded border border-gray-100 flex-1 justify-center">
                                                                          <span className="text-[9px] text-gray-500 font-bold shrink-0"><IoGitNetworkOutline/> If:</span>
                                                                          <select className="border border-gray-200 rounded text-[9px] w-14 py-0.5 bg-white" value={field.logic_target || ''} onChange={(e) => updateFieldInColumn(sIndex, cIndex, fIdx, 'logic_target', e.target.value)}>
                                                                              <option value="">(Any)</option>
                                                                              {col.form_schema.slice(0, fIdx).map((prev, pi) => (
                                                                                  <option key={prev.id} value={prev.label}>{prev.label?.substring(0,5)}..</option>
                                                                              ))}
                                                                          </select>
                                                                          <span className="text-[9px] text-gray-400">=</span>
                                                                          <input type="text" className="border border-gray-200 rounded text-[9px] w-10 px-1 py-0.5" placeholder="Val" value={field.logic_value || ''} onChange={(e) => updateFieldInColumn(sIndex, cIndex, fIdx, 'logic_value', e.target.value)} />
                                                                      </div>

                                                                      {/* Delete Button */}
                                                                      <button type="button" onClick={() => removeFieldFromColumn(sIndex, cIndex, fIdx)} className="text-red-400 hover:text-red-600 bg-red-50 p-1.5 rounded"><IoCloseCircleOutline size={16}/></button>
                                                                  </div>
                                                              </div>
                                                          ))}
                                                          {(!col.form_schema || col.form_schema.length === 0) && <div className="text-[10px] text-center text-gray-400 py-4">No fields added</div>}
                                                      </div>
                                                  </div>
                                              )}

                                              {/* 5. FILES */}
                                              {col.type === 'files' && (
                                                  <div className="flex-1 flex flex-col gap-2">
                                                      <div className="bg-white p-2 border border-gray-200 rounded flex-1 overflow-y-auto max-h-[150px]">
                                                          {col.files_list?.map((f, i) => (
                                                              <div key={i} className="text-[10px] flex justify-between border-b pb-1 mb-1">{f.title}</div>
                                                          ))}
                                                      </div>
                                                      <div className="flex gap-1">
                                                          <input type="text" className="input-field text-[10px] py-1" placeholder="Title" id={`ft-${sIndex}-${cIndex}`} />
                                                          <input type="file" className="w-16 text-[10px]" id={`ff-${sIndex}-${cIndex}`} />
                                                          <button type="button" className="text-[10px] bg-blue-50 text-blue-600 px-2 rounded" onClick={() => {
                                                              const t = document.getElementById(`ft-${sIndex}-${cIndex}`);
                                                              const f = document.getElementById(`ff-${sIndex}-${cIndex}`);
                                                              if(t.value && f.files[0]) {
                                                                  addDownloadToFileList(sIndex, cIndex, { title: t.value, file: f.files[0] });
                                                                  t.value = ''; f.value = '';
                                                              }
                                                          }}>Add</button>
                                                      </div>
                                                  </div>
                                              )}

                                          </div>
                                      ))}
                                  </div>
                              </div>
                          ))}
                          
                          {formData.sections.length === 0 && <div className="text-center py-12 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">Start by clicking "Add Row" above.</div>}
                      </div>
                  </div>
              )}
          </div>

          <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3 shrink-0">
            <Button variant="secondary" onClick={handleCloseFormModal}>Cancel</Button>
            <Button type="submit" isLoading={isSubmitting}><IoSaveOutline className="mr-2"/> Save Page</Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} onConfirm={handleDelete} title="Delete Page?" message="This action cannot be undone." isLoading={isSubmitting} />
      
      {/* General Confirmation Modal */}
      <ConfirmModal 
        isOpen={confirmState.isOpen} 
        onClose={() => setConfirmState({ ...confirmState, isOpen: false })} 
        onConfirm={handleConfirmAction} 
        title={confirmState.title} 
        message={confirmState.message} 
      />
    </div>
  );
};

export default Pages;