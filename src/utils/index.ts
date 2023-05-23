import { defaults } from 'lodash';
import { throwHttpException } from './errors';

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const parallelizeDefaults = { checkInterval: 100, timeout: 60000, step: 0, async: 1 };
export const parallelize =
    async (condition, _execute, config: any = {}) => {
        config = defaults(config, parallelizeDefaults);
        const options = defaults(config._options || {}, { parts: 0, finished: 0, timeSpent: 0 });
        const finish = async () => {
            if (options.finished === options.parts) return true;
            await sleep(config.checkInterval);
            options.timeSpent += config.checkInterval;
            if (config.timeout && options.timeSpent >= config.timeout) {
                return throwHttpException('PARALLELIZE_TIMEOUT');
            }
            return await finish();
        };

        while (condition()) {
            // makes possible to trigger some items and wait for them to finish
            // before trigger more
            if (config.step > 0 && (options.parts % config.step) === 0) {
                await finish();
                options.timeSpent = 0;
            }

            options.parts++;
            const execute = async () => {
                await _execute(options);
                options.finished++;
            };

            // is possible to make the process synchronous
            config.async ? execute() : await execute();
        }

        await finish();
    };
