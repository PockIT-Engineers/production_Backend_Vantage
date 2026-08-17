// Server-side customer scoping for Reports endpoints.
//
// Mirrors the exact, already-proven order-list authorization logic in the admin panel
// (src/app/orderpages/orderlist/orderlist.component.ts: role-exclusion list, role-7
// CUSTOMER_MANAGER_ID special case, and customer_spoc_mapping-based TERRITORY_IDS for
// everyone else) so that Reports enforce the same "mapped Service Desk user only sees
// their mapped customers" rule that Orders already enforce today — but enforced here,
// server-side, so it can't be skipped by any caller regardless of what filter it sends.
//
// Reuses the same stored procedures the frontend already calls for this (sp_customer_get,
// sp_customerSpocMapping_get) via the existing mm.executeQueryData helper — no new SQL,
// no new schema assumptions.

const mm = require('./globalModule');

// Roles that see all customers, unrestricted. Matches orderlist.component.ts's
// `decreptedroleId != 1 && != 6 && != 8 && != 9` exclusion exactly.
const UNRESTRICTED_ROLE_IDS = [1, 6, 8, 9];

// Role 7 is scoped via customer_master.CUSTOMER_MANAGER_ID rather than customer_spoc_mapping.
// Matches orderlist.component.ts's `decreptedroleId == 7` branch exactly.
const CUSTOMER_MANAGER_ROLE_ID = 7;

const NO_ACCESS_CLAUSE = ' AND 1=0';

function runProc(query, supportKey) {
    return new Promise((resolve, reject) => {
        mm.executeQueryData(query, [], supportKey, (error, results) => {
            if (error) return reject(error);
            resolve(results);
        });
    });
}

// Stored procedures here follow the pageIndex/pageSize/sortKey/sortValue/filter convention
// used everywhere in this codebase, and return [countResultSet, dataResultSet] — same
// extraction pattern already used throughout services/Reports/*.js and services/Masters/*.js.
function extractRows(results) {
    const sets = (results || []).filter(r => Array.isArray(r));
    return sets[1] || [];
}

// The login JWT's cached UserData is unreliable for authorization — it only ever carries
// {USER_ID, USER_NAME, NAME}, never ROLE_ID or BACKOFFICE_TEAM_ID (see generateToken() in
// services/UserAccess/user.js — a pre-existing gap, not something to fix here). USER_ID at
// the top level of the JWT payload is reliably present, so resolve role/backoffice identity
// fresh from the DB on every request instead of trusting anything cached in the token. This
// also means a role change takes effect immediately, without requiring the user to re-login.
async function getCurrentUserIdentity(userId, supportKey) {
    const setContext = `
        SET @v_PAGE_INDEX = 0;
        SET @v_PAGE_SIZE = 0;
        SET @v_SORT_KEY = 'ID';
        SET @v_SORT_VALUE = 'desc';
        SET @v_FILTER = ' AND ID=${userId}';
    `;
    const results = await runProc(setContext + `CALL sp_userMaster_get();`, supportKey);
    return extractRows(results)[0] || null;
}

async function getCustomerIdsManagedBy(backofficeId, supportKey) {
    const setContext = `
        SET @v_PAGE_INDEX = 0;
        SET @v_PAGE_SIZE = 0;
        SET @v_SORT_KEY = 'ID';
        SET @v_SORT_VALUE = 'desc';
        SET @v_FILTER = ' AND CUSTOMER_MANAGER_ID=${backofficeId}';
    `;
    const results = await runProc(setContext + `CALL sp_customer_get();`, supportKey);
    return extractRows(results).map(row => row.ID);
}

async function getMappedCustomerIds(userId, supportKey) {
    const setContext = `
        SET @v_PAGE_INDEX = 0;
        SET @v_PAGE_SIZE = 0;
        SET @v_SORT_KEY = 'ID';
        SET @v_SORT_VALUE = 'desc';
        SET @v_FILTER = ' AND IS_ACTIVE=1 AND USER_ID=${userId}';
    `;
    const results = await runProc(setContext + `CALL sp_customerSpocMapping_get();`, supportKey);
    return extractRows(results).map(row => row.CUSTOMER_ID);
}

