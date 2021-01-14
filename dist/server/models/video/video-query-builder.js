"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.wrapForAPIResults = exports.buildListQuery = void 0;
const utils_1 = require("@server/models/utils");
const validator_1 = require("validator");
const misc_1 = require("@server/helpers/custom-validators/misc");
function buildListQuery(model, options) {
    const and = [];
    const joins = [];
    const replacements = {};
    const cte = [];
    let attributes = options.attributes || ['"video"."id"'];
    let group = options.group || '';
    const having = options.having || '';
    joins.push('INNER JOIN "videoChannel" ON "videoChannel"."id" = "video"."channelId"' +
        'INNER JOIN "account" ON "account"."id" = "videoChannel"."accountId"' +
        'INNER JOIN "actor" "accountActor" ON "account"."actorId" = "accountActor"."id"');
    and.push('"video"."id" NOT IN (SELECT "videoBlacklist"."videoId" FROM "videoBlacklist")');
    if (options.serverAccountId) {
        const blockerIds = [options.serverAccountId];
        if (options.user)
            blockerIds.push(options.user.Account.id);
        const inClause = utils_1.createSafeIn(model, blockerIds);
        and.push('NOT EXISTS (' +
            '  SELECT 1 FROM "accountBlocklist" ' +
            '  WHERE "accountBlocklist"."accountId" IN (' + inClause + ') ' +
            '  AND "accountBlocklist"."targetAccountId" = "account"."id" ' +
            ')' +
            'AND NOT EXISTS (' +
            '  SELECT 1 FROM "serverBlocklist" WHERE "serverBlocklist"."accountId" IN (' + inClause + ') ' +
            '  AND "serverBlocklist"."targetServerId" = "accountActor"."serverId"' +
            ')');
    }
    if (!options.filter || (options.filter !== 'all-local' && options.filter !== 'all')) {
        and.push(`("video"."state" = ${1} OR ` +
            `("video"."state" = ${2} AND "video"."waitTranscoding" IS false))`);
        if (options.user) {
            and.push(`("video"."privacy" = ${1} OR "video"."privacy" = ${4})`);
        }
        else {
            and.push(`"video"."privacy" = ${1}`);
        }
    }
    if (options.videoPlaylistId) {
        joins.push('INNER JOIN "videoPlaylistElement" "video"."id" = "videoPlaylistElement"."videoId" ' +
            'AND "videoPlaylistElement"."videoPlaylistId" = :videoPlaylistId');
        replacements.videoPlaylistId = options.videoPlaylistId;
    }
    if (options.filter && (options.filter === 'local' || options.filter === 'all-local')) {
        and.push('"video"."remote" IS FALSE');
    }
    if (options.accountId) {
        and.push('"account"."id" = :accountId');
        replacements.accountId = options.accountId;
    }
    if (options.videoChannelId) {
        and.push('"videoChannel"."id" = :videoChannelId');
        replacements.videoChannelId = options.videoChannelId;
    }
    if (options.followerActorId) {
        let query = '(' +
            '  EXISTS (' +
            '    SELECT 1 FROM "videoShare" ' +
            '    INNER JOIN "actorFollow" "actorFollowShare" ON "actorFollowShare"."targetActorId" = "videoShare"."actorId" ' +
            '    AND "actorFollowShare"."actorId" = :followerActorId AND "actorFollowShare"."state" = \'accepted\' ' +
            '    WHERE "videoShare"."videoId" = "video"."id"' +
            '  )' +
            '  OR' +
            '  EXISTS (' +
            '    SELECT 1 from "actorFollow" ' +
            '    WHERE "actorFollow"."targetActorId" = "videoChannel"."actorId" AND "actorFollow"."actorId" = :followerActorId ' +
            '    AND "actorFollow"."state" = \'accepted\'' +
            '  )';
        if (options.includeLocalVideos) {
            query += '  OR "video"."remote" IS FALSE';
        }
        query += ')';
        and.push(query);
        replacements.followerActorId = options.followerActorId;
    }
    if (options.withFiles === true) {
        and.push('(' +
            '  EXISTS (SELECT 1 FROM "videoFile" WHERE "videoFile"."videoId" = "video"."id") ' +
            '  OR EXISTS (' +
            '    SELECT 1 FROM "videoStreamingPlaylist" ' +
            '    INNER JOIN "videoFile" ON "videoFile"."videoStreamingPlaylistId" = "videoStreamingPlaylist"."id" ' +
            '    WHERE "videoStreamingPlaylist"."videoId" = "video"."id"' +
            '  )' +
            ')');
    }
    if (options.tagsOneOf) {
        const tagsOneOfLower = options.tagsOneOf.map(t => t.toLowerCase());
        and.push('EXISTS (' +
            '  SELECT 1 FROM "videoTag" ' +
            '  INNER JOIN "tag" ON "tag"."id" = "videoTag"."tagId" ' +
            '  WHERE lower("tag"."name") IN (' + utils_1.createSafeIn(model, tagsOneOfLower) + ') ' +
            '  AND "video"."id" = "videoTag"."videoId"' +
            ')');
    }
    if (options.tagsAllOf) {
        const tagsAllOfLower = options.tagsAllOf.map(t => t.toLowerCase());
        and.push('EXISTS (' +
            '  SELECT 1 FROM "videoTag" ' +
            '  INNER JOIN "tag" ON "tag"."id" = "videoTag"."tagId" ' +
            '  WHERE lower("tag"."name") IN (' + utils_1.createSafeIn(model, tagsAllOfLower) + ') ' +
            '  AND "video"."id" = "videoTag"."videoId" ' +
            '  GROUP BY "videoTag"."videoId" HAVING COUNT(*) = ' + tagsAllOfLower.length +
            ')');
    }
    if (options.nsfw === true) {
        and.push('"video"."nsfw" IS TRUE');
    }
    if (options.nsfw === false) {
        and.push('"video"."nsfw" IS FALSE');
    }
    if (options.categoryOneOf) {
        and.push('"video"."category" IN (:categoryOneOf)');
        replacements.categoryOneOf = options.categoryOneOf;
    }
    if (options.licenceOneOf) {
        and.push('"video"."licence" IN (:licenceOneOf)');
        replacements.licenceOneOf = options.licenceOneOf;
    }
    if (options.languageOneOf) {
        const languages = options.languageOneOf.filter(l => l && l !== '_unknown');
        const languagesQueryParts = [];
        if (languages.length !== 0) {
            languagesQueryParts.push('"video"."language" IN (:languageOneOf)');
            replacements.languageOneOf = languages;
            languagesQueryParts.push('EXISTS (' +
                '  SELECT 1 FROM "videoCaption" WHERE "videoCaption"."language" ' +
                '  IN (' + utils_1.createSafeIn(model, languages) + ') AND ' +
                '  "videoCaption"."videoId" = "video"."id"' +
                ')');
        }
        if (options.languageOneOf.includes('_unknown')) {
            languagesQueryParts.push('"video"."language" IS NULL');
        }
        if (languagesQueryParts.length !== 0) {
            and.push('(' + languagesQueryParts.join(' OR ') + ')');
        }
    }
    if (options.trendingDays && options.isCount !== true) {
        const viewsGteDate = new Date(new Date().getTime() - (24 * 3600 * 1000) * options.trendingDays);
        joins.push('LEFT JOIN "videoView" ON "video"."id" = "videoView"."videoId" AND "videoView"."startDate" >= :viewsGteDate');
        replacements.viewsGteDate = viewsGteDate;
        attributes.push('COALESCE(SUM("videoView"."views"), 0) AS "videoViewsSum"');
        group = 'GROUP BY "video"."id"';
    }
    if (options.historyOfUser) {
        joins.push('INNER JOIN "userVideoHistory" on "video"."id" = "userVideoHistory"."videoId"');
        and.push('"userVideoHistory"."userId" = :historyOfUser');
        replacements.historyOfUser = options.historyOfUser.id;
    }
    if (options.startDate) {
        and.push('"video"."publishedAt" >= :startDate');
        replacements.startDate = options.startDate;
    }
    if (options.endDate) {
        and.push('"video"."publishedAt" <= :endDate');
        replacements.endDate = options.endDate;
    }
    if (options.originallyPublishedStartDate) {
        and.push('"video"."originallyPublishedAt" >= :originallyPublishedStartDate');
        replacements.originallyPublishedStartDate = options.originallyPublishedStartDate;
    }
    if (options.originallyPublishedEndDate) {
        and.push('"video"."originallyPublishedAt" <= :originallyPublishedEndDate');
        replacements.originallyPublishedEndDate = options.originallyPublishedEndDate;
    }
    if (options.durationMin) {
        and.push('"video"."duration" >= :durationMin');
        replacements.durationMin = options.durationMin;
    }
    if (options.durationMax) {
        and.push('"video"."duration" <= :durationMax');
        replacements.durationMax = options.durationMax;
    }
    if (options.search) {
        const escapedSearch = model.sequelize.escape(options.search);
        const escapedLikeSearch = model.sequelize.escape('%' + options.search + '%');
        cte.push('"trigramSearch" AS (' +
            '  SELECT "video"."id", ' +
            `  similarity(lower(immutable_unaccent("video"."name")), lower(immutable_unaccent(${escapedSearch}))) as similarity ` +
            '  FROM "video" ' +
            '  WHERE lower(immutable_unaccent("video"."name")) % lower(immutable_unaccent(' + escapedSearch + ')) OR ' +
            '        lower(immutable_unaccent("video"."name")) LIKE lower(immutable_unaccent(' + escapedLikeSearch + '))' +
            ')');
        joins.push('LEFT JOIN "trigramSearch" ON "video"."id" = "trigramSearch"."id"');
        let base = '(' +
            '  "trigramSearch"."id" IS NOT NULL OR ' +
            '  EXISTS (' +
            '    SELECT 1 FROM "videoTag" ' +
            '    INNER JOIN "tag" ON "tag"."id" = "videoTag"."tagId" ' +
            `    WHERE lower("tag"."name") = ${escapedSearch} ` +
            '    AND "video"."id" = "videoTag"."videoId"' +
            '  )';
        if (validator_1.default.isUUID(options.search)) {
            base += ` OR "video"."uuid" = ${escapedSearch}`;
        }
        base += ')';
        and.push(base);
        attributes.push(`COALESCE("trigramSearch"."similarity", 0) as similarity`);
    }
    else {
        attributes.push('0 as similarity');
    }
    if (options.isCount === true)
        attributes = ['COUNT(*) as "total"'];
    let suffix = '';
    let order = '';
    if (options.isCount !== true) {
        if (misc_1.exists(options.sort)) {
            if (options.sort === '-originallyPublishedAt' || options.sort === 'originallyPublishedAt') {
                attributes.push('COALESCE("video"."originallyPublishedAt", "video"."publishedAt") AS "publishedAtForOrder"');
            }
            order = buildOrder(options.sort);
            suffix += `${order} `;
        }
        if (misc_1.exists(options.count)) {
            const count = parseInt(options.count + '', 10);
            suffix += `LIMIT ${count} `;
        }
        if (misc_1.exists(options.start)) {
            const start = parseInt(options.start + '', 10);
            suffix += `OFFSET ${start} `;
        }
    }
    const cteString = cte.length !== 0
        ? `WITH ${cte.join(', ')} `
        : '';
    const query = cteString +
        'SELECT ' + attributes.join(', ') + ' ' +
        'FROM "video" ' + joins.join(' ') + ' ' +
        'WHERE ' + and.join(' AND ') + ' ' +
        group + ' ' +
        having + ' ' +
        suffix;
    return { query, replacements, order };
}
exports.buildListQuery = buildListQuery;
function buildOrder(value) {
    const { direction, field } = utils_1.buildDirectionAndField(value);
    if (field.match(/^[a-zA-Z."]+$/) === null)
        throw new Error('Invalid sort column ' + field);
    if (field.toLowerCase() === 'random')
        return 'ORDER BY RANDOM()';
    if (field.toLowerCase() === 'trending') {
        return `ORDER BY "videoViewsSum" ${direction}, "video"."views" ${direction}`;
    }
    let firstSort;
    if (field.toLowerCase() === 'match') {
        firstSort = '"similarity"';
    }
    else if (field === 'originallyPublishedAt') {
        firstSort = '"publishedAtForOrder"';
    }
    else if (field.includes('.')) {
        firstSort = field;
    }
    else {
        firstSort = `"video"."${field}"`;
    }
    return `ORDER BY ${firstSort} ${direction}, "video"."id" ASC`;
}
function wrapForAPIResults(baseQuery, replacements, options, order) {
    const attributes = {
        '"video".*': '',
        '"VideoChannel"."id"': '"VideoChannel.id"',
        '"VideoChannel"."name"': '"VideoChannel.name"',
        '"VideoChannel"."description"': '"VideoChannel.description"',
        '"VideoChannel"."actorId"': '"VideoChannel.actorId"',
        '"VideoChannel->Actor"."id"': '"VideoChannel.Actor.id"',
        '"VideoChannel->Actor"."preferredUsername"': '"VideoChannel.Actor.preferredUsername"',
        '"VideoChannel->Actor"."url"': '"VideoChannel.Actor.url"',
        '"VideoChannel->Actor"."serverId"': '"VideoChannel.Actor.serverId"',
        '"VideoChannel->Actor"."avatarId"': '"VideoChannel.Actor.avatarId"',
        '"VideoChannel->Account"."id"': '"VideoChannel.Account.id"',
        '"VideoChannel->Account"."name"': '"VideoChannel.Account.name"',
        '"VideoChannel->Account->Actor"."id"': '"VideoChannel.Account.Actor.id"',
        '"VideoChannel->Account->Actor"."preferredUsername"': '"VideoChannel.Account.Actor.preferredUsername"',
        '"VideoChannel->Account->Actor"."url"': '"VideoChannel.Account.Actor.url"',
        '"VideoChannel->Account->Actor"."serverId"': '"VideoChannel.Account.Actor.serverId"',
        '"VideoChannel->Account->Actor"."avatarId"': '"VideoChannel.Account.Actor.avatarId"',
        '"VideoChannel->Actor->Server"."id"': '"VideoChannel.Actor.Server.id"',
        '"VideoChannel->Actor->Server"."host"': '"VideoChannel.Actor.Server.host"',
        '"VideoChannel->Actor->Avatar"."id"': '"VideoChannel.Actor.Avatar.id"',
        '"VideoChannel->Actor->Avatar"."filename"': '"VideoChannel.Actor.Avatar.filename"',
        '"VideoChannel->Actor->Avatar"."fileUrl"': '"VideoChannel.Actor.Avatar.fileUrl"',
        '"VideoChannel->Actor->Avatar"."onDisk"': '"VideoChannel.Actor.Avatar.onDisk"',
        '"VideoChannel->Actor->Avatar"."createdAt"': '"VideoChannel.Actor.Avatar.createdAt"',
        '"VideoChannel->Actor->Avatar"."updatedAt"': '"VideoChannel.Actor.Avatar.updatedAt"',
        '"VideoChannel->Account->Actor->Server"."id"': '"VideoChannel.Account.Actor.Server.id"',
        '"VideoChannel->Account->Actor->Server"."host"': '"VideoChannel.Account.Actor.Server.host"',
        '"VideoChannel->Account->Actor->Avatar"."id"': '"VideoChannel.Account.Actor.Avatar.id"',
        '"VideoChannel->Account->Actor->Avatar"."filename"': '"VideoChannel.Account.Actor.Avatar.filename"',
        '"VideoChannel->Account->Actor->Avatar"."fileUrl"': '"VideoChannel.Account.Actor.Avatar.fileUrl"',
        '"VideoChannel->Account->Actor->Avatar"."onDisk"': '"VideoChannel.Account.Actor.Avatar.onDisk"',
        '"VideoChannel->Account->Actor->Avatar"."createdAt"': '"VideoChannel.Account.Actor.Avatar.createdAt"',
        '"VideoChannel->Account->Actor->Avatar"."updatedAt"': '"VideoChannel.Account.Actor.Avatar.updatedAt"',
        '"Thumbnails"."id"': '"Thumbnails.id"',
        '"Thumbnails"."type"': '"Thumbnails.type"',
        '"Thumbnails"."filename"': '"Thumbnails.filename"'
    };
    const joins = [
        'INNER JOIN "video" ON "tmp"."id" = "video"."id"',
        'INNER JOIN "videoChannel" AS "VideoChannel" ON "video"."channelId" = "VideoChannel"."id"',
        'INNER JOIN "actor" AS "VideoChannel->Actor" ON "VideoChannel"."actorId" = "VideoChannel->Actor"."id"',
        'INNER JOIN "account" AS "VideoChannel->Account" ON "VideoChannel"."accountId" = "VideoChannel->Account"."id"',
        'INNER JOIN "actor" AS "VideoChannel->Account->Actor" ON "VideoChannel->Account"."actorId" = "VideoChannel->Account->Actor"."id"',
        'LEFT OUTER JOIN "server" AS "VideoChannel->Actor->Server" ON "VideoChannel->Actor"."serverId" = "VideoChannel->Actor->Server"."id"',
        'LEFT OUTER JOIN "avatar" AS "VideoChannel->Actor->Avatar" ON "VideoChannel->Actor"."avatarId" = "VideoChannel->Actor->Avatar"."id"',
        'LEFT OUTER JOIN "server" AS "VideoChannel->Account->Actor->Server" ' +
            'ON "VideoChannel->Account->Actor"."serverId" = "VideoChannel->Account->Actor->Server"."id"',
        'LEFT OUTER JOIN "avatar" AS "VideoChannel->Account->Actor->Avatar" ' +
            'ON "VideoChannel->Account->Actor"."avatarId" = "VideoChannel->Account->Actor->Avatar"."id"',
        'LEFT OUTER JOIN "thumbnail" AS "Thumbnails" ON "video"."id" = "Thumbnails"."videoId"'
    ];
    if (options.withFiles) {
        joins.push('LEFT JOIN "videoFile" AS "VideoFiles" ON "VideoFiles"."videoId" = "video"."id"');
        joins.push('LEFT JOIN "videoStreamingPlaylist" AS "VideoStreamingPlaylists" ON "VideoStreamingPlaylists"."videoId" = "video"."id"');
        joins.push('LEFT JOIN "videoFile" AS "VideoStreamingPlaylists->VideoFiles" ' +
            'ON "VideoStreamingPlaylists->VideoFiles"."videoStreamingPlaylistId" = "VideoStreamingPlaylists"."id"');
        Object.assign(attributes, {
            '"VideoFiles"."id"': '"VideoFiles.id"',
            '"VideoFiles"."createdAt"': '"VideoFiles.createdAt"',
            '"VideoFiles"."updatedAt"': '"VideoFiles.updatedAt"',
            '"VideoFiles"."resolution"': '"VideoFiles.resolution"',
            '"VideoFiles"."size"': '"VideoFiles.size"',
            '"VideoFiles"."extname"': '"VideoFiles.extname"',
            '"VideoFiles"."infoHash"': '"VideoFiles.infoHash"',
            '"VideoFiles"."fps"': '"VideoFiles.fps"',
            '"VideoFiles"."videoId"': '"VideoFiles.videoId"',
            '"VideoStreamingPlaylists"."id"': '"VideoStreamingPlaylists.id"',
            '"VideoStreamingPlaylists->VideoFiles"."id"': '"VideoStreamingPlaylists.VideoFiles.id"',
            '"VideoStreamingPlaylists->VideoFiles"."createdAt"': '"VideoStreamingPlaylists.VideoFiles.createdAt"',
            '"VideoStreamingPlaylists->VideoFiles"."updatedAt"': '"VideoStreamingPlaylists.VideoFiles.updatedAt"',
            '"VideoStreamingPlaylists->VideoFiles"."resolution"': '"VideoStreamingPlaylists.VideoFiles.resolution"',
            '"VideoStreamingPlaylists->VideoFiles"."size"': '"VideoStreamingPlaylists.VideoFiles.size"',
            '"VideoStreamingPlaylists->VideoFiles"."extname"': '"VideoStreamingPlaylists.VideoFiles.extname"',
            '"VideoStreamingPlaylists->VideoFiles"."infoHash"': '"VideoStreamingPlaylists.VideoFiles.infoHash"',
            '"VideoStreamingPlaylists->VideoFiles"."fps"': '"VideoStreamingPlaylists.VideoFiles.fps"',
            '"VideoStreamingPlaylists->VideoFiles"."videoId"': '"VideoStreamingPlaylists.VideoFiles.videoId"'
        });
    }
    if (options.user) {
        joins.push('LEFT OUTER JOIN "userVideoHistory" ' +
            'ON "video"."id" = "userVideoHistory"."videoId" AND "userVideoHistory"."userId" = :userVideoHistoryId');
        replacements.userVideoHistoryId = options.user.id;
        Object.assign(attributes, {
            '"userVideoHistory"."id"': '"userVideoHistory.id"',
            '"userVideoHistory"."currentTime"': '"userVideoHistory.currentTime"'
        });
    }
    if (options.videoPlaylistId) {
        joins.push('INNER JOIN "videoPlaylistElement" as "VideoPlaylistElement" ON "videoPlaylistElement"."videoId" = "video"."id" ' +
            'AND "VideoPlaylistElement"."videoPlaylistId" = :videoPlaylistId');
        replacements.videoPlaylistId = options.videoPlaylistId;
        Object.assign(attributes, {
            '"VideoPlaylistElement"."createdAt"': '"VideoPlaylistElement.createdAt"',
            '"VideoPlaylistElement"."updatedAt"': '"VideoPlaylistElement.updatedAt"',
            '"VideoPlaylistElement"."url"': '"VideoPlaylistElement.url"',
            '"VideoPlaylistElement"."position"': '"VideoPlaylistElement.position"',
            '"VideoPlaylistElement"."startTimestamp"': '"VideoPlaylistElement.startTimestamp"',
            '"VideoPlaylistElement"."stopTimestamp"': '"VideoPlaylistElement.stopTimestamp"',
            '"VideoPlaylistElement"."videoPlaylistId"': '"VideoPlaylistElement.videoPlaylistId"'
        });
    }
    const select = 'SELECT ' + Object.keys(attributes).map(key => {
        const value = attributes[key];
        if (value)
            return `${key} AS ${value}`;
        return key;
    }).join(', ');
    return `${select} FROM (${baseQuery}) AS "tmp" ${joins.join(' ')} ${order}`;
}
exports.wrapForAPIResults = wrapForAPIResults;
