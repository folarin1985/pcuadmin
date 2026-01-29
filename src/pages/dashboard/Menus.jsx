import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { 
  IoAdd, IoPencil, IoTrash, IoList, IoLink, IoFolderOpenOutline, 
  IoReorderTwo, IoAppsOutline, IoDocumentTextOutline, IoChevronUp, IoChevronDown
} from 'react-icons/io5';

import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import ConfirmModal from '../../components/common/ConfirmModal';
import Spinner from '../../components/common/Spinner';

const Menus = () => {
  const [loading, setLoading] = useState(true);
  const [menus, setMenus] = useState([]);
  const [pages, setPages] = useState([]); 
  const [selectedMenu, setSelectedMenu] = useState(null);
  
  // Modals
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Data
  const [menuForm, setMenuForm] = useState({ name: '', slug: '', is_active: true, order: 0 });
  
  const initialItemForm = { 
    menu_id: '', parent_id: '', title: '', url: '', 
    order: 0, is_mega_menu: false, column_title: '' 
  };
  const [itemForm, setItemForm] = useState(initialItemForm);

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState({ type: '', id: null });

  // --- Data Loading ---
  const fetchData = async () => {
    try {
      setLoading(true);
      const [menusRes, pagesRes] = await Promise.all([
          axios.get('/menus'),
          axios.get('/pages') 
      ]);
      
      // Sort menus by order
      const sortedMenus = menusRes.data.data.sort((a, b) => a.order - b.order);
      setMenus(sortedMenus);
      setPages(pagesRes.data.data);

      // Refresh selected menu if exists
      if (selectedMenu) {
        const updated = sortedMenus.find(m => m.id === selectedMenu.id);
        if (updated) setSelectedMenu(updated);
      }
    } catch (error) { toast.error('Failed to load data'); } 
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  // --- Handlers ---
  
  const handlePageSelect = (e) => {
      const pageId = e.target.value;
      if (!pageId) return;

      const page = pages.find(p => p.id === parseInt(pageId));
      if (page) {
          setItemForm(prev => ({
              ...prev,
              title: page.title,
              url: `/pages/${page.slug}` 
          }));
      }
  };

  const handleCreateMenu = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
        if(menuForm.id) {
            await axios.put(`/menus/${menuForm.id}`, menuForm);
            toast.success('Menu updated');
        } else {
            // Assign a default order (last)
            const newOrder = menus.length > 0 ? Math.max(...menus.map(m => m.order)) + 1 : 0;
            await axios.post('/menus', { ...menuForm, order: newOrder });
            toast.success('Menu created');
        }
        setIsMenuModalOpen(false);
        fetchData();
    } catch(e) { toast.error('Operation failed'); }
    finally { setIsSubmitting(false); }
  };

  const handleSaveItem = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
        const payload = { ...itemForm, menu_id: selectedMenu.id };
        if(payload.parent_id === '') payload.parent_id = null;

        if(itemForm.id) {
            await axios.put(`/menu-items/${itemForm.id}`, payload);
            toast.success('Link updated');
        } else {
            await axios.post('/menu-items', payload);
            toast.success('Link added');
        }
        setIsItemModalOpen(false);
        fetchData(); 
    } catch(e) { toast.error('Operation failed'); }
    finally { setIsSubmitting(false); }
  };

  const handleDelete = async () => {
      setIsSubmitting(true);
      try {
          if (deleteTarget.type === 'menu') {
              await axios.delete(`/menus/${deleteTarget.id}`);
              setSelectedMenu(null);
              toast.success('Menu deleted');
          } else {
              await axios.delete(`/menu-items/${deleteTarget.id}`);
              toast.success('Link removed');
          }
          setIsDeleteOpen(false);
          fetchData();
      } catch(e) { toast.error('Delete failed'); }
      finally { setIsSubmitting(false); }
  };

  // --- Reordering Logic (Menus) ---
  const handleMoveMenu = async (e, menu, direction) => {
      e.stopPropagation(); // Prevent selecting the menu while moving
      const currentIndex = menus.findIndex(m => m.id === menu.id);
      if (currentIndex === -1) return;

      const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      if (swapIndex < 0 || swapIndex >= menus.length) return;

      const swapMenu = menus[swapIndex];
      const toastId = toast.loading('Reordering menus...');

      try {
          // Swap logic
          let newOrderCurrent = swapMenu.order;
          let newOrderSwap = menu.order;

          // Fail-safe if orders match
          if (newOrderCurrent === newOrderSwap) {
              newOrderCurrent = currentIndex;
              newOrderSwap = swapIndex;
          }

          await Promise.all([
              axios.put(`/menus/${menu.id}`, { ...menu, order: newOrderCurrent }),
              axios.put(`/menus/${swapMenu.id}`, { ...swapMenu, order: newOrderSwap })
          ]);
          
          toast.success('Menu order updated', { id: toastId });
          fetchData();
      } catch (e) {
          toast.error('Reorder failed', { id: toastId });
      }
  };

  // --- Reordering Logic (Items) ---
  const handleMoveItem = async (item, direction, siblings) => {
      const currentIndex = siblings.findIndex(i => i.id === item.id);
      if (currentIndex === -1) return;

      const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      if (swapIndex < 0 || swapIndex >= siblings.length) return;

      const swapItem = siblings[swapIndex];
      const toastId = toast.loading('Reordering links...');
      
      try {
          let newOrderCurrent = swapItem.order;
          let newOrderSwap = item.order;

          if (newOrderCurrent === newOrderSwap) {
              newOrderCurrent = currentIndex;
              newOrderSwap = swapIndex; 
          }

          await Promise.all([
              axios.put(`/menu-items/${item.id}`, { ...item, order: newOrderCurrent }),
              axios.put(`/menu-items/${swapItem.id}`, { ...swapItem, order: newOrderSwap })
          ]);
          
          toast.success('Order updated', { id: toastId });
          fetchData();
      } catch (e) {
          toast.error('Reorder failed', { id: toastId });
      }
  };

  const getAllPotentialParents = (items) => {
      let flat = [];
      if(!items) return [];
      items.forEach(item => {
          flat.push(item);
      });
      return flat;
  };

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col md:flex-row gap-6">
      
      {/* LEFT COL: MENU LIST (Updated with Reordering) */}
      <div className="w-full md:w-1/3 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center">
              <h2 className="font-bold text-gray-800">Menus</h2>
              <button onClick={() => { setMenuForm({name:'', slug:'', is_active:true}); setIsMenuModalOpen(true); }} className="p-2 bg-purple-50 text-pcu-purple rounded-lg hover:bg-purple-100"><IoAdd/></button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {loading ? <div className="p-4 text-center"><Spinner size="md" color="purple"/></div> : menus.map((menu, index) => (
                  <div key={menu.id} 
                       onClick={() => setSelectedMenu(menu)}
                       className={`p-3 rounded-xl cursor-pointer border transition-all flex items-center gap-3 group ${selectedMenu?.id === menu.id ? 'border-pcu-purple bg-purple-50' : 'border-transparent hover:bg-gray-50'}`}>
                      
                      {/* Reorder Controls */}
                      <div className="flex flex-col items-center">
                          <button 
                              className={`text-gray-400 hover:text-pcu-purple ${index === 0 ? 'opacity-20 cursor-not-allowed' : ''}`}
                              disabled={index === 0}
                              onClick={(e) => handleMoveMenu(e, menu, 'up')}
                          >
                              <IoChevronUp size={12}/>
                          </button>
                          <button 
                              className={`text-gray-400 hover:text-pcu-purple ${index === menus.length - 1 ? 'opacity-20 cursor-not-allowed' : ''}`}
                              disabled={index === menus.length - 1}
                              onClick={(e) => handleMoveMenu(e, menu, 'down')}
                          >
                              <IoChevronDown size={12}/>
                          </button>
                      </div>

                      <div className="flex-1">
                          <p className={`font-semibold ${selectedMenu?.id === menu.id ? 'text-pcu-purple' : 'text-gray-700'}`}>{menu.name}</p>
                          <p className="text-xs text-gray-400">{menu.slug}</p>
                      </div>
                      
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={(e) => { e.stopPropagation(); setMenuForm(menu); setIsMenuModalOpen(true); }} className="p-1 text-gray-500 hover:text-blue-600"><IoPencil/></button>
                          <button onClick={(e) => { e.stopPropagation(); setDeleteTarget({type:'menu', id:menu.id}); setIsDeleteOpen(true); }} className="p-1 text-gray-500 hover:text-red-600"><IoTrash/></button>
                      </div>
                  </div>
              ))}
          </div>
      </div>

      {/* RIGHT COL: MENU ITEMS */}
      <div className="w-full md:w-2/3 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col">
          {selectedMenu ? (
              <>
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h2 className="font-bold text-gray-800">{selectedMenu.name} Structure</h2>
                        <p className="text-xs text-gray-500">Manage links and dropdowns.</p>
                    </div>
                    <Button onClick={() => { setItemForm({...initialItemForm, menu_id: selectedMenu.id}); setIsItemModalOpen(true); }} className="text-xs px-3 py-2">
                        <IoAdd className="mr-1"/> Add Link
                    </Button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    <div className="space-y-3">
                        {selectedMenu.items && selectedMenu.items.length > 0 ? (
                            selectedMenu.items.sort((a,b) => a.order - b.order).map((item, index, arr) => (
                                <MenuItemRow 
                                    key={item.id} 
                                    item={item} 
                                    index={index}
                                    siblings={arr}
                                    onEdit={(i) => { setItemForm(i); setIsItemModalOpen(true); }}
                                    onDelete={(id) => { setDeleteTarget({type:'item', id}); setIsDeleteOpen(true); }}
                                    onMove={handleMoveItem}
                                    depth={0}
                                />
                            ))
                        ) : (
                            <div className="text-center py-10 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
                                <IoList className="mx-auto text-3xl mb-2 opacity-50"/>
                                <p>This menu is empty.</p>
                            </div>
                        )}
                    </div>
                </div>
              </>
          ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                  <IoFolderOpenOutline className="text-6xl mb-4 opacity-20"/>
                  <p>Select a menu to manage links</p>
              </div>
          )}
      </div>

      {/* --- MODALS --- */}

      <Modal isOpen={isMenuModalOpen} onClose={() => setIsMenuModalOpen(false)} title={menuForm.id ? "Edit Menu" : "Create Menu"} size="sm">
          <form onSubmit={handleCreateMenu} className="space-y-4">
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Menu Name</label>
                  <input type="text" className="input-field" value={menuForm.name} onChange={e => setMenuForm({...menuForm, name: e.target.value})} placeholder="e.g. Main Header" required />
              </div>
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unique Slug</label>
                  <input type="text" className="input-field" value={menuForm.slug} onChange={e => setMenuForm({...menuForm, slug: e.target.value})} placeholder="e.g. main-header" required />
              </div>
              <div className="pt-4 flex justify-end gap-2">
                  <Button variant="secondary" onClick={() => setIsMenuModalOpen(false)}>Cancel</Button>
                  <Button type="submit" isLoading={isSubmitting}>Save</Button>
              </div>
          </form>
      </Modal>

      <Modal isOpen={isItemModalOpen} onClose={() => setIsItemModalOpen(false)} title={itemForm.id ? "Edit Link" : "Add Link"} size="md">
          <form onSubmit={handleSaveItem} className="space-y-4">
              
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                  <label className="block text-xs font-bold text-blue-800 mb-1 flex items-center gap-1">
                      <IoDocumentTextOutline /> Quick Select: Link to a Page
                  </label>
                  <select className="input-field py-1 text-sm bg-white" onChange={handlePageSelect} value="">
                      <option value="" disabled>-- Select a Page (Auto-fills Title & URL) --</option>
                      {pages.map(page => (
                          <option key={page.id} value={page.id}>{page.title}</option>
                      ))}
                  </select>
              </div>

              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Link Title</label>
                  <input type="text" className="input-field" value={itemForm.title} onChange={e => setItemForm({...itemForm, title: e.target.value})} placeholder="e.g. Academics" required />
              </div>
              
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">URL (Destination)</label>
                  <input type="text" className="input-field" value={itemForm.url} onChange={e => setItemForm({...itemForm, url: e.target.value})} placeholder="/pages/about-us" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Parent Item</label>
                      <select className="input-field" value={itemForm.parent_id || ''} onChange={e => setItemForm({...itemForm, parent_id: e.target.value})}>
                          <option value="">(No Parent - Top Level)</option>
                          {selectedMenu && getAllPotentialParents(selectedMenu.items).map(p => (
                              <option key={p.id} value={p.id} disabled={p.id === itemForm.id}>{p.title}</option>
                          ))}
                      </select>
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
                      <input type="number" className="input-field" value={itemForm.order} onChange={e => setItemForm({...itemForm, order: e.target.value})} placeholder="e.g. 1, 2, 3" />
                  </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
                  <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-gray-700 flex items-center gap-2"><IoAppsOutline/> Mega Menu Settings</span>
                  </div>
                  
                  {!itemForm.parent_id && (
                      <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" className="accent-pcu-purple w-4 h-4" checked={itemForm.is_mega_menu} onChange={e => setItemForm({...itemForm, is_mega_menu: e.target.checked})} />
                          <span className="text-sm text-gray-600">Enable Mega Menu (Wide Dropdown)</span>
                      </label>
                  )}

                  {itemForm.parent_id && (
                      <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">Column Header (For Mega Menus)</label>
                          <input type="text" className="input-field py-1 text-sm" value={itemForm.column_title || ''} onChange={e => setItemForm({...itemForm, column_title: e.target.value})} placeholder="e.g. Schools & Colleges" />
                      </div>
                  )}
              </div>

              <div className="pt-4 flex justify-end gap-2">
                  <Button variant="secondary" onClick={() => setIsItemModalOpen(false)}>Cancel</Button>
                  <Button type="submit" isLoading={isSubmitting}>Save Link</Button>
              </div>
          </form>
      </Modal>

      <ConfirmModal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} onConfirm={handleDelete} title="Delete?" message="This action cannot be undone." isLoading={isSubmitting} />
    </div>
  );
};

