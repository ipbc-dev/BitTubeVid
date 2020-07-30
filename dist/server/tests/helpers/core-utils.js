"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const chai = require("chai");
require("mocha");
const lodash_1 = require("lodash");
const core_utils_1 = require("../../helpers/core-utils");
const validator_1 = require("validator");
const expect = chai.expect;
describe('Parse Bytes', function () {
    it('Should pass when given valid value', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            expect(core_utils_1.parseBytes(1024)).to.be.eq(1024);
            expect(core_utils_1.parseBytes(1048576)).to.be.eq(1048576);
            expect(core_utils_1.parseBytes('1024')).to.be.eq(1024);
            expect(core_utils_1.parseBytes('1048576')).to.be.eq(1048576);
            expect(core_utils_1.parseBytes('1B')).to.be.eq(1024);
            expect(core_utils_1.parseBytes('1MB')).to.be.eq(1048576);
            expect(core_utils_1.parseBytes('1GB')).to.be.eq(1073741824);
            expect(core_utils_1.parseBytes('1TB')).to.be.eq(1099511627776);
            expect(core_utils_1.parseBytes('5GB')).to.be.eq(5368709120);
            expect(core_utils_1.parseBytes('5TB')).to.be.eq(5497558138880);
            expect(core_utils_1.parseBytes('1024B')).to.be.eq(1048576);
            expect(core_utils_1.parseBytes('1024MB')).to.be.eq(1073741824);
            expect(core_utils_1.parseBytes('1024GB')).to.be.eq(1099511627776);
            expect(core_utils_1.parseBytes('1024TB')).to.be.eq(1125899906842624);
            expect(core_utils_1.parseBytes('1 GB')).to.be.eq(1073741824);
            expect(core_utils_1.parseBytes('1\tGB')).to.be.eq(1073741824);
            expect(core_utils_1.parseBytes('1TB 1024MB')).to.be.eq(1100585369600);
            expect(core_utils_1.parseBytes('4GB 1024MB')).to.be.eq(5368709120);
            expect(core_utils_1.parseBytes('4TB 1024GB')).to.be.eq(5497558138880);
            expect(core_utils_1.parseBytes('4TB 1024GB 0MB')).to.be.eq(5497558138880);
            expect(core_utils_1.parseBytes('1024TB 1024GB 1024MB')).to.be.eq(1127000492212224);
        });
    });
    it('Should be invalid when given invalid value', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            expect(core_utils_1.parseBytes('6GB 1GB')).to.be.eq(6);
        });
    });
    it('Should convert an object', function () {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            function keyConverter(k) {
                return lodash_1.snakeCase(k);
            }
            function valueConverter(v) {
                if (validator_1.default.isNumeric(v + ''))
                    return parseInt('' + v, 10);
                return v;
            }
            const obj = {
                mySuperKey: 'hello',
                mySuper2Key: '45',
                mySuper3Key: {
                    mySuperSubKey: '15',
                    mySuperSub2Key: 'hello',
                    mySuperSub3Key: ['1', 'hello', 2],
                    mySuperSub4Key: 4
                },
                mySuper4Key: 45,
                toto: {
                    super_key: '15',
                    superKey2: 'hello'
                },
                super_key: {
                    superKey4: 15
                }
            };
            const res = core_utils_1.objectConverter(obj, keyConverter, valueConverter);
            expect(res.my_super_key).to.equal('hello');
            expect(res.my_super_2_key).to.equal(45);
            expect(res.my_super_3_key.my_super_sub_key).to.equal(15);
            expect(res.my_super_3_key.my_super_sub_2_key).to.equal('hello');
            expect(res.my_super_3_key.my_super_sub_3_key).to.deep.equal([1, 'hello', 2]);
            expect(res.my_super_3_key.my_super_sub_4_key).to.equal(4);
            expect(res.toto.super_key).to.equal(15);
            expect(res.toto.super_key_2).to.equal('hello');
            expect(res.super_key.super_key_4).to.equal(15);
            expect(res.mySuperKey).to.be.undefined;
            expect(obj['my_super_key']).to.be.undefined;
        });
    });
});
