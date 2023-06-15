import { cloneDeep, defaults, omit } from 'lodash';
import { throwHttpException } from './errors';

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const queuelizeDefaults = { checkInterval: 100, timeout: 60000, step: 0, async: 1 };
export const queuelize =
    async (condition, _execute, config: any = {}) => {
        config = defaults(config, queuelizeDefaults);
        if (!config.params) config.params = {};

        const options = defaults(config._options || {}, { parts: 0, finished: 0, timeSpent: 0 });
        const finish = async () => {
            if (options.finished === options.parts) return true;
            await sleep(config.checkInterval);
            options.timeSpent += config.checkInterval;
            if (config.timeout && options.timeSpent >= config.timeout) {
                return throwHttpException('QUEUELIZE_TIMEOUT');
            }
            return await finish();
        };

        while (condition(config.params)) {
            // makes possible to trigger some items and wait for them to finish
            // before trigger more
            if (config.step > 0 && (options.parts % config.step) === 0) {
                await finish();
                options.timeSpent = 0;
            }

            options.parts++;
            const execute = async (params) => {
                await _execute(params, omit(options, 'params'));
                options.finished++;
            };

            const paramsClone = cloneDeep(config.params);
            // is possible to make the process synchronous
            config.async ? execute(paramsClone) : await execute(paramsClone);
        }

        await finish();
    };
