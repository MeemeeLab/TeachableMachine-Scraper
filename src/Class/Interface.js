import terminal from "terminal-kit";
import isValidFilename from 'valid-filename';
import ImageScrapeConfiguration from "./ImageScrapeConfiguration.js";
import ManifestConfiguration from "./ManifestConfiguration.js";

export class InterfaceConfiguration {
    terminal;
    callbacks;
    
    /**
     * @param {terminal.Terminal} terminal
     * @param {{writeCopyright: Function}} callbacks
     */
    constructor(terminal, callbacks) {
        this.terminal = terminal;
        this.callbacks = callbacks;
    }

    writeCopyright() {
        this.callbacks.writeCopyright.call(this);
    }
}

export class MainInterface {
    config;
    term;
    callbacks;
    /**
     * @param {InterfaceConfiguration} config
     * @param {{config: Function, scrape: Function, packImage: Function, saveConfig: Function, restoreConfig: Function, exit: Function}} callbacks
     */
    constructor(config, callbacks) {
        this.config = config;
        this.term = config.terminal;
        this.callbacks = callbacks;
        this.Init();
    }
    Init() {
        this.term.clear();
        this.config.writeCopyright();
        this.term.white('What do you want to do next?\n\n');
        this.term.singleColumnMenu([
            'Edit configurations (Classes, Scrape, Manifest)',
            'Scrape images (Start scraping)',
            'Pack images into a tm file',
            'Save configuration',
            'Load configuration',
            'Exit'
        ], (err, response) => {
            if (err) throw err;
            switch (response.selectedIndex) {
                case 0:
                    this.callbacks.config.call(this);
                    break;
                case 1:
                    this.callbacks.scrape.call(this);
                    break;
                case 2:
                    this.callbacks.packImage.call(this);
                    break;
                case 3:
                    this.callbacks.saveConfig.call(this);
                    break;
                case 4:
                    this.callbacks.restoreConfig.call(this);
                    break;
                case 5:
                    this.callbacks.exit.call(this);
                    break;
            }
        });
    }
}

export class GeneralConfigurationInterface {
    config;
    term;
    callbacks;
    /**
     * @param {InterfaceConfiguration} config
     * @param {{editConfig: Function, editManifest: Function, back: Function}} callbacks
    */
    constructor(config, callbacks) {
        this.config = config;
        this.term = config.terminal;
        this.callbacks = callbacks;
        this.Init();
    }
    Init() {
        this.term.clear();
        this.config.writeCopyright();
        this.term.yellow('Scrape Images\n');
        this.term.singleColumnMenu([
            'Edit class configuration (Search query, folder name, etc.)',
            'Edit manifest configuration (Epochs, batch size, etc.)',
            'Back'
        ], (err, response) => {
            if (err) throw err;
            switch (response.selectedIndex) {
                case 0:
                    this.callbacks.editConfig.call(this);
                    break;
                case 1:
                    this.callbacks.editManifest.call(this);
                    break;
                case 2:
                    this.callbacks.back.call(this);
                    break;
            }
        });
    }
}

