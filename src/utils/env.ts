let prefix = '';

export const setEnvPrefix = (_prefix) => {
    prefix = _prefix;
};

export const env = (key, _default = '', group = 'DEFAULT') => {
    const values = [];
    if (prefix) values.push(prefix);
    if (group) values.push(group); // .toUpperCase()
    values.push(key);

    const path: string = values.join('_');
    const value = process.env[path] || _default;

    return value;
};
