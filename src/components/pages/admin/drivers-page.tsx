"use client";

import { useState } from "react";
import AdminLayout from "@/components/layout/admin-layout";
import { Modal, Button, Input, EmptyState, Icones, useToastAction, ConfirmDialog, Badge } from "@/components/ui";
import { saveDriver, deleteDriver } from "@/lib/actions/crud";
import { formatPhone } from "@/lib/utils";

interface Driver {
  id: string;
  name: string;
  phone: string;
  status: "AVAILABLE" | "BUSY" | "OFFLINE";
  active: boolean;
  _count?: { deliveries: number };
}

interface Props {
  drivers: Driver[];
  user: { role: any; name: string | null };
}

export default function DriversPageClient({ drivers: init, user }: Props) {
  const [list, setList] = useState(init);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Driver | null>(null);
  const [deleting, setDeleting] = useState<Driver | null>(null);

  const toastSave = useToastAction(saveDriver, {
    success: "Entregador salvo!",
    onSuccess: () => {
      setOpen(false);
      setEditing(null);
      window.location.reload();
    },
  });
  const toastDel = useToastAction(deleteDriver, {
    success: "Entregador removido!",
    onSuccess: () => {
      setDeleting(null);
      setList((l) => l.filter((x) => x.id !== deleting?.id));
    },
  });

  const statusLabel: Record<string, { label: string; color: any }> = {
    AVAILABLE: { label: "Disponível", color: "green" },
    BUSY: { label: "Ocupado", color: "yellow" },
    OFFLINE: { label: "Offline", color: "red" },
  };

  return (
    <AdminLayout userRole={user.role} userName={user.name || "Usuário"} active="drivers">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Entregadores</h1>
          <p className="text-sm text-muted-foreground">
            {list.length} entregadores cadastrados
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          <Icones.Plus size={18} /> Novo Entregador
        </Button>
      </div>

      {list.length === 0 ? (
        <EmptyState
          title="Nenhum entregador"
          description="Cadastre entregadores para atribuir pedidos."
          action={{
            label: "Cadastrar primeiro entregador",
            onClick: () => setOpen(true),
          }}
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.map((d) => (
            <div
              key={d.id}
              className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-500 to-blue-500 text-white font-bold flex items-center justify-center shrink-0">
                    {d.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold">{d.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {formatPhone(d.phone)}
                    </p>
                  </div>
                </div>
                <Badge color={statusLabel[d.status].color}>
                  {statusLabel[d.status].label}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm mb-3 border-t border-border pt-3">
                <span className="text-muted-foreground">Status</span>
                <span className={d.active ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                  {d.active ? "Ativo" : "Inativo"}
                </span>
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => {
                    setEditing(d);
                    setOpen(true);
                  }}
                  className="p-2 rounded-lg hover:bg-muted transition text-blue-600"
                >
                  <Icones.Edit3 size={16} />
                </button>
                <button
                  onClick={() => setDeleting(d)}
                  className="p-2 rounded-lg hover:bg-muted transition text-red-600"
                >
                  <Icones.Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <DriverForm
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
        title="Remover entregador?"
        description={`Remover "${deleting?.name}"?`}
        confirmLabel="Remover"
        destructive
        onCancel={() => setDeleting(null)}
        onConfirm={() => deleting && toastDel.run(deleting.id)}
      />
    </AdminLayout>
  );
}

function DriverForm({ open, onClose, editing, onSave, saving }: any) {
  const [name, setName] = useState(editing?.name || "");
  const [phone, setPhone] = useState(editing?.phone || "");
  const [active, setActive] = useState(editing?.active ?? true);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Editar Entregador" : "Novo Entregador"}
      size="sm"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave({ id: editing?.id, name, phone, active });
        }}
        className="space-y-4"
      >
        <Input
          label="Nome completo"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <Input
          label="Telefone / WhatsApp"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />
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
