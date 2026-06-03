-- Alter the profiles table to support Razorpay subscription tracking
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS razorpay_customer_id text,
ADD COLUMN IF NOT EXISTS razorpay_subscription_id text;
