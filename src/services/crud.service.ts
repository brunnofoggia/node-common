import { HttpException, HttpStatus } from '@nestjs/common';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import _ from 'lodash';
import { IdInterface } from '../interfaces/id.interface';
import { IsNull } from 'typeorm';

export class CrudService<ENTITY> {
    protected repository;
    protected idAttribute = 'id';
    protected _deleteRecords = false;

    getIdAttribute() {
        return this.idAttribute;
    }

    getRepository() {
        return this.repository;
    }

    count(): Promise<number> {
        return this.getRepository().count();
    }

    private _findAll(options: any = {}): Promise<ENTITY[]> {
        const order: any = {};
        order[this.idAttribute] = 'ASC';

        options = {
            ...options,
            where: {
                ...options.where,
            },
            order: options.order || order
        };

        return this.getRepository().find(options);
    }

    private _find(options: any = {}): Promise<ENTITY[]> {
        options.where = {
            ...options.where,
        };

        if (!this.deleteRecords()) {
            options.where.deletedAt = IsNull();
        }

        return this._findAll(options);
    }

    find(options = {}): Promise<ENTITY[]> {
        return this._find(options);
    }

    findAll(options = {}): Promise<ENTITY[]> {
        return this._findAll(options);
    }

    private async _findById(id: number | string, options: any = {}): Promise<ENTITY> {
        const where: any = { ...options.where };
        where[this.idAttribute] = id;

        return (await this.find({
            ...options,
            where,
            take: 1,
        })).shift() || null;
    }

    async findById(id: number | string, options: any = {}): Promise<ENTITY> {
        return await this._findById(id, options);
    }

    async checkIdTaken(id: number | string): Promise<boolean> {
        const item = await this._findById(id);
        if (!item)
            throw new HttpException('', HttpStatus.NOT_FOUND);
        return true;
    }

    async checkIdNotTaken(id: number | string): Promise<boolean> {
        const item = await this._findById(id);
        if (item)
            throw new HttpException('', HttpStatus.FOUND);
        return true;
    }

    private async _create(_item: QueryDeepPartialEntity<ENTITY>, query: any = {}): Promise<IdInterface> {
        _item[this.idAttribute] && (await this.checkIdNotTaken(_.result(_item, this.idAttribute)));

        // to make beforeinsert work
        const item = this.getRepository().create({ ..._item });

        await this.getRepository().save(item);

        let result: any = { id: _.result(item, this.idAttribute) };
        if (query.find) {
            result = await this.findById(result.id as string | number);
        }
        return result;
    }

    async create(_item: QueryDeepPartialEntity<ENTITY>, query: any = {}): Promise<IdInterface | ENTITY> {
        return await this._create(_item, query);
    }

    private async _update(_item: QueryDeepPartialEntity<ENTITY>): Promise<IdInterface> {
        await this.checkIdTaken(_.result(_item, this.idAttribute));
        await this.getRepository().save(_item);
        return { id: _.result(_item, this.idAttribute) };
    }

    async update(_item: QueryDeepPartialEntity<ENTITY>): Promise<IdInterface> {
        return await this._update(_item);
    }

    private async _replace(_item: QueryDeepPartialEntity<ENTITY>): Promise<IdInterface> {
        await this.getRepository().save(_item);
        return { id: _.result(_item, this.idAttribute) };
    }

    async replace(_item: QueryDeepPartialEntity<ENTITY>): Promise<IdInterface> {
        return await this._replace(_item);
    }

    private async _hide(id: number | string): Promise<IdInterface> {
        await this.checkIdTaken(id);

        const item: any = { deletedAt: new Date().toISOString() };
        item[this.idAttribute] = id;

        await this.getRepository().save(item);
        return { id };
    }

    async hide(id: number | string): Promise<IdInterface> {
        return await this._hide(id);
    }

    private async _delete(id: number | string): Promise<IdInterface> {
        await this.checkIdTaken(id);
        await this.getRepository().delete(id);
        return { id };
    }

    async delete(id: number | string): Promise<IdInterface> {
        return await this._delete(id);
    }

    private async _remove(id: number | string): Promise<IdInterface> {
        return this.deleteRecords() ? this.delete(id) : this.hide(id);
    }

    async remove(id: number | string): Promise<IdInterface> {
        return await this._remove(id);
    }

    deleteRecords() {
        return this._deleteRecords;
    }

    async createIfNotExists(_item: QueryDeepPartialEntity<ENTITY>, where: QueryDeepPartialEntity<ENTITY>, query: any = {}): Promise<IdInterface | ENTITY> {
        let item: any = (await this.findAll({ where }))?.shift();
        if (!item) {
            item = (await this.create({ ..._item }, query));
        }

        let result: any = { id: _.result(item, this.idAttribute) };
        if (query.find) {
            result = item;
        }
        return result;
    }
}
