"use client";

import { useState } from "react";
import AdminLayout from "@/components/layout/admin-layout";
import { Modal, Button, Input, Select, Checkbox, EmptyState, Icones, useToastAction, ConfirmDialog } from "@/components/ui";
import { saveCategory, deleteCategory } from "@/lib/actions/crud";

interface Category {
  id: string;
  name: string;
  slug: string;
  order: number;
  active: boolean;
  _count?: { products: number };
}

interface Props {
  categories: Category[];
  user: { role: any; name: string | null };
}

export default function CategoriesPageClient({ categories: init, user }: Props) {
  const [list, setList] = useState(init);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);

  const toastSave = useToastAction(saveCategory, {
    success: "Categoria salva!",
    onSuccess: () => {
      setOpen(false);
      setEditing(null);
      window.location.reload();
    },
  });
  const toastDel = useToastAction(deleteCategory, {
    success: "Categoria removida!",
    onSuccess: () => {
      setDeleting(null);
      setList((l) => l.filter((x) => x.id !== deleting?.id));
    },
  });

  return (
    <AdminLayout userRole={user.role} userName={user.name || "Usuário"} active="categories">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Categorias</h1>
          <p className="text-sm text-muted-foreground">
            {list.length} categorias
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          <Icones.Plus size={18} /> Nova Categoria
        </Button>
      </div>

      {list.length === 0 ? (
        <EmptyState
          title="Nenhuma categoria"
          description="Crie categorias para organizar seu cardápio."
          action={{
            label: "Criar primeira categoria",
            onClick: () => setOpen(true),
          }}
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {list
            .sort((a, b) => a.order - b.order)
            .map((c) => (
              <div
                key={c.id}
                className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-lg">{c.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Ordem: {c.order} ·{" "}
                      {c._count?.products || 0} produtos
                    </p>
                  </div>
                  <span
                    className={`inline-block w-2.5 h-2.5 rounded-full ${
                      c.active ? "bg-green-500" : "bg-red-500"
                    }`}
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => {
                      setEditing(c);
                      setOpen(true);
                    }}
                    className="p-2 rounded-lg hover:bg-muted transition text-blue-600"
                  >
                    <Icones.Edit3 size={16} />
                  </button>
                  <button
                    onClick={() => setDeleting(c)}
                    className="p-2 rounded-lg hover:bg-muted transition text-red-600"
                  >
                    <Icones.Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
        </div>
      )}

      <CategoryForm
        open={open}
        onClose={() => {
          setOpen(false);
          setEditing(null);
        }}
        editing={editing}
        onSave={(d) => toastSave.run(d as any)}
        saving={toastSave.loading}
      />

      <ConfirmDialog
        open={!!deleting}
        title="Remover categoria?"
        description={`Remover "${deleting?.name}"? Irá remover também a associação com produtos.`}
        confirmLabel="Remover"
        destructive
        onCancel={() => setDeleting(null)}
        onConfirm={() => deleting && toastDel.run(deleting.id)}
      />
    </AdminLayout>
  );
}

function CategoryForm({ open, onClose, editing, onSave, saving }: any) {
  const [name, setName] = useState(editing?.name || "");
  const [order, setOrder] = useState(editing?.order ?? 0);
  const [active, setActive] = useState(editing?.active ?? true);
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Editar Categoria" : "Nova Categoria"}
      size="sm"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave({ id: editing?.id, name, order, active });
        }}
        className="space-y-4"
      >
        <Input
          label="Nome"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <Input
          label="Ordem de exibição"
          type="number"
          step="1"
          value={order}
          onChange={(e) => setOrder(Number(e.target.value))}
        />
        <div className="border border-border rounded-lg p-3 bg-muted/20">
          <Checkbox
            label="Categoria ativa"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
          />
        </div>
        <div className="flex justify-end gap-2 pt-3 border-t border-border">
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            <Icones.Save size={16} /> Salvar
          </Button>
        </div>
      </form>
    </Modal>
  );
}
