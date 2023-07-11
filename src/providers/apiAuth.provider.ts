import _debug from 'debug';
const debug = _debug('app:apiAuthProvider');

import _ from 'lodash';
import { HttpStatusCode } from 'axios';

import { ApiProvider } from './api.provider';
import { sleep } from '../utils';

export class ApiAuthProvider extends ApiProvider {
    static authPath = '';
    static authMethod = 'post';

    static authResponseToken(data) {
        return '';
    }

    protected static token = '';

    static isAuthenticated() {
        return !!this.token;
    }

    static isAuthorizing(options) {
        return options.url.indexOf(this.authPath) > this.baseUrl.length;
    }

    static async _request(options) {
        if (!this.isAuthenticated() && !this.isAuthorizing(options)) {
            await this.auth();
        }
        return await super._request(options);
    }

    static async auth() {
        const options = {
            url: this.authPath,
            method: this.authMethod || 'post',
            data: this.authBody(),
        };
        const response = await this.request(options);
        const data = response.data;
        this.token = this.authResponseToken(data);
    }

    protected static authBody() {
        return {};
    }

    protected static authHeaders() {
        return {
            Authorization: 'Bearer ' + this.token,
        };
    }

    static defaultHeaders() {
        let defaultHeaders: any = super.defaultHeaders();
        if (this.isAuthenticated()) {
            defaultHeaders = _.defaultsDeep(defaultHeaders, this.authHeaders());
        }

        return defaultHeaders;
    }

    static retryCheck(error, _retry) {
        return (_retry > 0 && error.code === 'ECONNREFUSED') || error?.response?.status === HttpStatusCode.Unauthorized;
    }

    static async retryRequest(options, error, _retry) {
        await sleep(this._sleep);
        if (error?.response?.status === HttpStatusCode.Unauthorized) {
            await this.auth();
        }
        return await this.request(options, _retry - 1);
    }
}
