export default class ManifestConfiguration {
    config;
    /**
     * Initialize with default config
    */
    constructor() {
        this.config = {        
            "type": "image",
            "version": "2.4.4",
            "appdata": {
                "publishResults": {},
                "trainEpochs": 50,
                "trainBatchSize": 16,
                "trainLearningRate": 0.001
            }
        };
    }

    static fromJSON(json) {
        const config = new ManifestConfiguration();
        config.config = json;
        return config;
    }

    get version() {
        return this.config.version;
    }

    get epochs() {
        return this.config.appdata.trainEpochs;
    }
    set epochs(epochs) {
        this.config.appdata.trainEpochs = epochs;
    }

    get batchSize() {
        return this.config.appdata.trainBatchSize;
    }
    set batchSize(batchSize) {
        this.config.appdata.trainBatchSize = batchSize;
    }

    get learningRate() {
        return this.config.appdata.trainLearningRate;
    }
    set learningRate(learningRate) {
        this.config.appdata.trainLearningRate = learningRate;
    }
}

ManifestConfiguration.prototype.toJSON = function () {
    return this.config;
}
