"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Eye, Plus, Trash2 } from "lucide-react";

import {
  Button,
  Dialog,
  DialogContent,
  Input,
  SingleSelect,
  Spinner,
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
import type { BaseSpecification, Category } from "@/types/categories";

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
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);

  // Modals
  const [addCategoryOpen, setAddCategoryOpen] = useState(false);
  const [addSubcategoryOpen, setAddSubcategoryOpen] = useState(false);
  const [specModalOpen, setSpecModalOpen] = useState(false);
  const [editingSpecIndex, setEditingSpecIndex] = useState<number | null>(null);

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

  const specCount = (category: Category) => category.baseSpecifications?.length ?? 0;
  const subCount = (category: Category) => category.subcategories?.length ?? 0;

  const openCategory = (category: Category) => {
    setSelectedCategoryId(category._id);
    setView("subcategories");
  };

  const openSubcategory = (sub: string) => {
    setSelectedSubcategory(sub);
    setView("specs");
  };

  const goBack = () => {
    if (view === "specs") {
      setSelectedSubcategory(null);
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
      subcategories: [],
      baseSpecifications: [],
    });
    refresh();
  };

  const handleAddSubcategory = async (name: string) => {
    if (!token || !selectedCategory) return;
    const next = [...(selectedCategory.subcategories ?? []), name.trim()];
    await categoryService.updateCategory(token, selectedCategory._id, {
      subcategories: next,
    });
    refresh();
  };

  const handleSaveSpec = async (spec: BaseSpecification) => {
    if (!token || !selectedCategory) return;
    const existing = selectedCategory.baseSpecifications ?? [];
    const next =
      editingSpecIndex !== null
        ? existing.map((s, i) => (i === editingSpecIndex ? spec : s))
        : [...existing, spec];
    await categoryService.updateCategory(token, selectedCategory._id, {
      baseSpecifications: next,
    });
    refresh();
  };

  // ── Render helpers ───────────────────────────────────────────────────────
  const heading =
    view === "categories"
      ? "Categories"
      : view === "subcategories"
        ? selectedCategory?.name ?? "Subcategories"
        : selectedSubcategory ?? "Required Specifications";

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
            />
          ) : view === "subcategories" ? (
            <SubcategoriesTable
              category={selectedCategory}
              specCount={selectedCategory ? specCount(selectedCategory) : 0}
              onView={openSubcategory}
            />
          ) : (
            <SpecsTable
              specs={selectedCategory?.baseSpecifications ?? []}
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
            ? selectedCategory?.baseSpecifications?.[editingSpecIndex] ?? null
            : null
        }
        onSave={handleSaveSpec}
      />
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
}: {
  loading: boolean;
  categories: Category[];
  subCount: (c: Category) => number;
  specCount: (c: Category) => number;
  onView: (c: Category) => void;
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
            <TableRow key={category._id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <span className="size-8 shrink-0 rounded-md bg-gray6" />
                  <span className="font-medium text-gray1">{category.name}</span>
                </div>
              </TableCell>
              <TableCell>{subCount(category)}</TableCell>
              <TableCell>{specCount(category)}</TableCell>
              <TableCell>
                <ViewButton onClick={() => onView(category)} />
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
  specCount,
  onView,
}: {
  category: Category | null;
  specCount: number;
  onView: (sub: string) => void;
}) {
  const subs = category?.subcategories ?? [];
  return (
    <Table className="min-w-[640px]">
      <TableHeader>
        <TableRow>
          <TableHead>Sub Category Name</TableHead>
          <TableHead>Required Specs</TableHead>
          <TableHead className="text-right">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {subs.length === 0 ? (
          <TableRow>
            <TableCell colSpan={3} className="py-16 text-center text-gray3">
              No subcategories yet. Add one to organise this category.
            </TableCell>
          </TableRow>
        ) : (
          subs.map((sub, index) => (
            <TableRow key={`${sub}-${index}`}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <span className="size-8 shrink-0 rounded-md bg-gray6" />
                  <span className="font-medium text-gray1">{sub}</span>
                </div>
              </TableCell>
              <TableCell>{specCount}</TableCell>
              <TableCell>
                <ViewButton onClick={() => onView(sub)} />
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
            <TableRow key={`${spec.key}-${index}`}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <span className="size-8 shrink-0 rounded-md bg-gray6" />
                  <span className="font-medium text-gray1">{spec.key}</span>
                </div>
              </TableCell>
              <TableCell>{fieldTypeLabel(spec.type)}</TableCell>
              <TableCell>
                <ViewButton onClick={() => onView(index)} />
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
    <div className="flex justify-end">
      <button
        type="button"
        onClick={onClick}
        className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
      >
        <Eye size={16} /> View
      </button>
    </div>
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
  onSave: (name: string) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName("");
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
      await onSave(name);
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
