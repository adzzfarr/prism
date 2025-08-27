import crypto from 'crypto';

export function buildMerkleRoot(items: string[]) {
    if (items.length === 0) return '';

    let level = items.map(item => crypto.createHash('sha256').update(item).digest('hex'));

    while (level.length > 1) {
        const next: string[] = [];

        for (let i = 0; i < level.length; i += 2) {
            if (i + 1 === level.length) {
                next.push(level[i])
            } else {
                next.push(crypto.createHash('sha256').update(level[i] + level[i + 1]).digest('hex'));
            }
        } 
        
        level = next;
    }

    return level[0];
}