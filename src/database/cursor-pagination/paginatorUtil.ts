import { cloneDeep } from 'lodash';
import { ObjectLiteral } from 'typeorm';
import { Cursor, PaginationOptions } from 'typeorm-cursor-pagination';
import { buildPaginator } from './buildPaginator';

export enum DIRECTION {
    PREV = 'before',
    NEXT = 'after',
}

export class PaginatorUtil<Entity extends ObjectLiteral> {
    private options: PaginationOptions<Entity>;
    private queryBuilder: any;
    private cursor: Cursor | null = null;
    public data: any[] = [];

    constructor(options: PaginationOptions<Entity>, queryBuilder) {
        this.options = options;
        this.queryBuilder = queryBuilder;
    }

    getOptions() {
        return cloneDeep(this.options);
    }

    buildOptions(type: DIRECTION, cursor: Cursor | null = null) {
        const options = this.getOptions();
        if (this.cursor) {
            const key = `${type}Cursor`;
            const value = cursor[key];
            // end of pagination
            if (!value) return null;

            options.query[key] = value;
        }
        return options;
    }

    buildNextOptions() {
        return this.buildOptions(DIRECTION.NEXT, this.cursor);
    }

    buildPrevOptions() {
        return this.buildOptions(DIRECTION.PREV, this.cursor);
    }

    async goTo(options: PaginationOptions<Entity> | null) {
        if (!options) return this.end();

        const paginator = buildPaginator({ getMethod: 'getRawMany', ...options });
        // const queryBuilder = this.queryBuilderFn();
        const queryBuilder = this.queryBuilder;
        const { data, cursor } = await paginator.paginate(queryBuilder);

        this.cursor = cursor;
        this.data = data;
        return { data, cursor };
    }

    end() {
        const data = [];
        this.data = data;
        return { data };
    }

    async next() {
        const options = this.buildNextOptions();
        return this.goTo(options);
    }

    async hasNext() {
        await this.next();
        return this.data.length > 0;
    }

    async prev() {
        const options = this.buildPrevOptions();
        return this.goTo(options);
    }

    async hasPrev() {
        await this.prev();
        return this.data.length > 0;
    }
}
