import fs from 'fs';
import path from 'path';

import terminal from 'terminal-kit';

import ImageScraper from './Class/ImageScraper.js';
import TMPacker from './Class/TMPacker.js';

import LanguageManager from './Class/LanguageManager.js';

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
    TMSaveInterface,
    LanguageConfigurationInterface
} from './Class/Interface.js';

import { createSaveFunction } from './Util/Configuration.js';

terminal.terminal('Please wait while teachablemachine-scraper is loading...');

if (!fs.existsSync('./out')) {
    fs.mkdirSync('./out');
}

let languageManager = new LanguageManager('EN_US');

let config = new InterfaceConfiguration(terminal.terminal, languageManager, {
    writeCopyright: function () {
        this.terminal.white(languageManager.get('APP_PRODUCT_NAME') + ' ' + languageManager.get('APP_VERSION') + '\n');
        this.terminal.white(languageManager.get('AUTHOR_TEXT')).green(languageManager.get('AUTHOR')).white('\n\n');
    }
});

let isConfig = new ImageScrapeConfiguration();
let mfConfig = new ManifestConfiguration();

let mainInterface = new MainInterface(config, {
    langConfig: () => {
        new LanguageConfigurationInterface(config, {
            changeLang: (lang) => {
                languageManager = new LanguageManager(lang);
                config = new InterfaceConfiguration(terminal.terminal, languageManager, config.callbacks);
                mainInterface = new MainInterface(config, mainInterface.callbacks);
            }
        });
    },
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
        terminal.terminal.yellow(languageManager.get('SCRAPING_STARTED') + '\n');
        terminal.terminal.white(languageManager.get('SCRAPING_INFO_FIRST')).green(classes.length).white(languageManager.get('SCRAPING_INFO_END') + '\n');
        for (let i = 0; i < classes.length; i++) {
            const classConfig = classes[i];
            const actualPath = path.join('./out', classConfig.folder);
            if (!fs.existsSync(actualPath))
                fs.mkdirSync(actualPath);
            const progressBar = terminal.terminal.progressBar({title: languageManager.get('SCRAPING_PROGRESS_FIRST') + classConfig.name, eta: false, percent: true, y: terminal.terminal.height});
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
        terminal.terminal.green(languageManager.get('SCRAPING_FINISHED') + '\n');
        terminal.terminal.yellow(languageManager.get('SCRAPING_REMOVE_FOR_ACCURACY') + '\n');
        terminal.terminal.white(languageManager.get('PRESS_ANY_KEY_TO_CONTINUE'));
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
                terminal.terminal.yellow(languageManager.get('PACKING_STARTED') + '\n');
                const progressBar = terminal.terminal.progressBar({title: languageManager.get('PACKING_PACKING'), eta: false, percent: true, y: terminal.terminal.height, syncMode: true});
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
                    terminal.terminal.green(languageManager.get('PACKING_FINISHED') + '\n');
                    packer.saveTo(filePath).then(async () => {
                        terminal.terminal.green(languageManager.get('PACKING_SAVED') + '\n');
                        packer.dispose();
                        terminal.terminal.white(languageManager.get('PRESS_ANY_KEY_TO_CONTINUE'));
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
            save: createSaveFunction(isConfig, mfConfig, () => mainInterface.Init())
        });
    },
    restoreConfig: () => {
        new ConfigurationLoadInterface(config, {
            cancel: () => {
                mainInterface.Init();
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
                terminal.terminal.white(languageManager.get('EXIT'));
                process.exit(0);
            },
            save: () => {
                new ConfigurationSaveInterface(config, {
                    cancel: () => {
                        mainInterface.Init();
                    },
                    save: createSaveFunction(isConfig, mfConfig, () => {
                        terminal.terminal.clear();
                        terminal.terminal.green(languageManager.get('CONFIG_SAVED') + '\n');
                        terminal.terminal.white(languageManager.get('EXIT'));
                        process.exit(0);
                    })
                });
            }
        });
    }
});
