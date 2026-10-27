/** Benefícios do Plano Pataí: sinal Pix, clube de pacotes, fidelidade, lembretes e relatórios. */
import { z } from 'zod';
import {
  businessSettingsSchema, localDateOf, packageInputSchema, RETURN_AFTER_DAYS, uuid,
  type MyPackageDTO, type PackageDTO, type PanelCustomerPackageDTO, type PanelReportDTO, type ReturnReminderDTO,
} from '@conecta/shared';
import { withUser, type Db } from '../db/pool';
import { AppError, forbidden, notFound, parse } from '../lib/errors';
import { zonedToUtc } from '../lib/time';
import { benefitsRepo } from '../repositories/benefits';
import { businessesRepo } from '../repositories/businesses';
import { panelRepo } from '../repositories/panel';
import { requireActivePlan } from './pets';
import { notifyBusiness } from './push';

export const BENEFIT_LIMITS = { maxPackages: 20 };

async function requireMember(db: Db, businessId: string) {
  const role = await panelRepo.role(db, businessId);
  if (role !== 'owner' && role !== 'manager') throw forbidden('Você não tem acesso a esta empresa.');
}

const iso = (d: Date | string | null) => (d ? new Date(d).toISOString() : null);
const DAY = 86_400_000;

export const packageRequestSchema = z.object({ packageId: uuid, petId: uuid.nullable().optional() });
export const customerPackageActionSchema = z.object({ action: z.enum(['activate', 'cancel']) });
export const reportQuerySchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Mês inválido.');

// ── Painel ──

export async function saveSettings(userId: string, businessId: string, input: unknown) {
  const v = parse(businessSettingsSchema, input);
  return withUser(userId, async (db) => {
    await requireMember(db, businessId);
    if (v.loyaltyEvery) await requireActivePlan(db, businessId);
    await benefitsRepo.setSettings(db, businessId, v.pixKey ?? null, v.loyaltyEvery ?? null);
    return { pixKey: v.pixKey ?? null, loyaltyEvery: v.loyaltyEvery ?? null };
  });
}

export async function panelPackages(userId: string, businessId: string): Promise<PackageDTO[]> {
  return withUser(userId, async (db) => {
    await requireMember(db, businessId);
    return (await benefitsRepo.packages(db, businessId, false)) as PackageDTO[];
  });
}

export async function savePackage(userId: string, businessId: string, packageId: string | null, input: unknown) {
  const v = parse(packageInputSchema, input);
  const row = { ...v, priceCents: Math.round(v.price * 100) };
  return withUser(userId, async (db) => {
    await requireMember(db, businessId);
    await requireActivePlan(db, businessId);
    if (!(await benefitsRepo.serviceBelongs(db, businessId, v.serviceId))) throw new AppError(422, 'validation_error', 'Serviço inválido.', { serviceId: 'Escolha um serviço.' });
    if (!packageId) {
      if ((await benefitsRepo.packages(db, businessId, false)).length >= BENEFIT_LIMITS.maxPackages) {
        throw new AppError(422, 'limit', `Você pode ter até ${BENEFIT_LIMITS.maxPackages} pacotes.`);
      }
      return { id: await benefitsRepo.insertPackage(db, businessId, row) };
    }
    if (!(await benefitsRepo.updatePackage(db, businessId, packageId, row)).length) throw notFound('Pacote não encontrado.');
    return { id: packageId };
  });
}

export async function removePackage(userId: string, businessId: string, packageId: string) {
  return withUser(userId, async (db) => {
    await requireMember(db, businessId);
    if (!(await benefitsRepo.removePackage(db, businessId, packageId)).length) throw notFound('Pacote não encontrado.');
    return { ok: true };
  });
}

export async function panelCustomerPackages(userId: string, businessId: string): Promise<PanelCustomerPackageDTO[]> {
  return withUser(userId, async (db) => {
    await requireMember(db, businessId);
    const rows = await benefitsRepo.panelCustomerPackages(db, businessId);
    return rows.map((r: Record<string, unknown>) => ({ ...r, expiresAt: iso(r.expiresAt as Date), createdAt: iso(r.createdAt as Date) })) as PanelCustomerPackageDTO[];
  });
}

export async function updateCustomerPackage(userId: string, businessId: string, id: string, input: unknown) {
  const { action } = parse(customerPackageActionSchema, input);
  return withUser(userId, async (db) => {
    await requireMember(db, businessId);
    if (action === 'activate') await requireActivePlan(db, businessId);
    if (!(await benefitsRepo.setCustomerPackage(db, businessId, id, action)).length) {
      throw new AppError(409, 'invalid_state', 'Este pacote já foi atualizado.');
    }
    return { ok: true };
  });
}

export async function markDepositPaid(userId: string, businessId: string, bookingId: string) {
  return withUser(userId, async (db) => {
    await requireMember(db, businessId);
    if (!(await benefitsRepo.setDepositPaid(db, businessId, bookingId)).length) throw new AppError(409, 'invalid_state', 'Este sinal já foi confirmado.');
    return { ok: true };
  });
}

