import fs from 'fs';
import path from 'path';

export default class LanguageManager {
    languageJSON;
    constructor(lang) {
        this.languageJSON = JSON.parse(
            fs.readFileSync(
                path.join('assets', 'lang', lang + '.json'), 'utf8'
            )
        );
    }

    static getAllLanguages() {
        const languages = fs.readdirSync(path.join('assets', 'lang'));
        languages.map(language => {
            const metadata = JSON.parse(
                fs.readFileSync(
                    path.join('assets', 'lang', language), 'utf8'
                )
            ).metadata;
            return {userFacingName: metadata.userFacingName, internalName: metadata.internalName, fileName: path.basename(language)};
        });
    }

    get userFacingName() {
        return this.languageJSON.metadata.userFacingName;
    }
    get internalName() {
        return this.languageJSON.metadata.internalName;
    }

    get(key) {
        return this.languageJSON[key] ?? key;
    }
}