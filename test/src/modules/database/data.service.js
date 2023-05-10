"use strict";
exports.__esModule = true;
exports.DataService = void 0;
var DataService = /** @class */ (function () {
    function DataService(moduleRef) {
        this.moduleRef = moduleRef;
        this.loaded = [];
    }
    DataService.prototype.load = function (Service) {
        !this.loaded[Service.name] && (this.loaded[Service.name] = this.moduleRef.get(Service));
        return this.loaded[Service.name];
    };
    DataService.prototype.get = function (Service) {
        return this.load(Service);
    };
    return DataService;
}());
exports.DataService = DataService;
