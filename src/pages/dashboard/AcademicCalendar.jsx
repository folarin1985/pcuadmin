import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DataTable from 'react-data-table-component';
import { toast } from 'react-hot-toast';
import { 
  IoAdd, IoPencil, IoTrash, IoCalendarOutline, IoCloudUploadOutline, 
  IoDocumentTextOutline, IoSave, IoClose, IoEyeOutline
} from 'react-icons/io5';
import { useAuth } from '../../contexts/AuthContext';

import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import ConfirmModal from '../../components/common/ConfirmModal';
import { glossyTableStyles } from '../../styles/tableStyles';

const AcademicCalendar = () => {
  const { getImageUrl } = useAuth();
  
  // Data State
  const [sessions, setSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [selectedSessionName, setSelectedSessionName] = useState('');
  
  // Calendar Data
  const [calendarFiles, setCalendarFiles] = useState([]); // Array for multiple files
  const [events, setEvents] = useState([]);

  // UI State
  const [loading, setLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Event Form State
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [eventForm, setEventForm] = useState({
    title: '', start_date: '', end_date: '', semester: 'First', type: 'academic', description: ''
  });

  // File Upload State
  const [uploadLabel, setUploadLabel] = useState('');

  // --- 1. INITIAL LOAD ---
  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const res = await axios.get('/academic-sessions');
      const sessionList = res.data.data;
      setSessions(sessionList);

      const current = sessionList.find(s => s.is_current);
      if (current) {
        setSelectedSessionId(current.id);
        setSelectedSessionName(current.name);
      } else if (sessionList.length > 0) {
        setSelectedSessionId(sessionList[0].id);
        setSelectedSessionName(sessionList[0].name);
      }
    } catch (error) {
      toast.error('Failed to load sessions');
    }
  };

  // --- 2. LOAD CALENDAR DATA ---
  useEffect(() => {
    if (selectedSessionName) {
      fetchCalendarData();
    }
  }, [selectedSessionName]);

  const fetchCalendarData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/academic-calendar?session=${selectedSessionName}`);
      // Set Files array
      setCalendarFiles(res.data.data.calendar_files || []);
      // Set Events array
      setEvents(res.data.data.calendar_events || []);
    } catch (error) {
      setCalendarFiles([]);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSessionChange = (e) => {
    const id = e.target.value;
    const session = sessions.find(s => s.id == id);
    if (session) {
        setSelectedSessionId(id);
        setSelectedSessionName(session.name);
    }
  };

  // --- HANDLERS: FILE UPLOAD ---
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const uploadData = new FormData();
    uploadData.append('session_id', selectedSessionId);
    uploadData.append('file', file);
    // Optional label (defaults to filename if empty)
    if(uploadLabel) uploadData.append('label', uploadLabel);

    const toastId = toast.loading('Uploading document...');
    try {
      await axios.post('/admin/calendar/upload', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Document added', { id: toastId });
      setUploadLabel(''); // Reset label
      fetchCalendarData(); // Refresh list
    } catch (error) {
      toast.error('Upload failed. Max 5MB.', { id: toastId });
    }
  };

  const handleFileDelete = async (fileId) => {
    if (!window.confirm("Remove this document?")) return;
    try {
      await axios.delete(`/admin/calendar/file/${fileId}`);
      toast.success('Document removed');
      fetchCalendarData();
    } catch (error) {
      toast.error('Failed to remove document');
    }
  };

  // --- HANDLERS: EVENTS CRUD ---
  // (These remain largely the same, just standard CRUD)
  const openCreateModal = () => {
    setSelectedEvent(null);
    setEventForm({ title: '', start_date: '', end_date: '', semester: 'First', type: 'academic', description: '' });
    setIsFormOpen(true);
  };

  const openEditModal = (event) => {
    setSelectedEvent(event);
    setEventForm({
      title: event.title,
      start_date: event.start_date.split('T')[0],
      end_date: event.end_date ? event.end_date.split('T')[0] : '',
      semester: event.semester,
      type: event.type,
      description: event.description || ''
    });
    setIsFormOpen(true);
  };

  const handleEventSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSessionId) return toast.error('Select a session');

    setIsSubmitting(true);
    const payload = { ...eventForm, academic_session_id: selectedSessionId };

    try {
      if (selectedEvent) {
        await axios.put(`/admin/calendar/events/${selectedEvent.id}`, payload);
        toast.success('Event updated');
      } else {
        await axios.post('/admin/calendar/events', payload);
        toast.success('Event added');
      }
      setIsFormOpen(false);
      fetchCalendarData();
    } catch (error) {
      toast.error('Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEvent = async () => {
    setIsSubmitting(true);
    try {
      await axios.delete(`/admin/calendar/events/${deleteId}`);
      toast.success('Event deleted');
      setIsDeleteOpen(false);
      fetchCalendarData();
    } catch (error) {
      toast.error('Failed delete');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Table Columns
  const columns = [
    { name: 'Date', selector: row => row.start_date, cell: row => <div className="text-sm font-semibold">{new Date(row.start_date).toLocaleDateString()}</div>, width: '120px' },
    { name: 'Title', selector: row => row.title, grow: 2 },
    { name: 'Semester', selector: row => row.semester, width: '100px' },
    { name: 'Type', selector: row => row.type, width: '100px', cell: row => <span className="capitalize bg-gray-100 px-2 py-1 rounded text-xs">{row.type}</span> },
    { name: 'Actions', cell: row => (
        <div className="flex gap-2">
          <button onClick={() => openEditModal(row)} className="text-blue-500 hover:bg-blue-50 p-2 rounded"><IoPencil/></button>
          <button onClick={() => { setDeleteId(row.id); setIsDeleteOpen(true); }} className="text-red-500 hover:bg-red-50 p-2 rounded"><IoTrash/></button>
        </div>
      ), button: true }
  ];

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Academic Calendar</h1>
          <p className="text-gray-500 text-sm">Manage timeline events and multiple documents.</p>
        </div>
        <div className="flex items-center gap-3">
            <select value={selectedSessionId} onChange={handleSessionChange} className="input-field py-2 bg-white font-semibold">
                {sessions.map(s => <option key={s.id} value={s.id}>{s.name} {s.is_current ? '(Current)' : ''}</option>)}
            </select>
            <Button onClick={openCreateModal} disabled={!selectedSessionId}><IoAdd className="mr-2"/> Add Event</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* --- LEFT: DOCUMENTS MANAGER --- */}
          <div className="lg:col-span-1 space-y-6">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-full">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <IoDocumentTextOutline className="text-pcu-purple"/> Documents
                  </h3>
                  
                  {/* Upload Area */}
                  <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                      <div className="mb-3">
                        <input 
                            type="text" 
                            placeholder="Label (e.g. Exam Timetable)" 
                            className="w-full text-sm p-2 border rounded mb-2"
                            value={uploadLabel}
                            onChange={(e) => setUploadLabel(e.target.value)}
                        />
                        <div className="relative w-full">
                            <label className="flex items-center justify-center gap-2 w-full py-2 bg-white border border-gray-300 rounded cursor-pointer hover:bg-gray-100 text-sm font-medium text-gray-600 transition-colors">
                                <IoCloudUploadOutline/> Choose File
                                <input type="file" className="hidden" onChange={handleFileUpload} accept=".pdf,.jpg,.png,.doc,.docx"/>
                            </label>
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 text-center">Max 5MB. PDF, Images, Word.</p>
                  </div>

                  {/* File List */}
                  <div className="space-y-3">
                      {calendarFiles.length > 0 ? (
                          calendarFiles.map(file => (
                              <div key={file.id} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg shadow-sm group hover:border-blue-300 transition-colors">
                                  <div className="flex items-center gap-3 overflow-hidden">
                                      <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded flex items-center justify-center shrink-0">
                                          <IoDocumentTextOutline/>
                                      </div>
                                      <div className="truncate">
                                          <p className="text-sm font-semibold text-gray-800 truncate">{file.label || file.file_name}</p>
                                          <p className="text-[10px] text-gray-400 truncate">{file.file_name}</p>
                                      </div>
                                  </div>
                                  <div className="flex gap-1 shrink-0 opacity-50 group-hover:opacity-100 transition-opacity">
                                      <a 
                                        href={`${import.meta.env.VITE_API_BASE_URL_FOR_FILE}${file.file_path}`} 
                                        target="_blank" rel="noreferrer"
                                        className="p-1.5 hover:bg-blue-50 text-blue-600 rounded"
                                      >
                                          <IoEyeOutline/>
                                      </a>
                                      <button 
                                        onClick={() => handleFileDelete(file.id)}
                                        className="p-1.5 hover:bg-red-50 text-red-600 rounded"
                                      >
                                          <IoTrash/>
                                      </button>
                                  </div>
                              </div>
                          ))
                      ) : (
                          <div className="text-center text-gray-400 py-4 text-sm italic">No documents uploaded.</div>
                      )}
                  </div>
              </div>
          </div>

          {/* --- RIGHT: EVENTS TIMELINE --- */}
          <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <DataTable 
                    columns={columns} 
                    data={events} 
                    pagination 
                    progressPending={loading} 
                    customStyles={glossyTableStyles}
                    noDataComponent={<div className="p-8 text-center text-gray-400">No events found.</div>}
                />
              </div>
          </div>
      </div>

      {/* EVENT MODAL */}
      <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={selectedEvent ? "Edit Event" : "Create Event"} size="md">
        <form onSubmit={handleEventSubmit} className="space-y-4">
            <div>
                <label className="label">Event Title</label>
                <input type="text" className="input-field" value={eventForm.title} onChange={e => setEventForm({...eventForm, title: e.target.value})} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="label">Start Date</label>
                    <input type="date" className="input-field" value={eventForm.start_date} onChange={e => setEventForm({...eventForm, start_date: e.target.value})} required />
                </div>
                <div>
                    <label className="label">End Date (Opt)</label>
                    <input type="date" className="input-field" value={eventForm.end_date} onChange={e => setEventForm({...eventForm, end_date: e.target.value})} />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="label">Semester</label>
                    <select className="input-field" value={eventForm.semester} onChange={e => setEventForm({...eventForm, semester: e.target.value})}>
                        <option value="First">First</option>
                        <option value="Second">Second</option>
                    </select>
                </div>
                <div>
                    <label className="label">Type</label>
                    <select className="input-field" value={eventForm.type} onChange={e => setEventForm({...eventForm, type: e.target.value})}>
                        <option value="academic">Academic</option>
                        <option value="exam">Exam</option>
                        <option value="break">Break</option>
                        <option value="ceremony">Ceremony</option>
                        <option value="opening">Resumption</option>
                    </select>
                </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
                <Button variant="secondary" onClick={() => setIsFormOpen(false)}>Cancel</Button>
                <Button type="submit" isLoading={isSubmitting}>Save</Button>
            </div>
        </form>
      </Modal>

      <ConfirmModal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} onConfirm={handleDeleteEvent} title="Delete Event?" message="Remove this event from the timeline?" isLoading={isSubmitting} />
    </div>
  );
};

export default AcademicCalendar;