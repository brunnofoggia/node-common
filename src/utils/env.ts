let prefix = '';

export const setEnvPrefix = (_prefix) => {
    prefix = _prefix;
};

export const env = (key, _default = '', group = 'DEFAULT') => {
    const path: string = [prefix, group.toUpperCase(), key].join('_');
    const value = process.env[path] || _default;

    return value;
};
