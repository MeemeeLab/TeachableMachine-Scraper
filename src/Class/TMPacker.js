import os from 'os';
import fs from 'fs';
import path from 'path';

import canvas from 'canvas';

import ImageScrapeConfiguration from './ImageScrapeConfiguration.js';
import ManifestConfiguration from './ManifestConfiguration.js';

import { cropTo } from '../Util/Canvas.js';
import archiver from 'archiver';

export default class TMPacker {
    isConfig;
    mfConfig;

    tempFolder;

    /**
     * Create a new TMPacker instance
     * @param {ImageScrapeConfiguration} isConfig
     * @param {ManifestConfiguration} mfConfig
     */
    constructor(isConfig, mfConfig) {
        this.isConfig = isConfig;
        this.mfConfig = mfConfig;
        this.tempFolder = fs.mkdtempSync(path.join(os.tmpdir(), 'tm-scraper-'));
    }
    /**
     * Pack the images in the given folder to tm folder structure
     * @param {(percentage: number) => void} updateProgress
     * @param {(str: string) => void} log
     */
    async pack(updateProgress, log) {
        const toCropAndCopy = {};

        this.isConfig.getClasses().forEach(classConfig => {
            const actualPath = path.join('./out', classConfig.folder);
            fs.readdirSync(actualPath).forEach((file, index) => {
                const from = path.join(actualPath, file);
                const to = path.join(this.tempFolder, `${classConfig.name}-!-${index}.jpg`);
                toCropAndCopy[from] = to;
            });
        });

        const total = Object.keys(toCropAndCopy).length;
        let progress = 0;

        for (const from in toCropAndCopy) {
            const to = toCropAndCopy[from];
            let imageCanvas;
            try {
                imageCanvas = await canvas.loadImage(from);
            } catch (e) {
                log(`Could not load image ${from}`);
                continue;
            }
            const croppedCanvas = cropTo(imageCanvas, 224, false); // Resize to 224x224 (Teachable Machine input size)
            fs.writeFileSync(to, croppedCanvas.toBuffer("image/jpeg"), {flag: ''});
            progress++;
            updateProgress(progress / total);
        }

        // Manifest
        fs.writeFileSync(path.join(this.tempFolder, 'manifest.json'), JSON.stringify(this.mfConfig.toJSON()), {encoding: "utf-8"});
    }
    /**
     * Archive tm folder structure to a file and save it to the given path
     * @param {string} filePath 
     */
    saveTo(filePath) {
        const tmFileStream = fs.createWriteStream(filePath);
        const archive = archiver('zip', {
            store: true
        });
        archive.pipe(tmFileStream);
        archive.directory(this.tempFolder, false);
        archive.finalize();
        return new Promise(resolve => tmFileStream.on('close', () => resolve()));
    }

    dispose() {
        fs.rmdirSync(this.tempFolder, {recursive: true});
    }
}
