const jwt = require('jsonwebtoken');
const mm = require('../utilities/globalModule');
const formidable = require('formidable');
const path = require('path');
const logger = require("../utilities/logger");
const applicationkey = process.env.APPLICATION_KEY;
const fs = require('fs');
const TechnicianActionLog = require('../utilities/dbMongo');
const GlobalData = require("../modules/globalData");
const MAP_API_KEY = process.env.MAP_API_KEY || 'AIzaSyDT0rIRA3oOkwIhszO4xoZIiYfzkTc_4WY';
const axios = require('axios');
const ServicesActivityLog = require('../modules/serviceLog'); // Assuming correct imports for Mongoose models
const systemActivityLog = require('../modules/systemLog'); // Assuming correct imports for Mongoose models
const CryptoJS = require('crypto-js');
const mime = require('mime-types');


exports.requireAuthentication = function (req, res, next) {
    try {
        var apikey = req.headers['apikey'];
        var applicationkey = req.headers['applicationkey'];
        console.log("apikey...", apikey)
        console.log("applicationkey", applicationkey)
        console
        if (apikey && applicationkey) {
            const bytes = CryptoJS.AES.decrypt(apikey, process.env.WEB_SECRET);
            var apiKeys = bytes.toString(CryptoJS.enc.Utf8);
            const applicationKeybytes = CryptoJS.AES.decrypt(applicationkey, process.env.WEB_SECRET);
            var applicationKeysKeys = applicationKeybytes.toString(CryptoJS.enc.Utf8);
            if (apiKeys == process.env.APIKEY && applicationKeysKeys == process.env.APPLICATION_KEY) {
                next();
            } else {
                res.send({
                    "code": 300,
                    "message": "Access Denied...!"
                });
            }
        }
        else {
            res.send({
                "code": 400,
                "message": "Parameter missingg.."
            });
        }

    } catch (error) {
        console.log(error)
        res.send({
            "code": 400,
            "message": "Server not found..."
        });
    }
}

//Updated on 28-03-2026
exports.checkTokenOLD = (req, res, next) => {

    let bearerHeader = req.headers['token'];
    let SECRET_KEY;

    // console.log("\n\n\n\nreq.headers", req.headers)
    console.log("process.env.PANEL_ORIGIN..", process.env.PANEL_ORIGIN)

    if (!(req.headers.origin == process.env.PANEL_ORIGIN || req.headers.origin == process.env.INTERNAL_PANEL_ORIGIN || req.headers.origin == process.env.WEB_ORIGIN || req.headers.origin == process.env.INTERNAL_WEB_ORIGIN)) {
        return res.status(403).send({
            code: 403,
            message: 'Forbidden'
        });
    } else if ((req.headers.origin == process.env.PANEL_ORIGIN) || (req.headers.origin == process.env.INTERNAL_PANEL_ORIGIN)) {
        SECRET_KEY = process.env.PANEL_SECRET
        console.log("SECRET_KEY.. in panel ....", SECRET_KEY)
    } else {
        SECRET_KEY = process.env.WEB_SECRET
        console.log("SECRET_KEY.. in Website ....", SECRET_KEY)
    }
    if (typeof bearerHeader !== 'undefined') {
        jwt.verify(bearerHeader, SECRET_KEY, (err, authData) => {
            if (err) {
                res.send({
                    'code': 303,
                    'message': 'Invalid token'
                });
            }
            else {
                //req.authData = authData;
                req.body.authData = authData;
                next();
            }
        });
    }
    else {
        res.send({
            'code': 400,
            'message': 'Access Denied...!'
        });
    }
}

