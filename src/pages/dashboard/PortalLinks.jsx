import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const PortalLinks = () => {
  const [links, setLinks] = useState([]);
  const [menuName, setMenuName] = useState("Portals");
  const [isLoading, setIsLoading] = useState(true);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    url: "",
    parent_id: "",
    order: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get("/portal-links");
      setLinks(response.data.data.links || []);
      setMenuName(response.data.data.menu_name || "Portals");
    } catch (error) {
      toast.error("Failed to fetch portal links");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateMenuName = async (e) => {
    e.preventDefault();
    try {
      await axios.post("/portal-links/menu-name", { name: menuName });
      toast.success("Menu name updated successfully!");
    } catch (error) {
      toast.error("Failed to update menu name");
    }
  };

  const openModal = (link = null) => {
    if (link) {
      setEditingId(link.id);
      setFormData({
        name: link.name,
        url: link.url || "",
        parent_id: link.parent_id || "",
        order: link.order || 0,
      });
    } else {
      setEditingId(null);
      setFormData({ name: "", url: "", parent_id: "", order: 0 });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`/portal-links/${editingId}`, formData);
        toast.success("Link updated successfully");
      } else {
        await axios.post("/portal-links", formData);
        toast.success("Link added successfully");
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error("Failed to save link");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this link?")) return;
    try {
      await axios.delete(`/portal-links/${id}`);
      toast.success("Link deleted successfully");
      fetchData();
    } catch (error) {
      toast.error("Failed to delete link");
    }
  };

  // Filter out children so we only show top-level options in the parent dropdown
  const parentOptions = links.filter((link) => !link.parent_id);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Portal Links Management
          </h1>
          <p className="text-gray-500 text-sm">
            Manage dynamic portal links and submenus.
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
        >
          + Add New Link
        </button>
      </div>

      {/* Menu Name Settings */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
        <h2 className="text-lg font-semibold mb-4">Dropdown Settings</h2>
        <form onSubmit={handleUpdateMenuName} className="flex gap-4 items-end">
          <div className="flex-1 max-w-md">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dropdown Menu Name
            </label>
            <input
              type="text"
              value={menuName}
              onChange={(e) => setMenuName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
              placeholder="e.g., Portals, Quick Links"
              required
            />
          </div>
          <button
            type="submit"
            className="bg-gray-800 text-white px-6 py-2 rounded-lg hover:bg-gray-900 transition-colors"
          >
            Save Name
          </button>
        </form>
      </div>

      {/* Links List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading links...</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 font-semibold text-sm text-gray-600">
                  Name
                </th>
                <th className="px-6 py-4 font-semibold text-sm text-gray-600">
                  URL
                </th>
                <th className="px-6 py-4 font-semibold text-sm text-gray-600">
                  Order
                </th>
                <th className="px-6 py-4 font-semibold text-sm text-gray-600 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {links.length === 0 ? (
                <tr>
                  <td
                    colSpan="4"
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    No portal links found. Create one above.
                  </td>
                </tr>
              ) : (
                links.map((link) => (
                  <React.Fragment key={link.id}>
                    {/* Parent Row */}
                    <tr className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-800">
                        {link.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {link.url || "-"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {link.order}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => openModal(link)}
                          className="text-purple-600 hover:text-purple-800 mr-3 text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(link.id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                    {/* Children Rows */}
                    {link.children &&
                      link.children.map((child) => (
                        <tr
                          key={child.id}
                          className="border-b border-gray-50 bg-gray-50/50 hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4 text-gray-600 pl-12 flex items-center gap-2">
                            <span className="text-gray-300">↳</span>{" "}
                            {child.name}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {child.url}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {child.order}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => openModal(child)}
                              className="text-purple-600 hover:text-purple-800 mr-3 text-sm"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(child.id)}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold">
                {editingId ? "Edit Link" : "Add New Link"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL{" "}
                  <span className="text-gray-400 font-normal">
                    (Optional for parents)
                  </span>
                </label>
                <input
                  type="text"
                  value={formData.url}
                  onChange={(e) =>
                    setFormData({ ...formData, url: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Parent Link (For Submenus)
                </label>
                <select
                  value={formData.parent_id}
                  onChange={(e) =>
                    setFormData({ ...formData, parent_id: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                >
                  <option value="">-- None (Top Level) --</option>
                  {parentOptions.map(
                    (opt) =>
                      // Prevent a link from being its own parent
                      opt.id !== editingId && (
                        <option key={opt.id} value={opt.id}>
                          {opt.name}
                        </option>
                      ),
                  )}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Display Order
                </label>
                <input
                  type="number"
                  value={formData.order}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      order: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>

              <div className="mt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Save Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PortalLinks;
