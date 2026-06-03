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

    // Fetch existing credits
    const { data: profile, error: fetchError } = await supabaseAdmin
      .from('profiles')
      .select('ai_credits_remaining')
      .eq('id', user.id)
      .single();

    if (fetchError || !profile) {
      console.error('Failed to fetch profile in verification:', fetchError);
      return NextResponse.json({ error: 'Profile not found' }, { status: 500 });
    }

    const currentCredits = profile.ai_credits_remaining ?? 0;
    const newCredits = currentCredits + 100; // Add 100 credits for one-time pack purchase

    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ 
        ai_credits_remaining: newCredits 
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Failed to update credits in verification:', updateError);
      return NextResponse.json({ error: 'Failed to apply credits' }, { status: 500 });
    }

    console.log(`Successfully verified payment for user ${user.id} and added 100 credits.`);

    return NextResponse.json({ success: true, newCredits });
  } catch (error: any) {
    console.error('Verification handler error:', error);
    return NextResponse.json({ error: error.message || 'Verification handler failed' }, { status: 500 });
  }
}
