/**
 * GET /api/campaigns
 * Returns list of all campaigns
 * 
 * POST /api/campaigns
 * Creates a new campaign
 */

import { supabase } from '@/lib/supabase';

export interface CreateCampaignRequest {
  name: string;
  total_accounts?: number;
}

export interface CreateCampaignResponse {
  success: boolean;
  campaign?: {
    id: string;
    name: string;
    status: string;
    total_accounts: number;
    created_at: string;
  };
  error?: string;
}

export async function GET(): Promise<Response> {
  try {
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return Response.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return Response.json({ success: true, campaigns: data || [] });

  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return Response.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body: CreateCampaignRequest = await request.json();

    if (!body.name || body.name.trim() === '') {
      return Response.json(
        { success: false, error: 'Campaign name is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('campaigns')
      .insert({
        name: body.name.trim(),
        total_accounts: body.total_accounts || 0,
        status: 'draft',
      })
      .select()
      .single();

    if (error) {
      return Response.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return Response.json({ success: true, campaign: data });

  } catch (error) {
    console.error('Error creating campaign:', error);
    return Response.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
