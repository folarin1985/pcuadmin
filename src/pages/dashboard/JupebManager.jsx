import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ReactQuill from 'react-quill-new'; // <--- Import Wrapper
import 'react-quill/dist/quill.snow.css'; // <--- Import Styles
import { toast } from 'react-hot-toast';
import { 
  IoSaveOutline, IoDocumentTextOutline, IoCloudUploadOutline, 
  IoCheckmarkCircle, IoInformationCircle, IoRefreshOutline 
} from 'react-icons/io5';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner'; 

const JupebManager = () => {
  const { getImageUrl } = useAuth();
  const [loading, setLoading] = useState(true);
  
  // State for Page Content
  const [pageId, setPageId] = useState(null);
  const [pageData, setPageData] = useState({ title: '', content: '' });
  const [isSavingContent, setIsSavingContent] = useState(false);

  // State for PDF
  const [pdfFile, setPdfFile] = useState(null);
  const [existingPdfUrl, setExistingPdfUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // 1. Fetch Page Content
      const pagesRes = await axios.get('/pages').catch(() => ({ data: { data: [] } }));
      const allPages = pagesRes.data.data || [];
      const jupebPage = allPages.find(p => p.slug === 'jupeb');

      if (jupebPage) {
        setPageId(jupebPage.id);
        setPageData({
          title: jupebPage.title,
          content: jupebPage.content
        });
      } else {
        setPageData({
          title: 'JUPEB Foundation Programme',
          content: ''
        });
      }

      // 2. Fetch PDF URL
      const settingRes = await axios.get('/settings');
      const settings = settingRes.data.data || {};
      
      let pdfUrl = null;
      if (Array.isArray(settings)) {
        pdfUrl = settings.find(s => s.key === 'jupeb_pdf_url')?.value;
      } else {
        pdfUrl = settings.jupeb_pdf_url;
      }
      setExistingPdfUrl(pdfUrl);

    } catch (error) {
      console.error(error);
      toast.error("Failed to load current data.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveContent = async (e) => {
    e.preventDefault();
    setIsSavingContent(true);
    try {
      const payload = {
        title: pageData.title,
        content: pageData.content,
        slug: 'jupeb',
        is_published: true
      };

      if (pageId) {
        await axios.put(`/pages/${pageId}`, payload);
        toast.success("Page updated successfully!");
      } else {
        const res = await axios.post('/pages', payload);
        if (res.data.data?.id) setPageId(res.data.data.id);
        toast.success("Page created successfully!");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to save page content.");
    } finally {
      setIsSavingContent(false);
    }
  };

  const handleUploadPdf = async () => {
    if (!pdfFile) return;
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', pdfFile);

    try {
      const res = await axios.post('/admin/settings/jupeb-upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setExistingPdfUrl(res.data.url);
      setPdfFile(null); 
      toast.success("PDF uploaded successfully!");
    } catch (error) {
      toast.error("Upload failed. Max size 10MB.");
    } finally {
      setIsUploading(false);
    }
  };

  // Custom Toolbar Modules for Quill
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike', 'blockquote'],
      [{'list': 'ordered'}, {'list': 'bullet'}],
      ['link', 'clean']
    ],
  };

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'bullet',
    'link'
  ];

  if (loading) return <div className="p-20 flex justify-center"><Spinner size="lg" color="purple"/></div>;

  return (
    <div className="space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">JUPEB Manager</h1>
          <p className="text-gray-500 text-sm">Manage Application Form</p>
        </div>
        <button onClick={fetchData} className="p-2 text-gray-500 hover:text-purple-600 transition-colors">
          <IoRefreshOutline size={24}/>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT: CONTENT EDITOR (Now WYSIWYG) */}
        {/*<div className="lg:col-span-2">
          <form onSubmit={handleSaveContent} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-full flex flex-col">
            <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2 pb-4 border-b border-gray-100">
              <IoDocumentTextOutline className="text-pcu-purple"/> Page Content
            </h3>
            
            <div className="space-y-6 flex-1 flex flex-col">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Page Title</label>
                <input 
                  type="text" 
                  className="input-field font-bold text-lg" 
                  value={pageData.title} 
                  onChange={(e) => setPageData({...pageData, title: e.target.value})}
                />
              </div>
              
              <div className="flex-1 flex flex-col">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Description / Body
                </label>
                <div className="flex-1 bg-white rounded-xl overflow-hidden">
                  <ReactQuill 
                    theme="snow"
                    value={pageData.content}
                    onChange={(content) => setPageData({...pageData, content})}
                    modules={modules}
                    formats={formats}
                    className="h-[350px] mb-12" // mb-12 to account for toolbar height
                  />
                </div>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-gray-100">
              <Button type="submit" isLoading={isSavingContent} className="w-full py-3 text-lg">
                <IoSaveOutline className="mr-2"/> 
                {pageId ? 'Update Page Content' : 'Create Page Content'}
              </Button>
            </div>
          </form>
        </div>*/}

        {/* RIGHT: PDF UPLOADER */}
        <div className="lg:col-span-4">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 sticky top-6">
            <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2 pb-4 border-b border-gray-100">
              <IoCloudUploadOutline className="text-pcu-purple"/> PDF Form
            </h3>

            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-6">
              <div className="flex items-start gap-2 text-blue-700">
                <IoInformationCircle className="mt-1 shrink-0"/>
                <p className="text-xs leading-relaxed">
                  This file will be linked to the "Download Form" button on the website.
                </p>
              </div>
            </div>

            {/* Current File Status */}
            <div className="mb-6">
              <p className="text-xs font-bold text-gray-400 uppercase mb-2">Current File</p>
              {existingPdfUrl ? (
                <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-100 rounded-lg text-green-700">
                  <IoCheckmarkCircle className="text-xl shrink-0"/>
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold">File Available</p>
                    <a 
                      href={getImageUrl(existingPdfUrl)} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="text-xs underline hover:text-green-900 truncate block"
                    >
                      View Current PDF
                    </a>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-500 text-xs">
                  No file currently uploaded.
                </div>
              )}
            </div>

            {/* Upload Area */}
            <div className="space-y-4">
               <p className="text-xs font-bold text-gray-400 uppercase">Upload New File</p>
               <input 
                 type="file" 
                 accept="application/pdf"
                 onChange={(e) => setPdfFile(e.target.files[0])}
                 className="block w-full text-sm text-gray-500
                   file:mr-4 file:py-2.5 file:px-4
                   file:rounded-full file:border-0
                   file:text-sm file:font-bold
                   file:bg-purple-50 file:text-pcu-purple
                   hover:file:bg-purple-100
                 "
               />
               
               <Button 
                 onClick={handleUploadPdf}
                 isLoading={isUploading}
                 disabled={!pdfFile}
                 variant={!pdfFile ? 'secondary' : 'primary'}
                 className="w-full mt-2"
               >
                 <IoCloudUploadOutline className="mr-2"/> 
                 {isUploading ? 'Uploading...' : 'Upload PDF'}
               </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JupebManager;