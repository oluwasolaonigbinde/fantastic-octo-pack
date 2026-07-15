"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Eye, Plus, Trash2 } from "lucide-react";

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Input,
  SingleSelect,
  Spinner,
  Switch,
  Textarea,
} from "@/components/base";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAppSelector } from "@/hooks/useAppSelector";
import categoryService from "@/services/categoryService";
import type {
  BaseSpecification,
  Category,
  Subcategory,
} from "@/types/categories";

type View = "categories" | "subcategories" | "specs";

/** UI field-type labels mapped onto the backend base-spec `type` values. */
const FIELD_TYPE_OPTIONS = [
  { value: "enum", label: "Dropdown" },
  { value: "text", label: "Text" },
  { value: "number", label: "Number" },
];

const fieldTypeLabel = (type: BaseSpecification["type"]) =>
  FIELD_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? "Text";

export default function CategoriesManagement() {
  const token = useAppSelector((state) => state.auth.data?.tokens?.accessToken);

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const [view, setView] = useState<View>("categories");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string | null>(
    null,
  );

  // Modals
  const [addCategoryOpen, setAddCategoryOpen] = useState(false);
  const [addSubcategoryOpen, setAddSubcategoryOpen] = useState(false);
  const [specModalOpen, setSpecModalOpen] = useState(false);
  const [editingSpecIndex, setEditingSpecIndex] = useState<number | null>(null);
  const [deleteCategoryTarget, setDeleteCategoryTarget] = useState<Category | null>(
    null,
  );
  const [deletingCategory, setDeletingCategory] = useState(false);
  const [deleteCategoryError, setDeleteCategoryError] = useState("");

  const refresh = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await categoryService.fetchCategories(1, 100);
        if (!ignore) setCategories(res.data.docs);
      } catch (err) {
        if (!ignore)
          setError(
            err instanceof Error ? err.message : "Failed to load categories.",
          );
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    void load();
    return () => {
      ignore = true;
    };
  }, [reloadKey]);

  // Keep the drilled-in category object fresh after each reload.
  const selectedCategory = useMemo(
    () => categories.find((c) => c._id === selectedCategoryId) ?? null,
    [categories, selectedCategoryId],
  );

  // Specs and the installation flag now live on the subcategory subdocument.
  const selectedSubcategory = useMemo(
    () =>
      (selectedCategory?.subcategories ?? []).find(
        (sub) => sub._id === selectedSubcategoryId,
      ) ?? null,
    [selectedCategory, selectedSubcategoryId],
  );

  const subCount = (category: Category) => category.subcategories?.length ?? 0;
  // Total required specs across all of a category's subcategories.
  const specCount = (category: Category) =>
    (category.subcategories ?? []).reduce(
      (total, sub) => total + (sub.specifications?.length ?? 0),
      0,
    );

  const openCategory = (category: Category) => {
    setSelectedCategoryId(category._id);
    setView("subcategories");
  };

  const openSubcategory = (sub: Subcategory) => {
    setSelectedSubcategoryId(sub._id);
    setView("specs");
  };

  const goBack = () => {
    if (view === "specs") {
      setSelectedSubcategoryId(null);
      setView("subcategories");
    } else if (view === "subcategories") {
      setSelectedCategoryId(null);
      setView("categories");
    }
  };

  // ── Mutations ────────────────────────────────────────────────────────────
  const handleAddCategory = async (name: string, description: string) => {
    if (!token) throw new Error("Your session has expired. Please sign in again.");
    await categoryService.createCategory(token, {
      name: name.trim(),
      description: description.trim(),
    });
    refresh();
  };

  const handleAddSubcategory = async (
    name: string,
    requiresInstallation: boolean,
  ) => {
    if (!token || !selectedCategory) return;
    await categoryService.createSubcategory(token, selectedCategory._id, {
      name: name.trim(),
      requiresInstallation,
    });
    refresh();
  };

  const handleDeleteCategory = async () => {
    if (!token || !deleteCategoryTarget) return;
    setDeletingCategory(true);
    setDeleteCategoryError("");
    try {
      await categoryService.deleteCategory(token, deleteCategoryTarget._id);
      setDeleteCategoryTarget(null);
      refresh();
    } catch (err) {
      setDeleteCategoryError(
        err instanceof Error ? err.message : "Deleting category failed.",
      );
    } finally {
      setDeletingCategory(false);
    }
  };

  const handleSaveSpec = async (spec: BaseSpecification) => {
    if (!token || !selectedCategory || !selectedSubcategory) return;
    const existing = selectedSubcategory.specifications ?? [];
    const next =
      editingSpecIndex !== null
        ? existing.map((s, i) => (i === editingSpecIndex ? spec : s))
        : [...existing, spec];
    await categoryService.updateSubcategory(
      token,
      selectedCategory._id,
      selectedSubcategory._id,
      { specifications: next },
    );
    refresh();
  };

  // ── Render helpers ───────────────────────────────────────────────────────
  const heading =
    view === "categories"
      ? "Categories"
      : view === "subcategories"
        ? selectedCategory?.name ?? "Subcategories"
        : selectedSubcategory?.name ?? "Required Specifications";

  const addBtnClass = "w-auto whitespace-nowrap px-4";
  const addButton =
    view === "categories" ? (
      <Button
        title="Add Category"
        iconLeft={<Plus size={16} />}
        type="button"
        size="sm"
        className={addBtnClass}
        onClick={() => setAddCategoryOpen(true)}
      />
    ) : view === "subcategories" ? (
      <Button
        title="Add Sub Category"
        iconLeft={<Plus size={16} />}
        type="button"
        size="sm"
        className={addBtnClass}
        onClick={() => setAddSubcategoryOpen(true)}
      />
    ) : (
      <Button
        title="Add Required Specifications"
        iconLeft={<Plus size={16} />}
        type="button"
        size="sm"
        className={addBtnClass}
        onClick={() => {
          setEditingSpecIndex(null);
          setSpecModalOpen(true);
        }}
      />
    );

  return (
    <div className="p-4 sm:p-5 lg:p-6">
      <section className="rounded-2xl border border-gray5 bg-white p-4 sm:p-5 lg:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            {view !== "categories" ? (
              <button
                type="button"
                onClick={goBack}
                className="flex size-9 items-center justify-center rounded-lg border border-gray5 text-gray2 hover:text-primary"
                aria-label="Go back"
              >
                <ArrowLeft size={18} />
              </button>
            ) : null}
            <h3 className="text-xl font-semibold leading-8 text-gray1">{heading}</h3>
          </div>
          {addButton}
        </div>

        {error ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {error}
          </div>
        ) : null}

        <div className="mt-6 overflow-x-auto">
          {view === "categories" ? (
            <CategoriesTable
              loading={loading}
              categories={categories}
              subCount={subCount}
              specCount={specCount}
              onView={openCategory}
              onDelete={setDeleteCategoryTarget}
            />
          ) : view === "subcategories" ? (
            <SubcategoriesTable
              category={selectedCategory}
              onView={openSubcategory}
            />
          ) : (
            <SpecsTable
              specs={selectedSubcategory?.specifications ?? []}
              onView={(index) => {
                setEditingSpecIndex(index);
                setSpecModalOpen(true);
              }}
            />
          )}
        </div>
      </section>

      <AddCategoryModal
        open={addCategoryOpen}
        onClose={() => setAddCategoryOpen(false)}
        onSave={handleAddCategory}
      />

      <AddSubcategoryModal
        open={addSubcategoryOpen}
        onClose={() => setAddSubcategoryOpen(false)}
        onSave={handleAddSubcategory}
      />

      <SpecModal
        open={specModalOpen}
        onClose={() => setSpecModalOpen(false)}
        spec={
          editingSpecIndex !== null
            ? selectedSubcategory?.specifications?.[editingSpecIndex] ?? null
            : null
        }
        onSave={handleSaveSpec}
      />

      <Dialog
        open={!!deleteCategoryTarget}
        onOpenChange={() => !deletingCategory && setDeleteCategoryTarget(null)}
      >
        <DialogContent
          showCloseButton={false}
          className="max-w-[440px] rounded-2xl bg-white p-6"
        >
          <DialogTitle className="text-lg font-semibold text-gray1">
            Delete category
          </DialogTitle>
          <DialogDescription className="mt-2 text-sm text-gray2">
            Are you sure you want to delete{" "}
            <span className="font-medium text-gray1">
              “{deleteCategoryTarget?.name}”
            </span>
            ? This will also remove its subcategories and required
            specifications. This action cannot be undone.
          </DialogDescription>
          {deleteCategoryError ? (
            <p className="mt-2 text-sm text-danger">{deleteCategoryError}</p>
          ) : null}
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              title="Cancel"
              variant="secondaryLight"
              type="button"
              className="w-full sm:w-auto"
              disabled={deletingCategory}
              onClick={() => setDeleteCategoryTarget(null)}
            />
            <Button
              title="Delete category"
              type="button"
              className="w-full bg-[#D92D20] hover:bg-[#b9241a] sm:w-auto"
              isBusy={deletingCategory}
              onClick={handleDeleteCategory}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Tables ──────────────────────────────────────────────────────────────────

