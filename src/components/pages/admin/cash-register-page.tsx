"use client";

import { useState } from "react";
import AdminLayout from "@/components/layout/admin-layout";
import { Modal, Button, Input, EmptyState, Icones, Badge, useToastAction, ConfirmDialog, Select } from "@/components/ui";
import {
  openCashRegister,
  closeCashRegister,
  addCashMovement,
} from "@/lib/actions/cash-register";
import {
  formatCurrency,
  formatDateTime,
} from "@/lib/utils";
import {
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  DollarSign,
  QrCode,
  Banknote,
  CreditCard,
  CheckCircle2,
  XCircle,
  Filter,
  X,
} from "lucide-react";
import type {
  CashRegister,
  CashMovement,
  CashMovementType,
  PaymentMethod,
} from "@prisma/client";

interface Props {
  user: { role: any; name: string | null };
  registers: (CashRegister & {
    movements: CashMovement[];
    user: { name: string };
    orders: any[];
  })[];
}

export default function CashRegisterPageClient({ user, registers: init }: Props) {
  const [list, setList] = useState(init);
  const [openOpen, setOpenOpen] = useState(false);
  const [openMovement, setOpenMovement] = useState<null | {
    cr: CashRegister;
    type: "IN" | "OUT" | "WITHDRAWAL";
  }>(null);
  const [closeModal, setCloseModal] = useState<CashRegister | null>(null);

  const myOpen = list.find(
    (c) => c.userId === (user as any).id && c.status === "OPEN"
  );
  const anyOpen = list.find((c) => c.status === "OPEN");

  const toastOpen = useToastAction(openCashRegister as any, {
    success: "Caixa aberto com sucesso!",
    onSuccess: () => {
      setOpenOpen(false);
      window.location.reload();
    },
  });
  const toastMov = useToastAction(addCashMovement as any, {
    success: "Movimentação registrada!",
    onSuccess: () => window.location.reload(),
  });
  const toastClose = useToastAction(closeCashRegister as any, {
    success: "Caixa fechado com sucesso!",
    onSuccess: () => {
      setCloseModal(null);
      window.location.reload();
    },
  });

  function summarize(cr: any) {
    const movs = cr.movements || [];
    const inTotal = movs
      .filter((m: any) =>
        ["OPENING", "SALE", "IN"].includes(m.type)
      )
      .reduce((s: number, m: any) => s + Number(m.amount), 0);
    const outTotal = movs
      .filter((m: any) => ["OUT", "WITHDRAWAL"].includes(m.type))
      .reduce((s: number, m: any) => s + Number(m.amount), 0);
    const expected = inTotal - outTotal;

    const sales = cr.orders?.filter((o: any) => o.status !== "CANCELLED") || [];
    const pix = sales
      .filter((o: any) => o.paymentMethod === "PIX")
      .reduce((s: number, o: any) => s + Number(o.totalAmount), 0);
    const cash = sales
      .filter((o: any) =>
        ["CASH", "DELIVERY_CASH"].includes(o.paymentMethod)
      )
      .reduce((s: number, o: any) => s + Number(o.totalAmount), 0);
    const card = sales
      .filter((o: any) =>
        ["CARD", "DELIVERY_CARD"].includes(o.paymentMethod)
      )
      .reduce((s: number, o: any) => s + Number(o.totalAmount), 0);

    return { inTotal, outTotal, expected, salesTotal: expected, pix, cash, card };
  }

  return (
    <AdminLayout userRole={user.role} userName={user.name || "Usuário"} active="cash">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Caixa</h1>
          <p className="text-sm text-muted-foreground">
            Abertura, movimentações e fechamento
          </p>
        </div>
        {!myOpen && (
          <Button onClick={() => setOpenOpen(true)}>
            <Wallet size={18} /> Abrir Meu Caixa
          </Button>
        )}
      </div>

      {list.length === 0 && !openOpen ? (
        <EmptyState
          title="Nenhum caixa aberto"
          description="Abra o caixa para começar a registrar vendas e movimentações."
          action={{ label: "Abrir caixa agora", onClick: () => setOpenOpen(true) }}
        />
      ) : (
        <div className="space-y-5">
          {list
            .sort((a, b) =>
              a.status === "OPEN" && b.status === "CLOSED"
                ? -1
                : b.createdAt.getTime() - a.createdAt.getTime()
            )
            .map((cr) => {
              const s = summarize(cr);
              return (
                <div
                  key={cr.id}
                  className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm"
                >
                  <div className="p-5 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-14 h-14 rounded-xl flex items-center justify-center text-white shadow-md ${
                          cr.status === "OPEN"
                            ? "bg-gradient-to-br from-green-500 to-emerald-600"
                            : "bg-gradient-to-br from-slate-500 to-slate-600"
                        }`}
                      >
                        <Wallet size={26} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="font-bold text-lg">
                            {cr.identifier}
                          </h2>
                          <Badge
                            color={cr.status === "OPEN" ? "green" : "default"}
                          >
                            {cr.status === "OPEN" ? "ABERTO" : "FECHADO"}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          Responsável: {cr.user.name} · Abertura:{" "}
                          {formatDateTime(cr.openedAt)}
                          {cr.closedAt && ` · Fechamento: ${formatDateTime(cr.closedAt)}`}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {cr.status === "OPEN" && cr.userId === (user as any).id && (
                        <>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() =>
                              setOpenMovement({ cr, type: "IN" })
                            }
                          >
                            <ArrowDownCircle size={15} /> Entrada
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() =>
                              setOpenMovement({ cr, type: "OUT" })
                            }
                          >
                            <ArrowUpCircle size={15} /> Saída
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() =>
                              setOpenMovement({ cr, type: "WITHDRAWAL" })
                            }
                          >
                            <DollarSign size={15} /> Sangria
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => setCloseModal(cr)}
                          >
                            <X size={15} /> Fechar Caixa
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-5 border-b border-border bg-muted/10">
                    <Metric
                      icon={<DollarSign size={18} />}
                      label="Saldo Abertura"
                      value={formatCurrency(cr.openingBalance)}
                      color="from-blue-500 to-blue-600"
                    />
                    <Metric
                      icon={<ArrowDownCircle size={18} />}
                      label="Entradas"
                      value={formatCurrency(s.inTotal)}
                      color="from-green-500 to-emerald-600"
                    />
                    <Metric
                      icon={<ArrowUpCircle size={18} />}
                      label="Saídas"
                      value={formatCurrency(s.outTotal)}
                      color="from-red-500 to-rose-600"
                    />
                    <Metric
                      icon={<CheckCircle2 size={18} />}
                      label="Saldo Esperado"
                      value={formatCurrency(s.expected)}
                      color="from-indigo-500 to-purple-600"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3 p-5 border-b border-border">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100">
                      <div className="flex items-center gap-2 text-indigo-700 text-xs font-semibold mb-1">
                        <QrCode size={14} /> PIX
                      </div>
                      <div className="font-bold text-xl text-indigo-700">
                        {formatCurrency(s.pix)}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-gradient-to-br from-yellow-50 to-amber-50 border border-yellow-200">
                      <div className="flex items-center gap-2 text-amber-700 text-xs font-semibold mb-1">
                        <Banknote size={14} /> DINHEIRO
                      </div>
                      <div className="font-bold text-xl text-amber-700">
                        {formatCurrency(s.cash)}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-gradient-to-br from-pink-50 to-rose-50 border border-pink-200">
                      <div className="flex items-center gap-2 text-pink-700 text-xs font-semibold mb-1">
                        <CreditCard size={14} /> CARTÃO
                      </div>
                      <div className="font-bold text-xl text-pink-700">
                        {formatCurrency(s.card)}
                      </div>
                    </div>
                  </div>

                  <div className="p-5">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Filter size={16} className="text-muted-foreground" />
                      Movimentações ({cr.movements.length})
                    </h3>
                    {cr.movements.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-6 bg-muted/20 rounded-xl border border-dashed border-border">
                        Sem movimentações ainda.
                      </p>
                    ) : (
                      <div className="overflow-x-auto -mx-5 px-5">
                        <table className="w-full text-sm min-w-[500px]">
                          <thead className="text-xs text-muted-foreground">
                            <tr className="text-left border-b border-border">
                              <th className="py-2 pr-3 font-medium">Horário</th>
                              <th className="py-2 pr-3 font-medium">Tipo</th>
                              <th className="py-2 pr-3 font-medium">Forma</th>
                              <th className="py-2 pr-3 font-medium">Descrição</th>
                              <th className="py-2 text-right font-medium">Valor</th>
                            </tr>
                          </thead>
                          <tbody>
                            {[...cr.movements]
                              .sort(
                                (a, b) =>
                                  new Date(b.createdAt).getTime() -
                                  new Date(a.createdAt).getTime()
                              )
                              .map((m) => (
                                <tr
                                  key={m.id}
                                  className="border-b border-border last:border-0"
                                >
                                  <td className="py-2 pr-3 text-xs text-muted-foreground whitespace-nowrap">
                                    {formatDateTime(m.createdAt)}
                                  </td>
                                  <td className="py-2 pr-3">
                                    <MoveBadge type={m.type} />
                                  </td>
                                  <td className="py-2 pr-3 text-xs text-muted-foreground">
                                    {m.paymentMethod || "-"}
                                  </td>
                                  <td className="py-2 pr-3 text-xs text-muted-foreground truncate max-w-[220px]">
                                    {m.description || "-"}
                                  </td>
                                  <td
                                    className={`py-2 text-right font-bold whitespace-nowrap ${
                                      ["OUT", "WITHDRAWAL"].includes(m.type)
                                        ? "text-red-600"
                                        : "text-green-600"
                                    }`}
                                  >
                                    {["OUT", "WITHDRAWAL"].includes(m.type)
                                      ? "-"
                                      : "+"}
                                    {formatCurrency(m.amount)}
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {cr.status === "CLOSED" && cr.reportedBalance !== null && (
                    <div className="p-5 border-t border-border bg-muted/20 grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">
                          Saldo Informado
                        </div>
                        <div className="font-bold text-xl">
                          {formatCurrency(Number(cr.reportedBalance))}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">
                          Saldo Esperado
                        </div>
                        <div className="font-bold text-xl">
                          {formatCurrency(Number(cr.closingBalance))}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">
                          Diferença
                        </div>
                        <div
                          className={`font-bold text-xl ${
                            Number(cr.difference) === 0
                              ? "text-green-600"
                              : Number(cr.difference || 0) < 0
                              ? "text-red-600"
                              : "text-blue-600"
                          }`}
                        >
                          {formatCurrency(Number(cr.difference))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      )}

      {openOpen && (
        <Modal
          open={true}
          onClose={() => setOpenOpen(false)}
          title="Abertura de Caixa"
          size="sm"
        >
          <OpenForm
            onSave={(d) => toastOpen.run(d as any)}
            loading={toastOpen.loading}
          />
        </Modal>
      )}

      {openMovement && (
        <Modal
          open={true}
          onClose={() => setOpenMovement(null)}
          title={
            openMovement.type === "IN"
              ? "Entrada de Valor"
              : openMovement.type === "WITHDRAWAL"
              ? "Sangria"
              : "Saída de Valor"
          }
          size="sm"
        >
          <MovementForm
            cashRegisterId={openMovement.cr.id}
            type={openMovement.type}
            onSave={(d) => toastMov.run(d as any)}
            loading={toastMov.loading}
          />
        </Modal>
      )}

      {closeModal && (
        <Modal
          open={true}
          onClose={() => setCloseModal(null)}
          title={`Fechamento - ${closeModal.identifier}`}
          size="md"
        >
          <CloseForm
            cashRegisterId={closeModal.id}
            expected={summarize(closeModal).expected}
            onSave={(d) => toastClose.run(d as any)}
            loading={toastClose.loading}
          />
        </Modal>
      )}
    </AdminLayout>
  );
}

function Metric({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="p-3 rounded-xl bg-card border border-border">
      <div className="flex items-center gap-2 mb-1">
        <div
          className={`w-7 h-7 rounded-lg bg-gradient-to-br ${color} text-white flex items-center justify-center`}
        >
          {icon}
        </div>
        <div className="text-xs text-muted-foreground font-medium">{label}</div>
      </div>
      <div className="font-bold text-lg">{value}</div>
    </div>
  );
}

function MoveBadge({ type }: { type: CashMovementType }) {
  const map: Record<CashMovementType, { label: string; color: any; icon: any }> = {
    OPENING: { label: "Abertura", color: "blue", icon: Wallet },
    SALE: { label: "Venda", color: "green", icon: CheckCircle2 },
    IN: { label: "Entrada", color: "green", icon: ArrowDownCircle },
    OUT: { label: "Saída", color: "red", icon: ArrowUpCircle },
    WITHDRAWAL: { label: "Sangria", color: "red", icon: DollarSign },
    CLOSING: { label: "Fechamento", color: "default", icon: X },
  };
  const m = map[type];
  return <Badge color={m.color}>{m.label}</Badge>;
}

function OpenForm({ onSave, loading }: any) {
  const [identifier, setIdentifier] = useState(
    `CAIXA-${new Date().getDate().toString().padStart(2, "0")}${(
      new Date().getMonth() + 1
    )
      .toString()
      .padStart(2, "0")}`
  );
  const [openingBalance, setOpeningBalance] = useState("0");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave({
          identifier,
          openingBalance: Number(String(openingBalance).replace(",", ".")),
        });
      }}
      className="space-y-4"
    >
      <Input
        label="Identificação do Caixa"
        value={identifier}
        onChange={(e) => setIdentifier(e.target.value)}
        required
      />
      <Input
        label="Saldo inicial (R$)"
        type="number"
        step="0.01"
        min="0"
        value={openingBalance}
        onChange={(e) => setOpeningBalance(e.target.value)}
        required
      />
      <div className="flex justify-end gap-2 pt-2 border-t border-border">
        <Button variant="secondary" type="button" onClick={() => {}}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          <Wallet size={16} /> Abrir Caixa
        </Button>
      </div>
    </form>
  );
}

function MovementForm({
  cashRegisterId,
  type,
  onSave,
  loading,
}: {
  cashRegisterId: string;
  type: "IN" | "OUT" | "WITHDRAWAL";
  onSave: any;
  loading: boolean;
}) {
  const [amount, setAmount] = useState("");
  const [pm, setPm] = useState<PaymentMethod | "">(PaymentMethod.CASH);
  const [description, setDescription] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave({
          cashRegisterId,
          type,
          amount: Number(String(amount).replace(",", ".")),
          paymentMethod: pm || undefined,
          description,
        });
      }}
      className="space-y-4"
    >
      <Input
        label="Valor (R$)"
        type="number"
        step="0.01"
        min="0.01"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        required
      />
      <Select
        label="Forma de pagamento"
        value={pm}
        onChange={(e) => setPm(e.target.value as any)}
        options={[
          { value: "CASH", label: "💵 Dinheiro" },
          { value: "PIX", label: "📱 PIX" },
          { value: "CARD", label: "💳 Cartão" },
        ]}
      />
      <Input
        label="Descrição"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder={
          type === "IN"
            ? "Ex.: Venda avulsa, entrada de troco"
            : type === "WITHDRAWAL"
            ? "Ex.: Retirada para banco, pagamento fornecedor"
            : "Ex.: Compra de insumo"
        }
      />
      <div className="flex justify-end gap-2 pt-2 border-t border-border">
        <Button variant="secondary" type="button" onClick={() => {}}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {type === "IN" ? (
            <><ArrowDownCircle size={16} /> Registrar Entrada</>
          ) : type === "WITHDRAWAL" ? (
            <><DollarSign size={16} /> Confirmar Sangria</>
          ) : (
            <><ArrowUpCircle size={16} /> Registrar Saída</>
          )}
        </Button>
      </div>
    </form>
  );
}

function CloseForm({
  cashRegisterId,
  expected,
  onSave,
  loading,
}: {
  cashRegisterId: string;
  expected: number;
  onSave: any;
  loading: boolean;
}) {
  const [reported, setReported] = useState(String(expected));
  const [note, setNote] = useState("");
  const diff = Number(String(reported).replace(",", ".")) - expected;
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave({
          cashRegisterId,
          reportedBalance: Number(String(reported).replace(",", ".")),
          closeNote: note,
        });
      }}
      className="space-y-4"
    >
      <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200">
        <div className="text-xs text-indigo-700 font-semibold mb-1">
          Saldo Esperado (conferência)
        </div>
        <div className="text-3xl font-extrabold text-indigo-700">
          {formatCurrency(expected)}
        </div>
      </div>
      <Input
        label="Valor Informado no Fechamento (R$)"
        type="number"
        step="0.01"
        value={reported}
        onChange={(e) => setReported(e.target.value)}
        required
      />
      <div
        className={`p-3 rounded-xl border ${
          diff === 0
            ? "bg-green-50 border-green-200"
            : diff < 0
            ? "bg-red-50 border-red-200"
            : "bg-blue-50 border-blue-200"
        }`}
      >
        <div className="text-xs font-semibold mb-1 text-muted-foreground">
          Diferença
        </div>
        <div
          className={`text-xl font-bold ${
            diff === 0
              ? "text-green-700"
              : diff < 0
              ? "text-red-700"
              : "text-blue-700"
          }`}
        >
          {formatCurrency(diff)}
          {diff !== 0 && (
            <span className="text-xs ml-2 font-normal opacity-80">
              {diff < 0 ? "(Faltante)" : "(Sobra)"}
            </span>
          )}
        </div>
      </div>
      <Input
        label="Observação (opcional)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Ex.: Conferência Ok, sobra R$ 2,00"
      />
      <div className="flex justify-end gap-2 pt-2 border-t border-border">
        <Button variant="secondary" type="button" onClick={() => {}}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          <X size={16} /> Confirmar Fechamento
        </Button>
      </div>
    </form>
  );
}
