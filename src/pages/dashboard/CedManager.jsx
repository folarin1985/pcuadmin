// pages/dashboard/CedManager.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { IoCloudUploadOutline, IoTrash, IoImageOutline } from 'react-icons/io5';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';

// Manages CED pictures of engagements
const CedManager = () => {
  const { getImageUrl } = useAuth();
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  const fetchGallery = async () => {
    try {
      const res = await axios.get('/admin/ced-galleries');
      setImages(res.data.data);
    } catch (e) { toast.error("Failed to fetch gallery"); } 
    finally { setLoading(false); }
  };

  useEffect(() => { fetchGallery(); }, []);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
        try {
            await axios.post('/admin/ced-galleries', { image_path: reader.result, caption: 'CED Engagement' });
            toast.success('Image uploaded');
            fetchGallery();
        } catch (err) { toast.error('Upload failed'); }
        finally { setIsUploading(false); }
    };
    reader.readAsDataURL(file);
  };

  const handleDelete = async (id) => {
      if (!window.confirm("Delete this image?")) return;
      try {
          await axios.delete(`/admin/ced-galleries/${id}`);
          toast.success('Image deleted');
          fetchGallery();
      } catch (err) { toast.error('Delete failed'); }
  };

  if (loading) return <div className="flex justify-center p-20"><Spinner size="lg" color="purple"/></div>;

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-800">CED Engagement Gallery</h1><p className="text-gray-500 text-sm">Upload pictures of students and facilitators engaged in CED activities.</p></div>
      
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
         <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
            {isUploading ? <Spinner size="md" color="purple" /> : <><IoCloudUploadOutline className="text-3xl text-gray-400 mb-2"/><span className="text-sm font-bold text-gray-500">Click to Upload New Image</span></>}
            <input type="file" className="hidden" accept="image/*" onChange={handleUpload} disabled={isUploading} />
         </label>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
         {images.map(img => (
             <div key={img.id} className="relative group rounded-xl overflow-hidden shadow-sm h-48 border border-gray-200">
                 <img src={getImageUrl(img.image_path)} className="w-full h-full object-cover" alt="CED" />
                 <button onClick={() => handleDelete(img.id)} className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700 shadow-md">
                     <IoTrash size={16}/>
                 </button>
             </div>
         ))}
         {images.length === 0 && <div className="col-span-full text-center py-10 text-gray-400"><IoImageOutline size={40} className="mx-auto mb-2 opacity-50"/> No images uploaded yet.</div>}
      </div>
    </div>
  );
};
export default CedManager;