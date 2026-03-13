import type { APIRoute } from 'astro';
import { execSync, exec } from 'child_process';



const run = (cmd: string) => {
    try {
        return execSync(cmd, { encoding: 'utf8' }).trim();
    } catch (e) {
        return null;
    }
};

const asyncRun = (cmd: string) => {
    exec(`setsid ${cmd}`, (error) => {
        if (error) console.error(`Async execution error: ${error}`);
    });
};

export const GET: APIRoute = async () => {
    const active = run('playerctl -p spotify status');
    if (!active) {
        return new Response(JSON.stringify({ active: false }), { 
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const title = run('playerctl -p spotify metadata title');
        const artist = run('playerctl -p spotify metadata artist');
        const lengthMicro = run('playerctl -p spotify metadata mpris:length');
        const position = run('playerctl -p spotify position');
        let artUrl = run('playerctl -p spotify metadata mpris:artUrl');

        // Convert microseconds to seconds
        const length = lengthMicro ? parseFloat(lengthMicro) / 1000000 : 0;

        // Handle file-based album art
        if (artUrl?.startsWith('file://')) {
            artUrl = null;
        }

        return new Response(JSON.stringify({
            active: true,
            isPlaying: active === 'Playing',
            position: position ? parseFloat(position) : 0,
            duration: length,
            track: {
                title: title || 'Watching Spotify...',
                artist: artist || 'Linux Player',
                artUrl: artUrl || null
            }
        }), { 
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (e) {
        return new Response(JSON.stringify({ active: true, isPlaying: active === 'Playing', track: null }), { 
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};

export const POST: APIRoute = async ({ request, url }) => {
    let command = url.searchParams.get('command') || '';
    
    if (!command) {
        const text = await request.text();
        try {
            const body = JSON.parse(text);
            command = body.command;
        } catch (e) {
            // Keep empty
        }
    }

    if (!command) {
        return new Response(JSON.stringify({ success: false, error: 'No command' }), { 
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        if (command === 'playpause') {
            const status = run('playerctl -p spotify status');
            if (!status) {
                asyncRun('sh -c "spotify & sleep 1.5 && hyprctl dispatch movetoworkspacesilent special,class:spotify && sleep 1 && playerctl -p spotify play-pause"');
            } else {
                run('playerctl -p spotify play-pause');
            }
        }
        else if (command === 'next') run('playerctl -p spotify next');
        else if (command === 'prev') run('playerctl -p spotify previous');
        else if (command === 'pause') run('playerctl -p spotify pause');
        else if (command === 'play') run('playerctl -p spotify play');
        else if (command === 'open') {
            asyncRun('sh -c "spotify & sleep 1.5 && hyprctl dispatch movetoworkspacesilent special,class:spotify"');
        }

        return new Response(JSON.stringify({ success: true, command }), { 
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (e) {
        return new Response(JSON.stringify({ success: false, error: String(e) }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
