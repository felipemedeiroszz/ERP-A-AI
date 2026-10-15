import axios from "axios";

const ASAAS_BASE_URL =
  process.env.ASAAS_BASE_URL || "https://www.asaas.com/api/v3";

const asaasApi = axios.create({
  baseURL: ASAAS_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    access_token: process.env.ASAAS_API_KEY || "",
  },
  timeout: 30000,
});

export interface AsaasPixCharge {
  id: string;
  dateCreated: string;
  customer: string;
  paymentLink: string | null;
  value: number;
  netValue: number;
  status: string;
  billingType: "PIX";
  dueDate: string;
  pixQrCode?: string;
  encodedImage?: string;
  transactionReceiptUrl?: string;
  description?: string;
  externalReference?: string;
  originalValue?: number;
  interestValue?: number;
  canceledRemovedPaymentReason?: string;
  confirmedDate?: string;
  paymentDate?: string;
  creditDate?: string;
}

export async function createPixCharge(params: {
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  value: number;
  dueDate?: string;
  description?: string;
  externalReference: string;
}): Promise<AsaasPixCharge> {
  const dueDate =
    params.dueDate ||
    new Date(Date.now() + 30 * 60 * 1000).toISOString().split("T")[0];

  const response = await asaasApi.post<AsaasPixCharge>("/payments", {
    customer: undefined,
    billingType: "PIX",
    value: params.value,
    dueDate,
    description: params.description || "Pedido Açaiteria",
    externalReference: params.externalReference,
  });

  const charge = response.data;

  try {
    const qrResponse = await asaasApi.get(
      `/payments/${charge.id}/pixQrCode`
    );
    if (qrResponse.data) {
      charge.encodedImage = qrResponse.data.encodedImage;
      charge.pixQrCode = qrResponse.data.payload;
    }
  } catch (e) {
    console.error("[ASAAS] Erro ao gerar QR Code:", e);
  }

  return charge;
}

export async function getPixCharge(id: string): Promise<AsaasPixCharge> {
  const response = await asaasApi.get<AsaasPixCharge>(`/payments/${id}`);
  return response.data;
}

export async function verifyWebhookSignature(
  token: string,
  body: unknown
): Promise<boolean> {
  const expected = process.env.ASAAS_WEBHOOK_TOKEN;
  if (!expected) return true;
  return token === expected;
}
