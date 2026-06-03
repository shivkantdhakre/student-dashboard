import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const signature = req.headers.get('x-razorpay-signature');
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!secret) {
      console.error('Missing RAZORPAY_WEBHOOK_SECRET environment variable.');
      return NextResponse.json({ error: 'Webhook configuration error' }, { status: 500 });
    }

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature header' }, { status: 400 });
    }

    // 1. Verify the signature is genuinely from Razorpay
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');

    if (expectedSignature !== signature) {
      console.error('Signature mismatch in webhook request.');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const event = JSON.parse(body);

    // 2. Handle the Subscription Successful Event
    if (event.event === 'subscription.charged') {
      const subscription = event.payload.subscription.entity;
      const userId = subscription.notes?.user_id;

      if (userId) {
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!serviceRoleKey) {
          console.error('Missing SUPABASE_SERVICE_ROLE_KEY.');
          return NextResponse.json({ error: 'Database service unavailable' }, { status: 500 });
        }

        // Initialize Admin client to bypass RLS and perform database update
        const supabaseAdmin = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          serviceRoleKey
        );

        const { error } = await supabaseAdmin
          .from('profiles')
          .update({ 
            subscription_tier: 'pro',
            razorpay_subscription_id: subscription.id,
            ai_credits_remaining: 1000 // Grant credits on purchase
          })
          .eq('id', userId);

        if (error) {
          console.error('Failed to update user profile in webhook:', error);
          return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
        }
        
        console.log(`Successfully upgraded user ${userId} to Pro tier.`);
      } else {
        console.warn('Subscription webhook payload missing user_id note:', subscription.id);
      }
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: error.message || 'Webhook handler failed' }, { status: 500 });
  }
}
