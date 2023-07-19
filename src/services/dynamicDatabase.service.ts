import _debug from 'debug';
const debug = _debug('app:db:DynamicDatabase');

import { keys } from 'lodash';
import { QueryRunner, Repository } from 'typeorm';
import { CrudService } from './crud.service';
// import _ from 'lodash';

export class DynamicDatabase<ENTITY> extends CrudService<ENTITY> {
    protected static DatabaseConnect;
    private static dataSources: any = {};

    protected dataSource;
    protected repository: Repository<any>;

    protected poolId = 'default';
    protected databaseAlias = 'default';
    protected entity;

    static setDatabaseConnect(DatabaseConnect) {
        this.DatabaseConnect = DatabaseConnect;
    }

    static async setDataSource({ poolId = 'default', database = '', databaseDir = '', alias = '', synchronize = false }) {
        const _alias = alias || database;
        const datasourcePath = this.defineDatasourcePath(_alias, poolId);
        if (!this.getDataSource(_alias, poolId)) {
            DynamicDatabase.dataSources[datasourcePath] = await this.DatabaseConnect({ database, databaseDir, synchronize });
        }
        return this.getDataSource(_alias, poolId);
    }

    static getDataSource(alias, poolId = 'default') {
        return DynamicDatabase.dataSources[this.defineDatasourcePath(alias, poolId)];
    }

    static defineDatasourcePath(alias, poolId = 'default') {
        return [poolId, alias].join(':');
    }

    static listConnections() {
        return keys(this.dataSources);
    }

    static async closeConnections(poolId = 'default') {
        for (const datasourcePath in DynamicDatabase.dataSources) {
            if (poolId && !datasourcePath.startsWith(poolId)) continue;

            await this._closeConnection(datasourcePath);
        }
    }

    static async closeConnection(alias, poolId = 'default') {
        const datasourcePath = this.defineDatasourcePath(alias, poolId);
        await this._closeConnection(datasourcePath);
    }

    static async _closeConnection(datasourcePath) {
        // console.log('close this conn', datasourcePath);
        await DynamicDatabase.dataSources[datasourcePath]?.destroy();
        delete DynamicDatabase.dataSources[datasourcePath];
        // DynamicDatabase.dataSources = omit(DynamicDatabase.dataSources, datasourcePath);
    }

    constructor(poolId = '') {
        super();

        if (poolId) this.poolId = poolId;
    }

    initialize() {
        return this;
    }

    getDataSource() {
        return this.dataSource || this.setDataSource();
    }

    setDataSource() {
        if (!this.dataSource && this.databaseAlias) {
            this.dataSource = DynamicDatabase.getDataSource(this.databaseAlias, this.poolId);
        }
        return this.dataSource;
    }

    getRepository() {
        const repository = this.repository || this.setRepository();
        return repository;
    }

    setRepository() {
        if (!this.repository && this.entity) {
            const datasource = this.getDataSource();
            if (!datasource) throw new Error(`connection not found. alias: ${this.databaseAlias} , poolId: ${this.poolId}`);
            this.repository = datasource.getRepository(this.entity);
        }
        return this.repository;
    }

    async checkIfTableExists() {
        try {
            const tableName = this.getDataSource().getMetadata(this.entity).tableName;
            const hasTable = await this.getDataSource().query(
                `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = '${tableName}')`,
            );
            debug(`Table ${tableName} exists: ${hasTable[0].exists}`);
            return true;
        } catch (error) {
            debug(error);
            return false;
        }
    }

    async insertBulkData(data: Array<any>, queryRunner?: QueryRunner) {
        const result = await this.getRepository().createQueryBuilder('', queryRunner).insert().into(this.entity).values(data).execute();
        debug(`Inserted ${result?.raw?.length} rows`);
    }

    async truncate() {
        try {
            const repository = this.getRepository();
            const query = repository.createQueryBuilder().delete();
            const result = await query.execute();
            debug(`Deleted ${result.affected} rows`);
        } catch (error) {
            debug(error);
        }
    }
}
