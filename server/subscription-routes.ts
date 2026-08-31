/**
 * Subscription API Routes
 * Mounts on /api in app.ts
 */

import { Router, Response } from 'express';
import { randomUUID } from 'crypto';
import { neon, neonConfig } from '@neondatabase/serverless';
import { authenticate, requireAdmin, AuthRequest, cacheControl } from './middleware';
import {
  createSubscriptionSchema,
  updateSubscriptionSchema,
  styleQuizSchema,
  shipOrderSchema,
} from './subscription-validators';
import { logger } from './logger';

neonConfig.fetchConnectionCache = true;

const uuidv4 = randomUUID;

let _sql: ReturnType<typeof neon> | null = null;
async function sql<T = any>(query: string, params?: any[]): Promise<T[]> {
  if (!_sql) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('DATABASE_URL is not set');
    _sql = neon(url);
  }
  return (await _sql.query(query, params || [])) as T[];
}

const router = Router();

// ── Helpers ──
const NUMERIC_FIELDS = ['price', 'amount', 'total'];
function fixNumeric(row: any): any {
  if (!row) return row;
  const r = { ...row };
  for (const f of NUMERIC_FIELDS) {
    if (r[f] !== null && r[f] !== undefined) r[f] = Number(r[f]);
  }
  if (r.features && typeof r.features === 'string') {
    try { r.features = JSON.parse(r.features); } catch {}
  }
  if (r.sizes && typeof r.sizes === 'string') {
    try { r.sizes = JSON.parse(r.sizes); } catch {}
  }
  if (r.items && typeof r.items === 'string') {
    try { r.items = JSON.parse(r.items); } catch {}
  }
  if (r.shipping_address && typeof r.shipping_address === 'string') {
    try { r.shipping_address = JSON.parse(r.shipping_address); } catch {}
  }
  if (r.style_preferences && typeof r.style_preferences === 'string') {
    try { r.style_preferences = JSON.parse(r.style_preferences); } catch {}
  }
  return r;
}
function fixMany(rows: any[]): any[] { return rows.map(fixNumeric); }

// ══════════════════════════════════════════════
//  PUBLIC: Subscription Plans
// ══════════════════════════════════════════════

router.get('/subscription-plans', cacheControl(300), async (_req, res) => {
  try {
    const rows = await sql('SELECT * FROM public.subscription_plans WHERE is_active = true ORDER BY display_order ASC');
    res.json({ success: true, data: fixMany(rows) });
  } catch (err: any) {
    logger.error('Failed to fetch plans', { error: err.message });
    res.status(500).json({ success: false, error: 'Failed to fetch plans' });
  }
});

router.get('/subscription-plans/:slug', cacheControl(300), async (req, res) => {
  try {
    const rows = await sql('SELECT * FROM public.subscription_plans WHERE slug = $1 AND is_active = true', [req.params.slug]);
    if (!rows[0]) return res.status(404).json({ success: false, error: 'Plan not found' });
    res.json({ success: true, data: fixNumeric(rows[0]) });
  } catch (err: any) {
    logger.error('Failed to fetch plan', { error: err.message });
    res.status(500).json({ success: false, error: 'Failed to fetch plan' });
  }
});

// ══════════════════════════════════════════════
//  AUTHENTICATED: Subscriptions
// ══════════════════════════════════════════════

router.post('/subscriptions', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const parsed = createSubscriptionSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.errors[0].message });

    const userId = req.user!.userId;
    const { planId, shippingAddress } = parsed.data;

    // Check plan exists
    const plans = await sql('SELECT * FROM public.subscription_plans WHERE id = $1 AND is_active = true', [planId]);
    if (!plans[0]) return res.status(404).json({ success: false, error: 'Plan not found' });

    // Check no active subscription
    const existing = await sql(
      "SELECT id FROM public.subscriptions WHERE user_id = $1 AND status = 'active' LIMIT 1",
      [userId]
    );
    if (existing[0]) return res.status(409).json({ success: false, error: 'You already have an active subscription' });

    // Get user profile for style preferences
    const quiz = await sql('SELECT * FROM public.style_quizzes WHERE user_id = $1 LIMIT 1', [userId]);

    const now = new Date();
    const nextMonth = new Date(now);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    const id = uuidv4();
    await sql(
      `INSERT INTO public.subscriptions (id, user_id, plan_id, status, shipping_address, style_preferences, current_period_start, current_period_end, next_billing_date)
       VALUES ($1, $2, $3, 'active', $4, $5, $6, $7, $8)`,
      [
        id, userId, planId,
        JSON.stringify(shippingAddress || {}),
        JSON.stringify(quiz[0] ? { sizes: quiz[0].sizes, colors: quiz[0].preferred_colors, styles: quiz[0].preferred_styles } : {}),
        now.toISOString(), nextMonth.toISOString(), nextMonth.toISOString(),
      ]
    );

    const sub = await sql('SELECT * FROM public.subscriptions WHERE id = $1', [id]);
    res.status(201).json({ success: true, data: fixNumeric(sub[0]) });
  } catch (err: any) {
    logger.error('Failed to create subscription', { error: err.message });
    res.status(500).json({ success: false, error: 'Failed to create subscription' });
  }
});

