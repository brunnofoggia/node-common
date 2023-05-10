import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { create, idResponse, item } from '../../test/mocks/crud.service.mock';
import { CacheModule } from '@nestjs/common';
import { GenericEntity } from '../entities/generic';
import { TestService } from './crud.service.test';

import { DatabaseModule } from '../../test/src/modules/database/database.module';

describe('Crud Service', () => {
    let service: TestService;
    let repository: any;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [
                DatabaseModule({}),
                TypeOrmModule.forFeature([GenericEntity]),
                CacheModule.register({
                    isGlobal: true
                }),],
            providers: [
                TestService
            ],
        }).compile();

        service = module.get<TestService>(TestService);
        repository = module.get(getRepositoryToken(GenericEntity));
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('count', () => {
        it('should return total of companies', async () => {
            const count = 2;
            jest.spyOn(repository, 'count').mockResolvedValueOnce(count);
            expect(await service.count()).toEqual(count);
        });
    });

    describe('findById', () => {
        it('should return an enterprise', async () => {
            jest.spyOn(repository, 'find').mockResolvedValueOnce([item]);
            expect(await service.findById(idResponse.id)).toEqual(item);
        });
    });

    describe('find (find all)', () => {
        it('should return a list of companies', async () => {
            const result = [item];
            jest.spyOn(repository, 'find').mockResolvedValueOnce(result);
            expect(await service.findAll()).toEqual(result);
        });
        it('should return an empty array', async () => {
            const result = [];
            jest.spyOn(repository, 'find').mockResolvedValueOnce(result);
            expect(await service.findAll()).toEqual(result);
        });
    });

    describe('create', () => {
        it('should return the id', async () => {
            jest.spyOn(repository, 'find').mockResolvedValueOnce([]);
            jest.spyOn(repository, "create").mockImplementationOnce((entity) => {
                return entity;
            });
            jest.spyOn(repository, "save").mockImplementationOnce((entity) => {
                entity['id'] = idResponse.id;
            });
            const result = await service.create(create, {});
            expect(result).toEqual(idResponse);
        });

        it('should return the entity', async () => {
            jest.spyOn(repository, 'find').mockResolvedValueOnce([]);
            jest.spyOn(repository, 'find').mockResolvedValueOnce([create]);
            jest.spyOn(repository, "create").mockImplementationOnce((entity) => {
                return entity;
            });
            jest.spyOn(repository, "save").mockImplementationOnce((entity) => {
                entity['id'] = idResponse.id;
            });
            const result = await service.create(create, { find: 1 });
            expect(result).toEqual(create);
        });

        it('should throw an exception', async () => {
            const error = { code: '999' };

            jest.spyOn(repository, 'find').mockResolvedValueOnce([]);
            jest.spyOn(repository, "create").mockImplementationOnce((entity) => {
                return entity;
            });
            jest.spyOn(repository, 'save').mockImplementationOnce(() => {
                throw error;
            });

            try {
                await service.create(create, {});
            } catch (err) {
                expect(err.code).toEqual(error.code);
            }
        });
    });

    describe('delete', () => {
        it('should return the id', async () => {
            jest.spyOn(repository, 'find').mockResolvedValueOnce([item]);
            jest.spyOn(repository, 'delete').mockResolvedValueOnce(idResponse);
            const result = await service.delete(idResponse.id);

            expect(result).toEqual(idResponse);
        });
        it('should throw an exception', async () => {
            const error = { code: '999' };

            jest.spyOn(repository, 'find').mockResolvedValueOnce([item]);
            jest.spyOn(repository, 'delete').mockImplementation(() => {
                throw error;
            });

            try {
                await service.delete(idResponse.id);
            } catch (err) {
                expect(err.code).toEqual(error.code);
            }
        });
    });

    describe('hide', () => {
        it('should return the id', async () => {
            jest.spyOn(repository, 'find').mockResolvedValueOnce([item]);
            jest.spyOn(repository, 'save').mockResolvedValueOnce(idResponse);
            const result = await service.hide(idResponse.id);

            expect(result).toEqual(idResponse);
        });
    });

});
