"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
class MockBlocklist {
    initialize() {
        return new Promise(res => {
            const app = express();
            app.get('/blocklist', (req, res) => {
                return res.json(this.body);
            });
            app.listen(42100, () => res());
        });
    }
    replace(body) {
        this.body = body;
    }
}
exports.MockBlocklist = MockBlocklist;
