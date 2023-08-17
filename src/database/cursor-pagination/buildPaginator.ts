import { ObjectLiteral } from 'typeorm';

import { Order, PaginationOptions } from 'typeorm-cursor-pagination';
import Paginator from './paginator';

export function buildPaginator<Entity extends ObjectLiteral>(options: PaginationOptions<Entity> & { _Paginator?; getMethod? }): Paginator<Entity> {
    const { entity, query = {}, alias = entity.name.toLowerCase(), paginationKeys = ['id' as any] } = options;
    const _Paginator = options._Paginator || Paginator;

    const paginator = new _Paginator(entity, paginationKeys);
    if (options.getMethod) paginator.getMethod = options.getMethod;

    paginator.setAlias(alias);

    if (query.afterCursor) {
        paginator.setAfterCursor(query.afterCursor);
    }

    if (query.beforeCursor) {
        paginator.setBeforeCursor(query.beforeCursor);
    }

    if (query.limit) {
        paginator.setLimit(query.limit);
    }

    if (query.order) {
        paginator.setOrder(query.order as Order);
    }

    return paginator;
}
