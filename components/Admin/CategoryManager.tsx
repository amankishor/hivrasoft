"use client";

import {
  FormEvent,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type CategoryNode = {
  id: string;
  name: string;
  slug: string;
  description: string;
  parent: string | null;
  ancestors: string[];
  level: number;
  image?: {
    url: string;
    publicId: string;
  };
  isActive: boolean;
  sortOrder: number;
  children: CategoryNode[];
};

type CategoryApiItem = {
  _id?: string;
  id?: string;
  name?: string;
  slug?: string;
  description?: string;
  parent?: string | { _id?: string } | null;
  ancestors?: string[];
  level?: number;
  image?: {
    url?: string;
    publicId?: string;
  };
  isActive?: boolean;
  sortOrder?: number;
  children?: CategoryApiItem[];
};

type CategoryForm = {
  name: string;
  description: string;
  parentId: string;
  sortOrder: string;
  isActive: boolean;
};

type ViewMode = "all" | "form";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const EMPTY_FORM: CategoryForm = {
  name: "",
  description: "",
  parentId: "",
  sortOrder: "0",
  isActive: true,
};

function getCategoryId(category: CategoryApiItem): string {
  return String(category.id || category._id || "");
}

function getParentId(
  parent: CategoryApiItem["parent"]
): string {
  if (!parent) return "";
  if (typeof parent === "string") return parent;
  return String(parent._id || "");
}

function normalizeTree(items: CategoryApiItem[] = []): CategoryNode[] {
  return items.map((item) => ({
    id: getCategoryId(item),
    name: item.name || "",
    slug: item.slug || "",
    description: item.description || "",
    parent: getParentId(item.parent) || null,
    ancestors: Array.isArray(item.ancestors)
      ? item.ancestors.map(String)
      : [],
    level: Number(item.level || 0),
    image: {
      url: item.image?.url || "",
      publicId: item.image?.publicId || "",
    },
    isActive: item.isActive ?? true,
    sortOrder: Number(item.sortOrder || 0),
    children: normalizeTree(item.children || []),
  }));
}

export default function CategoryManager() {
  const [categories, setCategories] = useState<CategoryNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<ViewMode>("all");
  const [menuOpen, setMenuOpen] = useState(false);
  const [form, setForm] = useState<CategoryForm>(EMPTY_FORM);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const menuRef = useRef<HTMLDivElement | null>(null);

  /* =========================================================
     LOAD TREE
  ========================================================= */

  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/api/categories/tree`,
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to load categories."
        );
      }

      setCategories(normalizeTree(data.categories || []));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load categories."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  /* =========================================================
     CLOSE TOP MENU ON OUTSIDE CLICK
  ========================================================= */

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClick);
    return () =>
      document.removeEventListener("mousedown", handleClick);
  }, []);

  /* =========================================================
     FLAT CATEGORY LIST
  ========================================================= */

  const flatCategories = useMemo(() => {
    const result: CategoryNode[] = [];

    const walk = (nodes: CategoryNode[]) => {
      for (const node of nodes) {
        result.push(node);
        walk(node.children || []);
      }
    };

    walk(categories);
    return result;
  }, [categories]);

  const findNode = useCallback(
    (categoryId: string): CategoryNode | null => {
      const walk = (nodes: CategoryNode[]): CategoryNode | null => {
        for (const node of nodes) {
          if (node.id === categoryId) return node;
          const child = walk(node.children || []);
          if (child) return child;
        }
        return null;
      };

      return walk(categories);
    },
    [categories]
  );

  const getDescendantIds = useCallback(
    (categoryId: string) => {
      const ids = new Set<string>();
      const node = findNode(categoryId);

      const collect = (current: CategoryNode) => {
        for (const child of current.children || []) {
          ids.add(child.id);
          collect(child);
        }
      };

      if (node) collect(node);
      return ids;
    },
    [findNode]
  );

  /* =========================================================
     VIEW ACTIONS
  ========================================================= */

  const showAllCategories = () => {
    setMenuOpen(false);
    setViewMode("all");
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError("");
    setSuccess("");
  };

  const openNewCategory = (parentId = "") => {
    setMenuOpen(false);
    setEditingId(null);
    setForm({
      ...EMPTY_FORM,
      parentId,
    });
    setViewMode("form");
    setError("");
    setSuccess("");
  };

  /* =========================================================
     EDIT BY ID
     GET /api/categories/:id
  ========================================================= */

  const openEditById = async (categoryId: string) => {
    try {
      setMenuOpen(false);
      setError("");
      setSuccess("");

      const response = await fetch(
        `${API_URL}/api/categories/${categoryId}`,
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to load category."
        );
      }

      const category: CategoryApiItem =
        data.category || {};

      setEditingId(categoryId);

      setForm({
        name: category.name || "",
        description: category.description || "",
        parentId: getParentId(category.parent),
        sortOrder: String(category.sortOrder ?? 0),
        isActive: category.isActive ?? true,
      });

      setViewMode("form");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load category."
      );
    }
  };

  /* =========================================================
     SAVE
  ========================================================= */

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (saving) return;

    const name = form.name.trim();
    const sortOrder = Number(form.sortOrder);

    if (!name) {
      setError("Category name is required.");
      return;
    }

    if (!Number.isFinite(sortOrder)) {
      setError("Sort order must be a number.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const isEditing = Boolean(editingId);

      const endpoint = isEditing
        ? `${API_URL}/api/categories/${editingId}`
        : `${API_URL}/api/categories`;

      const response = await fetch(endpoint, {
        method: isEditing ? "PATCH" : "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          description: form.description.trim(),
          parentId: form.parentId || null,
          sortOrder,
          isActive: form.isActive,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to save category."
        );
      }

      setSuccess(
        isEditing
          ? "Category updated successfully."
          : "Category created successfully."
      );

      setEditingId(null);
      setForm(EMPTY_FORM);
      setViewMode("all");

      await loadCategories();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save category."
      );
    } finally {
      setSaving(false);
    }
  };

  /* =========================================================
     DELETE
  ========================================================= */

  const handleDelete = async (categoryId: string) => {
    const category = findNode(categoryId);

    if (!category) {
      setError("Category not found.");
      return;
    }

    if (category.children?.length) {
      setError(
        `"${category.name}" has subcategories. Delete or move them first.`
      );
      return;
    }

    const confirmed = window.confirm(
      `Delete "${category.name}" category?`
    );

    if (!confirmed) return;

    try {
      setDeletingId(categoryId);
      setError("");
      setSuccess("");

      const response = await fetch(
        `${API_URL}/api/categories/${categoryId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to delete category."
        );
      }

      setSuccess("Category deleted successfully.");
      await loadCategories();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete category."
      );
    } finally {
      setDeletingId(null);
    }
  };

  /* =========================================================
     PARENT OPTIONS FOR EDIT
  ========================================================= */

  const invalidParentIds = useMemo(() => {
    const ids = new Set<string>();

    if (editingId) {
      ids.add(editingId);

      for (const id of getDescendantIds(editingId)) {
        ids.add(id);
      }
    }

    return ids;
  }, [editingId, getDescendantIds]);

  return (
    <div className="mx-auto w-full max-w-[1500px]">
      {/* =====================================================
          TOP
      ===================================================== */}

      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[9px] font-semibold uppercase tracking-[0.24em] text-[#8C1839]">
            Catalog Structure
          </p>

          <h1 className="mt-2 text-[28px] font-semibold text-[#211A18]">
            Categories
          </h1>

          <p className="mt-1 text-[11px] leading-5 text-[#211A18]/45">
            Create unlimited categories and nested subcategories.
          </p>
        </div>

        {/* CATEGORY DROPDOWN */}

        <div ref={menuRef} className="relative w-full sm:w-[245px]">
          <button
            type="button"
            onClick={() => setMenuOpen((current) => !current)}
            className="flex h-[48px] w-full items-center justify-between rounded-[12px] bg-[#8C1839] px-5 text-[10px] font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-[#211A18]"
          >
            <span>
              {viewMode === "form"
                ? editingId
                  ? "Edit Category"
                  : "New Category"
                : "Category"}
            </span>

            <ChevronIcon open={menuOpen} />
          </button>

          {menuOpen && (
            <div className="absolute right-0 z-50 mt-2 w-full overflow-hidden rounded-[14px] border border-[#211A18]/10 bg-white p-2 shadow-[0_18px_45px_rgba(33,26,24,0.12)]">
              <button
                type="button"
                onClick={showAllCategories}
                className="flex w-full items-center gap-3 rounded-[10px] px-3 py-3 text-left transition hover:bg-[#F3EEE8]"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-[#F3EEE8] text-[#8C1839]">
                  <TreeIcon />
                </span>

                <span>
                  <span className="block text-[11px] font-semibold text-[#211A18]">
                    All Categories
                  </span>
                  <span className="mt-0.5 block text-[9px] text-[#211A18]/40">
                    View complete category tree
                  </span>
                </span>
              </button>

              <div className="my-1 h-px bg-[#211A18]/8" />

              <button
                type="button"
                onClick={() => openNewCategory()}
                className="flex w-full items-center gap-3 rounded-[10px] px-3 py-3 text-left transition hover:bg-[#F3EEE8]"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-[#8C1839] text-white">
                  <PlusIcon />
                </span>

                <span>
                  <span className="block text-[11px] font-semibold text-[#211A18]">
                    New Category
                  </span>
                  <span className="mt-0.5 block text-[9px] text-[#211A18]/40">
                    Add root or subcategory
                  </span>
                </span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* =====================================================
          MESSAGE
      ===================================================== */}

      {error && (
        <Message tone="error">{error}</Message>
      )}

      {success && (
        <Message tone="success">{success}</Message>
      )}

      {/* =====================================================
          ALL CATEGORY VIEW
      ===================================================== */}

      {viewMode === "all" && (
        <section className="mt-6 overflow-hidden rounded-[22px] border border-[#211A18]/10 bg-white">
          <div className="flex flex-col gap-4 border-b border-[#211A18]/10 px-5 py-5 md:flex-row md:items-center md:justify-between md:px-6">
            <div>
              <h2 className="text-[16px] font-semibold text-[#211A18]">
                All Categories
              </h2>
              <p className="mt-1 text-[10px] text-[#211A18]/40">
                Click a category arrow to open its subcategories.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="rounded-full bg-[#F3EEE8] px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.1em] text-[#8C1839]">
                {flatCategories.length} Categories
              </span>

              <button
                type="button"
                onClick={() => openNewCategory()}
                className="h-9 rounded-[10px] bg-[#211A18] px-4 text-[9px] font-semibold uppercase tracking-[0.1em] text-white transition hover:bg-[#8C1839]"
              >
                + New
              </button>
            </div>
          </div>

          {/* TABLE HEADER */}

          <div className="hidden grid-cols-[minmax(260px,1fr)_120px_110px_180px] gap-4 border-b border-[#211A18]/8 bg-[#FAF8F6] px-6 py-3 md:grid">
            <HeaderText>Category</HeaderText>
            <HeaderText>Status</HeaderText>
            <HeaderText>Level</HeaderText>
            <HeaderText align="right">Actions</HeaderText>
          </div>

          {loading ? (
            <div className="flex min-h-[320px] items-center justify-center">
              <div className="flex items-center gap-3 text-[11px] text-[#211A18]/45">
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#211A18]/10 border-t-[#8C1839]" />
                Loading categories...
              </div>
            </div>
          ) : categories.length === 0 ? (
            <div className="flex min-h-[320px] flex-col items-center justify-center px-6 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#F3EEE8] text-[#8C1839]">
                <TreeIcon />
              </div>

              <h3 className="mt-4 text-[14px] font-semibold text-[#211A18]">
                No categories found
              </h3>

              <p className="mt-1 text-[10px] text-[#211A18]/40">
                Create your first category.
              </p>

              <button
                type="button"
                onClick={() => openNewCategory()}
                className="mt-5 rounded-[10px] bg-[#8C1839] px-5 py-3 text-[9px] font-semibold uppercase tracking-[0.12em] text-white"
              >
                + New Category
              </button>
            </div>
          ) : (
            <div className="p-3 sm:p-4">
              {categories.map((category) => (
                <CategoryRow
                  key={category.id}
                  category={category}
                  depth={0}
                  onAddChild={openNewCategory}
                  onEdit={openEditById}
                  onDelete={handleDelete}
                  deletingId={deletingId}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* =====================================================
          NEW / EDIT FORM VIEW
      ===================================================== */}

      {viewMode === "form" && (
        <section className="mt-6 overflow-hidden rounded-[22px] border border-[#211A18]/10 bg-white">
          <div className="flex items-center justify-between border-b border-[#211A18]/10 px-5 py-5 md:px-6">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#8C1839]">
                {editingId ? "Edit" : "New"}
              </p>

              <h2 className="mt-1 text-[17px] font-semibold text-[#211A18]">
                {editingId ? "Edit Category" : "New Category"}
              </h2>

              {editingId && (
                <p className="mt-1 break-all text-[9px] text-[#211A18]/40">
                  Category ID: {editingId}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={showAllCategories}
              className="rounded-[10px] border border-[#211A18]/10 px-4 py-2.5 text-[9px] font-semibold uppercase tracking-[0.1em] text-[#211A18]/60 transition hover:border-[#211A18] hover:text-[#211A18]"
            >
              ← All Categories
            </button>
          </div>

          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 gap-6 p-5 md:p-6 lg:grid-cols-2"
          >
            <Field>
              <Label>Category Name</Label>
              <input
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                placeholder="e.g. Sports Bra"
                className={inputClass}
              />
            </Field>

            <Field>
              <Label>Parent Category</Label>

              <select
                value={form.parentId}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    parentId: event.target.value,
                  }))
                }
                className={inputClass}
              >
                <option value="">
                  No Parent — Root Category
                </option>

                {flatCategories
                  .filter(
                    (category) =>
                      !invalidParentIds.has(category.id)
                  )
                  .map((category) => (
                    <option
                      key={category.id}
                      value={category.id}
                    >
                      {`${"— ".repeat(category.level)}${category.name}`}
                    </option>
                  ))}
              </select>

              <p className="mt-2 text-[9px] text-[#211A18]/35">
                Parent select karoge to ye category uske andar
                subcategory ban jayegi.
              </p>
            </Field>

            <div className="lg:col-span-2">
              <Field>
                <Label>Description</Label>
                <textarea
                  value={form.description}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  rows={5}
                  placeholder="Category description"
                  className={`${inputClass} h-auto resize-none py-3`}
                />
              </Field>
            </div>

            <Field>
              <Label>Sort Order</Label>
              <input
                type="number"
                value={form.sortOrder}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    sortOrder: event.target.value,
                  }))
                }
                className={inputClass}
              />
            </Field>

            <Field>
              <Label>Status</Label>

              <button
                type="button"
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    isActive: !current.isActive,
                  }))
                }
                className="flex h-[48px] w-full items-center justify-between rounded-[12px] border border-[#211A18]/12 bg-[#FAF8F6] px-4"
              >
                <span className="text-[11px] font-medium text-[#211A18]">
                  {form.isActive
                    ? "Active Category"
                    : "Inactive Category"}
                </span>

                <span
                  className={`relative h-7 w-12 rounded-full transition ${
                    form.isActive
                      ? "bg-[#8C1839]"
                      : "bg-[#211A18]/15"
                  }`}
                >
                  <span
                    className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${
                      form.isActive ? "left-6" : "left-1"
                    }`}
                  />
                </span>
              </button>
            </Field>

            <div className="flex flex-col-reverse gap-3 border-t border-[#211A18]/8 pt-5 sm:flex-row sm:justify-end lg:col-span-2">
              <button
                type="button"
                onClick={showAllCategories}
                disabled={saving}
                className="h-[46px] rounded-[11px] border border-[#211A18]/10 px-5 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#211A18]/60 transition hover:border-[#211A18] hover:text-[#211A18] disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="h-[46px] rounded-[11px] bg-[#8C1839] px-6 text-[9px] font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-[#211A18] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : editingId
                    ? "Update Category"
                    : "Create Category"}
              </button>
            </div>
          </form>
        </section>
      )}
    </div>
  );
}

/* =========================================================
   CATEGORY ROW - RECURSIVE TREE
========================================================= */

function CategoryRow({
  category,
  depth,
  onAddChild,
  onEdit,
  onDelete,
  deletingId,
}: {
  category: CategoryNode;
  depth: number;
  onAddChild: (parentId: string) => void;
  onEdit: (categoryId: string) => void;
  onDelete: (categoryId: string) => void;
  deletingId: string | null;
}) {
  const [open, setOpen] = useState(false);
  const hasChildren = Boolean(category.children?.length);

  return (
    <div>
      <div
        className="mb-2 overflow-hidden rounded-[14px] border border-[#211A18]/8 bg-[#FAF8F6] transition hover:border-[#8C1839]/25"
        style={{
          marginLeft: Math.min(depth * 22, 110),
        }}
      >
        <div className="grid grid-cols-1 gap-3 px-4 py-3.5 md:grid-cols-[minmax(260px,1fr)_120px_110px_180px] md:items-center md:gap-4">
          {/* CATEGORY */}

          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => hasChildren && setOpen((v) => !v)}
              disabled={!hasChildren}
              aria-label={
                hasChildren
                  ? open
                    ? "Close subcategories"
                    : "Open subcategories"
                  : "No subcategories"
              }
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] text-[12px] font-semibold transition ${
                hasChildren
                  ? "bg-[#F3EEE8] text-[#8C1839] hover:bg-[#8C1839] hover:text-white"
                  : "bg-[#211A18]/5 text-[#211A18]/20"
              }`}
            >
              {hasChildren ? (open ? "−" : "+") : "•"}
            </button>

            <button
              type="button"
              onClick={() => hasChildren && setOpen((v) => !v)}
              className="min-w-0 text-left"
            >
              <p className="truncate text-[12px] font-semibold text-[#211A18]">
                {category.name}
              </p>

              <p className="mt-1 truncate text-[9px] text-[#211A18]/40">
                /{category.slug}
                {hasChildren
                  ? ` • ${category.children.length} sub ${
                      category.children.length === 1
                        ? "category"
                        : "categories"
                    }`
                  : " • No subcategory"}
              </p>
            </button>
          </div>

          {/* STATUS */}

          <div>
            <span
              className={`inline-flex rounded-full px-2.5 py-1 text-[8px] font-semibold uppercase tracking-[0.08em] ${
                category.isActive
                  ? "bg-green-50 text-green-700"
                  : "bg-[#211A18]/5 text-[#211A18]/45"
              }`}
            >
              {category.isActive ? "Active" : "Inactive"}
            </span>
          </div>

          {/* LEVEL */}

          <div className="text-[10px] text-[#211A18]/55">
            Level {category.level}
            <span className="ml-1 text-[#211A18]/30">
              • Sort {category.sortOrder}
            </span>
          </div>

          {/* ACTIONS RIGHT */}

          <div className="flex flex-wrap items-center gap-2 md:justify-end">
            <button
              type="button"
              onClick={() => onAddChild(category.id)}
              className="h-8 rounded-[8px] border border-[#8C1839]/15 px-2.5 text-[8px] font-semibold uppercase tracking-[0.06em] text-[#8C1839] transition hover:bg-[#8C1839] hover:text-white"
            >
              + Sub
            </button>

            <button
              type="button"
              onClick={() => onEdit(category.id)}
              className="h-8 rounded-[8px] border border-[#211A18]/10 px-3 text-[8px] font-semibold uppercase tracking-[0.06em] text-[#211A18]/60 transition hover:border-[#211A18] hover:text-[#211A18]"
            >
              Edit
            </button>

            <button
              type="button"
              onClick={() => onDelete(category.id)}
              disabled={deletingId === category.id}
              className="h-8 rounded-[8px] border border-red-200 px-3 text-[8px] font-semibold uppercase tracking-[0.06em] text-red-500 transition hover:bg-red-500 hover:text-white disabled:opacity-40"
            >
              {deletingId === category.id ? "..." : "Delete"}
            </button>
          </div>
        </div>
      </div>

      {hasChildren &&
        open &&
        category.children.map((child) => (
          <CategoryRow
            key={child.id}
            category={child}
            depth={depth + 1}
            onAddChild={onAddChild}
            onEdit={onEdit}
            onDelete={onDelete}
            deletingId={deletingId}
          />
        ))}
    </div>
  );
}

