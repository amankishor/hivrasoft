"use client";

import {
  useCallback,
  useEffect,
  useMemo,
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

type CategoryForm = {
  name: string;
  description: string;
  parentId: string;
  sortOrder: string;
  isActive: boolean;
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000";

const EMPTY_FORM: CategoryForm = {
  name: "",
  description: "",
  parentId: "",
  sortOrder: "0",
  isActive: true,
};

/* =========================================================
   COMPONENT
========================================================= */

export default function CategoryManager() {
  const [categories, setCategories] =
    useState<CategoryNode[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [formOpen, setFormOpen] =
    useState(false);

  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [form, setForm] =
    useState<CategoryForm>(
      EMPTY_FORM
    );

  /* =========================================================
     LOAD CATEGORY TREE
  ========================================================= */

  const loadCategories =
    useCallback(async () => {
      setLoading(true);
      setError("");

      try {
        const response =
          await fetch(
            `${API_URL}/api/categories/tree`,
            {
              method: "GET",
              credentials: "include",
              cache: "no-store",
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Unable to load categories."
          );
        }

        setCategories(
          data.categories || []
        );
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
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
     FLATTEN TREE
  ========================================================= */

  const flatCategories =
    useMemo(() => {
      const result: CategoryNode[] =
        [];

      const walk = (
        items: CategoryNode[]
      ) => {
        for (const item of items) {
          result.push(item);

          if (
            item.children?.length
          ) {
            walk(
              item.children
            );
          }
        }
      };

      walk(categories);

      return result;
    }, [categories]);

  /* =========================================================
     DESCENDANT IDS
  ========================================================= */

  const getDescendantIds = (
    categoryId: string
  ) => {
    const ids =
      new Set<string>();

    const findNode = (
      items: CategoryNode[]
    ): CategoryNode | null => {
      for (const item of items) {
        if (
          item.id ===
          categoryId
        ) {
          return item;
        }

        const found =
          findNode(
            item.children || []
          );

        if (found) {
          return found;
        }
      }

      return null;
    };

    const node =
      findNode(
        categories
      );

    const collect = (
      item: CategoryNode
    ) => {
      for (
        const child
        of item.children || []
      ) {
        ids.add(
          child.id
        );

        collect(child);
      }
    };

    if (node) {
      collect(node);
    }

    return ids;
  };

  /* =========================================================
     OPEN CREATE ROOT
  ========================================================= */

  const openCreateRoot = () => {
    setEditingId(null);

    setForm({
      ...EMPTY_FORM,
    });

    setError("");
    setSuccess("");
    setFormOpen(true);
  };

  /* =========================================================
     OPEN CREATE SUBCATEGORY
  ========================================================= */

  const openCreateChild = (
    parentId: string
  ) => {
    setEditingId(null);

    setForm({
      ...EMPTY_FORM,
      parentId,
    });

    setError("");
    setSuccess("");
    setFormOpen(true);
  };

  /* =========================================================
     OPEN EDIT
  ========================================================= */

  const openEdit = (
    category: CategoryNode
  ) => {
    setEditingId(
      category.id
    );

    setForm({
      name:
        category.name,

      description:
        category.description ||
        "",

      parentId:
        category.parent ||
        "",

      sortOrder:
        String(
          category.sortOrder ??
            0
        ),

      isActive:
        category.isActive,
    });

    setError("");
    setSuccess("");
    setFormOpen(true);
  };

  /* =========================================================
     CLOSE FORM
  ========================================================= */

  const closeForm = () => {
    if (saving) return;

    setFormOpen(false);
    setEditingId(null);

    setForm({
      ...EMPTY_FORM,
    });

    setError("");
  };

  /* =========================================================
     SUBMIT
  ========================================================= */

  const handleSubmit =
    async (
      event:
        React.FormEvent<HTMLFormElement>
    ) => {
      event.preventDefault();

      if (saving) return;

      setError("");
      setSuccess("");

      const name =
        form.name.trim();

      if (!name) {
        setError(
          "Category name is required."
        );

        return;
      }

      const sortOrder =
        Number(
          form.sortOrder
        );

      if (
        !Number.isFinite(
          sortOrder
        )
      ) {
        setError(
          "Sort order must be a number."
        );

        return;
      }

      try {
        setSaving(true);

        const isEditing =
          Boolean(
            editingId
          );

        const endpoint =
          isEditing
            ? `${API_URL}/api/categories/${editingId}`
            : `${API_URL}/api/categories`;

        const response =
          await fetch(
            endpoint,
            {
              method:
                isEditing
                  ? "PATCH"
                  : "POST",

              credentials:
                "include",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  name,

                  description:
                    form.description.trim(),

                  parentId:
                    form.parentId ||
                    null,

                  sortOrder,

                  isActive:
                    form.isActive,
                }),
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Unable to save category."
          );
        }

        setSuccess(
          isEditing
            ? "Category updated successfully."
            : "Category created successfully."
        );

        setFormOpen(false);
        setEditingId(null);

        setForm({
          ...EMPTY_FORM,
        });

        await loadCategories();
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Unable to save category."
        );
      } finally {
        setSaving(false);
      }
    };

  /* =========================================================
     DELETE
  ========================================================= */

  const handleDelete =
    async (
      category: CategoryNode
    ) => {
      if (
        category.children
          ?.length
      ) {
        setError(
          `"${category.name}" has subcategories. Delete or move them first.`
        );

        return;
      }

      const confirmed =
        window.confirm(
          `Delete "${category.name}" category?`
        );

      if (!confirmed) {
        return;
      }

      setError("");
      setSuccess("");

      try {
        setDeletingId(
          category.id
        );

        const response =
          await fetch(
            `${API_URL}/api/categories/${category.id}`,
            {
              method:
                "DELETE",

              credentials:
                "include",
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Unable to delete category."
          );
        }

        setSuccess(
          "Category deleted successfully."
        );

        await loadCategories();
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Unable to delete category."
        );
      } finally {
        setDeletingId(
          null
        );
      }
    };

  /* =========================================================
     PARENT OPTIONS
  ========================================================= */

  const invalidParentIds =
    editingId
      ? getDescendantIds(
          editingId
        )
      : new Set<string>();

  if (editingId) {
    invalidParentIds.add(
      editingId
    );
  }

  /* =========================================================
     UI
  ========================================================= */

  return (
    <div
      className="
        mx-auto
        max-w-[1500px]
      "
    >
      {/* HEADER */}

      <div
        className="
          flex
          flex-col
          gap-4
          sm:flex-row
          sm:items-center
          sm:justify-between
        "
      >
        <div>
          <p
            className="
              text-[9px]
              font-semibold
              uppercase
              tracking-[0.24em]
              text-[#8C1839]
            "
          >
            Catalog Structure
          </p>

          <h2
            className="
              mt-2
              text-[25px]
              font-semibold
              text-[#211A18]
            "
          >
            Categories
          </h2>

          <p
            className="
              mt-1
              text-[11px]
              leading-5
              text-[#211A18]/45
            "
          >
            Create unlimited categories
            and nested subcategories.
          </p>
        </div>

        <button
          type="button"
          onClick={
            openCreateRoot
          }
          className="
            flex
            h-[46px]
            items-center
            justify-center
            rounded-[12px]
            bg-[#8C1839]
            px-5
            text-[10px]
            font-semibold
            uppercase
            tracking-[0.13em]
            text-white
            transition
            hover:bg-[#211A18]
          "
        >
          + Add Root Category
        </button>
      </div>

      {/* MESSAGES */}

      {error && (
        <div
          className="
            mt-5
            rounded-[14px]
            border
            border-red-200
            bg-red-50
            px-4
            py-3
            text-[11px]
            text-red-600
          "
        >
          {error}
        </div>
      )}

      {success && (
        <div
          className="
            mt-5
            rounded-[14px]
            border
            border-green-200
            bg-green-50
            px-4
            py-3
            text-[11px]
            text-green-700
          "
        >
          {success}
        </div>
      )}

      {/* CONTENT */}

      <div
        className="
          mt-6
          grid
          grid-cols-1
          gap-6
          xl:grid-cols-[1fr_390px]
        "
      >
        {/* CATEGORY TREE */}

        <section
          className="
            min-w-0
            overflow-hidden
            rounded-[22px]
            border
            border-[#211A18]/10
            bg-white
          "
        >
          <div
            className="
              flex
              items-center
              justify-between
              border-b
              border-[#211A18]/10
              px-5
              py-5
              md:px-6
            "
          >
            <div>
              <h3
                className="
                  text-[15px]
                  font-semibold
                  text-[#211A18]
                "
              >
                Category Tree
              </h3>

              <p
                className="
                  mt-1
                  text-[10px]
                  text-[#211A18]/40
                "
              >
                Add as many nested
                levels as required.
              </p>
            </div>

            <span
              className="
                rounded-full
                bg-[#F3EEE8]
                px-3
                py-1.5
                text-[9px]
                font-semibold
                uppercase
                tracking-[0.1em]
                text-[#8C1839]
              "
            >
              {
                flatCategories.length
              }{" "}
              Categories
            </span>
          </div>

          {loading ? (
            <div
              className="
                flex
                min-h-[300px]
                items-center
                justify-center
              "
            >
              <div
                className="
                  flex
                  items-center
                  gap-3
                  text-[11px]
                  text-[#211A18]/45
                "
              >
                <span
                  className="
                    h-5
                    w-5
                    animate-spin
                    rounded-full
                    border-2
                    border-[#211A18]/10
                    border-t-[#8C1839]
                  "
                />

                Loading categories...
              </div>
            </div>
          ) : categories.length ===
            0 ? (
            <div
              className="
                flex
                min-h-[300px]
                flex-col
                items-center
                justify-center
                px-5
                text-center
              "
            >
              <div
                className="
                  flex
                  h-14
                  w-14
                  items-center
                  justify-center
                  rounded-full
                  bg-[#F3EEE8]
                  text-[#8C1839]
                "
              >
                <CategoryIcon />
              </div>

              <h4
                className="
                  mt-4
                  text-[14px]
                  font-semibold
                  text-[#211A18]
                "
              >
                No categories yet
              </h4>

              <p
                className="
                  mt-1
                  text-[10px]
                  text-[#211A18]/45
                "
              >
                Create your first root
                category such as Women,
                Men or Accessories.
              </p>

              <button
                type="button"
                onClick={
                  openCreateRoot
                }
                className="
                  mt-5
                  rounded-[11px]
                  bg-[#211A18]
                  px-5
                  py-3
                  text-[9px]
                  font-semibold
                  uppercase
                  tracking-[0.12em]
                  text-white
                "
              >
                Create Category
              </button>
            </div>
          ) : (
            <div
              className="
                p-3
                sm:p-4
              "
            >
              {categories.map(
                (category) => (
                  <CategoryTreeItem
                    key={
                      category.id
                    }
                    category={
                      category
                    }
                    depth={0}
                    onAddChild={
                      openCreateChild
                    }
                    onEdit={
                      openEdit
                    }
                    onDelete={
                      handleDelete
                    }
                    deletingId={
                      deletingId
                    }
                  />
                )
              )}
            </div>
          )}
        </section>

        {/* FORM PANEL */}

        <section
          className="
            h-fit
            rounded-[22px]
            border
            border-[#211A18]/10
            bg-white
            xl:sticky
            xl:top-[100px]
          "
        >
          {!formOpen ? (
            <div
              className="
                flex
                min-h-[390px]
                flex-col
                items-center
                justify-center
                px-7
                text-center
              "
            >
              <div
                className="
                  flex
                  h-14
                  w-14
                  items-center
                  justify-center
                  rounded-full
                  bg-[#F3EEE8]
                  text-[#8C1839]
                "
              >
                <PlusIcon />
              </div>

              <h3
                className="
                  mt-4
                  text-[15px]
                  font-semibold
                  text-[#211A18]
                "
              >
                Category Manager
              </h3>

              <p
                className="
                  mt-2
                  max-w-[280px]
                  text-[10px]
                  leading-5
                  text-[#211A18]/45
                "
              >
                Add a root category or
                click “Add Subcategory”
                on any category to create
                another level inside it.
              </p>

              <button
                type="button"
                onClick={
                  openCreateRoot
                }
                className="
                  mt-5
                  rounded-[11px]
                  bg-[#211A18]
                  px-5
                  py-3
                  text-[9px]
                  font-semibold
                  uppercase
                  tracking-[0.12em]
                  text-white
                  transition
                  hover:bg-[#8C1839]
                "
              >
                + Add Category
              </button>
            </div>
          ) : (
            <form
              onSubmit={
                handleSubmit
              }
            >
              <div
                className="
                  flex
                  items-center
                  justify-between
                  border-b
                  border-[#211A18]/10
                  px-5
                  py-5
                "
              >
                <div>
                  <p
                    className="
                      text-[9px]
                      font-semibold
                      uppercase
                      tracking-[0.18em]
                      text-[#8C1839]
                    "
                  >
                    {editingId
                      ? "Edit"
                      : "Create"}
                  </p>

                  <h3
                    className="
                      mt-1
                      text-[16px]
                      font-semibold
                      text-[#211A18]
                    "
                  >
                    {editingId
                      ? "Edit Category"
                      : "New Category"}
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={
                    closeForm
                  }
                  className="
                    flex
                    h-9
                    w-9
                    items-center
                    justify-center
                    rounded-full
                    bg-[#F3EEE8]
                    text-lg
                    text-[#211A18]
                    transition
                    hover:bg-[#211A18]
                    hover:text-white
                  "
                >
                  ×
                </button>
              </div>

              <div
                className="
                  space-y-5
                  p-5
                "
              >
                {/* NAME */}

                <Field>
                  <Label>
                    Category Name
                  </Label>

                  <input
                    value={
                      form.name
                    }
                    onChange={(
                      event
                    ) =>
                      setForm(
                        (
                          current
                        ) => ({
                          ...current,
                          name:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                    placeholder="e.g. Sports Bra"
                    className={inputClass}
                  />
                </Field>

                {/* PARENT */}

                <Field>
                  <Label>
                    Parent Category
                  </Label>

                  <select
                    value={
                      form.parentId
                    }
                    onChange={(
                      event
                    ) =>
                      setForm(
                        (
                          current
                        ) => ({
                          ...current,
                          parentId:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                    className={
                      inputClass
                    }
                  >
                    <option value="">
                      No Parent — Root
                      Category
                    </option>

                    {flatCategories
                      .filter(
                        (
                          category
                        ) =>
                          !invalidParentIds.has(
                            category.id
                          )
                      )
                      .map(
                        (
                          category
                        ) => (
                          <option
                            key={
                              category.id
                            }
                            value={
                              category.id
                            }
                          >
                            {`${"— ".repeat(
                              category.level
                            )}${category.name}`}
                          </option>
                        )
                      )}
                  </select>

                  <p
                    className="
                      mt-2
                      text-[9px]
                      leading-4
                      text-[#211A18]/35
                    "
                  >
                    Select any existing
                    category to create a
                    subcategory inside it.
                  </p>
                </Field>

                {/* DESCRIPTION */}

                <Field>
                  <Label>
                    Description
                  </Label>

                  <textarea
                    value={
                      form.description
                    }
                    onChange={(
                      event
                    ) =>
                      setForm(
                        (
                          current
                        ) => ({
                          ...current,
                          description:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                    rows={4}
                    placeholder="Optional category description"
                    className={`
                      ${inputClass}
                      h-auto
                      resize-none
                      py-3
                    `}
                  />
                </Field>

                {/* SORT ORDER */}

                <Field>
                  <Label>
                    Sort Order
                  </Label>

                  <input
                    type="number"
                    value={
                      form.sortOrder
                    }
                    onChange={(
                      event
                    ) =>
                      setForm(
                        (
                          current
                        ) => ({
                          ...current,
                          sortOrder:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                    className={
                      inputClass
                    }
                  />
                </Field>

                {/* ACTIVE */}

                <div
                  className="
                    flex
                    items-center
                    justify-between
                    rounded-[14px]
                    border
                    border-[#211A18]/10
                    bg-[#FAF8F6]
                    px-4
                    py-4
                  "
                >
                  <div>
                    <p
                      className="
                        text-[11px]
                        font-semibold
                        text-[#211A18]
                      "
                    >
                      Active Category
                    </p>

                    <p
                      className="
                        mt-1
                        text-[9px]
                        text-[#211A18]/40
                      "
                    >
                      Show category on
                      storefront.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setForm(
                        (
                          current
                        ) => ({
                          ...current,
                          isActive:
                            !current.isActive,
                        })
                      )
                    }
                    className={`
                      relative
                      h-7
                      w-12
                      rounded-full
                      transition

                      ${
                        form.isActive
                          ? "bg-[#8C1839]"
                          : "bg-[#211A18]/15"
                      }
                    `}
                  >
                    <span
                      className={`
                        absolute
                        top-1
                        h-5
                        w-5
                        rounded-full
                        bg-white
                        shadow
                        transition-all

                        ${
                          form.isActive
                            ? "left-6"
                            : "left-1"
                        }
                      `}
                    />
                  </button>
                </div>

                {/* BUTTON */}

                <button
                  type="submit"
                  disabled={
                    saving
                  }
                  className="
                    flex
                    h-[48px]
                    w-full
                    items-center
                    justify-center
                    rounded-[12px]
                    bg-[#8C1839]
                    text-[10px]
                    font-semibold
                    uppercase
                    tracking-[0.15em]
                    text-white
                    transition
                    hover:bg-[#211A18]
                    disabled:cursor-not-allowed
                    disabled:opacity-50
                  "
                >
                  {saving
                    ? "Saving..."
                    : editingId
                      ? "Update Category"
                      : "Create Category"}
                </button>
              </div>
            </form>
          )}
        </section>
      </div>
    </div>
  );
}

/* =========================================================
   TREE ITEM
========================================================= */

function CategoryTreeItem({
  category,
  depth,
  onAddChild,
  onEdit,
  onDelete,
  deletingId,
}: {
  category: CategoryNode;

  depth: number;

  onAddChild: (
    id: string
  ) => void;

  onEdit: (
    category: CategoryNode
  ) => void;

  onDelete: (
    category: CategoryNode
  ) => void;

  deletingId: string | null;
}) {
  const [open, setOpen] =
    useState(true);

  const hasChildren =
    Boolean(
      category.children
        ?.length
    );

  return (
    <div>
      <div
        className="
          mb-2
          rounded-[15px]
          border
          border-[#211A18]/8
          bg-[#FAF8F6]
          transition
          hover:border-[#8C1839]/20
        "
        style={{
          marginLeft:
            Math.min(
              depth * 18,
              90
            ),
        }}
      >
        <div
          className="
            flex
            flex-col
            gap-3
            px-4
            py-4
            md:flex-row
            md:items-center
            md:justify-between
          "
        >
          <div
            className="
              flex
              min-w-0
              items-center
              gap-3
            "
          >
            <button
              type="button"
              onClick={() =>
                setOpen(
                  (value) =>
                    !value
                )
              }
              disabled={
                !hasChildren
              }
              className={`
                flex
                h-8
                w-8
                shrink-0
                items-center
                justify-center
                rounded-[9px]
                text-[12px]
                transition

                ${
                  hasChildren
                    ? "bg-[#F3EEE8] text-[#8C1839] hover:bg-[#8C1839] hover:text-white"
                    : "bg-[#211A18]/5 text-[#211A18]/20"
                }
              `}
            >
              {hasChildren
                ? open
                  ? "−"
                  : "+"
                : "•"}
            </button>

            <div
              className="
                min-w-0
              "
            >
              <div
                className="
                  flex
                  flex-wrap
                  items-center
                  gap-2
                "
              >
                <p
                  className="
                    truncate
                    text-[12px]
                    font-semibold
                    text-[#211A18]
                  "
                >
                  {category.name}
                </p>

                <span
                  className={`
                    rounded-full
                    px-2
                    py-1
                    text-[8px]
                    font-semibold
                    uppercase
                    tracking-[0.08em]

                    ${
                      category.isActive
                        ? "bg-green-50 text-green-700"
                        : "bg-[#211A18]/5 text-[#211A18]/40"
                    }
                  `}
                >
                  {category.isActive
                    ? "Active"
                    : "Inactive"}
                </span>
              </div>

              <p
                className="
                  mt-1
                  truncate
                  text-[9px]
                  text-[#211A18]/40
                "
              >
                /{category.slug}
                {" • "}
                Level{" "}
                {category.level}
                {" • "}
                Sort{" "}
                {category.sortOrder}
              </p>
            </div>
          </div>

          <div
            className="
              flex
              flex-wrap
              items-center
              gap-2
            "
          >
            <button
              type="button"
              onClick={() =>
                onAddChild(
                  category.id
                )
              }
              className="
                h-9
                rounded-[9px]
                border
                border-[#8C1839]/15
                px-3
                text-[8px]
                font-semibold
                uppercase
                tracking-[0.08em]
                text-[#8C1839]
                transition
                hover:bg-[#8C1839]
                hover:text-white
              "
            >
              + Subcategory
            </button>

            <button
              type="button"
              onClick={() =>
                onEdit(
                  category
                )
              }
              className="
                h-9
                rounded-[9px]
                border
                border-[#211A18]/10
                px-3
                text-[8px]
                font-semibold
                uppercase
                tracking-[0.08em]
                text-[#211A18]/60
                transition
                hover:border-[#211A18]
                hover:text-[#211A18]
              "
            >
              Edit
            </button>

            <button
              type="button"
              onClick={() =>
                onDelete(
                  category
                )
              }
              disabled={
                deletingId ===
                category.id
              }
              className="
                h-9
                rounded-[9px]
                border
                border-red-200
                px-3
                text-[8px]
                font-semibold
                uppercase
                tracking-[0.08em]
                text-red-500
                transition
                hover:bg-red-500
                hover:text-white
                disabled:opacity-40
              "
            >
              {deletingId ===
              category.id
                ? "..."
                : "Delete"}
            </button>
          </div>
        </div>
      </div>

      {hasChildren &&
        open &&
        category.children.map(
          (child) => (
            <CategoryTreeItem
              key={
                child.id
              }
              category={
                child
              }
              depth={
                depth + 1
              }
              onAddChild={
                onAddChild
              }
              onEdit={
                onEdit
              }
              onDelete={
                onDelete
              }
              deletingId={
                deletingId
              }
            />
          )
        )}
    </div>
  );
}

/* =========================================================
   HELPERS
========================================================= */

function Field({
  children,
}: {
  children:
    React.ReactNode;
}) {
  return (
    <div>
      {children}
    </div>
  );
}

function Label({
  children,
}: {
  children:
    React.ReactNode;
}) {
  return (
    <label
      className="
        mb-2
        block
        text-[9px]
        font-semibold
        uppercase
        tracking-[0.15em]
        text-[#211A18]/55
      "
    >
      {children}
    </label>
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

function CategoryIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect
        x="3"
        y="3"
        width="7"
        height="7"
        rx="1"
      />

      <rect
        x="14"
        y="3"
        width="7"
        height="7"
        rx="1"
      />

      <rect
        x="3"
        y="14"
        width="7"
        height="7"
        rx="1"
      />

      <rect
        x="14"
        y="14"
        width="7"
        height="7"
        rx="1"
      />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
      />

      <path d="M12 8v8M8 12h8" />
    </svg>
  );
}