import { version as uuidVersion, validate as uuidValidate } from 'uuid';

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));


export const uuidCheck = (value) => {
    try {
        if (value && uuidValidate(value) && uuidVersion(value) === 4) return true;
    } catch (err) {
        return false;
    }
    return false;
};
