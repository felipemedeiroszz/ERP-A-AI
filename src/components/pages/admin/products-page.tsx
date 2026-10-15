"use client";

import { useState } from "react";
import AdminLayout from "@/components/layout/admin-layout";
import { Modal, Button, Input, Textarea, Select, Checkbox, EmptyState, Icones, useToastAction, ConfirmDialog } from "@/components/ui";
import { saveProduct, deleteProduct, toggleProductActive } from "@/lib/actions/crud";
import { cn, formatCurrency } from "@/lib/utils";
import type { Category, Product, Addon, ProductAddon } from "@prisma/client";

type ProductWithRel = Product & {
  category: Category;
  addons: (ProductAddon & { addon: Addon })[];
};

interface PageProps {
  initialProducts: ProductWithRel[];
  categories: (Category & { _count?: { products: number } })[];
  addons: Addon[];
  user: { role: any; name: string | null };
}

export default function ProductsPage({
  initialProducts,
  categories,
  addons,
  user,
}: PageProps) {
  const [products, setProducts] = useState(initialProducts);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ProductWithRel | null>(null);
  const [deleting, setDeleting] = useState<ProductWithRel | null>(null);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("");

  const toastSave = useToastAction(saveProduct, {
    success: "Produto salvo!",
    onSuccess: () => {
      setOpen(false);
      setEditing(null);
      window.location.reload();
    },
  });
  const toastDel = useToastAction(deleteProduct, {
    success: "Produto removido!",
    onSuccess: () => {
      setDeleting(null);
      setProducts((p) => p.filter((x) => x.id !== deleting?.id));
    },
  });

  function handleEdit(p: ProductWithRel) {
    setEditing(p);
    setOpen(true);
  }

  function handleNew() {
    setEditing(null);
    setOpen(true);
  }

  const filtered = products.filter((p) => {
    const matchSearch =
      !search || p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = !filterCat || p.categoryId === filterCat;
    return matchSearch && matchCat;
  });

  return (
    <AdminLayout userRole={user.role} userName={user.name || "Usuário"} active="products">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Produtos</h1>
          <p className="text-sm text-muted-foreground">
            {products.length} produtos cadastrados
          </p>
        </div>
        <Button onClick={handleNew}>
          <Icones.Plus size={18} /> Novo Produto
        </Button>
      </div>

      <div className="bg-card border border-border rounded-xl p-4 mb-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <Input
          placeholder="Buscar produto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value)}
          options={[
            { value: "", label: "Todas as categorias" },
            ...categories.map((c) => ({ value: c.id, label: c.name })),
          ]}
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="Nenhum produto encontrado"
          description="Crie produtos para começar a vender."
          action={{ label: "Criar primeiro produto", onClick: handleNew }}
        />
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr className="text-left text-xs text-muted-foreground">
                <th className="px-4 py-3 font-medium">Produto</th>
                <th className="px-4 py-3 font-medium hidden md:table-cell">Categoria</th>
                <th className="px-4 py-3 font-medium">Preço</th>
                <th className="px-4 py-3 font-medium hidden sm:table-cell">Status</th>
                <th className="px-4 py-3 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr
                  key={p.id}
                  className="border-t border-border hover:bg-muted/30"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {p.image ? (
                        <img
                          src={p.image}
                          alt={p.name}
                          className="w-10 h-10 rounded-lg object-cover border border-border"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                          {p.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <div className="font-semibold">{p.name}</div>
                        {p.isWeightBased && (
                          <span className="inline-block mt-0.5 text-[10px] bg-accent/10 text-accent px-1.5 py-0.5 rounded-full font-medium">
                            POR PESO
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                    {p.category?.name || "-"}
                  </td>
                  <td className="px-4 py-3 font-semibold">
                    {formatCurrency(p.price)}
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span
                      className={cn(
                        "inline-block w-2 h-2 rounded-full mr-1.5",
                        p.active ? "bg-green-500" : "bg-red-500"
                      )}
                    />
                    {p.active ? "Ativo" : "Inativo"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex gap-1 justify-end">
                      <button
                        onClick={() =>
                          toggleProductActive(p.id, !p.active).then((r) => {
                            if (r.success) {
                              setProducts((ps) =>
                                ps.map((x) =>
                                  x.id === p.id ? { ...x, active: !x.active } : x
                                )
                              );
                            }
                          })
                        }
                        className="p-1.5 rounded-lg hover:bg-muted transition text-muted-foreground"
                        title={p.active ? "Desativar" : "Ativar"}
                      >
                        {p.active ? (
                          <Icones.PowerOff size={16} />
                        ) : (
                          <Icones.Power size={16} />
                        )}
                      </button>
                      <button
                        onClick={() => handleEdit(p)}
                        className="p-1.5 rounded-lg hover:bg-muted transition text-blue-600"
                      >
                        <Icones.Edit3 size={16} />
                      </button>
                      <button
                        onClick={() => setDeleting(p)}
                        className="p-1.5 rounded-lg hover:bg-muted transition text-red-600"
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

      <ProductForm
        open={open}
        onClose={() => {
          setOpen(false);
          setEditing(null);
        }}
        editing={editing}
        categories={categories}
        addons={addons}
        onSave={(data) => toastSave.run(data as any)}
        saving={toastSave.loading}
      />

      <ConfirmDialog
        open={!!deleting}
        title="Remover produto?"
        description={`Tem certeza que deseja remover "${deleting?.name}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Remover"
        destructive
        onCancel={() => setDeleting(null)}
        onConfirm={() => deleting && toastDel.run(deleting.id)}
      />
    </AdminLayout>
  );
}

function ProductForm({
  open,
  onClose,
  editing,
  categories,
  addons,
  onSave,
  saving,
}: any) {
  const [name, setName] = useState(editing?.name || "");
  const [description, setDescription] = useState(editing?.description || "");
  const [price, setPrice] = useState(editing?.price || "");
  const [categoryId, setCategoryId] = useState(
    editing?.categoryId || categories[0]?.id || ""
  );
  const [image, setImage] = useState(editing?.image || "");
  const [isWeightBased, setIsWeightBased] = useState(
    editing?.isWeightBased || false
  );
  const [active, setActive] = useState(editing?.active ?? true);
  const [addonIds, setAddonIds] = useState<string[]>(
    editing?.addons?.map((a: any) => a.addonId) || []
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Editar Produto" : "Novo Produto"}
      size="lg"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave({
            id: editing?.id,
            name,
            description,
            price: Number(String(price).replace(",", ".")),
            categoryId,
            image,
            isWeightBased,
            active,
            addonIds,
          });
        }}
        className="space-y-4"
      >
        <div className="grid sm:grid-cols-2 gap-3">
          <Input
            label="Nome do produto"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            label="Preço"
            type="number"
            step="0.01"
            min="0"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />
          <Select
            label="Categoria"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            options={categories.map((c: any) => ({
              value: c.id,
              label: c.name,
            }))}
          />
          <Input
            label="URL da Imagem (opcional)"
            value={image}
            onChange={(e) => setImage(e.target.value)}
            placeholder="https://..."
          />
        </div>
        <Textarea
          label="Descrição"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
        <div className="flex flex-wrap gap-4 border border-border rounded-lg p-3 bg-muted/20">
          <Checkbox
            label="Açaí por Peso"
            checked={isWeightBased}
            onChange={(e) => setIsWeightBased(e.target.checked)}
          />
          <Checkbox
            label="Produto ativo"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
          />
        </div>
        {addons.length > 0 && (
          <div>
            <p className="text-sm font-semibold mb-2">Adicionais do produto</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 border border-border rounded-lg p-3">
              {addons.map((a: any) => (
                <Checkbox
                  key={a.id}
                  label={`${a.name} - ${formatCurrency(a.price)}`}
                  checked={addonIds.includes(a.id)}
                  onChange={(e) => {
                    if (e.target.checked)
                      setAddonIds([...addonIds, a.id]);
                    else
                      setAddonIds(addonIds.filter((x) => x !== a.id));
                  }}
                />
              ))}
            </div>
          </div>
        )}
        <div className="flex justify-end gap-2 pt-3 border-t border-border">
          <Button type="button" variant="secondary" onClick={onClose}>
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
