import fs from 'fs/promises';

export async function ensureDirectories() {
    const dirs = ['./memories', './journals'];
    
    for (const dir of dirs) {
        try {
            await fs.access(dir);
        } catch {
            await fs.mkdir(dir, { recursive: true });
        }
    }
}