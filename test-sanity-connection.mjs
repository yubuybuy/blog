import { createClient } from '@sanity/client';
import fs from 'fs';
import path from 'path';

const ENV_FILE = './.env.local';
let token = '';

if (fs.existsSync(ENV_FILE)) {
    const content = fs.readFileSync(ENV_FILE, 'utf-8');
    const match = content.match(/SANITY_API_TOKEN=(.*)/);
    if (match) token = match[1].trim();
}

console.log('Using Token:', token.substring(0, 10) + '...');

const client = createClient({
    projectId: 'w7iihdoh',
    dataset: 'production',
    useCdn: false,
    apiVersion: '2024-01-01',
    token: token
});

async function test() {
    try {
        const result = await client.fetch('*[_type == "post"][0...1]');
        console.log('✅ Connection Successful!');
        console.log('Fetched 1 post:', result.length > 0 ? result[0].title : 'No posts found');
    } catch (e) {
        console.error('❌ Connection Failed:', e.message);
    }
}

test();
