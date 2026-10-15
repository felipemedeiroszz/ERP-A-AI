"use client";

import { useState } from "react";
import AdminLayout from "@/components/layout/admin-layout";
import {
  Button,
  Input,
  Textarea,
  Select,
  Checkbox,
  Icones,
  useToastAction,
  ToggleSwitch,
  Modal,
  Badge,
  ConfirmDialog,
  EmptyState,
} from "@/components/ui";
import {
  saveCompanySettings,
  saveStoreSettings,
  saveAppearanceSettings,
  savePrinterSettings,
  saveUser,
} from "@/lib/actions/settings";
import { cn } from "@/lib/utils";
import { Building2, Store, Palette, Printer, Database, Users, UserPlus } from "lucide-react";

interface Props {
  user: { role: any; name: string | null };
  company: any;
  store: any;
  appearance: any;
  printer: any;
  users: any[];
}

const TABS = [
  { id: "company", label: "Empresa", icon: Building2 },
  { id: "store", label: "Loja", icon: Store },
  { id: "users", label: "Usuários", icon: Users },
  { id: "appearance", label: "Aparência", icon: Palette },
  { id: "printer", label: "Impressão", icon: Printer },
  { id: "backup", label: "Backup", icon: Database },
];

export default function SettingsPageClient({
  user,
  company,
  store,
  appearance,
  printer,
  users,
}: Props) {
  const [tab, setTab] = useState("company");

  const toastCompany = useToastAction(saveCompanySettings, {
    success: "Dados da empresa atualizados!",
  });
  const toastStore = useToastAction(saveStoreSettings, {
    success: "Configurações da loja atualizadas!",
  });
  const toastAppearance = useToastAction(saveAppearanceSettings, {
    success: "Identidade visual atualizada! Recarregue a página para aplicar.",
  });
  const toastPrinter = useToastAction(savePrinterSettings, {
    success: "Configurações de impressão atualizadas!",
  });
  const toastUser = useToastAction(saveUser, {
    success: "Usuário salvo!",
    onSuccess: () => setTimeout(() => window.location.reload(), 500),
  });

  return (
    <AdminLayout userRole={user.role} userName={user.name || "Usuário"} active="settings">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-sm text-muted-foreground">
          Personalize todas as configurações do sistema
        </p>
      </div>

      <div className="grid lg:grid-cols-[240px_1fr] gap-6">
        <div className="bg-card border border-border rounded-xl p-2 h-fit lg:sticky lg:top-24 space-y-0.5">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition text-left",
                  tab === t.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon size={16} />
                {t.label}
              </button>
            );
          })}
        </div>

        <div>
          {tab === "company" && (
            <CompanyForm
              data={company}
              onSave={(d) => toastCompany.run(d as any)}
              loading={toastCompany.loading}
            />
          )}
          {tab === "store" && (
            <StoreForm
              data={store}
              onSave={(d) => toastStore.run(d as any)}
              loading={toastStore.loading}
            />
          )}
          {tab === "users" && (
            <UsersForm
              users={users}
              onSave={(d) => toastUser.run(d as any)}
              loading={toastUser.loading}
            />
          )}
          {tab === "appearance" && (
            <AppearanceForm
              data={appearance}
              onSave={(d) => toastAppearance.run(d as any)}
              loading={toastAppearance.loading}
            />
          )}
          {tab === "printer" && (
            <PrinterForm
              data={printer}
              onSave={(d) => toastPrinter.run(d as any)}
              loading={toastPrinter.loading}
            />
          )}
          {tab === "backup" && <BackupSection />}
        </div>
      </div>
    </AdminLayout>
  );
}