exports.checkToken = (req, res, next) => {

    let bearerHeader = req.headers['token'];
    let SECRET_KEY;
    const origin = req.headers.origin;
    //console.log("\n\n\n\nHeards:", req.headers)


    console.log("process.env.PANEL_ORIGIN..", process.env.PANEL_ORIGIN);

    // Skip origin validation if origin is undefined
    if (origin) {
        if (!(origin == process.env.PANEL_ORIGIN ||
            origin == process.env.INTERNAL_PANEL_ORIGIN ||
            origin == process.env.WEB_ORIGIN ||
            origin == process.env.INTERNAL_WEB_ORIGIN)) {

            return res.status(403).send({
                code: 403,
                message: 'Forbidden'
            });
        }

        // Decide secret key based on origin
        if (origin == process.env.PANEL_ORIGIN || origin == process.env.INTERNAL_PANEL_ORIGIN) {
            SECRET_KEY = process.env.PANEL_SECRET;
            console.log("SECRET_KEY.. in panel ....", SECRET_KEY);
        } else {
            SECRET_KEY = process.env.WEB_SECRET;
            console.log("SECRET_KEY.. in Website ....", SECRET_KEY);
        }

    } else {
        let decoded = null;

        try {
            decoded = jwt.decode(bearerHeader);
        } catch (e) {
            decoded = null;
        }

        if (decoded && decoded.data && decoded.data.source === 'panel') {
            SECRET_KEY = process.env.PANEL_SECRET;
            console.log("Using PANEL_SECRET from token");
        } else {
            SECRET_KEY = process.env.WEB_SECRET;
            console.log("Using WEB_SECRET from token");
        }
    }

    if (typeof bearerHeader !== 'undefined') {
        console.log("\n\n SECRET_KEY :", SECRET_KEY)
        jwt.verify(bearerHeader, SECRET_KEY, (err, authData) => {
            if (err) {
                return res.send({
                    code: 303,
                    message: 'Invalid token'
                });
            } else {
				console.log("authData",authData)
                req.body.authData = authData;
                next();
            }
        });
    } else {
        res.send({
            code: 400,
            message: 'Access Denied...!'
        });
    }
};

exports.uploadFiles = function (req, res) {
    const fs = require('fs');
    var folderName = req.params['folderName'];
    var pathName = path.join(__dirname, '../uploads/', folderName, '/');

    // Folder check
    if (!fs.existsSync(pathName)) {
        return res.status(400).send({
            "code": 400,
            "message": "Folder not found"
        });
    }

    // Stage incoming files inside the app instead of os.tmpdir(). On Windows
    // os.tmpdir() resolves to a per-session folder (…\AppData\Local\Temp\<id>)
    // that the OS deletes when the session ends; formidable never creates its
    // upload dir, so the write stream fails ENOENT *after* form.parse has
    // already called back with no error, and the file silently never exists.
    var tmpDir = path.join(__dirname, '../uploads/tmp');
    fs.mkdirSync(tmpDir, { recursive: true });

    var form = new formidable.IncomingForm({
        uploadDir: tmpDir,
        multiples: true, // allow multiple files under the same "Image" field
        keepExtensions: true
    });

    form.parse(req, function (error, fields, files) {
        if (error) {
            console.error('uploadFiles: form parse failed:', error);
            return res.status(400).send({
                "code": 400,
                "message": "Error parsing the form",
                "error": error && error.message ? error.message : String(error)
            });
        }

        if (!files.Image) {
            return res.status(400).send({
                "code": 400,
                "message": "No image file uploaded"
            });
        }

        // Normalize to an array so a single file and multiple files are handled
        // the same way (formidable returns a single object for one file, an
        // array when several files share the "Image" field name).
        var images = Array.isArray(files.Image) ? files.Image : [files.Image];
        var savedFiles = [];

        try {
            images.forEach(function (image) {
                // Fall back to the temp file name when the client sends the part
                // without a filename, and strip any directory component so a
                // crafted name can't escape the uploads folder.
                var rawName = image.originalFilename || image.newFilename || path.basename(image.filepath);
                var safeName = path.basename(String(rawName));
                var newPath = path.join(pathName, safeName);

                // Formidable reports success even when its write stream failed,
                // so confirm the staged file is really on disk before moving it.
                if (!image.filepath || !fs.existsSync(image.filepath)) {
                    throw new Error(
                        'Staged upload missing at ' + image.filepath +
                        ' (formidable wrote nothing for "' + safeName + '")'
                    );
                }

                // Move rather than read-into-memory + write: same volume, so this
                // is a rename, and it keeps large files off the heap.
                try {
                    fs.renameSync(image.filepath, newPath);
                } catch (renameErr) {
                    if (renameErr.code !== 'EXDEV') throw renameErr;
                    fs.copyFileSync(image.filepath, newPath);
                    fs.unlinkSync(image.filepath);
                }
                savedFiles.push(safeName);
            });
        } catch (e) {
            console.error('uploadFiles failed:', {
                folderName: folderName,
                pathName: pathName,
                files: images.map(function (i) {
                    return { originalFilename: i && i.originalFilename, filepath: i && i.filepath, size: i && i.size };
                }),
                error: e && e.stack ? e.stack : e
            });
            return res.status(500).send({
                "code": 500,
                "message": "Failed to upload",
                "error": e && e.message ? e.message : String(e)
            });
        }

        res.send({
            "code": 200,
            "message": "Uploaded successfully",
            "files": savedFiles
        });
    });
};
exports.downloadFiles = (req, res) => {
    const filename = req.params.filename;
    const folderName = req.params.folderName;

    // Sanitize the folder and file names.
    const safeFolderName = path.normalize(folderName);
    const safeFilename = path.normalize(filename);

    const absoluteUploadPath = path.resolve(__dirname, '../uploads');
    const filePath = path.resolve(absoluteUploadPath, safeFolderName, safeFilename);

    // Check if the requested file is within the allowed uploads directory.
    if (!filePath.startsWith(absoluteUploadPath)) {
        return res.status(400).send('Invalid file path.');
    }
    // Check if the file exists
    fs.access(filePath, fs.constants.F_OK, (error) => {
        if (error) {
            return res.status(404).send('File not found');
        }

        // Set appropriate headers for download
        const mimeType = mime.lookup(filename);
        res.setHeader('Content-type', mimeType || 'application/octet-stream');
        res.setHeader('Content-disposition', 'attachment; filename=' + filename);
        res.setHeader('Content-type', 'application/octet-stream'); // Or the correct MIME type

        // Stream the file to the response
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);

        fileStream.on('error', (streamError) => {
            console.error('Error streaming file:', streamError);
            res.status(500).send('Internal server error');
        });

    });
}


