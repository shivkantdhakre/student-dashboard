import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { createClient } from '@/utils/supabase/server';

export async function POST() {
  try {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      console.error('Missing Razorpay credentials.');
      return NextResponse.json({ error: 'Subscription configuration error' }, { status: 500 });
    }

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
    // 1. Authenticate the user via Supabase
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const planId = process.env.RAZORPAY_PLAN_ID;
    if (!planId) {
      console.error('Missing RAZORPAY_PLAN_ID environment variable.');
      return NextResponse.json({ error: 'Subscription configuration error' }, { status: 500 });
    }

    // 2. Create a Razorpay Subscription
    const subscription = await razorpay.subscriptions.create({
      plan_id: planId,
      customer_notify: 1,
      total_count: 12, // Billing cycle count
      notes: {
        user_id: user.id, // Securely embed user_id for identification in webhook
      },
    });

    return NextResponse.json({ 
      subscriptionId: subscription.id,
    });
  } catch (error: any) {
    console.error('Razorpay Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create subscription' }, { status: 500 });
  }
}
