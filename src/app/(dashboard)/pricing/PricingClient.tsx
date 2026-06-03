'use client';

import { useState } from 'react';
import Script from 'next/script';
import { motion } from 'framer-motion';
import { Loader2, Sparkles, Check, Gem, CreditCard, Coins } from 'lucide-react';
import { usePostHog } from 'posthog-js/react';
import * as Sentry from '@sentry/nextjs';

interface PricingClientProps {
  userEmail: string;
  userId: string;
}

export default function PricingClient({ userEmail, userId }: PricingClientProps) {
  const [isSubProcessing, setIsSubProcessing] = useState(false);
  const [isOneTimeProcessing, setIsOneTimeProcessing] = useState(false);
  const posthog = usePostHog();

  // 1. Handle Subscription Checkout
  const handleSubscribe = async () => {
    setIsSubProcessing(true);
    if (posthog) {
      posthog.capture('checkout_started', { type: 'subscription', price: 49900 });
    }
    
    try {
      const res = await fetch('/api/razorpay/create-subscription', { method: 'POST' });
      const data = await res.json();

      if (!res.ok || !data.subscriptionId) {
        throw new Error(data.error || 'Failed to initiate subscription');
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        subscription_id: data.subscriptionId,
        name: "ACADEMIA AI",
        description: "Pro Tier Upgrade Subscription",
        prefill: {
          email: userEmail,
        },
        notes: {
          user_id: userId,
        },
        theme: {
          color: "#6366f1",
        },
        handler: function () {
          if (posthog) {
            posthog.capture('checkout_completed', { type: 'subscription', price: 49900 });
          }
          alert("Payment Successful! Your subscription is active.");
          window.location.href = '/dashboard';
        },
        modal: {
          ondismiss: function() {
            if (posthog) {
              posthog.capture('checkout_abandoned', { type: 'subscription' });
            }
            setIsSubProcessing(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      
      rzp.on('payment.failed', function (response: any) {
        if (posthog) {
          posthog.capture('checkout_failed', { type: 'subscription', error: response.error.description });
        }
        alert(`Subscription Payment Failed: ${response.error.description}`);
        setIsSubProcessing(false);
      });

      rzp.open();
    } catch (error: any) {
      console.error(error);
      Sentry.captureException(error);
      alert(error.message || "Subscription initialization failed. Please try again.");
      setIsSubProcessing(false);
    }
  };

  // 2. Handle One-Time Credit Pack Checkout
  const handlePurchaseCredits = async () => {
    setIsOneTimeProcessing(true);
    if (posthog) {
      posthog.capture('checkout_started', { type: 'one_time_credits', price: 9900 });
    }

    try {
      // Create order: ₹99 = 9900 paise
      const res = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: 9900, currency: 'INR' }),
      });
      const data = await res.json();

      if (!res.ok || !data.order_id) {
        throw new Error(data.error || 'Failed to initiate credit purchase order');
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: data.amount,
        currency: data.currency,
        name: "ACADEMIA AI",
        description: "100 AI Study Credits Pack",
        order_id: data.order_id,
        prefill: {
          email: userEmail,
        },
        theme: {
          color: "#8b5cf6", // Purple theme for one-time credits
        },
        handler: async function (response: any) {
          try {
            // Verify payment signature
            const verifyRes = await fetch('/api/razorpay/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            const verifyData = await verifyRes.json();

            if (verifyRes.ok && verifyData.success) {
              if (posthog) {
                posthog.capture('checkout_completed', { type: 'one_time_credits', price: 9900 });
              }
              alert(`Payment Verified successfully! 100 credits added to your profile. (New Total: ${verifyData.newCredits} credits)`);
              window.location.reload();
            } else {
              throw new Error(verifyData.error || 'Signature verification failed.');
            }
          } catch (err: any) {
            console.error('Signature verification error:', err);
            Sentry.captureException(err);
            alert(err.message || 'Payment verification failed. Your account details could not be updated.');
          } finally {
            setIsOneTimeProcessing(false);
          }
        },
        modal: {
          ondismiss: function() {
            if (posthog) {
              posthog.capture('checkout_abandoned', { type: 'one_time_credits' });
            }
            setIsOneTimeProcessing(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);

      rzp.on('payment.failed', function (response: any) {
        if (posthog) {
          posthog.capture('checkout_failed', { type: 'one_time_credits', error: response.error.description });
        }
        alert(`Credit Purchase Failed: ${response.error.description}`);
        setIsOneTimeProcessing(false);
      });

      rzp.open();
    } catch (error: any) {
      console.error(error);
      Sentry.captureException(error);
      alert(error.message || "Order initialization failed. Please try again.");
      setIsOneTimeProcessing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10 py-4">
      {/* Dynamic injection of the Razorpay standard script */}
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      {/* Header section */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-400">
          <Gem size={12} /> Pricing Plans
        </div>
        <h2 className="text-3xl font-extrabold text-white md:text-4xl bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent leading-tight">
          Flexible Plans for Any Student
        </h2>
        <p className="text-slate-400 text-sm md:text-base max-w-md mx-auto leading-relaxed">
          Upgrade to recurring subscriptions or choose one-time credit boosts whenever you need.
        </p>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
        
        {/* Card 1: Subscription Tier */}
        <motion.div 
          whileHover={{ y: -4 }}
          transition={{ duration: 0.2 }}
          className="rounded-3xl border border-white/5 bg-[#09090b]/40 backdrop-blur-md p-8 flex flex-col justify-between relative overflow-hidden group shadow-2xl shadow-indigo-950/5 h-full"
        >
          {/* Animated glow */}
          <div className="absolute -inset-px bg-gradient-to-br from-indigo-500/10 via-transparent to-transparent pointer-events-none rounded-3xl group-hover:from-indigo-500/15 transition-all" />
          
          <div className="space-y-6 z-10">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-2xl font-black text-white">Academia Pro</h3>
                  <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] uppercase font-extrabold tracking-wider text-indigo-400">
                    Popular <Sparkles size={8} className="animate-pulse" />
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Subscription Access</p>
              </div>
              <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-indigo-400">
                <CreditCard size={20} />
              </div>
            </div>

            <p className="text-slate-400 text-sm leading-relaxed">
              Unlock unlimited dynamic syllabuses and continuous access to the AI Study Copilot.
            </p>

            <div className="flex items-baseline gap-1 text-white">
              <span className="text-4xl font-black">₹499</span>
              <span className="text-slate-500 text-xs font-semibold">/ month</span>
            </div>

            <div className="border-t border-white/5 my-4" />

            <ul className="space-y-3">
              {[
                'Unlimited AI Study Copilot queries',
                'Generate custom dynamic syllabuses',
                '1000 AI credits automatically refilled monthly',
                'Priority support and faster build times',
              ].map((feature, i) => (
                <li key={i} className="flex items-start gap-2.5 text-xs text-slate-300">
                  <Check size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="pt-8 z-10">
            <button
              onClick={handleSubscribe}
              disabled={isSubProcessing || isOneTimeProcessing}
              className="w-full py-3.5 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/15 disabled:opacity-50 cursor-pointer"
            >
              {isSubProcessing ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>Subscribe Now</span>
                </>
              )}
            </button>
          </div>
        </motion.div>

        {/* Card 2: One-Time Credit Boost */}
        <motion.div 
          whileHover={{ y: -4 }}
          transition={{ duration: 0.2 }}
          className="rounded-3xl border border-white/5 bg-[#09090b]/40 backdrop-blur-md p-8 flex flex-col justify-between relative overflow-hidden group shadow-2xl shadow-purple-950/5 h-full"
        >
          {/* Animated glow */}
          <div className="absolute -inset-px bg-gradient-to-br from-purple-500/10 via-transparent to-transparent pointer-events-none rounded-3xl group-hover:from-purple-500/15 transition-all" />

          <div className="space-y-6 z-10">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-2xl font-black text-white">AI Credit Pack</h3>
                  <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-[10px] uppercase font-extrabold tracking-wider text-purple-400">
                    Boost
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">One-Time Purchase</p>
              </div>
              <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-2xl text-purple-400">
                <Coins size={20} />
              </div>
            </div>

            <p className="text-slate-400 text-sm leading-relaxed">
              Top up your balance instantly without any recurring commitment. Perfect for exam weeks!
            </p>

            <div className="flex items-baseline gap-1 text-white">
              <span className="text-4xl font-black">₹99</span>
              <span className="text-slate-500 text-xs font-semibold">/ single boost</span>
            </div>

            <div className="border-t border-white/5 my-4" />

            <ul className="space-y-3">
              {[
                'Add 100 AI credits directly to balance',
                'Credits never expire and roll over',
                'Instantly usable for all copilot features',
                'No recurring charges or subscriptions',
              ].map((feature, i) => (
                <li key={i} className="flex items-start gap-2.5 text-xs text-slate-300">
                  <Check size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="pt-8 z-10">
            <button
              onClick={handlePurchaseCredits}
              disabled={isSubProcessing || isOneTimeProcessing}
              className="w-full py-3.5 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-purple-500/15 disabled:opacity-50 cursor-pointer"
            >
              {isOneTimeProcessing ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Preparing Order...</span>
                </>
              ) : (
                <>
                  <span>Buy Credits</span>
                </>
              )}
            </button>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
