import type { APIRoute } from 'astro';
import { MovieboxSession, search, getMovieDetails, getSeriesDetails, getMovieStreamUrl, getEpisodeStreamUrl } from 'moviebox-js-sdk';

const session = new MovieboxSession({
    host: 'h5.aoneroom.com',
    mirrorHosts: ['h5.aoneroom.com', 'movieboxapp.in', 'h5.moviebox.ph', 'h5.aonerentals.com'],
    retry: {
        maxAttempts: 5,
        delayMs: 1000
    }
});

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');
    const headers = { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
    };

    try {
        switch (action) {
            case 'search': {
                const query = url.searchParams.get('query');
                const type = url.searchParams.get('type') as any; // 'movie' | 'series' | 'all'
                if (!query) return new Response(JSON.stringify({ error: 'Missing query' }), { status: 400, headers });
                const results = await search(session, { query, type: type === 'all' ? undefined : type });
                return new Response(JSON.stringify(results), { status: 200, headers });
            }

            case 'details': {
                const detailPath = url.searchParams.get('path');
                const isSeries = url.searchParams.get('isSeries') === 'true';
                if (!detailPath) return new Response(JSON.stringify({ error: 'Missing path' }), { status: 400, headers });
                
                if (isSeries) {
                    const details = await getSeriesDetails(session, { detailPath });
                    return new Response(JSON.stringify(details), { status: 200, headers });
                } else {
                    const details = await getMovieDetails(session, { detailPath });
                    return new Response(JSON.stringify(details), { status: 200, headers });
                }
            }

            case 'stream': {
                const detailPath = url.searchParams.get('path');
                const isSeries = url.searchParams.get('isSeries') === 'true';
                const season = parseInt(url.searchParams.get('season') || '1');
                const episode = parseInt(url.searchParams.get('episode') || '1');
                
                if (!detailPath) return new Response(JSON.stringify({ error: 'Missing path' }), { status: 400, headers });

                if (isSeries) {
                    const stream = await getEpisodeStreamUrl(session, { detailPath, season, episode, quality: 'best' });
                    return new Response(JSON.stringify(stream), { status: 200, headers });
                } else {
                    const stream = await getMovieStreamUrl(session, { detailPath, quality: 'best' });
                    return new Response(JSON.stringify(stream), { status: 200, headers });
                }
            }

            case 'trending': {
                const results = await search(session, { query: 'trending', type: 'movie' });
                return new Response(JSON.stringify(results), { status: 200, headers });
            }

            default:
                return new Response(JSON.stringify({ error: 'Invalid action', receivedAction: action }), { status: 400, headers });
        }
    } catch (error: any) {
        console.error('Moviebox API Error:', error);
        return new Response(JSON.stringify({ error: error.message || 'API request failed' }), { status: 500, headers });
    }
};