async function expandParentAndChildCustomerIds(customerIds, supportKey) {
    if (!customerIds.length) return [];
    const idList = customerIds.join(',');
    const setContext = `
        SET @v_PAGE_INDEX = 0;
        SET @v_PAGE_SIZE = 0;
        SET @v_SORT_KEY = 'ID';
        SET @v_SORT_VALUE = 'desc';
        SET @v_FILTER = ' AND (PARENT_CUSTOMER_ID IN (${idList}) OR ID IN (${idList}))';
    `;
    const results = await runProc(setContext + `CALL sp_customer_get();`, supportKey);
    return extractRows(results).map(row => row.ID);
}

/**
 * Returns a SQL fragment to append to a report's `filter` before it's sent to the
 * stored procedure, or `null` if this user's role is unrestricted.
 *
 * Fails closed: a missing/unresolvable USER_ID, or a restricted user with zero active
 * customer mappings, returns `AND 1=0` (empty results) rather than no restriction.
 *
 * `idColumn` is the column the scope clause filters on — defaults to `CUSTOMER_ID`, the
 * foreign key used by every report table this was originally built for. Callers querying
 * customer_master itself (whose own primary key is just `ID`, not `CUSTOMER_ID`) should
 * pass `idColumn: 'ID'`.
 *
 * `failClosedOnUnknownIdentity` (default true) governs what happens when the token's
 * USER_ID doesn't resolve to a user_master row at all — i.e. this isn't an admin-panel
 * identity. Reports are admin-panel-only, so failing closed is correct and safe here.
 * See getOrderListCustomerScopeClause below for endpoints shared with the customer/
 * technician apps, where that default would be wrong.
 */
async function getReportCustomerScopeClause(authData, supportKey, idColumn = 'CUSTOMER_ID', failClosedOnUnknownIdentity = true) {
    const tokenUserId = Number(authData && authData.data && authData.data.USER_ID);
    if (!tokenUserId) {
        // No identity at all (malformed/missing token data) — always fail closed,
        // regardless of failClosedOnUnknownIdentity, which only concerns identities
        // that ARE present but belong to a different login system (see below).
        return NO_ACCESS_CLAUSE;
    }

    const userData = await getCurrentUserIdentity(tokenUserId, supportKey);
    if (!userData) {
        return failClosedOnUnknownIdentity ? NO_ACCESS_CLAUSE : null;
    }

    const roleId = Number(userData.ROLE_ID);
    if (UNRESTRICTED_ROLE_IDS.includes(roleId)) {
        return null;
    }

    const userId = Number(userData.ID);
    const backofficeId = Number(userData.BACKOFFICE_TEAM_ID) || userId;

    if (roleId === CUSTOMER_MANAGER_ROLE_ID) {
        if (!backofficeId) return NO_ACCESS_CLAUSE;
        const customerIds = await getCustomerIdsManagedBy(backofficeId, supportKey);
        return customerIds.length ? ` AND ${idColumn} IN (${customerIds.join(',')})` : NO_ACCESS_CLAUSE;
    }

    if (!userId) return NO_ACCESS_CLAUSE;
    const mappedCustomerIds = await getMappedCustomerIds(userId, supportKey);
    if (!mappedCustomerIds.length) return NO_ACCESS_CLAUSE;

    const territoryIds = await expandParentAndChildCustomerIds(mappedCustomerIds, supportKey);
    return territoryIds.length ? ` AND ${idColumn} IN (${territoryIds.join(',')})` : NO_ACCESS_CLAUSE;
}

/**
 * Same scoping as getReportCustomerScopeClause, for endpoints shared with the customer and
 * technician mobile apps — e.g. order/getOrderDetails, which the admin panel, the customer
 * app, and the technician app all call. Those apps log in through customer_master /
 * technician_master, not user_master, so their USER_ID will never resolve to an admin-panel
 * identity here. Failing closed in that case (like the report-only variant does) would wrongly
 * block their own already-existing self-service access. Instead: if the identity resolves to
 * a real admin-panel user, apply the exact same role-based scoping Reports gets; if it doesn't
 * resolve at all, leave it unrestricted AT THIS LAYER — those apps scope themselves through
 * their own separate, pre-existing logic, unrelated to and unaffected by this function.
 */
async function getOrderListCustomerScopeClause(authData, supportKey, idColumn = 'CUSTOMER_ID') {
    return getReportCustomerScopeClause(authData, supportKey, idColumn, false);
}

module.exports = { getReportCustomerScopeClause, getOrderListCustomerScopeClause };
