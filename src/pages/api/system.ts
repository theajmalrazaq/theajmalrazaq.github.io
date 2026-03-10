import type { APIRoute } from 'astro';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);
const BASE_BIN_PATH = '/home/theajmalrazaq/.local/share/omarchy/bin';



export const GET: APIRoute = async ({ url }) => {
    const action = url.searchParams.get('action') || 'scripts';
    const targetPath = url.searchParams.get('path');

    try {
        let responseData;
        let status = 200;

        if (action === 'scripts') {
            const files = await fs.readdir(BASE_BIN_PATH);
            responseData = await Promise.all(
                files
                    .filter(file => file.startsWith('omarchy-'))
                    .map(async file => {
                        const stats = await fs.stat(path.join(BASE_BIN_PATH, file));
                        return { name: file, size: stats.size, mtime: stats.mtime };
                    })
            );
        } else if (action === 'ls' && targetPath) {
            if (!targetPath.startsWith('/home/theajmalrazaq')) {
                return new Response(JSON.stringify({ error: 'Access denied' }), { status: 403 });
            }
            const entries = await fs.readdir(targetPath, { withFileTypes: true });
            responseData = await Promise.all(entries.map(async entry => {
                const fullPath = path.join(targetPath, entry.name);
                const stats = await fs.stat(fullPath);
                return { name: entry.name, kind: entry.isDirectory() ? 'directory' : 'file', size: stats.size, mtime: stats.mtime, path: fullPath };
            }));
        } else if (action === 'read' && targetPath) {
            if (!targetPath.startsWith('/home/theajmalrazaq')) {
                return new Response(JSON.stringify({ error: 'Access denied' }), { status: 403 });
            }
            const content = await fs.readFile(targetPath, 'utf-8');
            responseData = { content };
        } else if (action === 'validate' && targetPath) {
            if (!targetPath.startsWith('/home/theajmalrazaq')) {
                return new Response(JSON.stringify({ exists: false, error: 'Access denied' }), { status: 403 });
            }
            try {
                const stats = await fs.stat(targetPath);
                responseData = { exists: stats.isDirectory(), path: targetPath };
            } catch {
                try {
                    const parentPath = path.dirname(targetPath);
                    const basename = path.basename(targetPath).toLowerCase();
                    const entries = await fs.readdir(parentPath, { withFileTypes: true });
                    const match = entries.find(e => e.isDirectory() && e.name.toLowerCase() === basename);
                    if (match) {
                        const resolvedPath = path.join(parentPath, match.name);
                        responseData = { exists: true, path: resolvedPath };
                    } else {
                        responseData = { exists: false };
                    }
                } catch {
                    responseData = { exists: false };
                }
            }
        } else if (action === 'status' && targetPath) {
            const command = targetPath.replace('omarchy-', '');
            let checkCmd = '';
            switch (command) {
                case 'toggle-idle': checkCmd = 'pgrep -x hypridle >/dev/null && echo "on" || echo "off"'; break;
                case 'toggle-nightlight': checkCmd = "hyprctl hyprsunset temperature 2>/dev/null | grep -oE '[0-9]+' | grep -q '4000' && echo 'on' || echo 'off'"; break;
                case 'toggle-waybar': checkCmd = 'pgrep -x waybar >/dev/null && echo "on" || echo "off"'; break;
                case 'toggle-notification-silencing': checkCmd = "makoctl mode | grep -q 'do-not-disturb' && echo 'on' || echo 'off'"; break;
                case 'toggle-screensaver': checkCmd = '[[ ! -f ~/.local/state/omarchy/toggles/screensaver-off ]] && echo "on" || echo "off"'; break;
                case 'toggle-suspend': checkCmd = '[[ ! -f ~/.local/state/omarchy/toggles/suspend-off ]] && echo "on" || echo "off"'; break;
                case 'toggle-hybrid-gpu': checkCmd = "supergfxctl -g 2>/dev/null | grep -q 'Hybrid' && echo 'on' || echo 'off'"; break;
                case 'gnirehtet': checkCmd = 'pgrep -x gnirehtet >/dev/null && echo "on" || echo "off"'; break;
                default: responseData = { status: 'unknown' };
            }
            if (checkCmd) {
                try {
                    const { stdout } = await execAsync(checkCmd, { shell: '/bin/bash' });
                    responseData = { status: stdout.trim() };
                } catch {
                    responseData = { status: 'off' };
                }
            }
        } else if (action === 'file-proxy' && targetPath) {
            if (!targetPath.startsWith('/home/theajmalrazaq/.cache/elephant')) {
                return new Response(JSON.stringify({ error: 'Access denied' }), { status: 403 });
            }
            try {
                const fileContent = await fs.readFile(targetPath);
                const ext = path.extname(targetPath).toLowerCase();
                const contentType = ext === '.png' ? 'image/png' : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 'application/octet-stream';
                return new Response(new Uint8Array(fileContent), {
                    status: 200,
                    headers: { 'Content-Type': contentType }
                });
            } catch (err) {
                return new Response(JSON.stringify({ error: 'File not found' }), { status: 404 });
            }
        } else if (action === 'clipboard') {
            try {
                const { stdout: listOutput } = await execAsync('elephant query "clipboard;;30;false"').catch(() => ({ stdout: '' }));
                const items = listOutput.split('\n')
                    .filter(line => line.trim().startsWith('item:'))
                    .map(line => {
                        const getField = (field: string) => {
                            const regex = new RegExp(`${field}:"([^"]*)"`);
                            const match = line.match(regex);
                            return match ? match[1].replace(/\\n/g, '\n') : '';
                        };
                        return {
                            id: getField('identifier'),
                            preview: getField('preview') || getField('text'),
                            subtext: getField('subtext'),
                            type: line.match(/preview_type:"file"/) ? 'file' : 'text'
                        };
                    });
                const { stdout: current } = await execAsync('wl-paste -n').catch(() => ({ stdout: '' }));
                responseData = { history: items, current: current.trim(), backend: 'elephant' };
            } catch (e: any) {
                return new Response(JSON.stringify({ error: e.message }), { status: 500 });
            }
        } else {
            return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400 });
        }

        return new Response(JSON.stringify(responseData), {
            status,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
};

export const POST: APIRoute = async ({ request }) => {
    try {
        const body = await request.json();
        const { action = 'bin', command, args = [], cwd = BASE_BIN_PATH } = body;

        if (!command || typeof command !== 'string') {
            return new Response(JSON.stringify({ error: 'Command is required' }), { status: 400 });
        }

        try {
            const stats = await fs.stat(cwd);
            if (!stats.isDirectory()) throw new Error('CWD is not a directory');
        } catch {
            return new Response(JSON.stringify({ success: false, error: `Directory not found: ${cwd}` }), { status: 400 });
        }

        let fullCommand = '';
        if (action === 'bin') {
            if (command.includes('..') || command.includes('/')) {
                return new Response(JSON.stringify({ error: 'Invalid bin command' }), { status: 400 });
            }
            const sanitizedArgs = args.map((arg: any) => typeof arg === 'string' ? `'${arg.replace(/'/g, "'\\''")}'` : arg).join(' ');
            fullCommand = `${BASE_BIN_PATH}/${command} ${sanitizedArgs}`.trim();
        } else if (action === 'exec') {
            fullCommand = command;
        } else {
            return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400 });
        }

        const { stdout, stderr } = await execAsync(fullCommand, { cwd, timeout: 15000 });
        return new Response(JSON.stringify({ success: true, stdout, stderr }), {
            status: 200, headers: { 'Content-Type': 'application/json' }
        });
    } catch (e: any) {
        return new Response(JSON.stringify({
            success: false,
            error: e.message || 'Command failed',
            stdout: e.stdout || '',
            stderr: e.stderr || '',
        }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
};