/* =========================================================
   SMALL UI COMPONENTS
========================================================= */

function Field({ children }: { children: ReactNode }) {
  return <div>{children}</div>;
}

function Label({ children }: { children: ReactNode }) {
  return (
    <label className="mb-2 block text-[9px] font-semibold uppercase tracking-[0.15em] text-[#211A18]/55">
      {children}
    </label>
  );
}

function HeaderText({
  children,
  align = "left",
}: {
  children: ReactNode;
  align?: "left" | "right";
}) {
  return (
    <p
      className={`text-[8px] font-semibold uppercase tracking-[0.12em] text-[#211A18]/40 ${
        align === "right" ? "text-right" : ""
      }`}
    >
      {children}
    </p>
  );
}

function Message({
  children,
  tone,
}: {
  children: ReactNode;
  tone: "error" | "success";
}) {
  return (
    <div
      className={`mt-5 rounded-[14px] border px-4 py-3 text-[11px] ${
        tone === "error"
          ? "border-red-200 bg-red-50 text-red-600"
          : "border-green-200 bg-green-50 text-green-700"
      }`}
    >
      {children}
    </div>
  );
}

const inputClass = `
  h-[48px]
  w-full
  rounded-[12px]
  border
  border-[#211A18]/12
  bg-[#FAF8F6]
  px-4
  text-[12px]
  text-[#211A18]
  outline-none
  transition
  placeholder:text-[#211A18]/25
  focus:border-[#8C1839]
  focus:ring-4
  focus:ring-[#8C1839]/5
`;

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`transition ${open ? "rotate-180" : ""}`}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function TreeIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 3v12" />
      <path d="M6 7h8" />
      <path d="M6 15h8" />
      <rect x="14" y="4" width="7" height="6" rx="1" />
      <rect x="14" y="12" width="7" height="6" rx="1" />
    </svg>
  );
}