export class EditClassConfigurationInterface {
    config;
    term;
    callbacks;
    imageScrapeConfiguration;
    /**
     * @param {InterfaceConfiguration} config
     * @param {{back: Function}} callbacks
     * @param {ImageScrapeConfiguration} imageScrapeConfiguration
     * @param 
    */
    constructor(config, callbacks, imageScrapeConfiguration) {
        this.config = config;
        this.term = config.terminal;
        this.callbacks = callbacks;
        this.imageScrapeConfiguration = imageScrapeConfiguration;
        this.Init();
    }
    Init() {
        this.term.clear();
        const options = this._generateMenuOptions();
        this.term.singleLineMenu(options, {y: 1, style: this.term.inverse, selectedStyle: this.term.bgBlack}, (err, response) => {
            if (err) throw err;
            if (response.selectedIndex === 0) {
                this.callbacks.back.call(this);
            } else if (response.selectedIndex === options.length - 1) {
                this.imageScrapeConfiguration.addClass('New Class', 'someclass', 'someclass');
                this.Init();
            } else this.showConfigOption(response.selectedIndex-1, () => this.Init());
        });
    }
    showConfigOption(configIndex, cb) {
        const classConfig = this.imageScrapeConfiguration.getClass(configIndex);
        this.term.singleLineMenu(['Class Name', 'Scrape Query', 'Folder Name', 'Remove Class', 'Done'], {y: 2, style: this.term.inverse, selectedStyle: this.term.bgBlack}, async (err, response) => {
            if (err) throw err;
            switch (response.selectedIndex) {
                case 0: 
                    this.term.white('\nType class name: ');
                    this.term.inputField({default: classConfig.name}, async (err2, response2) => {
                        if (err2) throw err2;
                        if (!isValidFilename(response2.replace(' ', '-'))) {
                            this.term.eraseLine();
                            this.term.column(0);
                            this.term.red('ERROR: Class name must contain valid file name. ');
                            this.term.white('Press any key to continue...');
                            await this.term.waitFor('key');
                            this.term.eraseLine();
                            this.showConfigOption(configIndex, cb);
                            return;
                        }
                        classConfig.name = response2;
                        this.term.eraseLine();
                        this.showConfigOption(configIndex, cb);
                    });
                    break;
                case 1: 
                    this.term.white('\nType scrape query: ');
                    this.term.inputField({default: classConfig.query}, (err2, response2) => {
                        if (err2) throw err2;
                        classConfig.query = response2;
                        this.term.eraseLine();
                        this.showConfigOption(configIndex, cb);
                    });
                    break;
                case 2: 
                    this.term.white('\nType folder name: ');
                    this.term.inputField({default: classConfig.folder}, async (err2, response2) => {
                        if (err2) throw err2;
                        if (!isValidFilename(response2)) {
                            this.term.eraseLine();
                            this.term.column(0);
                            this.term.red('ERROR: Folder name contains character that is not allowed. ');
                            this.term.white('Press any key to continue...');
                            await this.term.waitFor('key');
                            this.term.eraseLine();
                            this.showConfigOption(configIndex, cb);
                            return;
                        }
                        classConfig.folder = response2;
                        this.term.eraseLine();
                        this.showConfigOption(configIndex, cb);
                    });
                    break;
                case 3:
                    if (this.imageScrapeConfiguration.classLength() === 2) {
                        this.term.red('\nClasses must have at least two classes! ');
                        this.term.white('Press any key to continue...');
                        await this.term.waitFor('key');
                        this.term.eraseLine();
                        this.showConfigOption(configIndex, cb);
                        break;
                    }
                    this.term.red('\nYou are about to remove class \'' + classConfig.name + '\'. Are you sure? (y/n)');
                    this.term.yesOrNo({yes: ['y'], no: ['n']}, (err2, response2) => {
                        if (err2) throw err2;
                        this.term.eraseLine();
                        if (response2) {
                            this.imageScrapeConfiguration.removeClass(configIndex);
                            this.Init();
                        } else this.showConfigOption(configIndex, cb);
                    });
                    break;
                case 4:
                    cb.call(this);
                    break;
            }
        });
    }
    _generateMenuOptions() {
        const options = [];
        options.push('Back');
        this.imageScrapeConfiguration.getClasses().forEach(classConfig => {
            options.push(classConfig.name);
        });
        options.push('Add New');
        return options;
    }
}

export class EditManifestConfigurationInterface {
    config;
    term;
    callbacks;
    manifestConfiguration;
    /**
     * @param {InterfaceConfiguration} config
     * @param {{back: Function}} callbacks
     * @param {ManifestConfiguration} manifestConfiguration
    */
    constructor(config, callbacks, manifestConfiguration) {
        this.config = config;
        this.term = config.terminal;
        this.callbacks = callbacks;
        this.manifestConfiguration = manifestConfiguration;
        this.Init();
    }
    Init() {
        this.term.clear();
        this.term.singleLineMenu(['Back', 'Epochs', 'Batch Size', 'Learning Rate'], {y: 1, style: this.term.inverse, selectedStyle: this.term.bgBlack}, (err, response) => {
            if (err) throw err;
            if (response.selectedIndex === 0) {
                this.callbacks.back.call(this);
            } else this.showConfigOption(response.selectedIndex-1, () => this.Init());
        })
    }
    /**
     * @param {number} selectionType 
     * @param {Function} cb 
     */
    showConfigOption(selectionType, cb) {
        switch (selectionType) {
            case 0: // Epochs
                this.term.white('\nType epochs: ');
                this.term.inputField({default: this.manifestConfiguration.epochs.toString()}, async (err, response) => {
                    if (err) throw err;
                    if (isNaN(parseInt(response))) {
                        this.term.eraseLine();
                        this.term.column(0);
                        this.term.red('ERROR: Epochs must be a number. ');
                        this.term.white('Press any key to continue...');
                        await this.term.waitFor('key');
                        cb.call(this);
                        return;
                    }
                    this.manifestConfiguration.epochs = parseInt(response);
                    cb.call(this);
                });
                break;
            case 1: // Batch Size
                this.term.white('\nType batch size: ');
                this.term.inputField({default: this.manifestConfiguration.batchSize.toString()}, async (err, response) => {
                    if (err) throw err;
                    if (isNaN(parseInt(response) === NaN)) {
                        this.term.eraseLine();
                        this.term.column(0);
                        this.term.red('ERROR: Batch size must be a number. ');
                        this.term.white('Press any key to continue...');
                        await this.term.waitFor('key');
                        cb.call(this);
                        return;
                    }
                    this.manifestConfiguration.batchSize = parseInt(response);
                    cb.call(this);
                });
                break;
            case 2: // Learning Rate
                this.term.white('\nType learning rate: ');
                this.term.inputField({default: this.manifestConfiguration.learningRate.toString()}, async (err, response) => {
                    if (err) throw err;
                    if (isNaN(parseFloat(response))) {
                        this.term.eraseLine();
                        this.term.column(0);
                        this.term.red('ERROR: Learning rate must be a number. ');
                        this.term.white('Press any key to continue...');
                        await this.term.waitFor('key');
                        cb.call(this);
                        return;
                    }
                    this.manifestConfiguration.learningRate = parseFloat(response);
                    cb.call(this);
                });
        }
    }
}

