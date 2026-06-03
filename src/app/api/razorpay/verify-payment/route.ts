import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient as createSupabaseServerClient } from '@/utils/supabase/server';
import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    // 1. Authenticate the calling user
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse request parameters
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = body;

    // 3. Validate missing fields
    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return NextResponse.json({ error: 'Missing required signature verification fields.' }, { status: 400 });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      console.error('Missing RAZORPAY_KEY_SECRET environment variable.');
      return NextResponse.json({ error: 'Verification configuration error' }, { status: 500 });
    }

    // 4. Verify signature cryptographically using HMAC-SHA256
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      console.error('Signature verification failed.');
      return NextResponse.json({ error: 'Payment verification failed. Invalid signature.' }, { status: 400 });
    }

    // 5. Upgrade user's credits in database using Admin client (bypassing RLS)
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      console.error('Missing SUPABASE_SERVICE_ROLE_KEY.');
      return NextResponse.json({ error: 'Database service unavailable' }, { status: 500 });
    }

    const supabaseAdmin = createSupabaseAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey
    );

    // Idempotency check: attempt to record this order. If it fails with PG code 23505 (unique violation),
    // it means this order has already been successfully processed and credited.
    const { error: insertOrderError } = await supabaseAdmin
      .from('processed_orders')
      .insert({
        order_id: razorpay_order_id,
        user_id: user.id,
        payment_id: razorpay_payment_id,
      });

    if (insertOrderError) {
      if (insertOrderError.code === '23505') {
        console.warn(`Replay attack or duplicate processing prevented for order_id: ${razorpay_order_id}`);
        return NextResponse.json({ error: 'This payment order has already been processed.' }, { status: 409 });
      }
      console.error('Failed to record processed order:', insertOrderError);
      return NextResponse.json({ error: 'Failed to record transaction' }, { status: 500 });
    }

    // Atomically increment user credits and retrieve the new balance
    const { data: newCredits, error: rpcError } = await supabaseAdmin.rpc('increment_credits', {
      user_id: user.id,
      amount: 100,
    });

    if (rpcError) {
      console.error('Failed to increment credits in verification RPC:', rpcError);
      return NextResponse.json({ error: 'Failed to apply credits' }, { status: 500 });
    }

    console.log(`Successfully verified payment for user ${user.id} and added 100 credits (New Total: ${newCredits}).`);

    return NextResponse.json({ success: true, newCredits });
  } catch (error: any) {
    console.error('Verification handler error:', error);
    return NextResponse.json({ error: error.message || 'Verification handler failed' }, { status: 500 });
  }
}