function Section({ title, description, children }: any) {
  return (
    <div className="bg-card border border-border rounded-xl p-6 space-y-5">
      <div>
        <h2 className="text-lg font-bold">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function SaveBar({ onSave, loading, disabled }: any) {
  return (
    <div className="sticky bottom-4 mt-6 z-10 flex justify-end">
      <div className="bg-card border border-border rounded-xl p-3 shadow-lg flex items-center gap-3">
        <Button
          onClick={onSave}
          disabled={loading || disabled}
          size="lg"
        >
          <Icones.Save size={18} />
          {loading ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </div>
    </div>
  );
}

function CompanyForm({ data, onSave, loading }: any) {
  const [f, setF] = useState(data);
  return (
    <>
      <Section
        title="Dados da Empresa"
        description="Informações visíveis aos clientes e em documentos"
      >
        <div className="grid sm:grid-cols-2 gap-4">
          <Input
            label="Razão Social *"
            value={f?.name || ""}
            onChange={(e) => setF({ ...f, name: e.target.value })}
          />
          <Input
            label="Nome Fantasia"
            value={f?.fantasyName || ""}
            onChange={(e) => setF({ ...f, fantasyName: e.target.value })}
          />
          <Input
            label="CNPJ"
            value={f?.document || ""}
            onChange={(e) => setF({ ...f, document: e.target.value })}
          />
          <Input
            label="E-mail"
            type="email"
            value={f?.email || ""}
            onChange={(e) => setF({ ...f, email: e.target.value })}
          />
          <Input
            label="Telefone"
            value={f?.phone || ""}
            onChange={(e) => setF({ ...f, phone: e.target.value })}
          />
          <Input
            label="WhatsApp"
            value={f?.whatsapp || ""}
            onChange={(e) => setF({ ...f, whatsapp: e.target.value })}
          />
        </div>
      </Section>
      <div className="h-6" />
      <Section title="Endereço" description="Endereço físico da loja">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-1">
            <Input
              label="CEP"
              value={f?.zipCode || ""}
              onChange={(e) => setF({ ...f, zipCode: e.target.value })}
            />
          </div>
          <div className="sm:col-span-1">
            <Input
              label="Cidade"
              value={f?.city || ""}
              onChange={(e) => setF({ ...f, city: e.target.value })}
            />
          </div>
          <div className="sm:col-span-1">
            <Input
              label="Estado (UF)"
              value={f?.state || ""}
              onChange={(e) => setF({ ...f, state: e.target.value })}
              maxLength={2}
            />
          </div>
          <div className="sm:col-span-1">
            <Input
              label="Bairro"
              value={f?.neighborhood || ""}
              onChange={(e) => setF({ ...f, neighborhood: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2 lg:col-span-1">
            <Input
              label="Rua / Logradouro"
              value={f?.street || ""}
              onChange={(e) => setF({ ...f, street: e.target.value })}
            />
          </div>
          <div className="sm:col-span-1">
            <Input
              label="Número"
              value={f?.number || ""}
              onChange={(e) => setF({ ...f, number: e.target.value })}
            />
          </div>
          <div className="sm:col-span-1">
            <Input
              label="Complemento"
              value={f?.complement || ""}
              onChange={(e) => setF({ ...f, complement: e.target.value })}
            />
          </div>
        </div>
      </Section>
      <SaveBar onSave={() => onSave(f)} loading={loading} />
    </>
  );
}

function StoreForm({ data, onSave, loading }: any) {
  const [f, setF] = useState(data);
  return (
    <>
      <Section
        title="Funcionamento da Loja"
        description="Controle de abertura e horários de atendimento"
      >
        <div className="border border-border rounded-lg p-4 bg-muted/20">
          <ToggleSwitch
            checked={!!f?.isOpen}
            onChange={(v) => setF({ ...f, isOpen: v })}
            label="Loja aberta para pedidos"
          />
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          <Input
            label="Abre às"
            type="time"
            value={f?.openTime || ""}
            onChange={(e) => setF({ ...f, openTime: e.target.value })}
          />
          <Input
            label="Fecha às"
            type="time"
            value={f?.closeTime || ""}
            onChange={(e) => setF({ ...f, closeTime: e.target.value })}
          />
          <Input
            label="Tempo médio de preparo (min)"
            type="number"
            value={f?.averagePreparationTime || 20}
            onChange={(e) =>
              setF({ ...f, averagePreparationTime: Number(e.target.value) })
            }
          />
        </div>
      </Section>
      <div className="h-6" />
      <Section title="Entrega e Retirada" description="Opções para o cliente">
        <div className="grid sm:grid-cols-2 gap-3 border border-border rounded-lg p-4 bg-muted/20 mb-2">
          <Checkbox
            label="Habilitar Delivery"
            checked={!!f?.deliveryEnabled}
            onChange={(e) => setF({ ...f, deliveryEnabled: e.target.checked })}
          />
          <Checkbox
            label="Habilitar Retirada na Loja"
            checked={!!f?.pickupEnabled}
            onChange={(e) => setF({ ...f, pickupEnabled: e.target.checked })}
          />
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          <Input
            label="Taxa de entrega (R$)"
            type="number"
            step="0.01"
            value={f?.deliveryFee || 0}
            onChange={(e) =>
              setF({ ...f, deliveryFee: Number(e.target.value) })
            }
          />
          <Input
            label="Valor mínimo pedido (R$)"
            type="number"
            step="0.01"
            value={f?.minDeliveryValue || 0}
            onChange={(e) =>
              setF({ ...f, minDeliveryValue: Number(e.target.value) })
            }
          />
          <Input
            label="Raio de entrega (km)"
            type="number"
            step="0.1"
            value={f?.deliveryRadiusKm || ""}
            onChange={(e) =>
              setF({
                ...f,
                deliveryRadiusKm:
                  e.target.value === ""
                    ? null
                    : Number(e.target.value),
              })
            }
          />
        </div>
      </Section>
      <div className="h-6" />
      <Section
        title="Açaí por Peso"
        description="Configuração de preço para açaí servido por peso"
      >
        <div className="sm:w-1/3">
          <Input
            label="Valor por KG (R$)"
            type="number"
            step="0.01"
            value={f?.weightPricePerKg || 59.9}
            onChange={(e) =>
              setF({ ...f, weightPricePerKg: Number(e.target.value) })
            }
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Ex.: Valor 59,90/kg · 750g = R$ 44,93
        </p>
      </Section>
      <SaveBar onSave={() => onSave(f)} loading={loading} />
    </>
  );
}

function AppearanceForm({ data, onSave, loading }: any) {
  const [f, setF] = useState(data);
  const colors = [
    { key: "primaryColor", label: "Cor Principal" },
    { key: "secondaryColor", label: "Cor Secundária" },
    { key: "accentColor", label: "Cor de Destaque" },
    { key: "buttonColor", label: "Cor dos Botões" },
  ];
  return (
    <>
      <Section
        title="Identidade Visual"
        description="As cores alteram toda a aparência do sistema imediatamente após salvar."
      >
        <div className="grid sm:grid-cols-2 gap-4">
          <Input
            label="URL do Logo (opcional)"
            value={f?.logo || ""}
            onChange={(e) => setF({ ...f, logo: e.target.value })}
            placeholder="https://..."
          />
          <Input
            label="URL do Favicon (opcional)"
            value={f?.favicon || ""}
            onChange={(e) => setF({ ...f, favicon: e.target.value })}
            placeholder="https://..."
          />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {colors.map((c) => (
            <div
              key={c.key}
              className="flex items-center gap-3 border border-border rounded-xl p-3 bg-card"
            >
              <input
                type="color"
                value={(f as any)?.[c.key] || "#6B21A8"}
                onChange={(e) =>
                  setF({ ...f, [c.key]: e.target.value })
                }
                className="w-14 h-14 rounded-xl border border-border cursor-pointer shrink-0"
              />
              <div className="flex-1 space-y-1">
                <div className="text-sm font-medium">{c.label}</div>
                <Input
                  value={(f as any)?.[c.key] || "#6B21A8"}
                  onChange={(e) =>
                    setF({ ...f, [c.key]: e.target.value })
                  }
                  className="font-mono text-xs"
                />
              </div>
            </div>
          ))}
        </div>
        <div className="pt-3">
          <p className="text-xs text-muted-foreground mb-2">Prévia:</p>
          <div className="rounded-xl border border-border p-5 flex flex-wrap items-center gap-3">
            <button
              style={{ backgroundColor: f?.buttonColor || "#6B21A8" }}
              className="px-4 py-2 rounded-lg text-white font-medium text-sm"
            >
              Botão Primário
            </button>
            <div
              style={{ backgroundColor: f?.primaryColor || "#6B21A8" }}
              className="w-10 h-10 rounded-lg"
            />
            <div
              style={{ backgroundColor: f?.secondaryColor || "#8B5CF6" }}
              className="w-10 h-10 rounded-lg"
            />
            <div
              style={{ backgroundColor: f?.accentColor || "#A855F7" }}
              className="w-10 h-10 rounded-lg"
            />
          </div>
        </div>
      </Section>
      <SaveBar onSave={() => onSave(f)} loading={loading} />
    </>
  );
}

function PrinterForm({ data, onSave, loading }: any) {
  const [f, setF] = useState(data);
  return (
    <>
      <Section
        title="Impressão Térmica (ESC/POS)"
        description="Configurações para impressoras térmicas de cupom"
      >
        <div className="border border-border rounded-lg p-4 bg-muted/20">
          <ToggleSwitch
            checked={!!f?.enabled}
            onChange={(v) => setF({ ...f, enabled: v })}
            label="Habilitar impressão automática"
          />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <Input
            label="Nome da impressora"
            value={f?.name || ""}
            onChange={(e) => setF({ ...f, name: e.target.value })}
          />
          <Select
            label="Tipo de conexão"
            value={f?.connectionType || "usb"}
            onChange={(e) => setF({ ...f, connectionType: e.target.value })}
            options={[
              { value: "usb", label: "USB" },
              { value: "network", label: "Rede (IP)" },
              { value: "bluetooth", label: "Bluetooth" },
              { value: "serial", label: "Serial" },
            ]}
          />
          <Input
            label="Vendor ID (USB, ex: 1046)"
            type="number"
            value={f?.vendorId ?? ""}
            onChange={(e) =>
              setF({
                ...f,
                vendorId:
                  e.target.value === "" ? null : Number(e.target.value),
              })
            }
          />
          <Input
            label="Product ID (USB, ex: 20497)"
            type="number"
            value={f?.productId ?? ""}
            onChange={(e) =>
              setF({
                ...f,
                productId:
                  e.target.value === "" ? null : Number(e.target.value),
              })
            }
          />
          <Select
            label="Largura do papel"
            value={String(f?.paperWidth || 48)}
            onChange={(e) =>
              setF({ ...f, paperWidth: Number(e.target.value) })
            }
            options={[
              { value: "48", label: "48 colunas (58mm)" },
              { value: "64", label: "64 colunas (80mm)" },
            ]}
          />
          <Select
            label="Codificação"
            value={f?.charset || "UTF-8"}
            onChange={(e) => setF({ ...f, charset: e.target.value })}
            options={[
              { value: "UTF-8", label: "UTF-8" },
              { value: "CP850", label: "CP850 (Europeu)" },
              { value: "WIN1252", label: "Windows-1252" },
            ]}
          />
        </div>
        <div className="grid sm:grid-cols-2 gap-3 border border-border rounded-lg p-4 bg-muted/20">
          <Checkbox
            label="Imprimir pedido automaticamente na cozinha"
            checked={!!f?.autoPrintOrders}
            onChange={(e) =>
              setF({ ...f, autoPrintOrders: e.target.checked })
            }
          />
          <Checkbox
            label="Imprimir cupom fiscal após venda no PDV"
            checked={!!f?.autoPrintReceipt}
            onChange={(e) =>
              setF({ ...f, autoPrintReceipt: e.target.checked })
            }
          />
        </div>
        <div className="flex flex-wrap gap-3 pt-2">
          <Button variant="secondary" size="sm">
            🖨️ Testar impressão
          </Button>
          <p className="text-xs text-muted-foreground self-center">
            Obs.: Impressão requer navegador compatível e/ou driver ESC/POS.
          </p>
        </div>
      </Section>
      <SaveBar onSave={() => onSave(f)} loading={loading} />
    </>
  );
}

function BackupSection() {
  async function handleBackup() {
    try {
      const res = await fetch("/api/admin/backup", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        window.location.href = `/api/admin/backup/download?file=${encodeURIComponent(data.file)}`;
      } else {
        alert("Erro: " + (data.error || "desconhecido"));
      }
    } catch (e: any) {
      alert("Erro ao gerar backup: " + e?.message);
    }
  }

  return (
    <Section
      title="Backup do Banco de Dados"
      description="Gere arquivos de backup completo do PostgreSQL. Salve-os em local seguro (nuvem, HD externo)."
    >
      <div className="rounded-xl border border-dashed border-border p-6 bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-xl bg-primary text-white flex items-center justify-center shrink-0 shadow-lg">
            <Database size={28} />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg mb-1">Backup Manual</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Gere um arquivo .sql completo do banco. Recomendamos fazer isso
              diariamente ou sempre antes de grandes atualizações.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button size="lg" onClick={handleBackup}>
                <Database size={18} />
                Gerar Backup Agora
              </Button>
              <Button size="lg" variant="secondary">
                📁 Restaurar Backup
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-xs text-muted-foreground mb-1">Frequência recomendada</div>
          <div className="font-bold text-lg">Diariamente</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-xs text-muted-foreground mb-1">Armazenamento</div>
          <div className="font-bold text-lg">Nuvem + HD</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-xs text-muted-foreground mb-1">Formato</div>
          <div className="font-bold text-lg">.SQL</div>
        </div>
      </div>

      <div className="rounded-xl bg-muted/30 border border-border p-5">
        <h4 className="font-bold mb-2">Como restaurar um backup</h4>
        <ol className="text-sm text-muted-foreground space-y-1 list-decimal pl-5">
          <li>
            Abra o <strong>pgAdmin</strong> ou terminal com psql
          </li>
          <li>
            Crie um banco vazio com nome <code className="bg-background px-1 rounded">erp_acai</code>
          </li>
          <li>
            Execute:{" "}
            <code className="bg-background px-1 rounded">
              psql -U postgres -d erp_acai -f caminho-do-backup.sql
            </code>
          </li>
        </ol>
      </div>
    </Section>
  );
}

const ROLE_LABEL: Record<string, { label: string; color: any }> = {
  ADMIN: { label: "Administrador", color: "purple" },
  ATTENDANT: { label: "Atendente", color: "blue" },
  KITCHEN: { label: "Cozinha", color: "orange" },
  DELIVERY_DRIVER: { label: "Entregador", color: "green" },
};

function UsersForm({
  users,
  onSave,
  loading,
}: {
  users: any[];
  onSave: (data: any) => Promise<any>;
  loading: boolean;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>({
    name: "",
    email: "",
    password: "",
    role: "ATTENDANT",
    active: true,
  });
  const [confirmDelete, setConfirmDelete] = useState<any>(null);

  function openNew() {
    setEditing(null);
    setForm({ name: "", email: "", password: "", role: "ATTENDANT", active: true });
    setModalOpen(true);
  }

  function openEdit(u: any) {
    setEditing(u);
    setForm({
      id: u.id,
      name: u.name,
      email: u.email,
      password: "",
      role: u.role,
      active: !!u.active,
    });
    setModalOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!editing && !form.password) {
      alert("Informe uma senha para o novo usuário");
      return;
    }
    await onSave(form);
    if (!loading) {
      // esperar onSuccess recarregar
    }
  }

  return (
    <>
      <Section
        title="Gestão de Usuários"
        description="Controle de acesso de funcionários e permissões do sistema"
      >
        <div className="flex justify-end mb-4">
          <Button onClick={openNew}>
            <UserPlus size={18} /> Novo Usuário
          </Button>
        </div>

        {users.length === 0 ? (
          <EmptyState
            title="Nenhum usuário cadastrado"
            description="Crie o primeiro usuário para começar."
            action={{ label: "Novo Usuário", onClick: openNew }}
          />
        ) : (
          <div className="border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="text-left p-3 font-medium">Nome</th>
                    <th className="text-left p-3 font-medium">E-mail</th>
                    <th className="text-left p-3 font-medium">Perfil</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-right p-3 font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-t border-border hover:bg-muted/20">
                      <td className="p-3 font-medium">{u.name}</td>
                      <td className="p-3 text-muted-foreground">{u.email}</td>
                      <td className="p-3">
                        <Badge color={(ROLE_LABEL[u.role]?.color || "default") as any}>
                          {ROLE_LABEL[u.role]?.label || u.role}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <Badge color={u.active ? "green" : "red"}>
                          {u.active ? "Ativo" : "Inativo"}
                        </Badge>
                      </td>
                      <td className="p-3 text-right">
                        <div className="inline-flex gap-1 justify-end">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => openEdit(u)}
                          >
                            <Icones.Edit3 size={14} /> Editar
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Section>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Editar Usuário" : "Novo Usuário"}
        size="md"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Nome completo *"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <Input
            label="E-mail *"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <Input
            label={editing ? "Senha (deixe em branco para manter)" : "Senha *"}
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required={!editing}
          />
          <Select
            label="Perfil *"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            options={Object.entries(ROLE_LABEL).map(([value, { label }]) => ({
              value,
              label,
            }))}
          />
          <Checkbox
            label="Usuário ativo"
            checked={!!form.active}
            onChange={(e) => setForm({ ...form, active: e.target.checked })}
          />
          <div className="flex gap-2 justify-end pt-2 border-t border-border">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
