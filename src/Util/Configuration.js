import fs from 'fs';

import ImageScrapeConfiguration from '../Class/ImageScrapeConfiguration.js';
import ManifestConfiguration from '../Class/ManifestConfiguration.js';

/**
 * @param {ImageScrapeConfiguration} isConfig 
 * @param {ManifestConfiguration} mfConfig 
 * @param {() => void} cb
 * @returns {(filePath: string) => void}
 */
export function createSaveFunction(isConfig, mfConfig, cb) {
    return (filePath) => {
        filePath += '.json';
        const fileStream = fs.createWriteStream(filePath);
        fileStream.write(JSON.stringify({scrape: isConfig.toJSON(), manifest: mfConfig.toJSON()}), () => {
            fileStream.close();
            cb.call(this);
        });
    }
}
