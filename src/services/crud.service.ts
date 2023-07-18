import { HttpStatusCode } from 'axios';
import { find, omit, result, size } from 'lodash';
import { IsNull } from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';

import { throwHttpException } from '../utils/errors';
import { IdInterface } from '../interfaces/id.interface';

export class CrudService<ENTITY> {
    protected repository;
    protected idAttribute = 'id';
    protected _deleteRecords;
    protected _deletedAttribute = 'deletedAt';
    protected _updatedAttribute;

    getIdAttribute() {
        return this.idAttribute;
    }

    getRepository() {
        return this.repository;
    }

    count(options: any = {}): Promise<number> {
        return this.getRepository().count(options);
    }

    private _findAll(options: any = {}): Promise<ENTITY[]> {
        const defaultOrder: any = {};
        defaultOrder[this.idAttribute] = 'ASC';

        /**
         * bug found when sending "order: {}" (empty object)
         * bug occurs when dealing with long pagination process with tons of data
         * scenario:
         * { skip: 500000, take: 50000, order: {} } (into a view, not a table)
         * solution:
         * always have an order by and a pk on select
         */
        const order = size(options.order) ? options.order : defaultOrder;

        options = {
            ...omit(options, 'order'),
            order,
        };

        return this.getRepository().find(options);
    }

    private _find(options: any = {}): Promise<ENTITY[]> {
        options.where = {
            ...options.where,
        };

        if (!this.deleteRecords()) {
            options.where[this._deletedAttribute] = IsNull();
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

        return (
            (
                await this.find({
                    ...options,
                    where,
                    take: 1,
                })
            ).shift() || null
        );
    }

    async findById(id: number | string, options: any = {}): Promise<ENTITY> {
        return await this._findById(id, options);
    }

    async checkIdTaken(id: number | string): Promise<boolean> {
        const item = await this._findById(id);
        if (!item) throwHttpException('', HttpStatusCode.NotFound);
        return true;
    }

    async checkIdNotTaken(id: number | string): Promise<boolean> {
        const item = await this._findById(id);
        if (item) throwHttpException('', HttpStatusCode.Found);
        return true;
    }

    private async _create(_item: QueryDeepPartialEntity<ENTITY>, query: any = {}): Promise<IdInterface> {
        _item[this.idAttribute] && (await this.checkIdNotTaken(result(_item, this.idAttribute)));

        // to make beforeinsert work
        const item = this.getRepository().create({ ..._item });

        await this.getRepository().save(item);

        let _result: any = { id: result(item, this.idAttribute) };
        if (query.find) {
            _result = await this.findById(_result.id as string | number);
        }
        return _result;
    }

    async create(_item: QueryDeepPartialEntity<ENTITY>, query: any = {}): Promise<IdInterface | ENTITY> {
        return await this._create(_item, query);
    }

    private async _update(_item: QueryDeepPartialEntity<ENTITY>): Promise<IdInterface> {
        await this.checkIdTaken(result(_item, this.idAttribute));
        const item = this.updatedAt(_item);
        await this.getRepository().save(item);
        return { id: result(item, this.idAttribute) };
    }

    async update(_item: QueryDeepPartialEntity<ENTITY>): Promise<IdInterface> {
        return await this._update(_item);
    }

    private async _replace(_item: QueryDeepPartialEntity<ENTITY>): Promise<IdInterface> {
        await this.getRepository().save(_item);
        return { id: result(_item, this.idAttribute) };
    }

    async replace(_item: QueryDeepPartialEntity<ENTITY>): Promise<IdInterface> {
        return await this._replace(_item);
    }

    private async _hide(id: number | string): Promise<IdInterface> {
        await this.checkIdTaken(id);

        let item: any = {};
        item[this._deletedAttribute] = new Date().toISOString();
        item[this.idAttribute] = id;
        item = this.updatedAt(item);

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

    async createIfNotExists(
        _item: QueryDeepPartialEntity<ENTITY>,
        where: QueryDeepPartialEntity<ENTITY>,
        query: any = {},
    ): Promise<IdInterface | ENTITY> {
        let item: any = (await this.findAll({ where }))?.shift();
        if (!item) {
            item = await this.create({ ..._item }, query);
        }

        let _result: any = { id: result(item, this.idAttribute) };
        if (query.find) {
            _result = item;
        }
        return _result;
    }

    getEntity() {
        const repository = this.getRepository();
        return repository.target;
    }

    getDataSource() {
        return this.getRepository().manager.connection;
    }

    getMetadata() {
        return this.getDataSource().getMetadata(this.getEntity());
    }

    getConnectionType() {
        return this.getDataSource().options.type;
    }

    shouldApplyManualUpdatedAt() {
        return this.getConnectionType() === 'postgres';
    }

    updatedAt(_item) {
        if (this.shouldApplyManualUpdatedAt()) {
            if (!this._updatedAttribute) {
                const metadata = this.getMetadata();
                const column = find(metadata.columns, (column) => (result(column, 'onUpdate') + '').indexOf('CURRENT_TIMESTAMP') >= 0);
                this._updatedAttribute = column?.propertyName;
            }

            if (this._updatedAttribute) _item[this._updatedAttribute] = new Date().toISOString();
        }

        return _item;
    }

    deleteRecords() {
        if (typeof this._deleteRecords !== 'undefined') return this._deleteRecords;

        const metadata = this.getMetadata();
        const column = find(metadata.columns, (column) => column.propertyName === this._deletedAttribute);
        return (this._deleteRecords = !!column);
    }
}