// --- Recursive Row Component ---
const MenuItemRow = ({ item, index, siblings, onEdit, onDelete, onMove, depth }) => {
    return (
        <div className="select-none">
            <div 
                className="flex items-center justify-between bg-white border border-gray-200 p-3 rounded-xl hover:shadow-sm transition-shadow group"
                style={{ marginLeft: `${depth * 24}px` }} 
            >
                <div className="flex items-center gap-3">
                    <div className="flex flex-col items-center">
                        <button 
                            className={`text-gray-400 hover:text-pcu-purple ${index === 0 ? 'opacity-20 cursor-not-allowed' : ''}`}
                            disabled={index === 0}
                            onClick={(e) => { e.stopPropagation(); onMove(item, 'up', siblings); }}
                        >
                            <IoChevronUp size={14}/>
                        </button>
                        
                        <button 
                            className={`text-gray-400 hover:text-pcu-purple ${index === siblings.length - 1 ? 'opacity-20 cursor-not-allowed' : ''}`}
                            disabled={index === siblings.length - 1}
                            onClick={(e) => { e.stopPropagation(); onMove(item, 'down', siblings); }}
                        >
                            <IoChevronDown size={14}/>
                        </button>
                    </div>
                    
                    <IoReorderTwo className="text-gray-300"/>
                    
                    <div>
                        <p className="font-medium text-gray-800 flex items-center gap-2">
                            {item.title}
                            {item.is_mega_menu && <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 rounded border border-purple-200">MEGA</span>}
                            {item.column_title && <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 rounded border border-blue-100">COL: {item.column_title}</span>}
                        </p>
                        <p className="text-xs text-gray-400 flex items-center gap-1">
                            {item.url ? <><IoLink size={10}/> {item.url}</> : 'No Link'}
                        </p>
                    </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => onEdit(item)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-pcu-purple"><IoPencil/></button>
                    <button onClick={() => onDelete(item.id)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-red-500"><IoTrash/></button>
                </div>
            </div>
            
            {item.children && item.children.length > 0 && (
                <div className="mt-2 space-y-2 relative">
                    <div className="absolute top-0 bottom-4 w-px bg-gray-200" style={{ left: `${(depth * 24) + 12}px` }}></div>
                    {item.children.sort((a,b) => a.order - b.order).map((child, i, childArr) => (
                        <MenuItemRow 
                            key={child.id} 
                            item={child} 
                            index={i}
                            siblings={childArr}
                            onEdit={onEdit} 
                            onDelete={onDelete} 
                            onMove={onMove}
                            depth={depth + 1} 
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default Menus;