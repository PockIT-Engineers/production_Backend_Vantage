const mm = require('../utilities/globalModule');
var tableName = "global_settings";
var viewTableName = "view_" + tableName;
const applicationkey = process.env.APPLICATION_KEY;

exports.get = (req, res) => {
    const supportKey = req.headers['supportkey'];
    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    var pageSize = req.body.pageSize ? req.body.pageSize : '';
    let sortKey = req.body.sortKey ? req.body.sortKey : 'ID';
    let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
    let filter = req.body.filter ? req.body.filter : '';

    filter = (filter || '').trim();
    const safeFilter = (filter || '').replace(/'/g, "\\'");

    const setContext = `
        SET @v_PAGE_INDEX = ${pageIndex || 0};
        SET @v_PAGE_SIZE = ${pageSize || 0};
        SET @v_SORT_KEY = '${sortKey}';
        SET @v_SORT_VALUE = '${sortValue}';
        SET @v_FILTER = '${safeFilter}';
    `;
    const IS_FILTER_WRONG = mm.sanitizeFilter(filter);

    if (IS_FILTER_WRONG !== "0")
        return res.status(400).json({ "message": "Invalid filter" });

    try {
        mm.executeQueryData(
            setContext + `CALL sp_globalSettings_get()`,
            [],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log("error", error)
                    return res.status(400).json({ "code": 400, "message": 'Failed to get globalsettings count.' });
                }
                const resultSets = results.filter(r => Array.isArray(r));
                const countResult = resultSets[0] || [];
                const dataResult = resultSets[1] || [];

                return res.status(200).json({
                    "code": 200,
                    "message": "success",
                    "TAB_ID": 16,
                    "count": countResult[0] ? countResult[0].cnt : 0,
                    "data": dataResult
                });
            }
        );
    } catch (error) {
        res.status(500).json({ "code": 500, "message": "Something went wrong" });
    }
};

exports.getVersion = (req, res) => {

    var supportKey = req.headers['supportkey'];

    try {

        mm.executeQuery(`CALL sp_globalSettings_getVersion()`, supportKey, (error, results) => {

            if (error) {

                console.log(error);

                res.send({
                    code: 400,
                    message: "error occurred"
                });

            } else {

                res.send({
                    code: 200,
                    message: "success",
                    data: [{
                        ...results[0][0],
                        SYSTEM_DATE: mm.getSystemDate()
                    }]
                });

            }

        });

    } catch (error) {

        console.log(error);

    }

}


exports.getVestionUpdatedHistory = (req, res) => {
    const supportKey = req.headers['supportkey'];
    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    var pageSize = req.body.pageSize ? req.body.pageSize : '';
    let sortKey = req.body.sortKey ? req.body.sortKey : 'ID';
    let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
    let filter = req.body.filter ? req.body.filter : '';

    filter = (filter || '').trim();
    const safeFilter = (filter || '').replace(/'/g, "\\'");

    const setContext = `
        SET @v_PAGE_INDEX = ${pageIndex || 0};
        SET @v_PAGE_SIZE = ${pageSize || 0};
        SET @v_SORT_KEY = '${sortKey}';
        SET @v_SORT_VALUE = '${sortValue}';
        SET @v_FILTER = '${safeFilter}';
    `;
    const IS_FILTER_WRONG = mm.sanitizeFilter(filter);

    if (IS_FILTER_WRONG !== "0")
        return res.status(400).json({ "message": "Invalid filter" });

    try {
        mm.executeQueryData(
            setContext + `CALL sp_globalSettings_getVestionUpdatedHistory()`,
            [],
            supportKey,
            (error, results) => {
                if (error) {
                    console.log("error", error)
                    return res.status(400).json({ "code": 400, "message": 'Failed to get vesrion update history count.' });
                }
                const resultSets = results.filter(r => Array.isArray(r));
                const countResult = resultSets[0] || [];
                const dataResult = resultSets[1] || [];

                return res.status(200).json({
                    "code": 200,
                    "message": "success",
                    "TAB_ID": 16,
                    "count": countResult[0] ? countResult[0].cnt : 0,
                    "data": dataResult
                });
            }
        );
    } catch (error) {
        res.status(500).json({ "code": 500, "message": "Something went wrong" });
    }
};



exports.updatedVersion = (req, res) => {
    var TECHNICIAN_MIN_VERSION = req.body.TECHNICIAN_MIN_VERSION;
    var TECHNICIAN_CUR_VERSION = req.body.TECHNICIAN_CUR_VERSION;
    var TECHNICIAN_APK_LINK = req.body.TECHNICIAN_APK_LINK ? req.body.TECHNICIAN_APK_LINK : '';
    var CUSTOMER_MIN_VERSION = req.body.CUSTOMER_MIN_VERSION;
    var CUSTOMER_CUR_VERSION = req.body.CUSTOMER_CUR_VERSION;
    var CUSTOMER_APK_LINK = req.body.CUSTOMER_APK_LINK ? req.body.CUSTOMER_APK_LINK : '';

    var TECHNICIAN_DESCRIPTION = req.body.TECHNICIAN_DESCRIPTION;
    var CUSTOMER_DESCRIPTION = req.body.CUSTOMER_DESCRIPTION;
    var TECHNICIAN_PREVIOUS_VERSION = req.body.TECHNICIAN_PREVIOUS_VERSION;
    var CUSTOMER_PREVIOUS_VERSION = req.body.CUSTOMER_PREVIOUS_VERSION;
    var USER_ID = req.body.USER_ID;
    var DATETIME = mm.getSystemDate()

    var supportKey = req.headers['supportkey'];

    try {
        if (!TECHNICIAN_MIN_VERSION || !TECHNICIAN_CUR_VERSION || !CUSTOMER_MIN_VERSION || !CUSTOMER_CUR_VERSION || !TECHNICIAN_PREVIOUS_VERSION || !CUSTOMER_PREVIOUS_VERSION || !USER_ID) {
            res.send({
                "code": 400,
                "message": "Parameter missing vesion or userid."
            });
        } else {

            var connection = mm.openConnection();
            mm.executeDML(`CALL sp_globalSettings_updatedVersion(?,?,?,?,?,?,?,?,?,?,?)`, [TECHNICIAN_MIN_VERSION, TECHNICIAN_CUR_VERSION, TECHNICIAN_APK_LINK, CUSTOMER_MIN_VERSION, CUSTOMER_CUR_VERSION, CUSTOMER_APK_LINK, TECHNICIAN_PREVIOUS_VERSION, CUSTOMER_PREVIOUS_VERSION, TECHNICIAN_DESCRIPTION, CUSTOMER_DESCRIPTION, USER_ID], supportKey, connection, (error, results) => {
                if (error) {

                    console.log(error);
                    mm.rollbackConnection(connection);
                    res.send({
                        "code": 400,
                        "message": "Failed to update APK information."
                    });
                } else {
                    mm.commitConnection(connection);
                    res.send({
                        "code": 200,
                        "message": "Apk Information Updated successfully..."
                    })
                }
            });
        }
    } catch (error) {

        console.log(error);
    }
}