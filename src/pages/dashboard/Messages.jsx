import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import DataTable from 'react-data-table-component';
import { toast } from 'react-hot-toast';
import { 
  IoMailOpenOutline, IoMailUnreadOutline, IoSearch, IoPaperPlaneOutline, IoRefresh
} from 'react-icons/io5';

import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Spinner from '../../components/common/Spinner';
import { glossyTableStyles } from '../../styles/tableStyles';

const Messages = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // View/Reply Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMsg, setSelectedMsg] = useState(null);
  
  // Reply Form
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Fetch Data
  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/inbox');
      setMessages(response.data.data);
    } catch (error) {
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMessages(); }, []);

  // Handlers
  const handleSearch = (e) => setSearch(e.target.value);

  const openMessage = async (msg) => {
    setSelectedMsg(msg);
    setReplyText(''); // Reset reply
    setIsModalOpen(true);

    // Mark as read immediately on open
    if (!msg.is_read) {
        try {
            await axios.post(`/inbox/${msg.id}/read`, { type: msg.type });
            // Update local state to remove badge
            setMessages(prev => prev.map(m => m.id === msg.id && m.type === msg.type ? { ...m, is_read: true } : m));
        } catch (e) { console.error("Read mark failed"); }
    }
  };

  const sendReply = async (e) => {
      e.preventDefault();
      if(!replyText) return toast.error("Please write a message");
      
      if(!selectedMsg.sender_email) return toast.error("No email address found for this sender");

      setIsSending(true);
      try {
          await axios.post(`/inbox/${selectedMsg.id}/reply`, {
              type: selectedMsg.type,
              email: selectedMsg.sender_email,
              subject: selectedMsg.source, // Re: Event Name
              message: replyText
          });
          toast.success('Reply sent successfully');
          setIsModalOpen(false);
      } catch (error) {
          toast.error('Failed to send reply');
      } finally {
          setIsSending(false);
      }
  };

  // Table Config
  const filteredItems = useMemo(() => {
    return messages.filter(m => 
        m.sender_name.toLowerCase().includes(search.toLowerCase()) || 
        m.source.toLowerCase().includes(search.toLowerCase())
    );
  }, [messages, search]);

  const columns = [
    {
      name: 'Status',
      width: '60px',
      cell: row => (
          <div className={`p-2 rounded-full ${row.is_read ? 'text-gray-400 bg-gray-100' : 'text-pcu-purple bg-purple-100'}`}>
              {row.is_read ? <IoMailOpenOutline /> : <IoMailUnreadOutline />}
          </div>
      )
    },
    {
      name: 'Sender',
      selector: row => row.sender_name,
      sortable: true,
      cell: row => (
          <div className="py-2">
              <p className={`font-semibold ${row.is_read ? 'text-gray-600' : 'text-gray-900'}`}>{row.sender_name}</p>
              <p className="text-xs text-gray-500">{row.sender_email || 'No Email'}</p>
          </div>
      ),
      grow: 2
    },
    {
      name: 'Source (Page/Event)',
      selector: row => row.source,
      cell: row => <span className="text-xs bg-gray-50 border border-gray-200 px-2 py-1 rounded">{row.source}</span>
    },
    {
      name: 'Date',
      selector: row => row.created_at,
      sortable: true,
      cell: row => <span className="text-xs text-gray-500">{new Date(row.created_at).toLocaleString()}</span>
    },
    {
      name: 'Action',
      cell: row => (
        <Button variant="secondary" className="px-3 py-1 text-xs h-8" onClick={() => openMessage(row)}>
            Read
        </Button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Inbox</h1>
        <Button onClick={fetchMessages} variant="secondary"><IoRefresh className="mr-2"/> Refresh</Button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-end">
          <div className="w-full md:w-64">
            <input type="text" placeholder="Search inbox..." className="input-field py-2" value={search} onChange={handleSearch} />
          </div>
        </div>
        <DataTable columns={columns} data={filteredItems} pagination progressPending={loading} customStyles={glossyTableStyles} highlightOnHover pointerOnHover onRowClicked={openMessage} />
      </div>

      {/* --- Read/Reply Modal --- */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Message Details" size="lg">
        {selectedMsg && (
            <div className="flex flex-col h-[70vh]">
                
                {/* Message Header */}
                <div className="border-b border-gray-100 pb-4 mb-4 shrink-0">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <h3 className="text-lg font-bold text-gray-800">{selectedMsg.sender_name}</h3>
                            <p className="text-sm text-gray-500">{selectedMsg.sender_email}</p>
                        </div>
                        <span className="text-xs text-gray-400">{new Date(selectedMsg.created_at).toLocaleString()}</span>
                    </div>
                    <span className="text-xs font-semibold bg-purple-50 text-purple-700 px-2 py-1 rounded">
                        via {selectedMsg.source}
                    </span>
                </div>

                {/* Message Body (Scrollable) */}
                <div className="flex-1 overflow-y-auto bg-gray-50 p-4 rounded-xl border border-gray-200 mb-4 text-sm">
                    <table className="w-full text-left">
                        <tbody>
                            {Object.entries(selectedMsg.data).map(([key, value]) => (
                                <tr key={key} className="border-b border-gray-200 last:border-0">
                                    <td className="py-2 font-semibold text-gray-600 w-1/3 align-top">{key}:</td>
                                    <td className="py-2 text-gray-800 align-top">
                                        {typeof value === 'string' && value.includes('http') ? (
                                            <a href={value} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline break-all">View Attachment</a>
                                        ) : (
                                            <span className="break-words">{String(value)}</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Reply Section (Fixed Bottom) */}
                <form onSubmit={sendReply} className="shrink-0 pt-2 border-t border-gray-100">
                    <label className="block text-xs font-bold text-gray-500 mb-1">Reply via Email</label>
                    <textarea 
                        className="input-field min-h-[80px] mb-3 text-sm" 
                        placeholder={selectedMsg.sender_email ? `Write a reply to ${selectedMsg.sender_email}...` : "Cannot reply (No email provided)"}
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        disabled={!selectedMsg.sender_email}
                    />
                    <div className="flex justify-end gap-2">
                        <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Close</Button>
                        <Button type="submit" isLoading={isSending} disabled={!selectedMsg.sender_email}>
                            <IoPaperPlaneOutline className="mr-2"/> Send Reply
                        </Button>
                    </div>
                </form>
            </div>
        )}
      </Modal>
    </div>
  );
};

export default Messages;