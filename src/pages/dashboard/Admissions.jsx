import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DataTable from 'react-data-table-component';
import { toast } from 'react-hot-toast';
import { 
  IoPersonAddOutline, IoSettingsOutline, IoListOutline, IoCheckmarkCircle, 
  IoCloseCircle, IoEye, IoAdd, IoGitNetworkOutline, IoCloseCircleOutline, 
  IoOptionsOutline, IoLockClosedOutline, IoDocumentTextOutline, IoSchoolOutline, IoBookOutline
} from 'react-icons/io5';
import { useAuth } from '../../contexts/AuthContext';

import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import ConfirmModal from '../../components/common/ConfirmModal';
import { glossyTableStyles } from '../../styles/tableStyles';

const Admissions = () => {
  const { getImageUrl } = useAuth();
  const [activeTab, setActiveTab] = useState('applications'); 
  const [loading, setLoading] = useState(true);
  
  // --- NEW: Application Type Toggle ---
  const [appType, setAppType] = useState('undergraduate'); // 'undergraduate' or 'jupeb'

  // Data
  const [ugApplications, setUgApplications] = useState([]); // Undergraduate
  const [jupebApplications, setJupebApplications] = useState([]); // JUPEB
  const [degreeTypes, setDegreeTypes] = useState([]);
  const [sessions, setSessions] = useState([]);
  
  // Builder State
  const [selectedDegree, setSelectedDegree] = useState(null);
  const [formSchema, setFormSchema] = useState([]);
  
  // Application View State
  const [viewApp, setViewApp] = useState(null);
  const [statusAction, setStatusAction] = useState({ id: null, status: '' });
  
  // Session Form
  const [sessionForm, setSessionForm] = useState({ name: '', is_current: false, is_open: true });
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- FETCH DATA ---
  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch UG, JUPEB, Degrees, Sessions all at once
      const [ugRes, jupebRes, degRes, sessRes] = await Promise.all([
          axios.get('/admissions').catch(() => ({ data: { data: [] } })),
          axios.get('/jupeb/applications').catch(() => ({ data: { data: [] } })), // NEW ENDPOINT
          axios.get('/degree-types'),
          axios.get('/academic-sessions')
      ]);

      setUgApplications(ugRes.data.data);
      setJupebApplications(jupebRes.data.data);
      setDegreeTypes(degRes.data.data);
      setSessions(sessRes.data.data);
      
      if(degRes.data.data.length > 0 && !selectedDegree) {
          setSelectedDegree(degRes.data.data[0].id);
      }
    } catch (e) { 
        console.error(e);
        toast.error('Failed to load data'); 
    } finally { 
        setLoading(false); 
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Fetch Schema (Builder Logic)
  useEffect(() => {
      if (activeTab === 'builder' && selectedDegree) {
          axios.get(`/admission-forms/${selectedDegree}`)
               .then(res => setFormSchema(res.data.data || []))
               .catch(() => setFormSchema([]));
      }
  }, [activeTab, selectedDegree]);

  // --- HANDLERS ---
  const handleStatusUpdate = async () => {
      try {
          // Dynamic Endpoint based on Application Type
          const endpoint = appType === 'jupeb' 
            ? `/jupeb/applications/${statusAction.id}/status`
            : `/admissions/${statusAction.id}/status`;

          await axios.post(endpoint, { status: statusAction.status });
          
          toast.success(`Application marked as ${statusAction.status}`);
          setStatusAction({ id: null, status: '' });
          setViewApp(null); 
          fetchData();
      } catch(e) { toast.error("Failed to update status"); }
  };

  // Builder Handlers
  const addField = () => { setFormSchema([...formSchema, { id: Date.now(), label: '', type: 'text', required: false, options: '', logic_target: '', logic_value: '' }]); };
  const updateField = (index, key, value) => { const updated = [...formSchema]; updated[index][key] = value; setFormSchema(updated); };
  const removeField = (index) => { const updated = [...formSchema]; updated.splice(index, 1); setFormSchema(updated); };
  const saveSchema = async () => {
      if (!selectedDegree) return toast.error("Please select a degree type.");
      if (formSchema.length === 0) return toast.error("Configuration is empty.");
      setIsSubmitting(true);
      try {
          await axios.post('/admission-forms', { degree_type_id: selectedDegree, schema: formSchema });
          toast.success("Form configuration saved successfully");
      } catch(e) { toast.error("Save failed"); } finally { setIsSubmitting(false); }
  };

  const saveSession = async (e) => {
      e.preventDefault();
      setIsSubmitting(true);
      try {
          await axios.post('/academic-sessions', sessionForm);
          toast.success("Session saved");
          setIsSessionModalOpen(false);
          fetchData();
      } catch(e) { toast.error("Operation failed"); }
      finally { setIsSubmitting(false); }
  };


  // --- COLUMNS ---
  const appColumns = [
      { name: 'App No', selector: row => row.application_number || row.application_no, sortable: true, width: '160px', cell: row => <span className="font-mono text-xs font-bold text-gray-600">{row.application_number || row.application_no}</span> },
      { name: 'Applicant', selector: row => row.last_name, cell: row => <div className="py-2"><p className="font-bold text-gray-800">{row.first_name} {row.last_name}</p><p className="text-xs text-gray-500">{row.email}</p></div>, grow: 2 },
      { name: 'Program', selector: row => row.program?.title, sortable: true, cell: row => <span className="text-sm text-gray-600">{row.program?.title || 'N/A'}</span> },
      { 
        name: 'Type', 
        width: '100px', 
        cell: row => (
          <span className="text-xs bg-gray-100 px-2 py-1 rounded">
            {appType === 'jupeb' ? 'Foundation' : row.degree_type?.abbr || 'UG'}
          </span>
        ) 
      },
      { name: 'Status', selector: row => row.status, cell: row => (
          <span className={`px-2 py-1 rounded text-xs font-bold capitalize ${
              row.status === 'admitted' ? 'bg-green-100 text-green-700' : 
              row.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
          }`}>
              {row.status}
          </span>
      )},
      { name: 'Action', cell: row => <button onClick={() => setViewApp(row)} className="text-blue-600 hover:bg-blue-50 p-2 rounded transition-colors"><IoEye size={18}/></button> }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
              <h1 className="text-2xl font-bold text-gray-800">Admission Management</h1>
              <p className="text-gray-500 text-sm">Review applications and configure admission requirements.</p>
          </div>
          <div className="flex bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
              {[
                  { id: 'applications', label: 'Applications', icon: IoDocumentTextOutline },
                  { id: 'builder', label: 'Form Configuration', icon: IoSettingsOutline },
                  { id: 'sessions', label: 'Sessions', icon: IoListOutline }
              ].map(tab => (
                  <button 
                    key={tab.id} 
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md capitalize transition-all ${activeTab === tab.id ? 'bg-pcu-purple text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
                  >
                      <tab.icon/> {tab.label}
                  </button>
              ))}
          </div>
      </div>

      {/* --- TAB 1: APPLICATIONS --- */}
      {activeTab === 'applications' && (
          <div className="space-y-4">
              {/* Type Toggle Switch */}
              <div className="flex justify-center md:justify-start">
                <div className="bg-gray-100 p-1 rounded-lg inline-flex">
                   <button 
                    onClick={() => setAppType('undergraduate')}
                    className={`px-4 py-2 text-xs font-bold rounded-md transition-all flex items-center gap-2 ${appType === 'undergraduate' ? 'bg-white text-pcu-purple shadow-sm' : 'text-gray-500'}`}
                   >
                     <IoSchoolOutline /> Undergraduate
                   </button>
                   <button 
                    onClick={() => setAppType('jupeb')}
                    className={`px-4 py-2 text-xs font-bold rounded-md transition-all flex items-center gap-2 ${appType === 'jupeb' ? 'bg-white text-[#b91c1c] shadow-sm' : 'text-gray-500'}`}
                   >
                     <IoBookOutline /> JUPEB Foundation
                   </button>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <DataTable 
                    columns={appColumns} 
                    data={appType === 'jupeb' ? jupebApplications : ugApplications} 
                    pagination 
                    progressPending={loading} 
                    customStyles={glossyTableStyles} 
                    noDataComponent={<div className="p-10 text-center text-gray-500">No {appType} applications found.</div>}
                  />
              </div>
          </div>
      )}

      {/* --- TAB 2: FORM BUILDER --- */}
      {activeTab === 'builder' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex justify-between items-center mb-6">
                  <div>
                      <h3 className="text-lg font-bold text-gray-800">Configure Extra Requirements</h3>
                      <p className="text-xs text-gray-500 mb-2">Select a degree to add specific questions.</p>
                      <div className="flex flex-wrap gap-2">
                          {degreeTypes.map(dt => (
                              <button key={dt.id} onClick={() => setSelectedDegree(dt.id)} className={`px-3 py-1 rounded-full text-xs border transition-all ${selectedDegree === dt.id ? 'bg-purple-50 border-purple-200 text-purple-700 font-bold shadow-sm' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                                  {dt.abbr}
                              </button>
                          ))}
                      </div>
                  </div>
                  <Button onClick={saveSchema} isLoading={isSubmitting}>Save Configuration</Button>
              </div>

              <div className="space-y-6 max-w-4xl">
                  {/* VISUAL AID: STANDARD FIELDS */}
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 opacity-80">
                      <h4 className="text-xs font-bold text-gray-500 uppercase mb-3 flex items-center gap-2">
                          <IoLockClosedOutline/> Standard Fields (Always Included)
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {['First Name', 'Last Name', 'Email Address', 'Phone Number', 'Gender', 'Country', 'Program Choice', 'Passport Photo'].map(f => (
                              <div key={f} className="bg-white px-3 py-2 rounded border border-gray-200 text-xs text-gray-500 cursor-not-allowed select-none flex items-center justify-between">
                                  {f} <span className="text-red-400">*</span>
                              </div>
                          ))}
                      </div>
                      <p className="text-[10px] text-gray-400 mt-2">These fields are built-in for every applicant. You do not need to add them below.</p>
                  </div>

                  <div className="border-t border-gray-100 pt-4">
                      <h4 className="text-sm font-bold text-gray-800 mb-3">Extra Fields for {degreeTypes.find(d => d.id === selectedDegree)?.name}</h4>
                      
                      {formSchema.length === 0 && (
                          <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 text-sm mb-4">
                              No extra fields configured for this degree. <br/> The application form will only show the standard fields above.
                          </div>
                      )}

                      <div className="space-y-4">
                          {formSchema.map((field, idx) => (
                              <div key={idx} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-3 relative group">
                                  {/* ROW 1: Label and Type */}
                                  <div className="flex flex-col md:flex-row gap-4 items-end">
                                      <div className="flex-1 w-full">
                                          <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Field Label / Question</label>
                                          <input type="text" className="input-field py-2 text-sm w-full font-medium" placeholder="e.g. Upload Transcript" value={field.label} onChange={(e) => updateField(idx, 'label', e.target.value)} />
                                      </div>
                                      <div className="w-full md:w-48">
                                          <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Input Type</label>
                                          <select className="input-field py-2 text-sm w-full" value={field.type} onChange={(e) => updateField(idx, 'type', e.target.value)}>
                                              <option value="text">Text Input</option>
                                              <option value="email">Email</option>
                                              <option value="file">File Upload</option>
                                              <option value="select">Dropdown Select</option>
                                              <option value="radio">Radio Buttons</option>
                                              <option value="checkbox">Checkboxes</option>
                                              <option value="textarea">Long Text Area</option>
                                          </select>
                                      </div>
                                  </div>

                                  {/* ROW 2: Options */}
                                  {['select', 'radio', 'checkbox'].includes(field.type) && (
                                      <div>
                                          <label className="block text-xs font-bold text-blue-600 mb-1 uppercase flex items-center gap-1"><IoOptionsOutline/> Options (Comma Separated)</label>
                                          <input type="text" className="input-field py-2 text-sm w-full border-blue-200 bg-blue-50" placeholder="Option A, Option B, Option C" value={field.options} onChange={(e) => updateField(idx, 'options', e.target.value)} />
                                      </div>
                                  )}

                                  {/* ROW 3: Settings */}
                                  <div className="flex items-center justify-between pt-2 border-t border-gray-100 mt-1">
                                      <label className="flex items-center text-xs font-bold text-gray-600 gap-1 cursor-pointer hover:text-pcu-purple">
                                          <input type="checkbox" className="accent-pcu-purple w-4 h-4" checked={field.required} onChange={(e) => updateField(idx, 'required', e.target.checked)}/> Is Required?
                                      </label>
                                      <div className="flex items-center gap-2 bg-gray-50 px-3 py-1 rounded border border-gray-200">
                                          <span className="text-xs text-gray-400 font-bold flex items-center gap-1"><IoGitNetworkOutline/> Show If:</span>
                                          <select className="text-xs border-none outline-none bg-transparent w-32 focus:ring-0" value={field.logic_target} onChange={(e) => updateField(idx, 'logic_target', e.target.value)}>
                                              <option value="">-- Always Visible --</option>
                                              {formSchema.slice(0, idx).map(p => <option key={p.id} value={p.label}>{p.label.substring(0,20)}...</option>)}
                                          </select>
                                          <span className="text-xs text-gray-400">=</span>
                                          <input type="text" className="text-xs border-b border-gray-300 w-20 focus:border-pcu-purple outline-none bg-transparent" placeholder="Value" value={field.logic_value} onChange={(e) => updateField(idx, 'logic_value', e.target.value)} />
                                      </div>
                                  </div>

                                  <button onClick={() => removeField(idx)} className="absolute top-3 right-3 text-red-400 hover:text-red-600 p-1 hover:bg-red-50 rounded transition-colors"><IoCloseCircle size={22}/></button>
                              </div>
                          ))}
                          
                          <button onClick={addField} className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-400 hover:text-pcu-purple hover:border-pcu-purple font-bold flex items-center justify-center gap-2 transition-all bg-white hover:bg-purple-50">
                              <IoAdd size={20}/> Add Extra Field
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* --- TAB 3: SESSIONS --- */}
      {activeTab === 'sessions' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-gray-800">Academic Sessions</h3>
                  <Button onClick={() => { setSessionForm({name:'', is_current:false, is_open:true}); setIsSessionModalOpen(true); }} size="sm"><IoAdd/> New Session</Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {sessions.map(sess => (
                      <div key={sess.id} className={`p-4 rounded-xl border ${sess.is_current ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-white'}`}>
                          <div className="flex justify-between items-start">
                              <span className="font-bold text-lg text-gray-700">{sess.name}</span>
                              {sess.is_current && <span className="bg-green-600 text-white text-[10px] px-2 py-1 rounded-full">CURRENT</span>}
                          </div>
                          <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                              <span className={`w-2 h-2 rounded-full ${sess.is_open ? 'bg-blue-500' : 'bg-red-500'}`}></span>
                              {sess.is_open ? 'Admission Open' : 'Closed'}
                          </div>
                          <button 
                            onClick={() => { setSessionForm(sess); setIsSessionModalOpen(true); }}
                            className="mt-3 text-xs text-blue-600 font-medium hover:underline"
                          >Edit Configuration</button>
                      </div>
                  ))}
              </div>
          </div>
      )}

      {/* --- APPLICATION DETAIL MODAL --- */}
      <Modal isOpen={!!viewApp} onClose={() => setViewApp(null)} title={`${appType === 'jupeb' ? 'JUPEB' : 'Undergraduate'} Application`} size="lg">
          {viewApp && (
              <div className="space-y-6">
                  {/* Header Info */}
                  <div className="bg-gray-50 p-4 rounded-xl flex justify-between items-start">
                      <div>
                          <h2 className="text-xl font-bold text-gray-800">{viewApp.first_name} {viewApp.last_name}</h2>
                          <p className="text-sm text-gray-500">{viewApp.email} • {viewApp.phone}</p>
                          <p className="text-sm text-gray-500">{viewApp.nationality || viewApp.country} • {viewApp.gender}</p>
                          <p className="text-xs text-gray-400 mt-1">{viewApp.address}</p>
                      </div>
                      <div className="text-right">
                          <span className="block font-mono text-sm font-bold text-gray-600">{viewApp.application_number || viewApp.application_no}</span>
                          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded mt-1 inline-block">
                              {viewApp.program?.title}
                          </span>
                      </div>
                  </div>

                  {/* Dynamic Data Display */}
                  <div className="border-t border-gray-100 pt-4">
                      <h4 className="text-sm font-bold text-gray-500 uppercase mb-3">Additional Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           {/* Handle JUPEB Specific Fields */}
                           {appType === 'jupeb' && (
                             <>
                               <div className="border-b border-gray-100 pb-2"><span className="block text-xs text-gray-400 uppercase">State of Origin</span> <span className="text-sm">{viewApp.state || 'N/A'}</span></div>
                               <div className="border-b border-gray-100 pb-2"><span className="block text-xs text-gray-400 uppercase">LGA</span> <span className="text-sm">{viewApp.lga || 'N/A'}</span></div>
                             </>
                           )}

                           {/* Handle Extra Data (JSON) */}
                           {viewApp.extra_data && Object.entries(viewApp.extra_data).map(([key, val]) => (
                               <div key={key} className="border-b border-gray-100 pb-2">
                                   <span className="block text-xs text-gray-400 uppercase">{key}</span>
                                   {typeof val === 'string' && val.startsWith('http') ? (
                                       <a href={getImageUrl(val)} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline">View Document</a>
                                   ) : (
                                       <span className="block text-sm text-gray-800 break-words">{val}</span>
                                   )}
                               </div>
                           ))}
                      </div>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                      {viewApp.status === 'pending' && (
                          <>
                              <Button variant="danger" onClick={() => setStatusAction({ id: viewApp.id, status: 'rejected' })}>
                                  <IoCloseCircle className="mr-2"/> Reject
                              </Button>
                              <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={() => setStatusAction({ id: viewApp.id, status: 'admitted' })}>
                                  <IoCheckmarkCircle className="mr-2"/> Admit Student
                              </Button>
                          </>
                      )}
                      {viewApp.status !== 'pending' && (
                          <div className="text-sm text-gray-500 italic flex items-center">
                              Decision recorded.
                          </div>
                      )}
                  </div>
              </div>
          )}
      </Modal>

      {/* --- CONFIRM STATUS CHANGE --- */}
      <ConfirmModal 
          isOpen={!!statusAction.id} 
          onClose={() => setStatusAction({ id: null, status: '' })} 
          onConfirm={handleStatusUpdate} 
          title={statusAction.status === 'admitted' ? "Admit Student?" : "Reject Application?"}
          message={`Are you sure you want to mark this ${appType === 'jupeb' ? 'JUPEB' : ''} application as ${statusAction.status}?`} 
      />

      {/* --- SESSION MODAL --- */}
      <Modal isOpen={isSessionModalOpen} onClose={() => setIsSessionModalOpen(false)} title="Configure Session" size="sm">
          <form onSubmit={saveSession} className="space-y-4">
              <div>
                  <label className="block text-sm font-medium text-gray-700">Session Name</label>
                  <input type="text" className="input-field" placeholder="e.g. 2024/2025" value={sessionForm.name} onChange={e => setSessionForm({...sessionForm, name: e.target.value})} required />
              </div>
              <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Set as Current Session?</span>
                  <input type="checkbox" className="accent-pcu-purple w-5 h-5" checked={sessionForm.is_current} onChange={e => setSessionForm({...sessionForm, is_current: e.target.checked})} />
              </div>
              <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Open for Admission?</span>
                  <input type="checkbox" className="accent-pcu-purple w-5 h-5" checked={sessionForm.is_open} onChange={e => setSessionForm({...sessionForm, is_open: e.target.checked})} />
              </div>
              <div className="pt-4 flex justify-end gap-2">
                  <Button variant="secondary" onClick={() => setIsSessionModalOpen(false)}>Cancel</Button>
                  <Button type="submit" isLoading={isSubmitting}>Save Session</Button>
              </div>
          </form>
      </Modal>
    </div>
  );
};

export default Admissions;