import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import DataTable from 'react-data-table-component';
import { toast } from 'react-hot-toast';
import { 
  IoAdd, IoPencil, IoTrash, IoNewspaperOutline, IoImageOutline, IoStar, IoStarOutline, IoArrowUndo, IoCalendarOutline, IoPricetagOutline
} from 'react-icons/io5';
import { useAuth } from '../../contexts/AuthContext';

import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import ConfirmModal from '../../components/common/ConfirmModal';
import Spinner from '../../components/common/Spinner';
import { glossyTableStyles } from '../../styles/tableStyles';

const Posts = () => {
  const { getImageUrl } = useAuth();
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [trashItems, setTrashItems] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isTrashOpen, setIsTrashOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);

  const [selectedPost, setSelectedPost] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [restoringId, setRestoringId] = useState(null);

  const initialForm = { 
    title: '', 
    excerpt: '', 
    content: '',
    category_id: '',
    featured_image: '',
    is_featured: false,
    published_at: new Date().toISOString().split('T')[0]
  };
  const [formData, setFormData] = useState(initialForm);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [postRes, catRes] = await Promise.all([
        axios.get('/posts'),
        axios.get('/categories')
      ]);
      setPosts(postRes.data.data);
      setCategories(catRes.data.data);
    } catch (error) {
      toast.error('Failed to load news data');
    } finally {
      setLoading(false);
    }
  };

  const fetchTrash = async () => {
    try {
      const res = await axios.get('/admin/posts/trash');
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
      reader.onloadend = () => setFormData(prev => ({ ...prev, featured_image: reader.result }));
      reader.readAsDataURL(file);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName) return;
    setIsAddingCategory(true);
    try {
        const res = await axios.post('/categories', { name: newCategoryName });
        setCategories([...categories, res.data.data]);
        setFormData(prev => ({ ...prev, category_id: res.data.data.id })); 
        setNewCategoryName('');
        toast.success('Category added');
    } catch (error) {
        toast.error('Failed to add category');
    } finally {
        setIsAddingCategory(false);
    }
  };

  const openCreateModal = () => {
    setSelectedPost(null);
    setFormData(initialForm);
    setIsFormOpen(true);
  };

  const openEditModal = (post) => {
    setSelectedPost(post);
    setFormData({ 
      title: post.title,
      excerpt: post.excerpt || '',
      content: post.content,
      category_id: post.category_id || '',
      featured_image: post.featured_image || '',
      is_featured: Boolean(post.is_featured),
      published_at: post.published_at ? new Date(post.published_at).toISOString().split('T')[0] : ''
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
      if (selectedPost) {
        await axios.put(`/posts/${selectedPost.id}`, formData);
        toast.success('News post updated');
      } else {
        await axios.post('/posts', formData);
        toast.success('News post created');
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
      await axios.delete(`/posts/${deleteId}`);
      toast.success('Moved to Recycle Bin');
      setIsDeleteOpen(false);
      fetchData();
    } catch (error) {
      toast.error('Failed to delete post');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRestore = async (id) => {
    setRestoringId(id);
    try {
      await axios.post(`/admin/posts/${id}/restore`);
      toast.success('Post restored');
      fetchTrash(); 
      fetchData(); 
    } catch (error) {
      toast.error('Failed to restore');
    } finally {
      setRestoringId(null);
    }
  };

  const filteredItems = useMemo(() => {
    return posts.filter(p => p.title.toLowerCase().includes(search.toLowerCase()));
  }, [posts, search]);

  const columns = [
    {
      name: 'News Title',
      selector: row => row.title,
      sortable: true,
      cell: row => (
        <div className="flex items-center gap-3 py-2">
            <div className="w-12 h-12 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden border border-gray-200">
                {row.featured_image ? (
                    <img src={getImageUrl(row.featured_image)} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400"><IoNewspaperOutline /></div>
                )}
            </div>
            <div>
                <div className="flex items-center gap-2">
                    {row.is_featured && <IoStar className="text-amber-400 text-xs" />}
                    <span className="font-semibold text-gray-700 line-clamp-1">{row.title}</span>
                </div>
                <span className="text-xs text-gray-400">
                    {new Date(row.published_at).toLocaleDateString()}
                </span>
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
          <h1 className="text-2xl font-bold text-gray-800">News</h1>
          <p className="text-gray-500 text-sm">Manage blog posts, bulletins, and press releases.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={openTrashModal}>
            <IoTrash className="mr-2" /> Recycle Bin
          </Button>
          <Button onClick={openCreateModal}>
            <IoAdd className="mr-2 text-xl" /> Create Post
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-end">
          <div className="w-full md:w-64">
            <input type="text" placeholder="Search news..." className="input-field py-2" value={search} onChange={handleSearch} />
          </div>
        </div>
        <DataTable columns={columns} data={filteredItems} pagination progressPending={loading} customStyles={glossyTableStyles} />
      </div>

      <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={selectedPost ? "Edit News Post" : "Create News Post"} size="xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Headline</label>
                <input type="text" className="input-field text-lg font-semibold" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Enter post title..." required />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Short Excerpt</label>
                <textarea className="input-field min-h-[60px]" value={formData.excerpt} onChange={e => setFormData({...formData, excerpt: e.target.value})} placeholder="Brief summary (displayed on cards)..." />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Content</label>
                <textarea className="input-field min-h-[300px]" value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} placeholder="Write your article here..." required />
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <IoPricetagOutline /> Category
                </label>
                <select 
                  className="input-field mb-2" 
                  value={formData.category_id}
                  onChange={e => setFormData({...formData, category_id: e.target.value})}
                >
                  <option value="">Select Category...</option>
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

              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <IoCalendarOutline /> Publish Date
                </label>
                <input 
                  type="date" 
                  className="input-field" 
                  value={formData.published_at} 
                  onChange={e => setFormData({...formData, published_at: e.target.value})} 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Featured Image</label>
                <div className="relative w-full h-40 bg-gray-200 rounded-xl overflow-hidden border border-gray-200 group">
                   {formData.featured_image ? (
                     <img src={getImageUrl(formData.featured_image)} className="w-full h-full object-cover" />
                   ) : (
                     <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                        <IoImageOutline size={32} />
                        <span className="text-sm mt-2">Upload Cover</span>
                     </div>
                   )}
                   <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <span className="text-white font-medium text-sm">Change Image</span>
                      <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                   </label>
                </div>
              </div>

              <button 
                type="button"
                onClick={() => setFormData(prev => ({...prev, is_featured: !prev.is_featured}))}
                className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-all font-medium ${
                  formData.is_featured ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {formData.is_featured ? <IoStar /> : <IoStarOutline />}
                {formData.is_featured ? 'Featured Post' : 'Standard Post'}
              </button>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
            <Button variant="secondary" onClick={() => setIsFormOpen(false)}>Cancel</Button>
            <Button type="submit" isLoading={isSubmitting}>Save Post</Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} onConfirm={handleDelete} title="Delete Post?" message="Move to Recycle Bin?" isLoading={isSubmitting} />
    </div>
  );
};

export default Posts;