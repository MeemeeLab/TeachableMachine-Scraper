import terminal from "terminal-kit";
import isValidFilename from 'valid-filename';
import LanguageManager from "./LanguageManager.js";
import ImageScrapeConfiguration from "./ImageScrapeConfiguration.js";
import ManifestConfiguration from "./ManifestConfiguration.js";

export class InterfaceConfiguration {
    terminal;
    lang;
    callbacks;
    
    /**
     * @param {terminal.Terminal} terminal
     * @param {LanguageManager} lang
     * @param {{writeCopyright: Function}} callbacks
     */
    constructor(terminal, lang, callbacks) {
        this.terminal = terminal;
        this.lang = lang;
        this.callbacks = callbacks;
    }

    writeCopyright() {
        this.callbacks.writeCopyright.call(this);
    }

    getLanguageManager() {
        return this.lang;
    }
}

export class MainInterface {
    config;
    term;
    lang;
    callbacks;
    /**
     * @param {InterfaceConfiguration} config
     * @param {{config: Function, scrape: Function, packImage: Function, saveConfig: Function, restoreConfig: Function, exit: Function}} callbacks
     */
    constructor(config, callbacks) {
        this.config = config;
        this.lang = config.getLanguageManager();
        this.term = config.terminal;
        this.callbacks = callbacks;
        this.Init();
    }
    Init() {
        this.term.clear();
        this.config.writeCopyright();
        this.term.white(this.lang.get('MAIN_WHAT_NEXT') + '\n\n');
        this.term.singleColumnMenu([
            this.lang.get('MAIN_EDIT_CONFIG'),
            this.lang.get('MAIN_SCRAPE_IMAGES'),
            this.lang.get('MAIN_PACK_TM'),
            this.lang.get('MAIN_SAVE_CONFIG'),
            this.lang.get('MAIN_LOAD_CONFIG'),
            this.lang.get('MAIN_EXIT')
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
    lang;
    callbacks;
    /**
     * @param {InterfaceConfiguration} config
     * @param {{editConfig: Function, editManifest: Function, back: Function}} callbacks
    */
    constructor(config, callbacks) {
        this.config = config;
        this.lang = config.getLanguageManager();
        this.term = config.terminal;
        this.callbacks = callbacks;
        this.Init();
    }
    Init() {
        this.term.clear();
        this.config.writeCopyright();
        this.term.yellow(this.lang.get('GENERALCONFIGURATION_TITLE') + '\n');
        this.term.singleColumnMenu([
            this.lang.get('GENERALCONFIGURATION_EDIT_CLASSES'),
            this.lang.get('GENERALCONFIGURATION_EDIT_MANIFEST'),
            this.lang.get('BACK')
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
    lang;
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
        this.lang = config.getLanguageManager();
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
                this.imageScrapeConfiguration.addClass(this.lang.get('CLASSESCONFIGURATION_NEW_CLASS_NAME'), 'foo', 'bar');
                this.Init();
            } else this.showConfigOption(response.selectedIndex-1, () => this.Init());
        });
    }
    showConfigOption(configIndex, cb) {
        const classConfig = this.imageScrapeConfiguration.getClass(configIndex);
        this.term.singleLineMenu([
            this.lang.get('CLASSESCONFIGURATION_CLASS_NAME'), 
            this.lang.get('CLASSESCONFIGURATION_CLASS_QUERY'), 
            this.lang.get('CLASSESCONFIGURATION_CLASS_FOLDER'), 
            this.lang.get('CLASSESCONFIGURATION_CLASS_REMOVE'), 
            this.lang.get('DONE')], {y: 2, style: this.term.inverse, selectedStyle: this.term.bgBlack}, async (err, response) => {
            if (err) throw err;
            switch (response.selectedIndex) {
                case 0: 
                    this.term.white('\n' + this.lang.get('CLASSESCONFIGURATION_TYPE_CLASS_NAME'));
                    this.term.inputField({default: classConfig.name}, async (err2, response2) => {
                        if (err2) throw err2;
                        if (!isValidFilename(response2.replace(' ', '-'))) {
                            this.term.eraseLine();
                            this.term.column(0);
                            this.term.red(this.lang.get('CLASSESCONFIGURATION_ERROR_CLASS_NAME_NOT_VALID_FILENAME'));
                            this.term.white(this.lang.get('PRESS_ANY_KEY_TO_CONTINUE'));
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
                    this.term.white('\n' + this.lang.get('CLASSESCONFIGURATION_TYPE_CLASS_QUERY'));
                    this.term.inputField({default: classConfig.query}, (err2, response2) => {
                        if (err2) throw err2;
                        classConfig.query = response2;
                        this.term.eraseLine();
                        this.showConfigOption(configIndex, cb);
                    });
                    break;
                case 2: 
                    this.term.white('\n' + this.lang.get('CLASSESCONFIGURATION_TYPE_CLASS_FOLDER'));
                    this.term.inputField({default: classConfig.folder}, async (err2, response2) => {
                        if (err2) throw err2;
                        if (!isValidFilename(response2)) {
                            this.term.eraseLine();
                            this.term.column(0);
                            this.term.red(this.lang.get('CLASSESCONFIGURATION_ERROR_CLASS_FOLDER_NOT_VALID_FOLDERNAME'));
                            this.term.white(this.lang.get('PRESS_ANY_KEY_TO_CONTINUE'));
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
                        this.term.red('\n' + this.lang.get('CLASSESCONFIGURATION_ERROR_CLASSES_MUST_HAVE_TWO'));
                        this.term.white(this.lang.get('PRESS_ANY_KEY_TO_CONTINUE'));
                        await this.term.waitFor('key');
                        this.term.eraseLine();
                        this.showConfigOption(configIndex, cb);
                        break;
                    }
                    this.term.red(this.lang.get('CLASSESCONFIGURATION_REMOVE_CLASS_CONFIRM_FIRST') + classConfig.name + this.lang.get('CLASSESCONFIGURATION_REMOVE_CLASS_CONFIRM_END'));
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
        options.push(this.lang.get('BACK'));
        this.imageScrapeConfiguration.getClasses().forEach(classConfig => {
            options.push(classConfig.name);
        });
        options.push(this.lang.get('CLASSESCONFIGURATION_CLASS_ADD'));
        return options;
    }
}

export class EditManifestConfigurationInterface {
    config;
    term;
    lang;
    callbacks;
    manifestConfiguration;
    /**
     * @param {InterfaceConfiguration} config
     * @param {{back: Function}} callbacks
     * @param {ManifestConfiguration} manifestConfiguration
    */
    constructor(config, callbacks, manifestConfiguration) {
        this.config = config;
        this.lang = config.getLanguageManager();
        this.term = config.terminal;
        this.callbacks = callbacks;
        this.manifestConfiguration = manifestConfiguration;
        this.Init();
    }
    Init() {
        this.term.clear();
        this.term.singleLineMenu([
            this.lang.get('BACK'), 
            this.lang.get('MANIFESTCONFIGURATION_EPOCHS'), 
            this.lang.get('MANIFESTCONFIGURATION_BATCH_SIZE'), 
            this.lang.get('MANIFESTCONFIGURATION_LEARNING_RATE')], {y: 1, style: this.term.inverse, selectedStyle: this.term.bgBlack}, (err, response) => {
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
                this.term.white('\n' + this.lang.get('MANIFESTCONFIGURATION_TYPE_EPOCHS'));
                this.term.inputField({default: this.manifestConfiguration.epochs.toString()}, async (err, response) => {
                    if (err) throw err;
                    if (isNaN(parseInt(response))) {
                        this.term.eraseLine();
                        this.term.column(0);
                        this.term.red(this.lang.get('MANIFESTCONFIGURATION_ERROR_EPOCHS_NOT_A_NUMBER'));
                        this.term.white(this.lang.get('PRESS_ANY_KEY_TO_CONTINUE'));
                        await this.term.waitFor('key');
                        cb.call(this);
                        return;
                    }
                    this.manifestConfiguration.epochs = parseInt(response);
                    cb.call(this);
                });
                break;
            case 1: // Batch Size
                this.term.white('\n' + this.lang.get('MANIFESTCONFIGURATION_TYPE_BATCH_SIZE'));
                this.term.inputField({default: this.manifestConfiguration.batchSize.toString()}, async (err, response) => {
                    if (err) throw err;
                    if (isNaN(parseInt(response) === NaN)) {
                        this.term.eraseLine();
                        this.term.column(0);
                        this.term.red(this.lang.get('MANIFESTCONFIGURATION_ERROR_BATCH_SIZE_NOT_A_NUMBER'));
                        this.term.white(this.lang.get('PRESS_ANY_KEY_TO_CONTINUE'));
                        await this.term.waitFor('key');
                        cb.call(this);
                        return;
                    }
                    this.manifestConfiguration.batchSize = parseInt(response);
                    cb.call(this);
                });
                break;
            case 2: // Learning Rate
                this.term.white('\n' + this.lang.get('MANIFESTCONFIGURATION_TYPE_LEARNING_RATE'));
                this.term.inputField({default: this.manifestConfiguration.learningRate.toString()}, async (err, response) => {
                    if (err) throw err;
                    if (isNaN(parseFloat(response))) {
                        this.term.eraseLine();
                        this.term.column(0);
                        this.term.red(this.lang.get('MANIFESTCONFIGURATION_ERROR_LEARNING_RATE_NOT_A_NUMBER'));
                        this.term.white(this.lang.get('PRESS_ANY_KEY_TO_CONTINUE'));
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
    lang;
    callbacks;
    /**
     * @param {InterfaceConfiguration} config
     * @param {{save: Function, discard: Function}} callbacks
    */
    constructor(config, callbacks) {
        this.config = config;
        this.lang = config.getLanguageManager();
        this.term = config.terminal;
        this.callbacks = callbacks;
        this.Init();
    }
    Init() {
        this.term.clear();
        this.config.writeCopyright();
        this.term.blue(this.lang.get('CONFIGURATIONNOTSAVED_CHANGES_NOT_SAVED'));
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
    lang;
    callbacks;
    /**
     * @param {InterfaceConfiguration} config
     * @param {{save: (filePath: string) => void, cancel: Function}} callbacks
    */
     constructor(config, callbacks) {
        this.config = config;
        this.lang = config.getLanguageManager();
        this.term = config.terminal;
        this.callbacks = callbacks;
        this.Init();
    }
    Init() {
        this.term.clear();
        this.config.writeCopyright();
        this.term.yellow(this.lang.get('SAVECONFIGURATION_TITLE') + '\n\n');
        this.term.white(this.lang.get('SAVECONFIGURATION_TYPE_FILE_PATH'));
        this.term.fileInput({cancelable: true}, (err, response) => {
            if (err) throw err;
            this.term.clear();
            this.config.writeCopyright();
            this.term.yellow(this.lang.get('SAVECONFIGURATION_SAVE_SCRAPE_CONFIG') + '\n\n');
            this.term.blue(this.lang.get('SAVECONFIGURATION_SAVING'));
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
    lang;
    callbacks;
    /**
     * @param {InterfaceConfiguration} config
     * @param {{load: (filePath: string) => void, cancel: Function}} callbacks
    */
     constructor(config, callbacks) {
        this.config = config;
        this.lang = config.getLanguageManager();
        this.term = config.terminal;
        this.callbacks = callbacks;
        this.Init();
    }
    Init() {
        this.term.clear();
        this.config.writeCopyright();
        this.term.yellow(this.lang.get('LOADCONFIGURATION_TITLE') + '\n\n');
        this.term.white(this.lang.get('LOADCONFIGURATION_TYPE_FILE_PATH'));
        this.term.fileInput({cancelable: true}, (err, response) => {
            if (err) throw err;
            this.term.clear();
            this.config.writeCopyright();
            this.term.yellow(this.lang.get('LOADCONFIGURATION_LOAD_SCRAPE_CONFIG') + '\n\n');
            this.term.blue(this.lang.get('LOADCONFIGURATION_LOADING'));
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
    lang;
    callbacks;
    /**
     * @param {InterfaceConfiguration} config
     * @param {{save: (filePath: string) => void, cancel: Function}} callbacks
    */
     constructor(config, callbacks) {
        this.config = config;
        this.lang = config.getLanguageManager();
        this.term = config.terminal;
        this.callbacks = callbacks;
        this.Init();
    }
    Init() {
        this.term.clear();
        this.config.writeCopyright();
        this.term.yellow(this.lang.get('TMSAVE_TITLE') + '\n\n');
        this.term.white(this.lang.get('TMSAVE_TYPE_FILE_PATH'));
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
