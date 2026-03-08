import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async () => {
    try {
        const token = import.meta.env.PUBLIC_GITHUB_FEED_TOKEN;
        if (!token) {
            return new Response(JSON.stringify({ error: 'GitHub token missing' }), { status: 500 });
        }

        const response = await fetch(`https://github.com/theajmalrazaq.private.atom?token=${token}`);
        if (!response.ok) throw new Error('Github feed fetch failed');
        
        const xml = await response.text();
        
        // Simple regex-based XML extraction for atom feed
        const entries = [];
        const entryMatches = xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g);
        
        for (const match of entryMatches) {
            const entryXml = match[1];
            
            const id = entryXml.match(/<id>([\s\S]*?)<\/id>/)?.[1];
            const published = entryXml.match(/<published>([\s\S]*?)<\/published>/)?.[1];
            const titleMatch = entryXml.match(/<title[\s\S]*?>([\s\S]*?)<\/title>/);
            const title = titleMatch ? titleMatch[1] : '';
            const content = entryXml.match(/<content[\s\S]*?>([\s\S]*?)<\/content>/)?.[1];
            const link = entryXml.match(/<link[\s\S]*?href="([\s\S]*?)"/)?.[1];
            const thumbnail = entryXml.match(/<media:thumbnail[\s\S]*?url="([\s\S]*?)"/)?.[1];
            const authorName = entryXml.match(/<author>[\s\S]*?<name>([\s\S]*?)<\/name>/)?.[1];

            entries.push({
                id,
                published,
                title: decodeHtml(title || ''),
                content: content, 
                link,
                thumbnail,
                authorName
            });
        }

        return new Response(JSON.stringify(entries.slice(0, 40)), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (e) {
        return new Response(JSON.stringify({ error: String(e) }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};

function decodeHtml(html: string) {
    const map: Record<string, string> = {
        '&amp;': '&',
        '&lt;': '<',
        '&gt;': '>',
        '&quot;': '"',
        '&#39;': "'"
    };
    return html.replace(/(&amp;|&lt;|&gt;|&quot;|&#39;)/g, m => map[m]);
}
