"use client";

import { useState } from "react";
import AdminLayout from "@/components/layout/admin-layout";
import { Modal, Button, Input, Select, EmptyState, Icones, useToastAction, ConfirmDialog, Badge, Checkbox } from "@/components/ui";
import { saveInventoryItem, deleteInventoryItem, addInventoryMovement } from "@/lib/actions/crud";
import { cn } from "@/lib/utils";

interface Inv {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  minQuantity: number;
  active: boolean;
  movements?: {
    id: string;
    type: "IN" | "OUT" | "ADJUSTMENT";
    quantityChange: number;
    description: string | null;
    createdAt: string;
  }[];
}

interface Props {
  items: Inv[];
  user: { role: any; name: string | null };
}

const unitOptions = [
  { value: "kg", label: "Quilograma (kg)" },
  { value: "g", label: "Grama (g)" },
  { value: "L", label: "Litro (L)" },
  { value: "ml", label: "Mililitro (ml)" },
  { value: "un", label: "Unidade (un)" },
  { value: "cx", label: "Caixa (cx)" },
  { value: "pct", label: "Pacote (pct)" },
];

export default function InventoryPageClient({ items: init, user }: Props) {
  const [list, setList] = useState(init);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Inv | null>(null);
  const [deleting, setDeleting] = useState<Inv | null>(null);
  const [moveItem, setMoveItem] = useState<Inv | null>(null);

  const toastSave = useToastAction(saveInventoryItem, {
    success: "Item salvo!",
    onSuccess: () => {
      setOpen(false);
      setEditing(null);
      window.location.reload();
    },
  });
  const toastDel = useToastAction(deleteInventoryItem, {
    success: "Item removido!",
    onSuccess: () => {
      setDeleting(null);
      setList((l) => l.filter((x) => x.id !== deleting?.id));
    },
  });
  const toastMove = useToastAction(addInventoryMovement as any, {
    success: "Movimentação registrada!",
    onSuccess: () => {
      setMoveItem(null);
      window.location.reload();
    },
  });

  return (
    <AdminLayout userRole={user.role} userName={user.name || "Usuário"} active="inventory">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Estoque</h1>
          <p className="text-sm text-muted-foreground">
            Controle simples de insumos
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          <Icones.Plus size={18} /> Novo Insumo
        </Button>
      </div>

      {list.length === 0 ? (
        <EmptyState
          title="Nenhum item em estoque"
          description="Cadastre insumos para controlar seu estoque."
          action={{
            label: "Cadastrar primeiro item",
            onClick: () => setOpen(true),
          }}
        />
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr className="text-left text-xs text-muted-foreground">
                <th className="px-4 py-3 font-medium">Insumo</th>
                <th className="px-4 py-3 font-medium">Quantidade</th>
                <th className="px-4 py-3 font-medium hidden sm:table-cell">Mínimo</th>
                <th className="px-4 py-3 font-medium hidden md:table-cell">Unidade</th>
                <th className="px-4 py-3 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {list.map((i) => {
                const low = i.quantity <= i.minQuantity;
                return (
                  <tr
                    key={i.id}
                    className={cn(
                      "border-t border-border hover:bg-muted/30",
                      low && "bg-red-50/50"
                    )}
                  >
                    <td className="px-4 py-3 font-semibold">
                      <div className="flex items-center gap-2">
                        {i.name}
                        {low && <Badge color="red">Estoque Baixo</Badge>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={low ? "text-red-600 font-bold" : "font-semibold"}>
                        {Number(i.quantity).toLocaleString("pt-BR", {
                          maximumFractionDigits: 3,
                        })}{" "}
                        <span className="text-xs text-muted-foreground font-normal">
                          {i.unit}
                        </span>
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground">
                      {Number(i.minQuantity).toLocaleString("pt-BR", {
                        maximumFractionDigits: 3,
                      })}{" "}
                      {i.unit}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                      {unitOptions.find((u) => u.value === i.unit)?.label || i.unit}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex gap-1 justify-end">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setMoveItem(i)}
                        >
                          + / -
                        </Button>
                        <button
                          onClick={() => {
                            setEditing(i);
                            setOpen(true);
                          }}
                          className="p-1.5 rounded-lg hover:bg-muted text-blue-600"
                        >
                          <Icones.Edit3 size={16} />
                        </button>
                        <button
                          onClick={() => setDeleting(i)}
                          className="p-1.5 rounded-lg hover:bg-muted text-red-600"
                        >
                          <Icones.Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <ItemForm
        open={open}
        onClose={() => {
          setOpen(false);
          setEditing(null);
        }}
        editing={editing}
        onSave={(d) => toastSave.run(d as any)}
        saving={toastSave.loading}
      />

      <MovementForm
        open={!!moveItem}
        onClose={() => setMoveItem(null)}
        item={moveItem}
        onSave={(d) => toastMove.run(d as any)}
        saving={toastMove.loading}
      />

      <ConfirmDialog
        open={!!deleting}
        title="Remover item?"
        description={`Remover "${deleting?.name}"?`}
        confirmLabel="Remover"
        destructive
        onCancel={() => setDeleting(null)}
        onConfirm={() => deleting && toastDel.run(deleting.id)}
      />
    </AdminLayout>
  );
}

function ItemForm({ open, onClose, editing, onSave, saving }: any) {
  const [name, setName] = useState(editing?.name || "");
  const [unit, setUnit] = useState(editing?.unit || "un");
  const [quantity, setQuantity] = useState(editing?.quantity ?? 0);
  const [minQuantity, setMinQuantity] = useState(editing?.minQuantity ?? 0);
  const [active, setActive] = useState(editing?.active ?? true);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Editar Insumo" : "Novo Insumo"}
      size="sm"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave({ id: editing?.id, name, unit, quantity, minQuantity, active });
        }}
        className="space-y-4"
      >
        <Input
          label="Nome do insumo"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <Select
          label="Unidade"
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          options={unitOptions}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Quantidade inicial"
            type="number"
            step="0.001"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
          />
          <Input
            label="Estoque mínimo"
            type="number"
            step="0.001"
            value={minQuantity}
            onChange={(e) => setMinQuantity(Number(e.target.value))}
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

function MovementForm({ open, onClose, item, onSave, saving }: any) {
  const [type, setType] = useState<"IN" | "OUT" | "ADJUSTMENT">("IN");
  const [qty, setQty] = useState(0);
  const [description, setDescription] = useState("");

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Movimentar ${item?.name || ""}`}
      size="sm"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave({
            itemId: item.id,
            type,
            quantity: type === "ADJUSTMENT" ? qty : Number(qty),
            description,
          });
        }}
        className="space-y-4"
      >
        <p className="text-sm bg-muted/30 rounded-lg p-3">
          <strong>Quantidade atual:</strong>{" "}
          {Number(item?.quantity || 0).toLocaleString("pt-BR", {
            maximumFractionDigits: 3,
          })}{" "}
          {item?.unit}
        </p>
        <Select
          label="Tipo de movimentação"
          value={type}
          onChange={(e) => setType(e.target.value as any)}
          options={[
            { value: "IN", label: "📥 Entrada" },
            { value: "OUT", label: "📤 Saída" },
            { value: "ADJUSTMENT", label: "⚙️ Ajuste de quantidade" },
          ]}
        />
        <Input
          label={
            type === "ADJUSTMENT"
              ? "Nova quantidade"
              : type === "IN"
              ? "Quantidade de entrada"
              : "Quantidade de saída"
          }
          type="number"
          step="0.001"
          min="0"
          value={qty}
          onChange={(e) => setQty(Number(e.target.value))}
          required
        />
        <Input
          label="Observação (opcional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Ex.: Compra fornecedor X"
        />
        <div className="flex justify-end gap-2 pt-3 border-t border-border">
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            Confirmar
          </Button>
        </div>
      </form>
    </Modal>
  );
}
