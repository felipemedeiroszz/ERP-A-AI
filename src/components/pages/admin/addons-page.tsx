"use client";

import { useState } from "react";
import AdminLayout from "@/components/layout/admin-layout";
import { Modal, Button, Input, Checkbox, EmptyState, Icones, useToastAction, ConfirmDialog, Badge } from "@/components/ui";
import { saveAddon, deleteAddon } from "@/lib/actions/crud";
import { formatCurrency } from "@/lib/utils";

interface Addon {
  id: string;
  name: string;
  price: number;
  active: boolean;
  _count?: { products: number };
}

interface Props {
  addons: Addon[];
  user: { role: any; name: string | null };
}

export default function AddonsPageClient({ addons: init, user }: Props) {
  const [list, setList] = useState(init);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Addon | null>(null);
  const [deleting, setDeleting] = useState<Addon | null>(null);

  const toastSave = useToastAction(saveAddon, {
    success: "Adicional salvo!",
    onSuccess: () => {
      setOpen(false);
      setEditing(null);
      window.location.reload();
    },
  });
  const toastDel = useToastAction(deleteAddon, {
    success: "Adicional removido!",
    onSuccess: () => {
      setDeleting(null);
      setList((l) => l.filter((x) => x.id !== deleting?.id));
    },
  });

  return (
    <AdminLayout userRole={user.role} userName={user.name || "Usuário"} active="addons">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Adicionais</h1>
          <p className="text-sm text-muted-foreground">
            {list.length} adicionais cadastrados
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          <Icones.Plus size={18} /> Novo Adicional
        </Button>
      </div>

      {list.length === 0 ? (
        <EmptyState
          title="Nenhum adicional"
          description="Cadastre complementos como morango, banana, granola, etc."
          action={{
            label: "Criar primeiro adicional",
            onClick: () => setOpen(true),
          }}
        />
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr className="text-left text-xs text-muted-foreground">
                <th className="px-4 py-3 font-medium">Nome</th>
                <th className="px-4 py-3 font-medium">Preço</th>
                <th className="px-4 py-3 font-medium hidden sm:table-cell">Status</th>
                <th className="px-4 py-3 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {list.map((a) => (
                <tr
                  key={a.id}
                  className="border-t border-border hover:bg-muted/30"
                >
                  <td className="px-4 py-3 font-semibold">{a.name}</td>
                  <td className="px-4 py-3">
                    <Badge color="green">{formatCurrency(a.price)}</Badge>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <Badge color={a.active ? "green" : "red"}>
                      {a.active ? "Ativo" : "Inativo"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex gap-1 justify-end">
                      <button
                        onClick={() => {
                          setEditing(a);
                          setOpen(true);
                        }}
                        className="p-1.5 rounded-lg hover:bg-muted text-blue-600"
                      >
                        <Icones.Edit3 size={16} />
                      </button>
                      <button
                        onClick={() => setDeleting(a)}
                        className="p-1.5 rounded-lg hover:bg-muted text-red-600"
                      >
                        <Icones.Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AddonForm
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
        title="Remover adicional?"
        description={`Tem certeza que deseja remover "${deleting?.name}"?`}
        confirmLabel="Remover"
        destructive
        onCancel={() => setDeleting(null)}
        onConfirm={() => deleting && toastDel.run(deleting.id)}
      />
    </AdminLayout>
  );
}

function AddonForm({ open, onClose, editing, onSave, saving }: any) {
  const [name, setName] = useState(editing?.name || "");
  const [price, setPrice] = useState(editing?.price || "");
  const [active, setActive] = useState(editing?.active ?? true);
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Editar Adicional" : "Novo Adicional"}
      size="sm"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave({
            id: editing?.id,
            name,
            price: Number(String(price).replace(",", ".")),
            active,
          });
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
          label="Preço (R$)"
          type="number"
          step="0.01"
          min="0"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
        />
        <div className="border border-border rounded-lg p-3 bg-muted/20">
          <Checkbox
            label="Adicional ativo"
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
