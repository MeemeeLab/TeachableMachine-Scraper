import fs from 'fs';
import path from 'path';

import terminal from 'terminal-kit';

import ImageScraper from './Class/ImageScraper.js';
import TMPacker from './Class/TMPacker.js';

import ImageScrapeConfiguration from './Class/ImageScrapeConfiguration.js';
import ManifestConfiguration from './Class/ManifestConfiguration.js';

import { 
    InterfaceConfiguration, 
    MainInterface, 
    GeneralConfigurationInterface, 
    EditClassConfigurationInterface, 
    EditManifestConfigurationInterface, 
    ConfigurationSaveInterface,
    ConfigurationNotSavedInterface,
    ConfigurationLoadInterface,
    TMSaveInterface
} from './Class/Interface.js';

import { createSaveFunction } from './Util/Configuration.js';

if (!fs.existsSync('./out')) {
    fs.mkdirSync('./out');
}

const config = new InterfaceConfiguration(terminal.terminal, {
    writeCopyright: function () {
        this.terminal.white('TeachableMachine-Scraper v1.0.0\n');
        this.terminal.white('Author: ').green('@MeemeeLab').white('\n\n');
    }
});

let isConfig = new ImageScrapeConfiguration();
let mfConfig = new ManifestConfiguration();

const mainInterface = new MainInterface(config, {
    config: () => {
        const imageScrapeInterface = new GeneralConfigurationInterface(config, {
            editConfig: () => {
                new EditClassConfigurationInterface(config, {
                    back: () => {
                        imageScrapeInterface.Init();
                    }
                }, isConfig);
            },
            editManifest: () => {
                new EditManifestConfigurationInterface(config, {
                    back: () => {
                        imageScrapeInterface.Init();
                    }
                }, mfConfig);
            },
            back: () => {
                mainInterface.Init();
            }
        });
    },
    scrape: async () => {
        const classes = isConfig.getClasses();
        terminal.terminal.clear();
        config.writeCopyright();
        terminal.terminal.yellow('Scraping started; this may take a while...\n');
        terminal.terminal.white('Will scrape ').green(classes.length).white(' classes.\n');
        for (let i = 0; i < classes.length; i++) {
            const classConfig = classes[i];
            const actualPath = path.join('./out', classConfig.folder);
            if (!fs.existsSync(actualPath))
                fs.mkdirSync(actualPath);
            const progressBar = terminal.terminal.progressBar({title: 'Scraping ' + classConfig.name, eta: false, percent: true, y: terminal.terminal.height});
            const imageScraper = new ImageScraper(
                classConfig.query, 
                actualPath,
                (str) => {
                    terminal.terminal.eraseLine();
                    terminal.terminal.white(str + '\n');
                    progressBar.update(null);
                },
                (progress) => {
                    progressBar.update(progress);
                },
                {
                    puppeteer: {
                        headless: false
                    }
                }
            );
            await imageScraper.scrape();
            progressBar.stop();
            terminal.terminal.white('\n');
        }
        terminal.terminal.green('Scraping finished.\n');
        terminal.terminal.yellow('You can now view the images in the out folder.\nYou should remove unrelated images before packing to tm file for more accuracy.\n');
        terminal.terminal.white('Press any key to continue...');
        await terminal.terminal.waitFor('key');
        mainInterface.Init();
    },
    packImage: async () => {
        new TMSaveInterface(config, {
            cancel: () => {
                mainInterface.Init();
            },
            save: (filePath) => {
                filePath += '.tm';
                terminal.terminal.clear();
                config.writeCopyright();
                terminal.terminal.yellow('Packing started\n');
                const progressBar = terminal.terminal.progressBar({title: 'Packing', eta: false, percent: true, y: terminal.terminal.height, syncMode: true});
                const packer = new TMPacker(isConfig, mfConfig);
                packer.pack((progress) => {
                    progressBar.update(progress);
                }, (str) => {
                    terminal.terminal.eraseLine();
                    terminal.terminal.white(str + '\n');
                    progressBar.update(null);
                }).then(() => {
                    progressBar.update(1);
                    progressBar.stop();
                    terminal.terminal.green('Packing finished.\n');
                    packer.saveTo(filePath).then(async () => {
                        terminal.terminal.green('Successfully saved to file.\n');
                        terminal.terminal.white('Press any key to continue...');
                        await terminal.terminal.waitFor('key');
                        mainInterface.Init();
                    });
                });
            }
        });
    },
    saveConfig: () => {
        new ConfigurationSaveInterface(config, {
            cancel: () => {
                mainInterface.Init();
            },
            save: createSaveFunction(isConfig, mfConfig, imageScrapeInterface.Init)
        });
    },
    restoreConfig: () => {
        new ConfigurationLoadInterface(config, {
            cancel: () => {
                imageScrapeInterface.Init();
            },
            load: (filePath) => {
                const json = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                isConfig = ImageScrapeConfiguration.fromJSON(json.scrape);
                mfConfig = ManifestConfiguration.fromJSON(json.manifest);
                mainInterface.Init();
            }
        });
    },
    exit: () => {
        new ConfigurationNotSavedInterface(config, {
            discard: () => {
                terminal.terminal.clear();
                terminal.terminal.white('Bye!\n');
                process.exit(0);
            },
            save: () => {
                new ConfigurationSaveInterface(config, {
                    cancel: () => {
                        mainInterface.Init();
                    },
                    save: createSaveFunction(isConfig, mfConfig, () => {
                        terminal.terminal.clear();
                        terminal.terminal.green('Successfully saved configuration.\n');
                        terminal.terminal.white('Bye!\n');
                        process.exit(0);
                    })
                });
            }
        });
    }
});
