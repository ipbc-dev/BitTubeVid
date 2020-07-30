"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockBlocklist = void 0;
const express = require("express");
class MockBlocklist {
    initialize() {
        return new Promise(res => {
            const app = express();
            app.get('/blocklist', (req, res) => {
                return res.json(this.body);
            });
            this.server = app.listen(42100, () => res());
        });
    }
    replace(body) {
        this.body = body;
    }
    terminate() {
        if (this.server)
            this.server.close();
    }
}
exports.MockBlocklist = MockBlocklist;