router.get('/subscriptions/mine', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const rows = await sql(
      `SELECT s.*, sp.name as plan_name, sp.slug as plan_slug, sp.price as plan_price, sp.features as plan_features
       FROM public.subscriptions s
       JOIN public.subscription_plans sp ON s.plan_id = sp.id
       WHERE s.user_id = $1
       ORDER BY s.created_at DESC LIMIT 1`,
      [req.user!.userId]
    );
    res.json({ success: true, data: fixMany(rows) });
  } catch (err: any) {
    logger.error('Failed to fetch subscription', { error: err.message });
    res.status(500).json({ success: false, error: 'Failed to fetch subscription' });
  }
});

router.patch('/subscriptions/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const parsed = updateSubscriptionSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.errors[0].message });

    const { id } = req.params;
    const userId = req.user!.userId;

    // Verify ownership or admin
    const existing = await sql('SELECT * FROM public.subscriptions WHERE id = $1', [id]);
    if (!existing[0]) return res.status(404).json({ success: false, error: 'Subscription not found' });
    if (existing[0].user_id !== userId && req.user!.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (parsed.data.status) {
      fields.push(`status = $${idx++}`);
      values.push(parsed.data.status);
      if (parsed.data.status === 'cancelled') {
        fields.push(`cancelled_at = $${idx++}`);
        values.push(new Date().toISOString());
      }
    }
    if (parsed.data.planId) {
      fields.push(`plan_id = $${idx++}`);
      values.push(parsed.data.planId);
    }
    if (parsed.data.shippingAddress) {
      fields.push(`shipping_address = $${idx++}`);
      values.push(JSON.stringify(parsed.data.shippingAddress));
    }
    fields.push(`updated_at = $${idx++}`);
    values.push(new Date().toISOString());
    values.push(id);

    await sql(`UPDATE public.subscriptions SET ${fields.join(', ')} WHERE id = $${idx}`, values);
    const updated = await sql('SELECT * FROM public.subscriptions WHERE id = $1', [id]);
    res.json({ success: true, data: fixNumeric(updated[0]) });
  } catch (err: any) {
    logger.error('Failed to update subscription', { error: err.message });
    res.status(500).json({ success: false, error: 'Failed to update subscription' });
  }
});

router.post('/subscriptions/:id/cancel', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const existing = await sql('SELECT * FROM public.subscriptions WHERE id = $1', [id]);
    if (!existing[0]) return res.status(404).json({ success: false, error: 'Subscription not found' });
    if (existing[0].user_id !== userId && req.user!.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    await sql(
      "UPDATE public.subscriptions SET status = 'cancelled', cancelled_at = $1, updated_at = $1 WHERE id = $2",
      [new Date().toISOString(), id]
    );
    const updated = await sql('SELECT * FROM public.subscriptions WHERE id = $1', [id]);
    res.json({ success: true, data: fixNumeric(updated[0]) });
  } catch (err: any) {
    logger.error('Failed to cancel subscription', { error: err.message });
    res.status(500).json({ success: false, error: 'Failed to cancel subscription' });
  }
});

// ══════════════════════════════════════════════
//  AUTHENTICATED: Style Quiz
// ══════════════════════════════════════════════

