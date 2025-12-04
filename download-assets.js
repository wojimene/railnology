import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DOWNLOAD_DIR = path.join(__dirname, 'public', 'diagrams');

// Ensure directory exists
if (!fs.existsSync(DOWNLOAD_DIR)){
    fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
}

// ✅ UPDATED: Switched to Unsplash (High Availability CDN) to fix 404 errors
const ASSETS = [
    { 
        name: 'pantograph.jpg', // Changed to jpg as Unsplash provides images
        url: 'https://images.unsplash.com/photo-1555662506-b838b9895198?auto=format&fit=crop&w=800&q=80' 
    },
    { 
        name: 'bogie.jpg', 
        url: 'https://images.unsplash.com/photo-1541427468627-a89a96e5ca1d?auto=format&fit=crop&w=800&q=80' 
    },
    { 
        name: 'cant.jpg', 
        url: 'https://images.unsplash.com/photo-1594322436404-5a0526db4d13?auto=format&fit=crop&w=800&q=80' 
    },
    { 
        name: 'semaphore.jpg', 
        url: 'https://images.unsplash.com/photo-1515165592879-1849b88c601e?auto=format&fit=crop&w=800&q=80' 
    },
    { 
        name: 'fishplate.jpg', 
        url: 'https://images.unsplash.com/photo-1533484218222-8951e287d448?auto=format&fit=crop&w=800&q=80' 
    }
];

const downloadImage = (url, filename) => {
    const filepath = path.join(DOWNLOAD_DIR, filename);
    const file = fs.createWriteStream(filepath);
    
    const options = {
        headers: {
            'User-Agent': 'RailnologyBot/1.0'
        }
    };

    https.get(url, options, (response) => {
        // Handle Redirects
        if (response.statusCode === 301 || response.statusCode === 302) {
            downloadImage(response.headers.location, filename);
            return;
        }

        if (response.statusCode !== 200) {
            console.error(`❌ Failed to download ${filename}: HTTP ${response.statusCode}`);
            file.close();
            fs.unlink(filepath, () => {}); 
            return;
        }

        response.pipe(file);
        file.on('finish', () => {
            file.close();
            const stats = fs.statSync(filepath);
            if (stats.size < 1000) {
                console.warn(`⚠️ Warning: ${filename} is suspicious (${stats.size} bytes).`);
            } else {
                console.log(`✅ Downloaded: ${filename} (${(stats.size/1024).toFixed(1)} KB)`);
            }
        });
    }).on('error', (err) => {
        fs.unlink(filepath, () => {});
        console.error(`❌ Error downloading ${filename}:`, err.message);
    });
};

console.log("⬇️  Starting Asset Download...");
ASSETS.forEach(asset => downloadImage(asset.url, asset.name));