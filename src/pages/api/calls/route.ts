/**
 * GET /api/calls
 * Returns calls with optional filters
 * Query params: campaign_id, outcome, status, search
 * 
 * Returns paginated results (20 per page)
 */

import { supabase } from '@/lib/supabase';

export interface CallsQueryParams {
  campaign_id?: string;
  outcome?: string;
  status?: string;
  search?: string;
  page?: string;
}

export async function GET(request: Request): Promise<Response> {
  try {
    const { searchParams } = new URL(request.url);
    
    const campaign_id = searchParams.get('campaign_id') || undefined;
    const outcome = searchParams.get('outcome') || undefined;
    const status = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = 20;

    let query = supabase
      .from('calls')
      .select('*, borrower:borrowers(*)', { count: 'exact' });

    if (campaign_id) {
      query = query.eq('campaign_id', campaign_id);
    }

    if (outcome && outcome !== 'all') {
      query = query.eq('outcome', outcome);
    }

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    // Apply pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query.order('created_at', { ascending: true });

    if (error) {
      return Response.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Client-side search if provided
    let filteredData = data || [];
    if (search) {
      const searchLower = search.toLowerCase();
      filteredData = filteredData.filter((call: any) =>
        call.borrower?.name?.toLowerCase().includes(searchLower) ||
        call.borrower?.phone?.includes(search)
      );
    }

    return Response.json({
      success: true,
      calls: filteredData,
      pagination: {
        page,
        page_size: pageSize,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / pageSize),
      },
    });

  } catch (error) {
    console.error('Error fetching calls:', error);
    return Response.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
