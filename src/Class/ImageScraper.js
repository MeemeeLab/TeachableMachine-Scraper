import path from 'path';
import fs from 'fs';
import events from 'events';
import ImagesScraper from 'images-scraper';
import fetch from 'node-fetch';

export default class ImageScraper {
    query;
    folderPath;
    log;
    updateProgress;

    scraper;

    /**
     * Create new ImageScraper instance
     * @param {string} query query to search for
     * @param {string} folderPath folder to save images to
     * @param {(str: string) => void} log function to log to
     * @param {(percentage: number) => void} updateProgress function to log progress
     * @param {ImagesScraper.ScraperOptions|undefined} scraperOptions scraper options
     */
    constructor(query, folderPath, log, updateProgress, scraperOptions) {
        this.query = query;
        this.folderPath = folderPath;
        this.log = log;
        this.updateProgress = updateProgress;
        this.scraper = new ImagesScraper(scraperOptions);
    }
    async scrape() {
        const abortController = new AbortController();
        events.setMaxListeners(Infinity, abortController.signal); // Prevent memory leak warning
        let progress = 0;
        let totalProgress = -1;
        const fetches = [];
        await this.scraper.scrape(this.query, Infinity).then(res => {
            totalProgress = res.length;
            res.forEach(elem => {
                if (!elem.url) {
                    return;
                }
                const imgNo = fetches.length;
                fetches.push(
                    new Promise(resolve => {
                        fetch(elem.url, {signal: abortController.signal})
                            .then(async res => {
                                let extname = '';
                                // Try to detect file extension from content-type
                                const contentType = res.headers.get('content-type');
                                if (contentType) {
                                    const mimeType = contentType.split('/');
                                    if (mimeType[0] !== 'image')
                                        throw new Error('Not an image');
                                    extname = mimeType[1].split(';')[0];
                                } else {
                                    extname = path.extname(elem.url).split('?')[0].split('#')[0].split('&')[0].split(';')[0].split(',')[0];
                                }
                                if (extname.length === 0) {
                                    throw new Error('Could not detect file extension');
                                }
                                const saveTo = path.join(this.folderPath, imgNo + '.' + extname);
                                const stream = fs.createWriteStream(saveTo)
                                stream.write(Buffer.from(await res.arrayBuffer()), () => {
                                    stream.close();
                                    this.log(`Downloaded to \'${saveTo}\'`);
                                    progress++;
                                    this.updateProgress(progress / totalProgress);
                                    resolve();
                                });
                            })
                            .catch(err => {
                                this.log('Error while downloading from \'' + elem.url + '\': ' + err.message);
                                progress++;
                                this.updateProgress(progress / totalProgress);
                                resolve();
                            })
                    })
                );
            });
        });
        const timeout = setTimeout(() => {
            abortController.abort();
        }, 10000);
        await Promise.all(fetches);
        clearTimeout(timeout);
    }
}
