
import _debug from 'debug';
const debug = _debug('app:DynamicDatabase');

import { QueryRunner, Repository } from 'typeorm';
import { CrudService } from './crud.service';
// import _ from 'lodash';

export abstract class DynamicDatabase<ENTITY> extends CrudService<ENTITY> {
    protected static DatabaseConnect;
    protected static dataSource: any = {};
    protected dataSource;
    protected repository: Repository<any>;

    protected databaseAlias;
    protected entity;

    static setDatabaseConnect(DatabaseConnect) {
        this.DatabaseConnect = DatabaseConnect;
    }

    static async setDataSource({ database = '', databaseDir = '', alias = '', synchronize = false }) {
        const _alias = alias || database;
        if (!DynamicDatabase.dataSource[_alias]) {
            DynamicDatabase.dataSource[_alias] = await this.DatabaseConnect({ database, databaseDir, synchronize });
        }
    }

    initialize() {
        return this;
    }

    getDataSource() {
        return this.dataSource || this.setDataSource();
    }

    setDataSource() {
        if (!this.dataSource && this.databaseAlias) {
            this.dataSource = DynamicDatabase.dataSource[this.databaseAlias];
        }
        return this.dataSource;
    }

    getRepository() {
        return this.repository || this.setRepository();
    }

    setRepository() {
        if (!this.repository && this.entity)
            this.repository = this.getDataSource().getRepository(this.entity);
        return this.repository;
    }

    async checkIfTableExists() {
        try {
            const tableName = this.getDataSource().getMetadata(this.entity).tableName;
            const hasTable = await this.getDataSource().query(`SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = '${tableName}')`);
            debug(`Table ${tableName} exists: ${hasTable[0].exists}`);
            return true;
        } catch (error) {
            debug(error);
            return false;
        }
    }

    async insertBulkData(data: Array<any>, queryRunner?: QueryRunner) {
        const result = await this.getRepository().createQueryBuilder('', queryRunner)
            .insert()
            .into(this.entity)
            .values(data)
            .execute();
        debug(`Inserted ${result?.raw?.length} rows`);
    }

    async truncate() {
        try {
            const query = this.getRepository().createQueryBuilder()
                .delete();
            const result = await query.execute();
            debug(`Deleted ${result.affected} rows`);
        } catch (error) {
            debug(error);
        }
    }

}
