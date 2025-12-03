import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

// Fix for __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DOWNLOAD_DIR = path.join(__dirname, 'public', 'diagrams');

// Ensure directory exists
if (!fs.existsSync(DOWNLOAD_DIR)){
    fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
}

const ASSETS = [
    { 
        name: 'pantograph.gif', 
        url: 'https://upload.wikimedia.org/wikipedia/commons/d/d8/Pantograph_Animation.gif' 
    },
    { 
        name: 'bogie.jpg', 
        url: 'https://upload.wikimedia.org/wikipedia/commons/f/f3/Baureihe_614_Drehgestell.jpg' 
    },
    { 
        name: 'cant.png', 
        url: 'https://upload.wikimedia.org/wikipedia/commons/f/fd/Banked_turn.png' 
    },
    { 
        name: 'semaphore.jpg', 
        url: 'https://upload.wikimedia.org/wikipedia/commons/4/4b/Semaphore_Signal_Stop.jpg' 
    },
    { 
        name: 'fishplate.jpg', 
        url: 'https://upload.wikimedia.org/wikipedia/commons/e/e0/Laschenverbindung.jpg' 
    }
];

const downloadImage = (url, filename) => {
    const file = fs.createWriteStream(path.join(DOWNLOAD_DIR, filename));
    
    https.get(url, (response) => {
        // Handle redirects (Wikimedia often redirects)
        if (response.statusCode === 301 || response.statusCode === 302) {
            downloadImage(response.headers.location, filename);
            return;
        }

        response.pipe(file);
        file.on('finish', () => {
            file.close();
            console.log(`✅ Downloaded: ${filename}`);
        });
    }).on('error', (err) => {
        fs.unlink(filename);
        console.error(`❌ Error downloading ${filename}:`, err.message);
    });
};

console.log("⬇️  Starting Asset Download...");
ASSETS.forEach(asset => downloadImage(asset.url, asset.name));