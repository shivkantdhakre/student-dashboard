import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: Request) {
  try {
    // 1. Authenticate user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse and validate request body
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { amount, currency = 'INR', receipt = `rcpt_${Date.now()}` } = body;

    if (amount === undefined || typeof amount !== 'number') {
      return NextResponse.json({ error: 'Amount is required and must be a number.' }, { status: 400 });
    }

    if (amount < 100) {
      return NextResponse.json({ error: 'Amount must be at least 100 paise (1 INR).' }, { status: 400 });
    }

    // 3. Resolve Razorpay credentials
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      console.error('Missing Razorpay credentials.');
      return NextResponse.json({ error: 'Order creation configuration error' }, { status: 500 });
    }

    // 4. Initialize Razorpay Client
    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    // 5. Create order in Razorpay
    const order = await razorpay.orders.create({
      amount, // paise
      currency,
      receipt,
      notes: {
        user_id: user.id, // Store caller's user_id in notes to track the payment
      }
    });

    // 6. Return details required by Razorpay checkout form
    return NextResponse.json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error: any) {
    console.error('Razorpay Create Order Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create order' }, { status: 500 });
  }
}
