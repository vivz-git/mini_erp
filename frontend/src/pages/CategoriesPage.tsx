import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import type { Category, CategoryInput } from "../types/api";
import {
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../services/api";
import {
  Layers,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  X,
} from "lucide-react";

export const CategoriesPage: React.FC = () => {
  const { user } = useAuth();
  const canManage = user?.role === "ADMIN" || user?.role === "INVENTORY_MANAGER";

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formCode, setFormCode] = useState<string>("");
  const [formName, setFormName] = useState<string>("");
  const [formDescription, setFormDescription] = useState<string>("");
  const [formIsActive, setFormIsActive] = useState<boolean>(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);

  // Delete confirm state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCategories({
        search: searchTerm.trim() || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
      });
      setCategories(data.categories);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load categories");
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const handleOpenCreateModal = () => {
    setEditingCategory(null);
    setFormCode("");
    setFormName("");
    setFormDescription("");
    setFormIsActive(true);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setFormCode(cat.code);
    setFormName(cat.name);
    setFormDescription(cat.description || "");
    setFormIsActive(cat.isActive);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
    setFormError(null);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || saving) return;

    setSaving(true);
    setFormError(null);

    try {
      if (editingCategory) {
        // Update existing category
        const updated = await updateCategory(editingCategory.id, {
          name: formName.trim(),
          description: formDescription.trim() || null,
          isActive: formIsActive,
        });
        setCategories((prev) =>
          prev.map((c) => (c.id === updated.id ? updated : c))
        );
      } else {
        // Create new category
        if (!formCode.trim()) {
          setFormError("Category code is required");
          setSaving(false);
          return;
        }
        const input: CategoryInput = {
          code: formCode.trim().toUpperCase(),
          name: formName.trim(),
          description: formDescription.trim() || null,
          isActive: formIsActive,
        };
        const created = await createCategory(input);
        setCategories((prev) => [...prev, created].sort((a, b) => a.code.localeCompare(b.code)));
      }
      handleCloseModal();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save category");
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (cat: Category) => {
    if (!cat.isActive) return;
    if (!window.confirm(`Are you sure you want to deactivate category '${cat.name}' (${cat.code})?\n\nDeactivation preserves all historical records but marks the category unavailable for new product assignments.`)) {
      return;
    }

    setDeletingId(cat.id);
    try {
      await deleteCategory(cat.id);
      // Soft-deactivate in local state without deleting the row
      setCategories((prev) =>
        prev
          .map((c) => (c.id === cat.id ? { ...c, isActive: false } : c))
          .filter((c) => (statusFilter === "active" ? c.isActive : true))
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to deactivate category");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1>
            <Layers size={28} color="#818cf8" />
            Product Categories
          </h1>
          <p>Organize items into classifications for purchasing, inventory tracking, and sales.</p>
        </div>

        {canManage && (
          <button
            className="btn btn-primary"
            onClick={handleOpenCreateModal}
            id="btn-add-category"
          >
            <Plus size={16} />
            Add Category
          </button>
        )}
      </div>

      {/* Search and Filters Bar */}
      <div className="filter-bar">
        <div className="search-input-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search by code or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
            aria-label="Search categories"
          />
        </div>

        <div className="filter-controls">
          <div className="select-wrapper">
            <Filter size={15} className="select-icon" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-select"
              aria-label="Filter by status"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>

          <button
            className="btn btn-secondary"
            onClick={loadCategories}
            disabled={loading}
            title="Refresh list"
            aria-label="Refresh categories"
          >
            <RefreshCw size={15} className={loading ? "auth-spinner" : ""} />
          </button>
        </div>
      </div>

      {/* Main Table Content */}
      <div className="panel" style={{ padding: 0, overflow: "hidden" }}>
        {error ? (
          <div style={{ padding: "24px", color: "var(--status-error)", display: "flex", alignItems: "center", gap: "8px" }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        ) : loading && categories.length === 0 ? (
          <div style={{ padding: "48px", textAlign: "center", color: "var(--text-muted)" }}>
            <Loader2 size={32} className="auth-spinner" style={{ margin: "0 auto 12px" }} />
            <p>Loading master categories...</p>
          </div>
        ) : categories.length === 0 ? (
          <div style={{ padding: "48px", textAlign: "center", color: "var(--text-muted)" }}>
            <Layers size={36} color="var(--text-dim)" style={{ margin: "0 auto 12px" }} />
            <h3 style={{ color: "var(--text-main)", marginBottom: "6px" }}>No Categories Found</h3>
            <p style={{ fontSize: "0.85rem" }}>
              {searchTerm ? "No categories matched your search criteria." : "No categories have been created yet."}
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="erp-table">
              <thead>
                <tr>
                  <th style={{ width: "160px" }}>Code</th>
                  <th style={{ width: "220px" }}>Name</th>
                  <th>Description</th>
                  <th style={{ width: "120px" }}>Status</th>
                  <th style={{ width: "140px" }}>Created</th>
                  {canManage && <th style={{ width: "110px", textAlign: "right" }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {categories.map((cat) => (
                  <tr key={cat.id}>
                    <td>
                      <span className="code-badge">{cat.code}</span>
                    </td>
                    <td style={{ fontWeight: 600, color: "var(--text-main)" }}>
                      {cat.name}
                    </td>
                    <td style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                      {cat.description || <span style={{ color: "var(--text-dim)" }}>--</span>}
                    </td>
                    <td>
                      {cat.isActive ? (
                        <span className="status-pill online">
                          <CheckCircle2 size={12} /> Active
                        </span>
                      ) : (
                        <span className="status-pill offline">
                          <XCircle size={12} /> Inactive
                        </span>
                      )}
                    </td>
                    <td style={{ fontSize: "0.82rem", color: "var(--text-dim)", fontFamily: "var(--font-mono)" }}>
                      {new Date(cat.createdAt).toLocaleDateString()}
                    </td>
                    {canManage && (
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: "6px" }}>
                          <button
                            className="table-action-btn"
                            title="Edit Category"
                            onClick={() => handleOpenEditModal(cat)}
                            aria-label={`Edit ${cat.name}`}
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            className="table-action-btn delete"
                            title={cat.isActive ? "Deactivate Category" : "Already Inactive"}
                            disabled={deletingId === cat.id || !cat.isActive}
                            onClick={() => handleDeactivate(cat)}
                            aria-label={`Deactivate ${cat.name}`}
                          >
                            {deletingId === cat.id ? (
                              <Loader2 size={14} className="auth-spinner" />
                            ) : (
                              <Trash2 size={14} />
                            )}
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal Dialog */}
      {isModalOpen && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-card">
            <div className="modal-header">
              <h2>{editingCategory ? "Edit Category" : "Create Product Category"}</h2>
              <button
                className="modal-close-btn"
                onClick={handleCloseModal}
                disabled={saving}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div className="auth-alert" role="alert" style={{ margin: "16px 24px 0" }}>
                <AlertCircle size={16} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="modal-form">
              <div className="form-group">
                <label htmlFor="cat-code" className="form-label">
                  Category Code {!editingCategory && <span style={{ color: "var(--status-error)" }}>*</span>}
                </label>
                <input
                  id="cat-code"
                  type="text"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                  placeholder="e.g. RAW-MAT, ELEC-01"
                  required
                  disabled={Boolean(editingCategory) || saving}
                  className="form-input"
                  maxLength={20}
                  style={{ textTransform: "uppercase", fontFamily: "var(--font-mono)" }}
                />
                <span style={{ fontSize: "0.72rem", color: "var(--text-dim)" }}>
                  {editingCategory ? "Code cannot be changed once created." : "Unique uppercase identifier (2–20 chars)."}
                </span>
              </div>

              <div className="form-group">
                <label htmlFor="cat-name" className="form-label">
                  Category Name <span style={{ color: "var(--status-error)" }}>*</span>
                </label>
                <input
                  id="cat-name"
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Raw Materials & Metals"
                  required
                  disabled={saving}
                  className="form-input"
                  maxLength={100}
                />
              </div>

              <div className="form-group">
                <label htmlFor="cat-desc" className="form-label">
                  Description
                </label>
                <textarea
                  id="cat-desc"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Optional details about items classified here..."
                  disabled={saving}
                  className="form-input"
                  rows={3}
                  maxLength={500}
                  style={{ resize: "vertical" }}
                />
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "4px" }}>
                <input
                  id="cat-active"
                  type="checkbox"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  disabled={saving}
                  style={{ width: "16px", height: "16px", cursor: "pointer" }}
                />
                <label htmlFor="cat-active" style={{ fontSize: "0.85rem", cursor: "pointer", color: "var(--text-main)" }}>
                  Active (available for product assignment and orders)
                </label>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCloseModal}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving || !formName.trim() || (!editingCategory && !formCode.trim())}
                >
                  {saving ? (
                    <>
                      <Loader2 size={16} className="auth-spinner" />
                      Saving...
                    </>
                  ) : editingCategory ? (
                    "Update Category"
                  ) : (
                    "Create Category"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
