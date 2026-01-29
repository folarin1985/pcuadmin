import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import DataTable from 'react-data-table-component';
import { toast } from 'react-hot-toast';
import { 
  IoAdd, IoPencil, IoTrash, IoWalletOutline, IoCalendarOutline, 
  IoDocumentAttachOutline, IoListOutline, IoCloseCircleOutline, IoSearchOutline,
  IoInformationCircleOutline, IoCloudUploadOutline, IoGridOutline, IoCashOutline,
  IoSchoolOutline
} from 'react-icons/io5';
import { useAuth } from '../../contexts/AuthContext';

import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import ConfirmModal from '../../components/common/ConfirmModal';
import Spinner from '../../components/common/Spinner';
import { glossyTableStyles } from '../../styles/tableStyles';

const TuitionManagement = () => {
  const { getImageUrl } = useAuth();
  
  // --- STATE ---
  const [schedules, setSchedules] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  // Default structure for a clean PCU Fee Matrix
  const initialForm = { 
    academic_session_id: '', 
    faculty_id: '',
    title: '', 
    acceptance_fee: 40000,
    pdf: null,
    installment_config: [
        { label: '1st Installment', percent: 50, note: 'Before Resumption' },
        { label: '2nd Installment', percent: 20, note: 'Before 1st Sem Exams' },
        { label: '3rd Installment', percent: 20, note: 'Before 2nd Sem Resumption' },
        { label: '4th Installment', percent: 10, note: 'Before 2nd Sem Exams' }
    ],
    data: {
      headers: ["100L", "200L", "300L", "400L"], 
      rows: [{ description: '', amounts: ['', '', '', ''] }] 
    }
  };
  const [formData, setFormData] = useState(initialForm);

  // --- DATA FETCHING ---
  const fetchData = async () => {
    try {
      setLoading(true);
      const [feeRes, sessRes, facRes] = await Promise.all([
        axios.get('/admin/tuition-fees'),
        axios.get('/academic-sessions'),
        axios.get('/faculties') // Fetches from your existing faculties table
      ]);
      setSchedules(feeRes.data.data || []);
      setSessions(sessRes.data.data || []);
      setFaculties(facRes.data.data || []);
    } catch (error) {
      toast.error('Failed to load tuition management data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // --- MATRIX GRID LOGIC ---
  const addLevelColumn = () => {
    setFormData(prev => ({
      ...prev,
      data: {
        headers: [...(prev.data?.headers || []), "New Level"],
        rows: (prev.data?.rows || []).map(row => ({
          ...row,
          amounts: [...(row.amounts || []), '']
        }))
      }
    }));
  };

  const removeLevelColumn = (index) => {
    if (formData.data.headers.length <= 1) return toast.error("Must have at least one column");
    setFormData(prev => ({
      ...prev,
      data: {
        headers: prev.data.headers.filter((_, i) => i !== index),
        rows: prev.data.rows.map(row => ({
          ...row,
          amounts: row.amounts.filter((_, i) => i !== index)
        }))
      }
    }));
  };

  const addFeeRow = () => {
    const emptyAmounts = (formData.data?.headers || []).map(() => '');
    setFormData(prev => ({
      ...prev,
      data: {
        ...prev.data,
        rows: [...(prev.data?.rows || []), { description: '', amounts: emptyAmounts }]
      }
    }));
  };

  const removeFeeRow = (index) => {
    if (formData.data.rows.length <= 1) return toast.error("Must have at least one row");
    const newRows = [...formData.data.rows];
    newRows.splice(index, 1);
    setFormData(prev => ({ ...prev, data: { ...prev.data, rows: newRows } }));
  };

  const handleHeaderChange = (index, value) => {
    const newHeaders = [...formData.data.headers];
    newHeaders[index] = value;
    setFormData(prev => ({ ...prev, data: { ...prev.data, headers: newHeaders } }));
  };

  const handleAmountChange = (rowIdx, colIdx, value) => {
    const newRows = [...formData.data.rows];
    newRows[rowIdx].amounts[colIdx] = value;
    setFormData(prev => ({ ...prev, data: { ...prev.data, rows: newRows } }));
  };

  // --- INSTALLMENT LOGIC ---
  const addInstallmentRow = () => {
    setFormData(prev => ({
        ...prev,
        installment_config: [...(prev.installment_config || []), { label: '', percent: '', note: '' }]
    }));
  };

  const removeInstallmentRow = (index) => {
    if (formData.installment_config.length <= 1) return toast.error("Must have at least one installment");
    const newConfig = [...formData.installment_config];
    newConfig.splice(index, 1);
    setFormData(prev => ({ ...prev, installment_config: newConfig }));
  };

  const handleInstallmentChange = (index, field, value) => {
    const newConfig = [...formData.installment_config];
    newConfig[index][field] = value;
    setFormData(prev => ({ ...prev, installment_config: newConfig }));
  };

  // --- MODAL & FORM HANDLERS ---
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === "application/pdf") {
        setFormData(prev => ({ ...prev, pdf: file }));
    } else {
        toast.error("Please select a valid PDF file");
    }
  };

  const openCreateModal = () => {
    setSelectedSchedule(null);
    setFormData(initialForm);
    setIsFormOpen(true);
  };

  const openEditModal = (row) => {
    setSelectedSchedule(row);
    const normalizedData = (row.data && row.data.headers && row.data.rows) ? row.data : initialForm.data;
    setFormData({
      academic_session_id: row.academic_session_id || '',
      faculty_id: row.faculty_id || '',
      title: row.title || '',
      acceptance_fee: row.acceptance_fee || 40000,
      installment_config: row.installment_config || initialForm.installment_config,
      pdf: null,
      data: normalizedData
    });
    setIsFormOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const payload = new FormData();
    payload.append('academic_session_id', formData.academic_session_id);
    payload.append('faculty_id', formData.faculty_id);
    payload.append('title', formData.title);
    payload.append('acceptance_fee', formData.acceptance_fee);
    payload.append('installment_config', JSON.stringify(formData.installment_config));
    payload.append('data', JSON.stringify(formData.data)); 
    
    if (formData.pdf instanceof File) payload.append('pdf', formData.pdf);

    try {
      const config = { headers: { 'Content-Type': 'multipart/form-data' } };
      if (selectedSchedule) {
          await axios.post(`/admin/tuition-fees/${selectedSchedule.id}?_method=PUT`, payload, config);
          toast.success('Regime updated');
      } else {
          await axios.post('/admin/tuition-fees', payload, config);
          toast.success('New regime published');
      }
      setIsFormOpen(false);
      fetchData();
    } catch (error) {
      const errors = error.response?.data?.data || {};
      Object.values(errors).flat().forEach(msg => toast.error(msg));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsSubmitting(true);
    try {
      await axios.delete(`/admin/tuition-fees/${deleteId}`);
      toast.success('Regime deleted');
      setIsDeleteOpen(false);
      fetchData();
    } catch (error) { toast.error('Failed to delete schedule'); }
    finally { setIsSubmitting(false); }
  };

  const filteredItems = useMemo(() => {
    return schedules.filter(s => s.title.toLowerCase().includes(search.toLowerCase()));
  }, [schedules, search]);

  const columns = [
    {
      name: 'Fee Regime',
      selector: row => row.title,
      sortable: true,
      cell: row => (
        <div className="flex items-center gap-3 py-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 flex-shrink-0">
                <IoWalletOutline size={20} />
            </div>
            <div>
                <span className="font-bold text-gray-800 block">{row.title}</span>
                <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">
                    {row.faculty?.name || 'No Faculty'} • {row.session?.name}
                </span>
            </div>
        </div>
      ),
      grow: 2,
    },
    {
      name: 'Levels',
      cell: row => (
        <div className="flex flex-wrap gap-1">
            {row.data?.headers?.map((h, i) => (
                <span key={i} className="text-[9px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded border border-gray-200 font-bold">{h}</span>
            ))}
        </div>
      )
    },
    {
        name: 'Actions',
        cell: row => (
          <div className="flex gap-2">
            <button onClick={() => openEditModal(row)} className="p-2 text-gray-400 hover:text-pcu-purple hover:bg-purple-50 rounded-lg transition-all"><IoPencil size={18} /></button>
            <button onClick={() => { setDeleteId(row.id); setIsDeleteOpen(true); }} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"><IoTrash size={18} /></button>
          </div>
        ),
        button: true,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Tuition & Fees</h1>
          <p className="text-gray-500 text-sm">Matrix Grid Management for Faculty Regimes.</p>
        </div>
        <Button onClick={openCreateModal}>
          <IoAdd className="mr-2 text-xl" /> Create Fee Matrix
        </Button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-end">
          <div className="relative w-full md:w-72">
            <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search regimes..." className="input-field py-2 pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
        <DataTable columns={columns} data={filteredItems} pagination progressPending={loading} customStyles={glossyTableStyles} highlightOnHover />
      </div>

      <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={selectedSchedule ? "Update Fee Matrix" : "New Fee Matrix"} size="xl">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* LEFT: SETTINGS & DYNAMIC INSTALLMENTS */}
            <div className="space-y-6">
              <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 space-y-4">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><IoInformationCircleOutline /> Basic Meta</h4>
                  <select className="input-field" value={formData.academic_session_id} onChange={e => setFormData({...formData, academic_session_id: e.target.value})} required>
                    <option value="">Choose Session...</option>
                    {sessions.map(s => <option key={s.id} value={s.id}>{s.name} {s.is_current ? '(Current)' : ''}</option>)}
                  </select>
                  <select className="input-field" value={formData.faculty_id} onChange={e => setFormData({...formData, faculty_id: e.target.value})} required>
                    <option value="">Assign Faculty...</option>
                    {faculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                  <input type="text" className="input-field font-semibold" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Title (e.g. Science Freshers)" required />
                  <input type="number" className="input-field" value={formData.acceptance_fee} onChange={e => setFormData({...formData, acceptance_fee: e.target.value})} placeholder="Acceptance Fee (₦)" required />

                  <div className="pt-4 space-y-3">
                    <div className="flex justify-between items-center">
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><IoCashOutline /> Installments</h4>
                        <button type="button" onClick={addInstallmentRow} className="text-[10px] font-bold text-indigo-600 hover:underline">+ Add</button>
                    </div>
                    <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                        {formData.installment_config?.map((inst, i) => (
                            <div key={i} className="p-3 bg-white border rounded-xl relative group">
                                <button type="button" onClick={() => removeInstallmentRow(i)} className="absolute top-1 right-1 text-red-300 opacity-0 group-hover:opacity-100 transition-opacity"><IoCloseCircleOutline /></button>
                                <input type="text" className="w-full text-[10px] font-bold border-b mb-2 focus:outline-none" value={inst.label} onChange={e => handleInstallmentChange(i, 'label', e.target.value)} placeholder="Phase Name" />
                                <div className="flex gap-2">
                                    <input type="number" className="w-12 p-1 text-[10px] border rounded" value={inst.percent} onChange={e => handleInstallmentChange(i, 'percent', e.target.value)} placeholder="%" />
                                    <input type="text" className="flex-1 p-1 text-[10px] border rounded italic" value={inst.note} onChange={e => handleInstallmentChange(i, 'note', e.target.value)} placeholder="Note" />
                                </div>
                            </div>
                        ))}
                    </div>
                  </div>

                  <div className="pt-2">
                    <label className="block text-[10px] font-black text-gray-700 mb-2 uppercase flex items-center gap-2"><IoDocumentAttachOutline /> PDF Schedule</label>
                    <div className="relative h-20 border-2 border-dashed border-gray-200 rounded-xl bg-white flex flex-col items-center justify-center group cursor-pointer">
                        <input type="file" onChange={handleFileChange} accept="application/pdf" className="absolute inset-0 opacity-0 cursor-pointer" />
                        <IoCloudUploadOutline className="text-gray-300 group-hover:text-indigo-400 text-xl transition-colors" />
                        <span className="text-[9px] text-gray-400 font-bold mt-1 uppercase text-center">{formData.pdf ? formData.pdf.name : "Choose File"}</span>
                    </div>
                  </div>
              </div>
            </div>

            {/* RIGHT: MATRIX EDITOR */}
            <div className="lg:col-span-2 space-y-4">
                <div className="flex justify-between items-center bg-white py-2 sticky top-0 z-10">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><IoGridOutline /> Pricing Matrix</h4>
                    <button type="button" onClick={addLevelColumn} className="text-[10px] font-black text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-indigo-50 px-3 py-1.5 rounded-full transition-colors uppercase">
                        <IoAdd /> Add Level
                    </button>
                </div>

                <div className="overflow-x-auto border border-gray-200 rounded-2xl bg-white shadow-sm custom-scrollbar">
                    <table className="w-full text-left border-collapse min-w-[600px]">
                        <thead>
                            <tr className="bg-gray-50 border-b">
                                <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest w-64">Description</th>
                                {formData.data?.headers?.map((h, i) => (
                                    <th key={i} className="p-2 text-center min-w-[100px] relative group">
                                        <input type="text" value={h} onChange={(e) => handleHeaderChange(i, e.target.value)} className="w-full bg-transparent text-center font-black text-indigo-600 border-none focus:ring-0 text-[11px] uppercase" />
                                        <button type="button" onClick={() => removeLevelColumn(i)} className="absolute -top-1 right-0 text-red-300 opacity-0 group-hover:opacity-100 transition-all"><IoCloseCircleOutline size={16}/></button>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {formData.data?.rows?.map((row, rIdx) => (
                                <tr key={rIdx} className="group/row">
                                    <td className="p-3 relative">
                                        <input type="text" placeholder="Description" className="w-full p-2 text-xs rounded-lg border border-transparent hover:border-gray-200 focus:border-indigo-400 font-bold text-gray-700" value={row.description} onChange={(e) => {
                                            const newRows = [...formData.data.rows];
                                            newRows[rIdx].description = e.target.value;
                                            setFormData({...formData, data: {...formData.data, rows: newRows}});
                                        }} required />
                                        <button type="button" onClick={() => removeFeeRow(rIdx)} className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full opacity-0 group-hover/row:opacity-100 text-red-300 hover:text-red-500 transition-all pr-2"><IoTrash size={14}/></button>
                                    </td>
                                    {row.amounts?.map((amt, cIdx) => (
                                        <td key={cIdx} className="p-2">
                                            <input type="number" className="w-full p-2 text-center text-xs rounded-lg border border-transparent hover:border-gray-200 focus:border-indigo-400 outline-none font-mono font-bold" value={amt} onChange={(e) => handleAmountChange(rIdx, cIdx, e.target.value)} required />
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <button type="button" onClick={addFeeRow} className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-[10px] font-black text-gray-400 hover:bg-gray-50 transition-all uppercase tracking-widest">+ Add Fee Row</button>
            </div>
          </div>

          <div className="pt-6 flex justify-end gap-3 border-t border-gray-100">
            <Button variant="secondary" onClick={() => setIsFormOpen(false)}>Cancel</Button>
            <Button type="submit" isLoading={isSubmitting}>{selectedSchedule ? "Update Regime" : "Publish Regime"}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} onConfirm={handleDelete} title="Delete Regime?" message="This will remove the grid from the website permanently." isLoading={isSubmitting} />
    </div>
  );
};

export default TuitionManagement;