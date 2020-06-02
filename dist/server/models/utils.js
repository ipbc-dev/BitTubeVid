"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_typescript_1 = require("sequelize-typescript");
const validator_1 = require("validator");
const sequelize_1 = require("sequelize");
function getSort(value, lastSort = ['id', 'ASC']) {
    const { direction, field } = buildDirectionAndField(value);
    let finalField;
    if (field.toLowerCase() === 'match') {
        finalField = sequelize_typescript_1.Sequelize.col('similarity');
    }
    else if (field === 'videoQuotaUsed') {
        finalField = sequelize_typescript_1.Sequelize.col('videoQuotaUsed');
    }
    else {
        finalField = field;
    }
    return [[finalField, direction], lastSort];
}
exports.getSort = getSort;
function getCommentSort(value, lastSort = ['id', 'ASC']) {
    const { direction, field } = buildDirectionAndField(value);
    if (field === 'totalReplies') {
        return [
            [sequelize_typescript_1.Sequelize.literal('"totalReplies"'), direction],
            lastSort
        ];
    }
    return getSort(value, lastSort);
}
exports.getCommentSort = getCommentSort;
function getVideoSort(value, lastSort = ['id', 'ASC']) {
    const { direction, field } = buildDirectionAndField(value);
    if (field.toLowerCase() === 'trending') {
        return [
            [sequelize_typescript_1.Sequelize.fn('COALESCE', sequelize_typescript_1.Sequelize.fn('SUM', sequelize_typescript_1.Sequelize.col('VideoViews.views')), '0'), direction],
            [sequelize_typescript_1.Sequelize.col('VideoModel.views'), direction],
            lastSort
        ];
    }
    let finalField;
    if (field.toLowerCase() === 'match') {
        finalField = sequelize_typescript_1.Sequelize.col('similarity');
    }
    else {
        finalField = field;
    }
    const firstSort = typeof finalField === 'string'
        ? finalField.split('.').concat([direction])
        : [finalField, direction];
    return [firstSort, lastSort];
}
exports.getVideoSort = getVideoSort;
function getBlacklistSort(model, value, lastSort = ['id', 'ASC']) {
    const [firstSort] = getSort(value);
    if (model)
        return [[sequelize_1.literal(`"${model}.${firstSort[0]}" ${firstSort[1]}`)], lastSort];
    return [firstSort, lastSort];
}
exports.getBlacklistSort = getBlacklistSort;
function getFollowsSort(value, lastSort = ['id', 'ASC']) {
    const { direction, field } = buildDirectionAndField(value);
    if (field === 'redundancyAllowed') {
        return [
            ['ActorFollowing', 'Server', 'redundancyAllowed', direction],
            lastSort
        ];
    }
    return getSort(value, lastSort);
}
exports.getFollowsSort = getFollowsSort;
function isOutdated(model, refreshInterval) {
    const now = Date.now();
    const createdAtTime = model.createdAt.getTime();
    const updatedAtTime = model.updatedAt.getTime();
    return (now - createdAtTime) > refreshInterval && (now - updatedAtTime) > refreshInterval;
}
exports.isOutdated = isOutdated;
function throwIfNotValid(value, validator, fieldName = 'value', nullable = false) {
    if (nullable && (value === null || value === undefined))
        return;
    if (validator(value) === false) {
        throw new Error(`"${value}" is not a valid ${fieldName}.`);
    }
}
exports.throwIfNotValid = throwIfNotValid;
function buildTrigramSearchIndex(indexName, attribute) {
    return {
        name: indexName,
        fields: [sequelize_typescript_1.Sequelize.literal('lower(immutable_unaccent(' + attribute + '))')],
        using: 'gin',
        operator: 'gin_trgm_ops'
    };
}
exports.buildTrigramSearchIndex = buildTrigramSearchIndex;
function createSimilarityAttribute(col, value) {
    return sequelize_typescript_1.Sequelize.fn('similarity', searchTrigramNormalizeCol(col), searchTrigramNormalizeValue(value));
}
exports.createSimilarityAttribute = createSimilarityAttribute;
function buildBlockedAccountSQL(serverAccountId, userAccountId) {
    const blockerIds = [serverAccountId];
    if (userAccountId)
        blockerIds.push(userAccountId);
    const blockerIdsString = blockerIds.join(', ');
    return 'SELECT "targetAccountId" AS "id" FROM "accountBlocklist" WHERE "accountId" IN (' + blockerIdsString + ')' +
        ' UNION ALL ' +
        'SELECT "account"."id" AS "id" FROM account INNER JOIN "actor" ON account."actorId" = actor.id ' +
        'INNER JOIN "serverBlocklist" ON "actor"."serverId" = "serverBlocklist"."targetServerId" ' +
        'WHERE "serverBlocklist"."accountId" IN (' + blockerIdsString + ')';
}
exports.buildBlockedAccountSQL = buildBlockedAccountSQL;
function buildServerIdsFollowedBy(actorId) {
    const actorIdNumber = parseInt(actorId + '', 10);
    return '(' +
        'SELECT "actor"."serverId" FROM "actorFollow" ' +
        'INNER JOIN "actor" ON actor.id = "actorFollow"."targetActorId" ' +
        'WHERE "actorFollow"."actorId" = ' + actorIdNumber +
        ')';
}
exports.buildServerIdsFollowedBy = buildServerIdsFollowedBy;
function buildWhereIdOrUUID(id) {
    return validator_1.default.isInt('' + id) ? { id } : { uuid: id };
}
exports.buildWhereIdOrUUID = buildWhereIdOrUUID;
function parseAggregateResult(result) {
    if (!result)
        return 0;
    const total = parseInt(result + '', 10);
    if (isNaN(total))
        return 0;
    return total;
}
exports.parseAggregateResult = parseAggregateResult;
const createSafeIn = (model, stringArr) => {
    return stringArr.map(t => {
        return t === null
            ? null
            : model.sequelize.escape('' + t);
    }).join(', ');
};
exports.createSafeIn = createSafeIn;
function buildLocalAccountIdsIn() {
    return sequelize_1.literal('(SELECT "account"."id" FROM "account" INNER JOIN "actor" ON "actor"."id" = "account"."actorId" AND "actor"."serverId" IS NULL)');
}
exports.buildLocalAccountIdsIn = buildLocalAccountIdsIn;
function buildLocalActorIdsIn() {
    return sequelize_1.literal('(SELECT "actor"."id" FROM "actor" WHERE "actor"."serverId" IS NULL)');
}
exports.buildLocalActorIdsIn = buildLocalActorIdsIn;
function buildDirectionAndField(value) {
    let field;
    let direction;
    if (value.substring(0, 1) === '-') {
        direction = 'DESC';
        field = value.substring(1);
    }
    else {
        direction = 'ASC';
        field = value;
    }
    return { direction, field };
}
exports.buildDirectionAndField = buildDirectionAndField;
function searchAttribute(sourceField, targetField) {
    if (!sourceField)
        return {};
    return {
        [targetField]: {
            [sequelize_1.Op.iLike]: `%${sourceField}%`
        }
    };
}
exports.searchAttribute = searchAttribute;
function searchTrigramNormalizeValue(value) {
    return sequelize_typescript_1.Sequelize.fn('lower', sequelize_typescript_1.Sequelize.fn('immutable_unaccent', value));
}
function searchTrigramNormalizeCol(col) {
    return sequelize_typescript_1.Sequelize.fn('lower', sequelize_typescript_1.Sequelize.fn('immutable_unaccent', sequelize_typescript_1.Sequelize.col(col)));
}
