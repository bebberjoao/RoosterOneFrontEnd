import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { financeService } from "@/services/mock-api/finance.service";
import type { Tuition } from "@/mock/database/charges";
import type { Product } from "@/mock/database/products";
import type { Service } from "@/mock/database/services";
import type { Payment } from "@/mock/database/payments";
import { NFES as INITIAL_NFES, DISCOUNTS as INITIAL_DISCOUNTS, type Nfe, type Discount } from "./mock-data";
import { nextId } from "@/services/mock-api/utils";

type Ctx = {
  tuitions: Tuition[];
  products: Product[];
  services: Service[];
  payments: Payment[];
  nfes: Nfe[];
  discounts: Discount[];
  loading: boolean;
  updateTuition: (id: string, patch: Partial<Tuition>) => Promise<void>;
  createProduct: (p: Omit<Product, "id">) => Promise<Product>;
  updateProduct: (id: string, patch: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  createService: (s: Omit<Service, "id">) => Promise<Service>;
  updateService: (id: string, patch: Partial<Service>) => Promise<void>;
  deleteService: (id: string) => Promise<void>;
  paymentsOf: (studentId: string) => Payment[];
  emitBoleto: (tuition: Tuition) => Promise<Payment>;
  markPaymentPaid: (id: string) => Promise<void>;
  emitNfe: (n: Omit<Nfe, "id">) => Nfe;
  createDiscount: (d: Omit<Discount, "id">) => Discount;
  updateDiscount: (id: string, patch: Partial<Discount>) => void;
  deleteDiscount: (id: string) => void;
};

const FinanceCtx = createContext<Ctx | null>(null);

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [tuitions, setTuitions] = useState<Tuition[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [nfes, setNfes] = useState<Nfe[]>(INITIAL_NFES);
  const [discounts, setDiscounts] = useState<Discount[]>(INITIAL_DISCOUNTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    Promise.all([
      financeService.getTuitions(),
      financeService.getProducts(),
      financeService.getServices(),
      financeService.getPayments(),
    ]).then(([t, p, s, pay]) => {
      if (!alive) return;
      setTuitions(t);
      setProducts(p);
      setServices(s);
      setPayments(pay);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, []);

  const updateTuition = useCallback(async (id: string, patch: Partial<Tuition>) => {
    const updated = await financeService.updateTuition(id, patch);
    if (updated) setTuitions((prev) => prev.map((t) => (t.id === id ? updated : t)));
  }, []);

  const createProduct = useCallback(async (p: Omit<Product, "id">) => {
    const created = await financeService.createProduct(p);
    setProducts((prev) => [created, ...prev]);
    return created;
  }, []);
  const updateProduct = useCallback(async (id: string, patch: Partial<Product>) => {
    const updated = await financeService.updateProduct(id, patch);
    if (updated) setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)));
  }, []);
  const deleteProduct = useCallback(async (id: string) => {
    await financeService.removeProduct(id);
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const createService = useCallback(async (s: Omit<Service, "id">) => {
    const created = await financeService.createService(s);
    setServices((prev) => [created, ...prev]);
    return created;
  }, []);
  const updateService = useCallback(async (id: string, patch: Partial<Service>) => {
    const updated = await financeService.updateService(id, patch);
    if (updated) setServices((prev) => prev.map((s) => (s.id === id ? updated : s)));
  }, []);
  const deleteService = useCallback(async (id: string) => {
    await financeService.removeService(id);
    setServices((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const emitBoleto = useCallback(async (tuition: Tuition) => {
    const created = await financeService.emitPayment({
      code: `23793.${Date.now().toString().slice(-10)}`,
      ourNumber: `NN-${Date.now().toString().slice(-6)}`,
      studentId: tuition.studentId,
      description: `Mensalidade ${tuition.competence}`,
      dueDate: tuition.dueDate,
      value: tuition.value - tuition.discount + tuition.fine + tuition.interest,
      status: "emitido",
      emittedAt: new Date().toISOString().slice(0, 10),
      paidAt: undefined,
      chargeId: tuition.id,
    });
    setPayments((prev) => [created, ...prev]);
    return created;
  }, []);

  const markPaymentPaid = useCallback(async (id: string) => {
    const updated = await financeService.updatePayment(id, { status: "pago", paidAt: new Date().toISOString().slice(0, 10) });
    if (updated) setPayments((prev) => prev.map((p) => (p.id === id ? updated : p)));
  }, []);

  const emitNfe = useCallback((n: Omit<Nfe, "id">) => {
    const created: Nfe = { ...n, id: nextId("nfe") };
    setNfes((prev) => [created, ...prev]);
    return created;
  }, []);

  const createDiscount = useCallback((d: Omit<Discount, "id">) => {
    const created: Discount = { ...d, id: nextId("disc") };
    setDiscounts((prev) => [created, ...prev]);
    return created;
  }, []);
  const updateDiscount = useCallback((id: string, patch: Partial<Discount>) => {
    setDiscounts((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)));
  }, []);
  const deleteDiscount = useCallback((id: string) => {
    setDiscounts((prev) => prev.filter((d) => d.id !== id));
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      tuitions,
      products,
      services,
      payments,
      nfes,
      discounts,
      loading,
      updateTuition,
      createProduct,
      updateProduct,
      deleteProduct,
      createService,
      updateService,
      deleteService,
      paymentsOf: (studentId) => payments.filter((p) => p.studentId === studentId),
      emitBoleto,
      markPaymentPaid,
      emitNfe,
      createDiscount,
      updateDiscount,
      deleteDiscount,
    }),
    [tuitions, products, services, payments, nfes, discounts, loading, updateTuition, createProduct, updateProduct, deleteProduct, createService, updateService, deleteService, emitBoleto, markPaymentPaid, emitNfe, createDiscount, updateDiscount, deleteDiscount],
  );

  return <FinanceCtx.Provider value={value}>{children}</FinanceCtx.Provider>;
}

export function useFinance() {
  const ctx = useContext(FinanceCtx);
  if (!ctx) throw new Error("useFinance must be used inside FinanceProvider");
  return ctx;
}
