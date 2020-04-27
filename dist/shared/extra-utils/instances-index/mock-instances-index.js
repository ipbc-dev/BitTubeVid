"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
class MockInstancesIndex {
    constructor() {
        this.indexInstances = [];
    }
    initialize() {
        return new Promise(res => {
            const app = express();
            app.use('/', (req, res, next) => {
                if (process.env.DEBUG)
                    console.log('Receiving request on mocked server %s.', req.url);
                return next();
            });
            app.get('/api/v1/instances/hosts', (req, res) => {
                const since = req.query.since;
                const filtered = this.indexInstances.filter(i => {
                    if (!since)
                        return true;
                    return i.createdAt > since;
                });
                return res.json({
                    total: filtered.length,
                    data: filtered
                });
            });
            app.listen(42100, () => res());
        });
    }
    addInstance(host) {
        this.indexInstances.push({ host, createdAt: new Date().toISOString() });
    }
}
exports.MockInstancesIndex = MockInstancesIndex;
