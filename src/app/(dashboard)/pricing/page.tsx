import { createClient } from '@/utils/supabase/server';
import PricingClient from './PricingClient';

export default async function PricingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <PricingClient 
      userEmail={user?.email || ''} 
      userId={user?.id || ''} 
    />
  );
}
