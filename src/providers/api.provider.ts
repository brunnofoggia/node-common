import _debug from 'debug';
const debug = _debug('app:ApiProvider');

import axios from 'axios';
import { defaultsDeep } from 'lodash';
import { HttpStatusCode } from 'axios';

import { throwHttpException } from '../utils/errors';
import { sleep } from '../utils';


export class ApiProvider {
    static _sleep = 1000;
    static baseUrl = '';

    static async fetch(options, _retry = 3) {
        if (!this.baseUrl) throwHttpException('api base url not found', HttpStatusCode.BadGateway);
        const url = /^http/.test(options.url) ? options.url : [this.baseUrl, options.url].join('/');

        try {
            return await this._fetch({
                ...options,
                url,
            });
        } catch (error) {
            if (this.retryCheck(error, _retry)) {
                return await this.retryFetch(options, error, _retry);
            }

            const data = typeof error.response?.data === 'object' ? error.response?.data : {};
            const dataStr: any = typeof data === 'object' ? JSON.stringify(data) : error.response?.data || '';
            debug([error.code, error.message || '', dataStr].join(";\n"));
            throwHttpException(error, HttpStatusCode.BadGateway);
        }
    }

    static retryCheck(error, _retry) {
        return error.code === 'ECONNREFUSED' && _retry > 0;
    }

    static async retryFetch(options, error, _retry) {
        await sleep(this._sleep);
        return await this.fetch(options, _retry - 1);
    }

    static async _fetch(_options) {
        const options = defaultsDeep(_options, {
            headers: this.defaultHeaders()
        });

        return await axios(options);
    }

    static defaultHeaders() {
        return {
            'Content-Type': 'application/json'
        };
    }
}