export async function report(userId: string, businessId: string, month: string | undefined, now = new Date()): Promise<PanelReportDTO> {
  return withUser(userId, async (db) => {
    await requireMember(db, businessId);
    await requireActivePlan(db, businessId);
    const biz = await businessesRepo.basicById(businessId, db);
    if (!biz) throw notFound('Empresa não encontrada.');
    const m = month ? parse(reportQuerySchema, month) : localDateOf(now, biz.timezone).slice(0, 7);
    const [y, mo] = m.split('-').map(Number);
    const next = mo === 12 ? `${y + 1}-01` : `${y}-${String(mo + 1).padStart(2, '0')}`;
    const from = zonedToUtc(`${m}-01`, 0, biz.timezone);
    const to = zonedToUtc(`${next}-01`, 0, biz.timezone);
    const r = await benefitsRepo.report(db, businessId, from, to);
    return {
      month: m,
      completed: r.totals.completed,
      cancelled: r.totals.cancelled,
      revenueCents: r.totals.revenue,
      newCustomers: r.customers.new,
      returningCustomers: r.customers.returning,
      topServices: r.topServices,
      busiestHours: r.busiestHours,
      missingCustomers: r.missing
        .map((x) => ({ name: x.name ?? 'Cliente', phone: x.phone, petName: x.pet_name, lastVisit: iso(x.last_visit)!, daysSince: Math.floor((now.getTime() - new Date(x.last_visit).getTime()) / DAY) }))
        .sort((a, b) => a.daysSince - b.daysSince)
        .slice(0, 30),
    };
  });
}

// ── Tutor ──

export async function requestPackage(userId: string, input: unknown) {
  const v = parse(packageRequestSchema, input);
  return withUser(userId, async (db) => {
    const pkg = await benefitsRepo.package(db, v.packageId);
    if (!pkg || !pkg.active) throw notFound('Pacote não encontrado.');
    await requireActivePlan(db, pkg.business_id);
    if (await benefitsRepo.openRequestFor(db, pkg.id)) throw new AppError(409, 'conflict', 'Você já pediu este pacote. Aguarde a empresa confirmar.');
    try {
      const id = await benefitsRepo.requestPackage(db, { packageId: pkg.id, businessId: pkg.business_id, petId: v.petId ?? null, sessions: pkg.sessions, priceCents: pkg.price_cents });
      await notifyBusiness(db, pkg.business_id, { title: 'Pedido de pacote', body: 'Um cliente quer um pacote do seu clube. Confira o pagamento e ative em Clube e Pix.', url: `/empresas/${pkg.business_id}/clube`, tag: `pkg-${id}` });
      return { id };
    } catch (e) {
      if ((e as Error).message?.includes('pet_not_owned')) throw new AppError(422, 'validation_error', 'Pet inválido.');
      throw e;
    }
  });
}

export async function myPackages(userId: string): Promise<MyPackageDTO[]> {
  return withUser(userId, async (db) => {
    const rows = await benefitsRepo.myPackages(db);
    return rows
      .map((r: Record<string, unknown>) => ({ ...r, expiresAt: iso(r.expiresAt as Date), createdAt: iso(r.createdAt as Date) }) as MyPackageDTO)
      .filter((p) => p.status === 'requested' || (p.remaining > 0 && (!p.expiresAt || new Date(p.expiresAt) > new Date())));
  });
}

export async function cancelMyPackage(userId: string, id: string) {
  return withUser(userId, async (db) => {
    if (!(await benefitsRepo.cancelMyRequest(db, id)).length) throw new AppError(409, 'invalid_state', 'Só dá para cancelar pedidos ainda não confirmados.');
    return { ok: true };
  });
}

export async function reminders(userId: string, now = new Date()): Promise<ReturnReminderDTO[]> {
  return withUser(userId, async (db) => {
    const rows = await benefitsRepo.lastVisits(db);
    return rows
      .map((r) => ({ r, days: Math.floor((now.getTime() - new Date(r.last_at).getTime()) / DAY) }))
      .filter(({ r, days }) => RETURN_AFTER_DAYS[r.cat_slug] != null && days >= RETURN_AFTER_DAYS[r.cat_slug] && days <= 120)
      .sort((a, b) => a.days - b.days)
      .slice(0, 3)
      .map(({ r, days }) => ({
        petId: r.pet_id, petName: r.pet_name, business: { slug: r.slug, name: r.name }, serviceId: r.service_id, serviceName: r.service_name, daysSince: days,
      }));
  });
}

/** Benefícios exibidos no perfil público da empresa. */
export async function publicBenefits(db: Db, businessId: string, planActive: boolean, loggedIn: boolean) {
  if (!planActive) return { packages: [] as PackageDTO[], myLoyaltyVisits: null as number | null };
  const packages = (await benefitsRepo.packages(db, businessId, true)) as PackageDTO[];
  const myLoyaltyVisits = loggedIn ? await benefitsRepo.myVisits(db, businessId) : null;
  return { packages, myLoyaltyVisits };
}
