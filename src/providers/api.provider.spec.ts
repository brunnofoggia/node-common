import _ from 'lodash';
import { ApiProvider } from './api.provider';
import { reject, request, response } from '../../test/mocks/api.mock';

describe('Api Provider', () => {
    beforeEach(async () => {
        ApiProvider._sleep = 0;
        ApiProvider.baseUrl = 'https://api.com';
    });

    it('execucao do fetch', async () => {
        jest.spyOn(ApiProvider, '_fetch').mockResolvedValueOnce(response);
        expect(await ApiProvider.request(request)).toEqual(response);
    });

    it('1 unica tentativa do fetch', async () => {
        const fetch = _.bind(ApiProvider.request, ApiProvider);
        let c = 0;
        jest.spyOn(ApiProvider, '_fetch').mockResolvedValueOnce(response);
        jest.spyOn(ApiProvider, 'fetch').mockImplementationOnce(async (options) => {
            c++;
            return await fetch(options);
        });

        await ApiProvider.request(request);
        expect(c).toEqual(1);
    });

    it('3 tentativas do fetch', async () => {
        let c = 0;
        jest.spyOn(ApiProvider, '_fetch').mockImplementation((options: any) => {
            options;
            if (++c < 3) return Promise.reject(reject);
            return Promise.resolve(response);
        });
        await ApiProvider.request(request);

        expect(c).toEqual(3);
    });

    it('tentativas esgotadas do fetch', async () => {
        let c = 0;
        jest.spyOn(ApiProvider, '_fetch').mockImplementation((options: any) => {
            options;
            return Promise.reject(reject);
        });

        try {
            await ApiProvider.request(request);
        } catch (err) {
            expect(() => {
                throw err;
            }).toThrowError();
        }
    });
});