export class ConfigurationNotSavedInterface {
    config;
    term;
    callbacks;
    /**
     * @param {InterfaceConfiguration} config
     * @param {{save: Function, discard: Function}} callbacks
    */
    constructor(config, callbacks) {
        this.config = config;
        this.term = config.terminal;
        this.callbacks = callbacks;
        this.Init();
    }
    Init() {
        this.term.clear();
        this.config.writeCopyright();
        this.term.blue('Warning: Changes will not saved automatically. Do you want to save it? (y/n)');
        this.term.yesOrNo({yes: ['y'], no: ['n']}, (err, response) => {
            if (err) throw err;
            if (response) {
                this.callbacks.save.call(this);
            } else {
                this.callbacks.discard.call(this)
            }
        });
    }
}

export class ConfigurationSaveInterface {
    config;
    term;
    callbacks;
    /**
     * @param {InterfaceConfiguration} config
     * @param {{save: (filePath: string) => void, cancel: Function}} callbacks
    */
     constructor(config, callbacks) {
        this.config = config;
        this.term = config.terminal;
        this.callbacks = callbacks;
        this.Init();
    }
    Init() {
        this.term.clear();
        this.config.writeCopyright();
        this.term.yellow('Save scrape configuration\n\n');
        this.term.white('Type file path: ');
        this.term.fileInput({cancelable: true}, (err, response) => {
            if (err) throw err;
            this.term.clear();
            this.config.writeCopyright();
            this.term.yellow('Save scrape configuration\n\n');
            this.term.blue('Saving...');
            if (response === undefined) {
                this.callbacks.cancel.call(this);
                return;
            }
            this.callbacks.save.call(this, response);
        });
    }
}

export class ConfigurationLoadInterface {
    config;
    term;
    callbacks;
    /**
     * @param {InterfaceConfiguration} config
     * @param {{load: (filePath: string) => void, cancel: Function}} callbacks
    */
     constructor(config, callbacks) {
        this.config = config;
        this.term = config.terminal;
        this.callbacks = callbacks;
        this.Init();
    }
    Init() {
        this.term.clear();
        this.config.writeCopyright();
        this.term.yellow('Load scrape configuration\n\n');
        this.term.white('Type file path: ');
        this.term.fileInput({cancelable: true}, (err, response) => {
            if (err) throw err;
            this.term.clear();
            this.config.writeCopyright();
            this.term.yellow('Load scrape configuration\n\n');
            this.term.blue('Loading...');
            if (response === undefined) {
                this.callbacks.cancel.call(this);
                return;
            }
            this.callbacks.load.call(this, response);
        });
    }
}

export class TMSaveInterface {
    config;
    term;
    callbacks;
    /**
     * @param {InterfaceConfiguration} config
     * @param {{save: (filePath: string) => void, cancel: Function}} callbacks
    */
     constructor(config, callbacks) {
        this.config = config;
        this.term = config.terminal;
        this.callbacks = callbacks;
        this.Init();
    }
    Init() {
        this.term.clear();
        this.config.writeCopyright();
        this.term.yellow('Pack images into a tm file\n\n');
        this.term.white('Type file path: ');
        this.term.fileInput({cancelable: true}, (err, response) => {
            if (err) throw err;
            if (response === undefined) {
                this.callbacks.cancel.call(this);
                return;
            }
            this.callbacks.save.call(this, response);
        });
    }
}
