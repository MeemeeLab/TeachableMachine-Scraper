export default class ImageScrapeConfiguration {
    config;
    /**
     * Initialize with empty config
     */
    constructor() {
        this.config = {
            classes: [
                {
                    name: 'Class 1',
                    query: 'cat',
                    folder: 'cat'
                },
                {
                    name: 'Class 2',
                    query: 'dog',
                    folder: 'dog'
                }
            ],
        }
    }

    static fromJSON(json) {
        const config = new ImageScrapeConfiguration();
        config.config = json;
        return config;
    }

    getClasses() {
        return this.config.classes;
    }

    getClass(index) {
        return this.config.classes[index];
    }

    classLength() {
        return this.config.classes.length;
    }

    addClass(name, query, folder) {
        this.config.classes.push({
            name: name,
            query: query,
            folder: folder
        });
    }

    editClass(index, name, query, folder) {
        this.config.classes[index] = {
            name: name,
            query: query,
            folder: folder
        };
    }

    removeClass(index) {
        this.config.classes.splice(index, 1);
    }

    getClassIndexByName(name) {
        return this.config.classes.findIndex(c => c.name === name);
    }
}

ImageScrapeConfiguration.prototype.toJSON = function () {
    return this.config;
}
