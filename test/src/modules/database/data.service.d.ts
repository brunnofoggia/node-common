import { ModuleRef } from '@nestjs/core';
export declare abstract class DataService {
    protected moduleRef: ModuleRef;
    protected loaded: any[];
    constructor(moduleRef: ModuleRef);
    protected load(Service: any): any;
    get(Service: any): any;
}
