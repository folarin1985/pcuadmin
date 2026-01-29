import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import DataTable from 'react-data-table-component';
import { toast } from 'react-hot-toast';
import { 
  IoSchoolOutline, IoCalendarOutline, IoEye, IoChevronDown, IoChevronForward,
  IoBusinessOutline, IoLibraryOutline, IoToggle
} from 'react-icons/io5';

import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import ConfirmModal from '../../components/common/ConfirmModal';
import { glossyTableStyles } from '../../styles/tableStyles';

const Scholarships = () => {
  const [activeTab, setActiveTab] = useState('applications'); // applications | settings
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [programs, setPrograms] = useState([]);

  // Modals
  const [viewApp, setViewApp] = useState(null);
  const [scheduleModal, setScheduleModal] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ id: null, action: '', status: '' });
  
  // Forms & Loading States
  const [scheduleForm, setScheduleForm] = useState({ exam_date: '', exam_time: '', exam_link: '', instructions: '' });
  const [isScheduling, setIsScheduling] = useState(false); // For Schedule Button
  const [isDeciding, setIsDeciding] = useState(false);     // <--- NEW: For Reject/Grant Button

  // UI State for Hierarchy
  const [expandedDegrees, setExpandedDegrees] = useState({});

  // --- FETCH DATA ---
  const fetchData = async () => {
    setLoading(true);
    try {
      const [appRes, progRes] = await Promise.all([
        axios.get('/admin/scholarships'),
        axios.get('/programs') // Must return degree_type and department.faculty
      ]);
      setData(appRes.data.data);
      setPrograms(progRes.data.data);
    } catch (error) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // --- DATA TRANSFORMATION (The Hierarchy Logic) ---
  const groupedPrograms = useMemo(() => {
    const grouped = {};

    programs.forEach(prog => {
      const degree = prog.degree_type?.name || 'Uncategorized';
      const faculty = prog.department?.faculty?.name || 'General';
      const dept = prog.department?.name || 'General Dept';

      if (!grouped[degree]) grouped[degree] = {};
      if (!grouped[degree][faculty]) grouped[degree][faculty] = {};
      if (!grouped[degree][faculty][dept]) grouped[degree][faculty][dept] = [];

      grouped[degree][faculty][dept].push(prog);
    });

    return grouped;
  }, [programs]);

  // --- HANDLERS ---

  const toggleEligibility = async (programId) => {
    // Optimistic Update for instant UI feedback
    const updatedPrograms = programs.map(p => 
      p.id === programId ? { ...p, is_scholarship_eligible: !p.is_scholarship_eligible } : p
    );
    setPrograms(updatedPrograms);

    try {
      await axios.post(`/admin/programs/${programId}/toggle-scholarship`);
      toast.success("Updated successfully");
    } catch (e) {
      toast.error("Update failed");
      fetchData(); // Revert on error
    }
  };

  const toggleDegreeExpand = (degree) => {
    setExpandedDegrees(prev => ({ ...prev, [degree]: !prev[degree] }));
  };

  // Schedule & Decision Handlers
  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    setIsScheduling(true); // Start Spinner
    try {
      const payload = {
        exam_date: `${scheduleForm.exam_date} ${scheduleForm.exam_time}`,
        exam_link: scheduleForm.exam_link,
        instructions: scheduleForm.instructions
      };
      await axios.post(`/admin/scholarships/${scheduleModal.id}/schedule`, payload);
      toast.success("Exam scheduled & Email sent!");
      setScheduleModal(null);
      fetchData();
    } catch (e) { 
        toast.error("Failed to schedule exam"); 
    } finally {
        setIsScheduling(false); // Stop Spinner
    }
  };

  const handleDecision = async () => {
    setIsDeciding(true); // <--- Start Spinner for Reject/Grant
    try {
      await axios.post(`/admin/scholarships/${confirmModal.id}/decide`, { status: confirmModal.status });
      toast.success(`Scholarship ${confirmModal.status} successfully`);
      setConfirmModal({ id: null, action: '', status: '' });
      setViewApp(null);
      fetchData();
    } catch (e) { 
        toast.error("Operation failed"); 
    } finally {
        setIsDeciding(false); // <--- Stop Spinner
    }
  };

  // --- COLUMNS FOR APPLICATIONS TAB ---
  const columns = [
    { name: 'App No', selector: row => row.application_number, sortable: true, width: '150px', cell: row => <span className="font-mono text-xs font-bold text-gray-600">{row.application_number}</span> },
    { name: 'Applicant', selector: row => row.last_name, cell: row => <div><p className="font-bold text-gray-800">{row.first_name} {row.last_name}</p><p className="text-xs text-gray-500">{row.email}</p></div>, grow: 2 },
    { name: 'JAMB', selector: row => row.jamb_score, width: '100px', sortable: true, cell: row => <span className="font-bold text-gray-700">{row.jamb_score}</span> },
    { name: 'Program', selector: row => row.program?.title, sortable: true },
    { name: 'Status', selector: row => row.status, cell: row => (
        <span className={`px-2 py-1 rounded text-xs font-bold capitalize ${
            row.status === 'granted' ? 'bg-green-100 text-green-700' : 
            row.status === 'rejected' ? 'bg-red-100 text-red-700' : 
            row.status === 'exam_scheduled' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'
        }`}>
            {row.status.replace('_', ' ')}
        </span>
    )},
    { name: 'Action', cell: row => <button onClick={() => setViewApp(row)} className="text-blue-600 hover:bg-blue-50 p-2 rounded"><IoEye size={18}/></button> }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-2xl font-bold text-gray-800">Scholarships & Grants</h1>
            <p className="text-gray-500 text-sm">Manage promoter's scholarship applications.</p>
        </div>
        <div className="flex bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
             <button onClick={() => setActiveTab('applications')} className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'applications' ? 'bg-pcu-purple text-white shadow' : 'text-gray-500 hover:bg-gray-50'}`}>Applications</button>
             <button onClick={() => setActiveTab('settings')} className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'settings' ? 'bg-pcu-purple text-white shadow' : 'text-gray-500 hover:bg-gray-50'}`}>Settings</button>
        </div>
      </div>

      {/* --- TAB 1: APPLICATIONS --- */}
      {activeTab === 'applications' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
             <DataTable 
                columns={columns} 
                data={data} 
                pagination 
                progressPending={loading} 
                customStyles={glossyTableStyles}
                noDataComponent={<div className="p-10 text-center text-gray-500">No scholarship applications found.</div>}
            />
        </div>
      )}

      {/* --- TAB 2: SETTINGS (HIERARCHICAL VIEW) --- */}
      {activeTab === 'settings' && (
        <div className="space-y-6 animate-fadeIn">
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-center gap-3">
                <IoLibraryOutline className="text-blue-600 text-xl" />
                <div>
                    <h3 className="font-bold text-blue-800 text-sm">Program Eligibility Manager</h3>
                    <p className="text-xs text-blue-600">Toggle the switch to enable or disable the scholarship application form for specific programs.</p>
                </div>
            </div>

            {loading ? <div className="p-10 text-center text-gray-400">Loading hierarchy...</div> : (
                Object.keys(groupedPrograms).map((degree) => (
                    <div key={degree} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        {/* Level 1: DEGREE TYPE */}
                        <button 
                            onClick={() => toggleDegreeExpand(degree)}
                            className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors border-b border-gray-100"
                        >
                            <div className="flex items-center gap-3">
                                <span className={`p-2 rounded-lg ${expandedDegrees[degree] ? 'bg-pcu-purple text-white' : 'bg-white text-gray-500 border border-gray-200'}`}>
                                    <IoSchoolOutline size={18} />
                                </span>
                                <h3 className="font-bold text-gray-800 text-lg">{degree}</h3>
                                <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                                    {Object.values(groupedPrograms[degree]).reduce((acc, fac) => acc + Object.values(fac).reduce((a, d) => a + d.length, 0), 0)} Programs
                                </span>
                            </div>
                            {expandedDegrees[degree] ? <IoChevronDown className="text-gray-400"/> : <IoChevronForward className="text-gray-400"/>}
                        </button>

                        {/* Level 2: FACULTY */}
                        {expandedDegrees[degree] && (
                            <div className="p-4 space-y-4 bg-white">
                                {Object.keys(groupedPrograms[degree]).map(faculty => (
                                    <div key={faculty} className="border border-gray-100 rounded-xl overflow-hidden">
                                        <div className="bg-gray-50/50 px-4 py-2 border-b border-gray-100 flex items-center gap-2">
                                            <IoBusinessOutline className="text-gray-400"/>
                                            <span className="font-bold text-gray-700 text-sm uppercase tracking-wide">{faculty}</span>
                                        </div>

                                        {/* Level 3: DEPARTMENT */}
                                        <div className="p-4 grid gap-6">
                                            {Object.keys(groupedPrograms[degree][faculty]).map(dept => (
                                                <div key={dept}>
                                                    <h5 className="text-xs font-bold text-pcu-purple mb-2 pl-2 border-l-2 border-pcu-purple">{dept}</h5>
                                                    
                                                    {/* Level 4: PROGRAMS */}
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                        {groupedPrograms[degree][faculty][dept].map(prog => (
                                                            <div key={prog.id} className={`flex items-center justify-between p-3 rounded-lg border transition-all ${prog.is_scholarship_eligible ? 'bg-purple-50 border-purple-200' : 'bg-white border-gray-200 hover:border-gray-300'}`}>
                                                                <span className={`text-sm font-medium ${prog.is_scholarship_eligible ? 'text-gray-800' : 'text-gray-500'}`}>
                                                                    {prog.title}
                                                                </span>
                                                                
                                                                <button 
                                                                    onClick={() => toggleEligibility(prog.id)}
                                                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${prog.is_scholarship_eligible ? 'bg-pcu-purple' : 'bg-gray-300'}`}
                                                                >
                                                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${prog.is_scholarship_eligible ? 'translate-x-6' : 'translate-x-1'}`} />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))
            )}
        </div>
      )}

      {/* --- APP DETAIL MODAL --- */}
      <Modal isOpen={!!viewApp} onClose={() => setViewApp(null)} title="Application Details">
         {viewApp && (
            <div className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-xl flex justify-between">
                    <div>
                        <h2 className="font-bold text-lg">{viewApp.first_name} {viewApp.last_name}</h2>
                        <p className="text-sm text-gray-500">{viewApp.email}</p>
                        <p className="text-sm text-gray-500">{viewApp.phone}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-gray-500 uppercase">JAMB Score</p>
                        <p className="font-bold text-xl text-pcu-purple">{viewApp.jamb_score}</p>
                    </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><span className="text-gray-500 block">State:</span> {viewApp.state_of_origin}</div>
                    <div><span className="text-gray-500 block">LGA:</span> {viewApp.lga}</div>
                    <div className="col-span-2"><span className="text-gray-500 block">Address:</span> {viewApp.address}</div>
                    <div className="col-span-2 border-t pt-2 mt-2"><span className="text-gray-500 block">Course:</span> <span className="font-bold">{viewApp.program?.title}</span></div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t">
                    {/* Schedule Exam Button */}
                    {viewApp.status === 'pending' && (
                        <Button onClick={() => { setScheduleForm({ exam_date:'', exam_time:'', exam_link:'', instructions:'' }); setScheduleModal(viewApp); }} variant="secondary">
                            <IoCalendarOutline className="mr-2"/> Schedule Exam
                        </Button>
                    )}
                    
                    {/* Decision Buttons */}
                    {(viewApp.status === 'pending' || viewApp.status === 'exam_scheduled') && (
                        <>
                            <Button variant="danger" onClick={() => setConfirmModal({ id: viewApp.id, status: 'rejected', action: 'Reject' })}>Reject</Button>
                            <Button className="bg-green-600 text-white" onClick={() => setConfirmModal({ id: viewApp.id, status: 'granted', action: 'Grant' })}>Grant Scholarship</Button>
                        </>
                    )}
                </div>
            </div>
         )}
      </Modal>

      {/* --- SCHEDULE EXAM MODAL --- */}
      <Modal isOpen={!!scheduleModal} onClose={() => setScheduleModal(null)} title="Schedule Screening Exam" size="sm">
        <form onSubmit={handleScheduleSubmit} className="space-y-4">
            <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Exam Date</label>
                <input type="date" required className="input-field" value={scheduleForm.exam_date} onChange={e=>setScheduleForm({...scheduleForm, exam_date:e.target.value})} />
            </div>
            <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Time</label>
                <input type="time" required className="input-field" value={scheduleForm.exam_time} onChange={e=>setScheduleForm({...scheduleForm, exam_time:e.target.value})} />
            </div>
            <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Exam Link / Venue</label>
                <input type="text" placeholder="https://..." required className="input-field" value={scheduleForm.exam_link} onChange={e=>setScheduleForm({...scheduleForm, exam_link:e.target.value})} />
            </div>
            <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Instructions</label>
                <textarea className="input-field" rows="3" placeholder="Additional info for student..." value={scheduleForm.instructions} onChange={e=>setScheduleForm({...scheduleForm, instructions:e.target.value})}></textarea>
            </div>
            <div className="flex justify-end gap-2 pt-2">
                <Button type="submit" isLoading={isScheduling}>Send Schedule</Button>
            </div>
        </form>
      </Modal>

      {/* --- CONFIRM MODAL (Reject/Grant) --- */}
      <ConfirmModal 
        isOpen={!!confirmModal.id} 
        onClose={() => setConfirmModal({id:null, action:'', status:''})}
        onConfirm={handleDecision}
        isLoading={isDeciding} // <--- Connected loading state here
        title={`${confirmModal.action} Scholarship?`}
        message={`Are you sure you want to mark this applicant as ${confirmModal.status}? An email will be sent immediately.`}
      />
    </div>
  );
};

export default Scholarships;