import { CACHE_MANAGER, Inject, Injectable, Scope } from '@nestjs/common';
import { Cache } from 'cache-manager';
import CryptoJS from 'crypto-js';

@Injectable({ scope: Scope.TRANSIENT })
export class CacheUtil {
    protected static isCacheActivated = true;

    public static set(activateCache = true) {
        this.isCacheActivated = activateCache;
    }

    @Inject(CACHE_MANAGER) public manager: Cache;
    protected keyPrefix;
    protected ttl: number;

    set(keyPrefix: string, ttl: number) {
        this.keyPrefix = keyPrefix;
        this.ttl = ttl;
    }

    generateKey(methodName: string, id: number | string = '', options: any = {}): string {
        const cacheKey: string[] = [this.keyPrefix, methodName, id + ''];
        cacheKey.push(CryptoJS.MD5(JSON.stringify(options)).toString());

        return cacheKey.join('#');
    }

    async result(cacheKey: string, callback: any, cacheTTL = 0, cacheEmpty = false): Promise<any> {
        if (!CacheUtil.isCacheActivated) return await callback();
        const cache: string = await this.manager.get(cacheKey);

        let result: any = null;
        try {
            result = JSON.parse(cache);
        } catch (err) {
            result = await callback();
            if (cacheEmpty || result) // skip cache on empty result
                await this.manager.set(cacheKey, JSON.stringify(result), { ttl: cacheTTL || this.ttl || 3600 });
        }

        return result;
    }
}
