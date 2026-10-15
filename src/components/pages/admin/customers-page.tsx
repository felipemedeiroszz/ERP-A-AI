"use client";

import { useState } from "react";
import AdminLayout from "@/components/layout/admin-layout";
import { Modal, Button, Input, EmptyState, Icones, useToastAction, ConfirmDialog, Badge } from "@/components/ui";
import { saveCustomer, deleteCustomer } from "@/lib/actions/crud";
import { formatCurrency, formatDate, formatPhone } from "@/lib/utils";

interface Order {
  id: string;
  orderNumber: number;
  totalAmount: number;
  status: string;
  createdAt: string;
}
interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  createdAt: string;
  _count: { orders: number; addresses: number };
  orders?: Order[];
  totalSpent?: number;
}

interface Props {
  customers: Customer[];
  user: { role: any; name: string | null };
}

export default function CustomersPageClient({ customers: init, user }: Props) {
  const [list, setList] = useState(init);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [deleting, setDeleting] = useState<Customer | null>(null);
  const [search, setSearch] = useState("");

  const toastSave = useToastAction(saveCustomer, {
    success: "Cliente salvo!",
    onSuccess: () => {
      setOpen(false);
      setEditing(null);
      window.location.reload();
    },
  });
  const toastDel = useToastAction(deleteCustomer, {
    success: "Cliente removido!",
    onSuccess: () => {
      setDeleting(null);
      setList((l) => l.filter((x) => x.id !== deleting?.id));
    },
  });

  const filtered = list.filter(
    (c) =>
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search.replace(/\D/g, ""))
  );

  return (
    <AdminLayout userRole={user.role} userName={user.name || "Usuário"} active="customers">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Clientes</h1>
          <p className="text-sm text-muted-foreground">
            {list.length} clientes cadastrados
          </p>
        </div>
        <div className="flex gap-2">
          <div className="w-full sm:w-64">
            <Input
              placeholder="Buscar cliente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            <Icones.Plus size={18} /> Novo Cliente
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="Nenhum cliente"
          description="Comece a cadastrar seus clientes para associar aos pedidos."
          action={{
            label: "Cadastrar primeiro cliente",
            onClick: () => setOpen(true),
          }}
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => (
            <div
              key={c.id}
              className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary to-accent text-white font-bold flex items-center justify-center shrink-0">
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold">{c.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      Desde {formatDate(c.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-1 text-sm mb-3 border-t border-border pt-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Telefone</span>
                  <span className="font-medium">{formatPhone(c.phone)}</span>
                </div>
                {c.email && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">E-mail</span>
                    <span className="font-medium truncate max-w-[180px]">
                      {c.email}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pedidos</span>
                  <Badge color="blue">{c._count.orders}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total gasto</span>
                  <span className="font-bold text-primary">
                    {formatCurrency(c.totalSpent || 0)}
                  </span>
                </div>
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

      <CustomerForm
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
        title="Remover cliente?"
        description={`Remover "${deleting?.name}"? Pedidos continuarão existindo.`}
        confirmLabel="Remover"
        destructive
        onCancel={() => setDeleting(null)}
        onConfirm={() => deleting && toastDel.run(deleting.id)}
      />
    </AdminLayout>
  );
}

function CustomerForm({ open, onClose, editing, onSave, saving }: any) {
  const [name, setName] = useState(editing?.name || "");
  const [phone, setPhone] = useState(editing?.phone || "");
  const [email, setEmail] = useState(editing?.email || "");

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Editar Cliente" : "Novo Cliente"}
      size="sm"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave({ id: editing?.id, name, phone, email });
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
          placeholder="(11) 99999-8888"
        />
        <Input
          label="E-mail (opcional)"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
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