exports.getDownloadLink = (req, res) => {
    const filename = req.params.filename;
    const folderName = req.params.folderName;

    if (!filename || !folderName) {
        return res.status(400).json({
            success: false,
            message: "Filename and folderName are required.",
        });
    }

    const downloadLink = `${process.env.FILE_URL}/${folderName}/${filename}`;

    res.status(200).json({
        success: true,
        message: "Download link generated successfully.",
        downloadLink,
    });
};

exports.actionLogs = async (TECHNICIAN_ID, VENDOR_ID, ORDER_ID, JOB_CARD_ID, CUSTOMER_ID, LOG_TYPE, ACTION_LOG_TYPE, ACTION_DETAILS, USER_ID, TECHNICIAN_NAME, ORDER_DATE_TIME, CART_ID, EXPECTED_DATE_TIME, ORDER_MEDIUM, ORDER_STATUS, PAYMENT_MODE, PAYMENT_STATUS, TOTAL_AMOUNT, ORDER_NUMBER, TASK_DESCRIPTION, ESTIMATED_TIME_IN_MIN, PRIORITY, JOB_CARD_STATUS, USER_NAME, DATE_TIME, supportKey) => {
    try {
        console.log("data:", TECHNICIAN_ID, VENDOR_ID, ORDER_ID, JOB_CARD_ID, CUSTOMER_ID, LOG_TYPE, ACTION_LOG_TYPE, ACTION_DETAILS, USER_ID, TECHNICIAN_NAME, ORDER_DATE_TIME, CART_ID, EXPECTED_DATE_TIME, ORDER_MEDIUM, ORDER_STATUS, PAYMENT_MODE, PAYMENT_STATUS, TOTAL_AMOUNT, ORDER_NUMBER, TASK_DESCRIPTION, ESTIMATED_TIME_IN_MIN, PRIORITY, JOB_CARD_STATUS, USER_NAME, supportKey)
        //await connectToDatabase();
        const logEntry = new TechnicianActionLog({ TECHNICIAN_ID, VENDOR_ID, ORDER_ID, JOB_CARD_ID, CUSTOMER_ID, LOG_TYPE, ACTION_LOG_TYPE, ACTION_DETAILS, CLIENT_ID: 1, USER_ID, TECHNICIAN_NAME, ORDER_DATE_TIME, CART_ID, EXPECTED_DATE_TIME, ORDER_MEDIUM, ORDER_STATUS, PAYMENT_MODE, PAYMENT_STATUS, TOTAL_AMOUNT, ORDER_NUMBER, TASK_DESCRIPTION, ESTIMATED_TIME_IN_MIN, PRIORITY, JOB_CARD_STATUS, USER_NAME, DATE_TIME });
        const result = await logEntry.save();
        console.log("Log entry saved successfully:", result);

        //await closeDatabaseConnection();
    } catch (error) {
        console.log("Error in actionLogs:", error);
        //await closeDatabaseConnection();
    }
};