router.post('/style-quiz', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const parsed = styleQuizSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.errors[0].message });

    const userId = req.user!.userId;
    const data = parsed.data;

    // Upsert
    const existing = await sql('SELECT id FROM public.style_quizzes WHERE user_id = $1', [userId]);

    if (existing[0]) {
      await sql(
        `UPDATE public.style_quizzes
         SET sizes = $1, preferred_colors = $2, preferred_styles = $3, occasions = $4, notes = $5, completed_at = $6, updated_at = $6
         WHERE user_id = $7`,
        [JSON.stringify(data.sizes || {}), data.preferredColors, data.preferredStyles, data.occasions, data.notes, new Date().toISOString(), userId]
      );
    } else {
      await sql(
        `INSERT INTO public.style_quizzes (id, user_id, sizes, preferred_colors, preferred_styles, occasions, notes, completed_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [uuidv4(), userId, JSON.stringify(data.sizes || {}), data.preferredColors, data.preferredStyles, data.occasions, data.notes, new Date().toISOString()]
      );
    }

    const quiz = await sql('SELECT * FROM public.style_quizzes WHERE user_id = $1', [userId]);
    res.json({ success: true, data: fixNumeric(quiz[0]) });
  } catch (err: any) {
    logger.error('Failed to save quiz', { error: err.message });
    res.status(500).json({ success: false, error: 'Failed to save quiz' });
  }
});

router.get('/style-quiz/mine', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const rows = await sql('SELECT * FROM public.style_quizzes WHERE user_id = $1', [req.user!.userId]);
    res.json({ success: true, data: fixMany(rows) });
  } catch (err: any) {
    logger.error('Failed to fetch quiz', { error: err.message });
    res.status(500).json({ success: false, error: 'Failed to fetch quiz' });
  }
});

// ══════════════════════════════════════════════
//  AUTHENTICATED: Subscription Orders
// ══════════════════════════════════════════════

router.get('/subscription-orders/mine', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const rows = await sql(
      `SELECT so.*, sp.name as plan_name
       FROM public.subscription_orders so
       JOIN public.subscriptions s ON so.subscription_id = s.id
       JOIN public.subscription_plans sp ON s.plan_id = sp.id
       WHERE so.user_id = $1
       ORDER BY so.created_at DESC`,
      [req.user!.userId]
    );
    res.json({ success: true, data: fixMany(rows) });
  } catch (err: any) {
    logger.error('Failed to fetch orders', { error: err.message });
    res.status(500).json({ success: false, error: 'Failed to fetch orders' });
  }
});

router.get('/subscription-orders/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const rows = await sql('SELECT * FROM public.subscription_orders WHERE id = $1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ success: false, error: 'Order not found' });
    if (rows[0].user_id !== req.user!.userId && req.user!.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }
    res.json({ success: true, data: fixNumeric(rows[0]) });
  } catch (err: any) {
    logger.error('Failed to fetch order', { error: err.message });
    res.status(500).json({ success: false, error: 'Failed to fetch order' });
  }
});

// ══════════════════════════════════════════════
//  ADMIN: Subscription Management
// ══════════════════════════════════════════════

router.post('/admin/subscription-orders/:id/ship', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const parsed = shipOrderSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.errors[0].message });

    const { id } = req.params;
    const { trackingNumber } = parsed.data;

    await sql(
      "UPDATE public.subscription_orders SET status = 'shipped', tracking_number = $1, shipped_at = $2, updated_at = $2 WHERE id = $3",
      [trackingNumber || null, new Date().toISOString(), id]
    );
    const updated = await sql('SELECT * FROM public.subscription_orders WHERE id = $1', [id]);
    res.json({ success: true, data: fixNumeric(updated[0]) });
  } catch (err: any) {
    logger.error('Failed to ship order', { error: err.message });
    res.status(500).json({ success: false, error: 'Failed to ship order' });
  }
});

router.get('/admin/subscriptions', authenticate, requireAdmin, async (_req: AuthRequest, res: Response) => {
  try {
    const rows = await sql(
      `SELECT s.*, sp.name as plan_name, sp.price as plan_price, p.display_name, p.email
       FROM public.subscriptions s
       JOIN public.subscription_plans sp ON s.plan_id = sp.id
       LEFT JOIN public.profiles p ON s.user_id = p.user_id
       ORDER BY s.created_at DESC`
    );
    res.json({ success: true, data: fixMany(rows) });
  } catch (err: any) {
    logger.error('Failed to fetch subscriptions', { error: err.message });
    res.status(500).json({ success: false, error: 'Failed to fetch subscriptions' });
  }
});

router.get('/admin/subscription-stats', authenticate, requireAdmin, async (_req: AuthRequest, res: Response) => {
  try {
    const [totalSubs, activeSubs, planBreakdown, revenue] = await Promise.all([
      sql('SELECT COUNT(*)::int as count FROM public.subscriptions'),
      sql("SELECT COUNT(*)::int as count FROM public.subscriptions WHERE status = 'active'"),
      sql(`SELECT sp.name, COUNT(s.id)::int as count
           FROM public.subscription_plans sp
           LEFT JOIN public.subscriptions s ON sp.id = s.plan_id AND s.status = 'active'
           GROUP BY sp.name ORDER BY sp.display_order`),
      sql("SELECT COALESCE(SUM(amount), 0)::numeric as total FROM public.subscription_payments WHERE status = 'succeeded'"),
    ]);
    res.json({
      success: true,
      data: {
        totalSubscriptions: totalSubs[0]?.count || 0,
        activeSubscriptions: activeSubs[0]?.count || 0,
        planBreakdown: fixMany(planBreakdown),
        totalRevenue: Number(revenue[0]?.total || 0),
      },
    });
  } catch (err: any) {
    logger.error('Failed to fetch stats', { error: err.message });
    res.status(500).json({ success: false, error: 'Failed to fetch stats' });
  }
});

export default router;
