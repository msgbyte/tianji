-- Write your migration SQL here

-- WebsiteSession
CREATE TABLE IF NOT EXISTS WebsiteSession (
    id UUID,
    websiteId String,
    hostname String,
    browser String,
    os String,
    device String,
    screen String,
    language String,
    ip String,
    country FixedString(2),
    subdivision1 String,
    subdivision2 String,
    city String,
    longitude Float64 NULL,
    latitude Float64 NULL,
    accuracyRadius UInt32 NULL,
    createdAt DateTime64(3, 'UTC')
) ENGINE = ReplacingMergeTree()
PARTITION BY toYYYYMM(createdAt)
ORDER BY (websiteId, id, createdAt);

-- WebsiteEvent
CREATE TABLE IF NOT EXISTS WebsiteEvent (
    id String,
    websiteId String,
    sessionId UUID,
    urlPath String,
    urlQuery String NULL,
    referrerPath String NULL,
    referrerQuery String NULL,
    referrerDomain String NULL,
    pageTitle String NULL,
    eventType UInt8 DEFAULT 1,
    eventName String NULL,
    createdAt DateTime64(3, 'UTC')
) ENGINE = ReplacingMergeTree()
PARTITION BY toYYYYMM(createdAt)
ORDER BY (websiteId, id, createdAt);

-- WebsiteEventData
CREATE TABLE IF NOT EXISTS WebsiteEventData (
    id String,
    websiteId String,
    websiteEventId String,
    eventKey String,
    stringValue String NULL,
    numberValue Decimal(19, 4) NULL,
    dateValue DateTime64(3, 'UTC') NULL,
    dataType UInt8,
    createdAt DateTime64(3, 'UTC')
) ENGINE = ReplacingMergeTree()
PARTITION BY toYYYYMM(createdAt)
ORDER BY (websiteId, id, createdAt);

-- WebsiteSessionData
CREATE TABLE IF NOT EXISTS WebsiteSessionData (
    id String,
    websiteId String,
    sessionId UUID,
    key String,
    stringValue String NULL,
    numberValue Decimal(19, 4) NULL,
    dateValue DateTime64(3, 'UTC') NULL,
    dataType UInt8,
    createdAt DateTime64(3, 'UTC')
) ENGINE = ReplacingMergeTree()
PARTITION BY toYYYYMM(createdAt)
ORDER BY (websiteId, id, createdAt);

-- ApplicationSession
CREATE TABLE IF NOT EXISTS ApplicationSession (
    id UUID,
    applicationId String,
    os String,
    language String,
    ip String,
    country FixedString(2),
    subdivision1 String,
    subdivision2 String,
    city String,
    longitude Float64 NULL,
    latitude Float64 NULL,
    accuracyRadius UInt32 NULL,
    createdAt DateTime64(3, 'UTC')
) ENGINE = ReplacingMergeTree()
PARTITION BY toYYYYMM(createdAt)
ORDER BY (applicationId, id, createdAt);

-- ApplicationEvent
CREATE TABLE IF NOT EXISTS ApplicationEvent (
    id String,
    applicationId String,
    sessionId UUID,
    eventType UInt8 DEFAULT 1,
    eventName String,
    screenName String,
    screenParams String, -- 在ClickHouse中使用String存储JSON
    createdAt DateTime64(3, 'UTC')
) ENGINE = ReplacingMergeTree()
PARTITION BY toYYYYMM(createdAt)
ORDER BY (applicationId, id, createdAt);

-- ApplicationEventData
CREATE TABLE IF NOT EXISTS ApplicationEventData (
    id String,
    applicationId String,
    applicationEventId String,
    eventKey String,
    stringValue String,
    numberValue Decimal(19, 4) NULL,
    dateValue DateTime64(3, 'UTC') NULL,
    dataType UInt8,
    createdAt DateTime64(3, 'UTC')
) ENGINE = ReplacingMergeTree()
PARTITION BY toYYYYMM(createdAt)
ORDER BY (applicationId, id, createdAt);

-- ApplicationSessionData
CREATE TABLE IF NOT EXISTS ApplicationSessionData (
    id String,
    applicationId String,
    sessionId UUID,
    key String,
    stringValue String,
    numberValue Decimal(19, 4) NULL,
    dateValue DateTime64(3, 'UTC') NULL,
    dataType UInt8,
    createdAt DateTime64(3, 'UTC')
) ENGINE = ReplacingMergeTree()
PARTITION BY toYYYYMM(createdAt)
ORDER BY (applicationId, id, createdAt);