// General log function
async function logToDatabase(model, data) {
    try {
        //await connectToDatabase(); // Open DB connection
        const logEntry = new model(data);
        const result = await logEntry.save();
        console.log("Log entry added successfully:", result);
    } catch (error) {
        console.error("Error in logging entry:", error);
        throw error;
    } finally {
        //await closeDatabaseConnection(); // Close DB connection after operation
    }
}

// Service Logs
exports.serviceLogs = async (logData) => {
    try {
        const result = await logToDatabase(ServicesActivityLog, logData);
        console.log("result", result);
        return result;
    } catch (error) {
        console.error("Error in serviceLogs:", error);
        throw error;
    }
};

// Action System Logs
exports.actionSystemLogs = async (logData) => {
    try {
        const result = await logToDatabase(systemActivityLog, logData);
        console.log("result", result);
        return result;
    } catch (error) {
        console.error("Error in actionSystemLogs:", error);
        throw error;
    }
};


exports.addDatainGlobal = (ID, CATEGORY, TITLE, DATA, ROUTE, TERRITORY_ID, supportKey) => {
    try {
        mm.executeQueryData(
            `CALL sp_global_addDatainGlobal(?,?,?,?,?,?)`,
            [ID, CATEGORY, TITLE, DATA, ROUTE, TERRITORY_ID],
            supportKey,
            (error, results) => {

                if (error) {
                    console.log(error);
                } else {
                    console.log("Success");
                }

            }
        );

    } catch (error) {
        console.log(error);
    }

}