function CategoriesTable({
  loading,
  categories,
  subCount,
  specCount,
  onView,
  onDelete,
}: {
  loading: boolean;
  categories: Category[];
  subCount: (c: Category) => number;
  specCount: (c: Category) => number;
  onView: (c: Category) => void;
  onDelete: (c: Category) => void;
}) {
  return (
    <Table className="min-w-[760px]">
      <TableHeader>
        <TableRow>
          <TableHead>Category Name</TableHead>
          <TableHead>Sub Categories</TableHead>
          <TableHead>Required Specs</TableHead>
          <TableHead className="text-right">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading && categories.length === 0 ? (
          <TableRow>
            <TableCell colSpan={4} className="py-16 text-center">
              <Spinner />
            </TableCell>
          </TableRow>
        ) : categories.length === 0 ? (
          <TableRow>
            <TableCell colSpan={4} className="py-16 text-center text-gray3">
              No categories yet. Add your first category to get started.
            </TableCell>
          </TableRow>
        ) : (
          categories.map((category) => (
            <TableRow
              key={category._id}
              onClick={() => onView(category)}
              className="cursor-pointer"
            >
              <TableCell>
                <div className="flex items-center gap-3">
                  <span className="size-8 shrink-0 rounded-md bg-gray6" />
                  <span className="font-medium text-gray1">{category.name}</span>
                </div>
              </TableCell>
              <TableCell>{subCount(category)}</TableCell>
              <TableCell>{specCount(category)}</TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-4">
                  <ViewButton onClick={() => onView(category)} />
                  <DeleteButton onClick={() => onDelete(category)} />
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}

function SubcategoriesTable({
  category,
  onView,
}: {
  category: Category | null;
  onView: (sub: Subcategory) => void;
}) {
  const subs = category?.subcategories ?? [];
  return (
    <Table className="min-w-[640px]">
      <TableHeader>
        <TableRow>
          <TableHead>Sub Category Name</TableHead>
          <TableHead>Required Specs</TableHead>
          <TableHead>Installation</TableHead>
          <TableHead className="text-right">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {subs.length === 0 ? (
          <TableRow>
            <TableCell colSpan={4} className="py-16 text-center text-gray3">
              No subcategories yet. Add one to organise this category.
            </TableCell>
          </TableRow>
        ) : (
          subs.map((sub) => (
            <TableRow
              key={sub._id}
              onClick={() => onView(sub)}
              className="cursor-pointer"
            >
              <TableCell>
                <div className="flex items-center gap-3">
                  <span className="size-8 shrink-0 rounded-md bg-gray6" />
                  <span className="font-medium text-gray1">{sub.name}</span>
                </div>
              </TableCell>
              <TableCell>{sub.specifications?.length ?? 0}</TableCell>
              <TableCell>
                {sub.requiresInstallation ? "Required" : "Not required"}
              </TableCell>
              <TableCell>
                <div className="flex justify-end">
                  <ViewButton onClick={() => onView(sub)} />
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}

function SpecsTable({
  specs,
  onView,
}: {
  specs: BaseSpecification[];
  onView: (index: number) => void;
}) {
  return (
    <Table className="min-w-[640px]">
      <TableHeader>
        <TableRow>
          <TableHead>Specification Name</TableHead>
          <TableHead>Field Type</TableHead>
          <TableHead className="text-right">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {specs.length === 0 ? (
          <TableRow>
            <TableCell colSpan={3} className="py-16 text-center text-gray3">
              No required specifications yet.
            </TableCell>
          </TableRow>
        ) : (
          specs.map((spec, index) => (
            <TableRow
              key={`${spec.key}-${index}`}
              onClick={() => onView(index)}
              className="cursor-pointer"
            >
              <TableCell>
                <div className="flex items-center gap-3">
                  <span className="size-8 shrink-0 rounded-md bg-gray6" />
                  <span className="font-medium text-gray1">{spec.key}</span>
                </div>
              </TableCell>
              <TableCell>{fieldTypeLabel(spec.type)}</TableCell>
              <TableCell>
                <div className="flex justify-end">
                  <ViewButton onClick={() => onView(index)} />
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}

function ViewButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
    >
      <Eye size={16} /> View
    </button>
  );
}

function DeleteButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label="Delete category"
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      className="flex items-center text-[#D92D20] hover:opacity-80"
    >
      <Trash2 size={16} />
    </button>
  );
}

// ─── Modals ──────────────────────────────────────────────────────────────────

function ModalShell({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-[460px] rounded-2xl bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray1">{title}</h2>
        </div>
        {children}
      </DialogContent>
    </Dialog>
  );
}

function AddCategoryModal({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (name: string, description: string) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName("");
      setDescription("");
      setError("");
    }
  }, [open]);

  const submit = async () => {
    if (name.trim().length < 2) {
      setError("Enter a category name (at least 2 characters).");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSave(name, description);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Saving category failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell open={open} onClose={onClose} title="Add Category">
      <div className="space-y-4">
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <Input
          label="Category name"
          placeholder="Enter category name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Textarea
          label="Description"
          placeholder="Short description"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <ModalActions onCancel={onClose} onSave={submit} saving={saving} />
      </div>
    </ModalShell>
  );
}

function AddSubcategoryModal({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (name: string, requiresInstallation: boolean) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [requiresInstallation, setRequiresInstallation] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName("");
      setRequiresInstallation(false);
      setError("");
    }
  }, [open]);

  const submit = async () => {
    if (!name.trim()) {
      setError("Enter a subcategory name.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSave(name, requiresInstallation);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Saving subcategory failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell open={open} onClose={onClose} title="Add Sub Category">
      <div className="space-y-4">
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <Input
          label="Sub category name"
          placeholder="Enter sub category name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <div className="flex items-center justify-between gap-3 rounded-xl border border-gray5 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-gray1">
              Requires on-site installation
            </p>
            <p className="text-xs text-gray3">
              Products listed under this subcategory will require an installation
              timeline.
            </p>
          </div>
          <Switch
            checked={requiresInstallation}
            onCheckedChange={setRequiresInstallation}
            aria-label="Requires on-site installation"
          />
        </div>
        <ModalActions onCancel={onClose} onSave={submit} saving={saving} />
      </div>
    </ModalShell>
  );
}

function SpecModal({
  open,
  onClose,
  spec,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  spec: BaseSpecification | null;
  onSave: (spec: BaseSpecification) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState<BaseSpecification["type"]>("enum");
  const [options, setOptions] = useState<string[]>([""]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(spec?.key ?? "");
    setType(spec?.type ?? "enum");
    setOptions(spec?.options?.length ? [...spec.options] : [""]);
    setError("");
  }, [open, spec]);

  const submit = async () => {
    const key = name.trim();
    if (!key) {
      setError("Enter a specification name.");
      return;
    }
    const cleanOptions = options.map((o) => o.trim()).filter(Boolean);
    if (type === "enum" && cleanOptions.length === 0) {
      setError("Add at least one dropdown value.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSave({
        key,
        type,
        required: true,
        ...(type === "enum" ? { options: cleanOptions } : {}),
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Saving specification failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title={spec ? "Edit Required Specification" : "Add Required Specification"}
    >
      <div className="space-y-4">
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <Input
          label="Specification name *"
          placeholder="Enter specification name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <SingleSelect
          label="Field Type *"
          value={type}
          onValueChange={(v) => setType(v as BaseSpecification["type"])}
          options={FIELD_TYPE_OPTIONS}
        />

        {type === "enum" ? (
          <div className="space-y-3">
            <p className="type-label font-medium text-gray2">Dropdown Values</p>
            {options.map((value, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  label=""
                  placeholder={`Value ${index + 1}`}
                  value={value}
                  onChange={(e) =>
                    setOptions((prev) =>
                      prev.map((o, i) => (i === index ? e.target.value : o)),
                    )
                  }
                />
                <button
                  type="button"
                  onClick={() =>
                    setOptions((prev) =>
                      prev.length === 1 ? [""] : prev.filter((_, i) => i !== index),
                    )
                  }
                  className="mt-1 flex size-11 shrink-0 items-center justify-center text-danger"
                  aria-label="Remove value"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setOptions((prev) => [...prev, ""])}
              className="text-sm font-medium text-primary"
            >
              + Add Value
            </button>
          </div>
        ) : null}

        <ModalActions onCancel={onClose} onSave={submit} saving={saving} />
      </div>
    </ModalShell>
  );
}

function ModalActions({
  onCancel,
  onSave,
  saving,
}: {
  onCancel: () => void;
  onSave: () => void;
  saving: boolean;
}) {
  return (
    <div className="flex justify-center gap-3 pt-2">
      <Button
        title="Save"
        type="button"
        className="min-w-[120px]"
        isBusy={saving}
        disabled={saving}
        onClick={onSave}
      />
      <Button
        title="Cancel"
        variant="secondaryLight"
        type="button"
        className="min-w-[120px]"
        onClick={onCancel}
      />
    </div>
  );
}
