// Mock service for Rooster Finance (charges, tuitions, products, services, payments).
import { db } from "@/mock/database";
import type { Charge, Tuition } from "@/mock/database/charges";
import type { Product } from "@/mock/database/products";
import type { Service } from "@/mock/database/services";
import type { Payment } from "@/mock/database/payments";
import { delay, nextId, applyFilters, type Filters } from "./utils";

let charges = [...db.charges];
let tuitions = [...db.tuitions];
let products = [...db.products];
let services = [...db.services];
let payments = [...db.payments];

export const financeService = {
  // Primary entity: charges
  async getAll(filters?: Filters<Charge>): Promise<Charge[]> {
    return delay(applyFilters(charges, filters));
  },
  async getById(id: string): Promise<Charge | undefined> {
    return delay(charges.find((c) => c.id === id));
  },
  async create(dto: Omit<Charge, "id">): Promise<Charge> {
    const created: Charge = { ...dto, id: nextId("charge") };
    charges = [...charges, created];
    return delay(created);
  },
  async update(id: string, dto: Partial<Charge>): Promise<Charge | undefined> {
    charges = charges.map((c) => (c.id === id ? { ...c, ...dto } : c));
    return delay(charges.find((c) => c.id === id));
  },
  async remove(id: string): Promise<boolean> {
    const before = charges.length;
    charges = charges.filter((c) => c.id !== id);
    return delay(charges.length < before);
  },
  async search(query: string): Promise<Charge[]> {
    const q = query.toLowerCase();
    return delay(charges.filter((c) => c.description.toLowerCase().includes(q)));
  },

  // Tuitions (mensalidades)
  async getTuitions(filters?: Filters<Tuition>) {
    return delay(applyFilters(tuitions, filters));
  },
  async updateTuition(id: string, dto: Partial<Tuition>): Promise<Tuition | undefined> {
    tuitions = tuitions.map((t) => (t.id === id ? { ...t, ...dto } : t));
    return delay(tuitions.find((t) => t.id === id));
  },

  // Products
  async getProducts(filters?: Filters<Product>) {
    return delay(applyFilters(products, filters));
  },
  async createProduct(dto: Omit<Product, "id">): Promise<Product> {
    const created: Product = { ...dto, id: nextId("prod") };
    products = [...products, created];
    return delay(created);
  },
  async updateProduct(id: string, dto: Partial<Product>): Promise<Product | undefined> {
    products = products.map((p) => (p.id === id ? { ...p, ...dto } : p));
    return delay(products.find((p) => p.id === id));
  },
  async removeProduct(id: string): Promise<boolean> {
    const before = products.length;
    products = products.filter((p) => p.id !== id);
    return delay(products.length < before);
  },

  // Services
  async getServices(filters?: Filters<Service>) {
    return delay(applyFilters(services, filters));
  },
  async createService(dto: Omit<Service, "id">): Promise<Service> {
    const created: Service = { ...dto, id: nextId("serv") };
    services = [...services, created];
    return delay(created);
  },
  async updateService(id: string, dto: Partial<Service>): Promise<Service | undefined> {
    services = services.map((s) => (s.id === id ? { ...s, ...dto } : s));
    return delay(services.find((s) => s.id === id));
  },
  async removeService(id: string): Promise<boolean> {
    const before = services.length;
    services = services.filter((s) => s.id !== id);
    return delay(services.length < before);
  },

  // Payments / boletos
  async getPayments(filters?: Filters<Payment>) {
    return delay(applyFilters(payments, filters));
  },
  async emitPayment(dto: Omit<Payment, "id">): Promise<Payment> {
    const created: Payment = { ...dto, id: nextId("pay") };
    payments = [...payments, created];
    return delay(created);
  },
  async updatePayment(id: string, dto: Partial<Payment>): Promise<Payment | undefined> {
    payments = payments.map((p) => (p.id === id ? { ...p, ...dto } : p));
    return delay(payments.find((p) => p.id === id));
  },
};