//update by me
exports.searchGlobally = async (req, res) => {
    try {
        let { pageIndex, pageSize, sortKey, sortValue, searchKey, category, TERRITORY_ID, TYPE } = req.body;

        pageIndex = pageIndex ? parseInt(pageIndex) : 1;
        pageSize = pageSize ? parseInt(pageSize) : 10;
        sortKey = sortKey || 'ID';
        sortValue = sortValue === 'ASC' ? 1 : -1;

        let filter = {};

        if (category) filter.CATEGORY = category;

        // Apply searchKey on raw DATA and TITLE only
        if (searchKey) {
            filter.$or = [
                { DATA: { $regex: searchKey, $options: 'i' } },
                { TITLE: { $regex: searchKey, $options: 'i' } }
            ];
        }

        if (TERRITORY_ID && TERRITORY_ID.length > 0) {
            filter.TERRITORY_ID = { $in: TERRITORY_ID };
        }

        if (TYPE === "M") {
            filter.CATEGORY = { $in: ["Category", "SubCategory", "Service"] };
        } else if (TYPE === "W") {
            const excludeCategories = ["Category", "SubCategory", "Service"];
            filter.CATEGORY = category
                ? { $nin: excludeCategories, $in: [category] }
                : { $nin: excludeCategories };
        }

        console.log("FILTER", JSON.stringify(filter));

        const totalCount = await GlobalData.countDocuments(filter);

        const data = await GlobalData.aggregate([
            { $match: filter },
            { $sort: { [sortKey]: sortValue } },
            { $skip: (pageIndex - 1) * pageSize },
            { $limit: pageSize },
            {
                $group: {
                    _id: "$CATEGORY",
                    MATCHED_RECORDS: {
                        $push: {
                            ID: "$ID",
                            SOURCE_ID: "$SOURCE_ID",
                            CATEGORY: "$CATEGORY",
                            TITLE: "$TITLE",
                            DATA: "$DATA",
                            ROUTE: "$ROUTE"
                        }
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    CATEGORY: "$_id",
                    MATCHED_RECORDS: 1
                }
            }
        ]);

        // Parse stringified DATA fields
        data.forEach(category => {
            category.MATCHED_RECORDS.forEach(record => {
                try {
                    record.DATA = record.DATA ? JSON.parse(record.DATA) : {};
                } catch (e) {
                    console.error("JSON Parsing Error for DATA:", record.DATA);
                    record.DATA = {};
                }
            });
        });

        res.send({
            code: 200,
            message: "success",
            count: totalCount,
            data
        });

    } catch (error) {
        console.error(error);
        res.send({ code: 500, message: "Something went wrong." });
    }
};

exports.globalDataForWeb = (req, res) => {
    var supportKey = req.headers['supportkey'];

    let CUSTOMER_ID = req.body.CUSTOMER_ID;
    let searchKey = req.body.searchKey || '';

    try {
        mm.executeQueryData(
            `CALL sp_globalDataForWeb(?, ?)`,
            [CUSTOMER_ID, searchKey],
            supportKey,
            (error, results) => {

                if (error) {
                    console.log(error);
                    return res.send({
                        code: 400,
                        message: "Failed to fetch data"
                    });
                }

                // SP returns multiple result sets
                let services = results[0];
                let categories = results[1];
                let subcategories = results[2];
                let items = results[3];
                let itemCategories = results[4];

                const formattedResponse = formatResponse(
                    categories,
                    subcategories,
                    services,
                    items,
                    itemCategories
                );

                res.send({
                    code: 200,
                    message: "success",
                    count: formattedResponse.data.length,
                    data: formattedResponse.data
                });
            }
        );

    } catch (error) {
        console.log(error);
        res.send({
            code: 500,
            message: "Something went wrong"
        });
    }
};


function formatResponse(categories, subcategories, services, items, itemCategories) {
    const response = {
        data: []
    };

    console.log("itemCategories", itemCategories);


    if (categories && categories.length > 0) {
        const categoryData = {
            MATCHED_RECORDS: categories.map(cat => ({
                SOURCE_ID: cat.ID,
                CATEGORY: "Category",
                TITLE: cat.NAME,
                DATA: cat,
                ROUTE: "masters/category"
            })),
            CATEGORY: "Category"
        };
        response.data.push(categoryData);
    }

    if (subcategories && subcategories.length > 0) {
        const subCategoryData = {
            MATCHED_RECORDS: subcategories.map(subCat => ({
                SOURCE_ID: subCat.ID,
                CATEGORY: "SubCategory",
                TITLE: subCat.NAME,
                DATA: subCat,
                ROUTE: "masters/subcategory"
            })),
            CATEGORY: "SubCategory"
        };
        response.data.push(subCategoryData);
    }

    if (services && services.length > 0) {
        const serviceData = {
            MATCHED_RECORDS: services.map(service => ({
                SOURCE_ID: service.ID,
                CATEGORY: "Service",
                TITLE: service.NAME,
                DATA: service,
                ROUTE: "masters/service"
            })),
            CATEGORY: "Service"
        };
        response.data.push(serviceData);
    }

    if (itemCategories && itemCategories.length > 0) {
        const itemCategoryData = {
            MATCHED_RECORDS: itemCategories.map(cat => ({
                SOURCE_ID: cat.ID,
                CATEGORY: "ItemBrands",
                TITLE: cat.BRAND_NAME,
                DATA: cat,
                ROUTE: ""
            })),
            CATEGORY: "ItemBrands"
        };
        response.data.push(itemCategoryData);
    }

    if (items && items.length > 0) {
        const itemData = {
            MATCHED_RECORDS: items.map(item => ({
                SOURCE_ID: item.ID,
                CATEGORY: "Items",
                TITLE: item.ITEM_NAME,
                DATA: item,
                ROUTE: "inventory/item"
            })),
            CATEGORY: "Items"
        };
        response.data.push(itemData);
    }

    // if (itemSubcategories && itemSubcategories.length > 0) {
    //     const itemSubCategoryData = {
    //         MATCHED_RECORDS: itemSubcategories.map(subCat => ({
    //             SOURCE_ID: subCat.ID,
    //             CATEGORY: "Brands",
    //             TITLE: subCat.BRAND_NAME,
    //             DATA: subCat,
    //             ROUTE: "inventory/subcategory"
    //         })),
    //         CATEGORY: "ItemSubCategory"
    //     };
    //     response.data.push(itemSubCategoryData);
    // }

    return response;
}

exports.getPlaces = async (req, res) => {
    const supportKey = req.headers['supportkey'];
    const SEARCHKEY = req.body.SEARCHKEY;

    try {
        if (!SEARCHKEY) {
            return res.status(400).send({
                code: 400,
                message: "Parameter Missing: SEARCHKEY is required.",
            });
        }

        const response = await axios.get(
            `https://maps.googleapis.com/maps/api/place/autocomplete/json`,
            {
                params: {
                    input: SEARCHKEY,
                    key: MAP_API_KEY,
                    language: 'en',
                },
            }
        );
        console.log("Response: ", response);

        res.status(200).send({
            code: 200,
            message: "Success",
            data: response.data.predictions,
        });

    } catch (error) {
        logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(error)}`, applicationkey);
        console.error(error);

        res.status(500).send({
            code: 500,
            message: "Something went wrong.",
        });
    }
};

exports.getPlaceDetails = async (req, res) => {
    const supportKey = req.headers['supportkey'];
    const placeId = req.body.placeId;

    try {
        if (!placeId) {
            return res.status(400).send({
                code: 400,
                message: "Parameter Missing: placeId is required.",
            });
        }

        const response = await axios.get(
            `https://maps.googleapis.com/maps/api/place/details/json`,
            {
                params: {
                    place_id: placeId,
                    key: MAP_API_KEY,
                    language: 'en',
                },
            }
        );

        const result = response.data.result;
        const { lat, lng } = result.geometry.location;
        const address = result.formatted_address;

        res.status(200).send({
            code: 200,
            message: "Success",
            data: {
                lat,
                lng,
                address,
            },
        });

    } catch (error) {
        logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(error)}`, applicationkey);
        console.error(error);

        res.status(500).send({
            code: 500,
            message: "Something went wrong.",
        });
    }
};

exports.getDirections = async (req, res) => {
    const supportKey = req.headers['supportkey'];
    const LOCATION_LATITUDE = req.body.LOCATION_LATITUDE;
    const LOCATION_LONG = req.body.LOCATION_LONG;
    const destination = req.body.destination; // expecting { LOCATION_LATITUDE, LOCATION_LONG }

    try {
        if (
            !LOCATION_LATITUDE || !LOCATION_LONG ||
            !destination?.LOCATION_LATITUDE || !destination?.LOCATION_LONG
        ) {
            return res.status(400).send({
                code: 400,
                message: "Parameter Missing: Origin or Destination coordinates are required.",
            });
        }

        const originStr = `${LOCATION_LATITUDE},${LOCATION_LONG}`;
        const destStr = `${destination.LOCATION_LATITUDE},${destination.LOCATION_LONG}`;

        console.log("originStr:", originStr);
        console.log("destStr:", destStr);

        const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${originStr}&destination=${destStr}&key=${MAP_API_KEY}`;

        const response = await axios.get(url);
        const json = response.data;

        if (!json.routes || json.routes.length === 0) {
            return res.status(404).send({
                code: 404,
                message: "No route found between the provided coordinates.",
            });
        }

        const route = json.routes[0];
        const leg = route.legs[0];

        const lat = leg.end_location.lat;
        const lng = leg.end_location.lng;
        const address = leg.end_address;

        res.status(200).send({
            code: 200,
            message: "Success",
            json: json,
            data: {
                lat,
                lng,
                address,
                distance: leg.distance.text,
                duration: leg.duration.text,
            },
        });

    } catch (error) {
        logger?.error?.(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(error.message || error)}`, applicationkey);
        console.error("Error in getDirections:", error.message);

        res.status(500).send({
            code: 500,
            message: "Something went wrong.",
            error: error.message,
        });
    }
};
