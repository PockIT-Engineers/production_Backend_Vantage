var admin = require("firebase-admin");
var serviceAccount = require("./serviceAccountKey.json");
// const logger = require("../logger/logger").Logger;


admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    
});
// exports.admin= admin;


exports.generateNotification = function (topic, deviceID, notificationType, title, body, data1, data2, data3, data4, data5, channelId, attachmentType, attachmentUrl) {
    try {
        var data = {
            notificationType: notificationType,
            title: title,
            body: body,
            data1: data1,
            data2: data2,
            data3: data3,
            data4: data4,
            data5: data5,
            channelId: channelId,
            attachmentType: attachmentType ? attachmentType : '',
            attachmentUrl: attachmentUrl ? attachmentUrl : ''
        }

        console.log("\n\n\n\nin firebase data:", data);


        var message = {
            data: data
        };
        var options = {
            "priority": "high",
            //timeToLive: 1000 //default value 2419200 //four weeks
        };

        var data21 = deviceID ? deviceID : true + topic ? topic : true + " " + JSON.stringify(message) + " ";

        if (topic) {
            var message = {
                notification: {

                    title: title,
                    body: body,
                },
                android: {
                    notification: {
                        sound: 'default',
                        channelId: 'custom',
                    },
                },
                apns: {
                    payload: {
                        aps: {
                            sound: 'custom_ios_sound.wav',
                        },
                    },
                },
                data: {
                    notificationType: notificationType,
                    data1: data1,
                    data2: data2,
                    data3: data3,
                    data4: data4,
                    data5: data5,
                    attachmentType: attachmentType ? attachmentType : '',
                    attachmentUrl: attachmentUrl ? attachmentUrl : '',
                },
                topic: topic
            }
            admin.messaging().send(message)
                .then((response) => {
                    // Response is a message ID string.
                    console.log('Successfully sent message to Topic:', response);
                    addNotificationHistory('T', topic, JSON.stringify(data), JSON.stringify(response), 'S', 0, title, body, attachmentType, attachmentUrl);

                })
                .catch((error) => {
                    console.log('Error sending message:', error);
                    addNotificationHistory('T', topic, JSON.stringify(data), JSON.stringify(error), 'E', 0, title, body, attachmentType, attachmentUrl);
                });
        }
        else if (Array.isArray(deviceID)) {
            console.log("array", deviceID)
            console.log('multicast');
            const payload = {
                notification: {

                    title: title,
                    body: body,
                },
                android: {
                    notification: {
                        sound: 'default',
                        channelId: 'custom',
                    },
                },
                apns: {
                    payload: {
                        aps: {
                            sound: 'custom_ios_sound.wav',
                        },
                    },
                },
                data: {
                    notificationType: notificationType,
                    data1: data1,
                    data2: data2,
                    data3: data3,
                    data4: data4,
                    data5: data5,
                    attachmentType: attachmentType ? attachmentType : '',
                    attachmentUrl: attachmentUrl ? attachmentUrl : '',
                },
            };

            deviceID.forEach(item => {

                payload.token = item.FIREBASE_REG_TOKEN;
                admin.messaging().send(payload)
                    .then((response) => {
                        console.log('Successfully sent message to Device:', response);
                        addNotificationHistory('D', item.FIREBASE_REG_TOKEN, JSON.stringify(data), JSON.stringify(response), 'S', title, body, attachmentType, attachmentUrl);

                    })
                    .catch((error) => {
                        console.log('Error sending message:', error);
                        addNotificationHistory('D', item.FIREBASE_REG_TOKEN, JSON.stringify(data), JSON.stringify(error), 'E', title, body, attachmentType, attachmentUrl);
                    });
            });


        }
        else if (deviceID) {
            console.log('deviceID', deviceID);
            const payload = {
                token: deviceID,
                notification: {

                    title: title,
                    body: body,
                },
                android: {
                    notification: {
                        sound: 'default',
                        channelId: 'custom',
                    },
                },
                apns: {
                    payload: {
                        aps: {
                            sound: 'custom_ios_sound.wav',
                        },
                    },
                },
                data: {

                    notificationType: notificationType,
                    data1: data1,
                    data2: data2,
                    data3: data3,
                    data4: data4,
                    data5: data5,
                    attachmentType: attachmentType ? attachmentType : '',
                    attachmentUrl: attachmentUrl ? attachmentUrl : '',
                },
            };

            admin.messaging().send(payload)
                .then((response) => {
                    console.log('Successfully sent message to Device:', response);
                    addNotificationHistory('D', deviceID, JSON.stringify(data), JSON.stringify(response), 'S', title, body, attachmentType, attachmentUrl);

                })
                .catch((error) => {
                    console.log('Error sending message:', error);
                    addNotificationHistory('D', deviceID, JSON.stringify(data), JSON.stringify(error), 'E', title, body, attachmentType, attachmentUrl);

                });
        }

    } catch (error) {
        console.log(error);
    }
}

exports.generateNotificationArray = function (topic, deviceID, notificationType, title, body, data1, data2, data3, data4, data5, imageUri, channelId, attachmentType, attachmentUrl) {
    //console.log(deviceID.length);

    try {
        var data = {
            notificationType: notificationType,
            title: title,
            body: body,
            data1: data1 ? data1 : '',
            data2: data2 ? data2 : '',
            data3: data3 ? data3 : '',
            data4: data4 ? data4 : '',
            data5: data5 ? data5 : '',
            imageUri: imageUri,
            channelId: channelId,
            attachmentType: attachmentType ? attachmentType : '',
            attachmentUrl: attachmentUrl ? attachmentUrl : ''
        }

        var message = {
            data: data
        };

        var options = {
            "priority": "high",
            //timeToLive: 1000 //default value 2419200 //four weeks
        };

        var data21 = deviceID ? deviceID : true + topic ? topic : true + " " + JSON.stringify(message) + " ";

        if (topic) {

            for (let i = 0; i < topic.length; i++) {
                const topicsName = topic[i];
                message.topic = topicsName;
                admin.messaging().send(message)
                    .then((response) => {
                        // Response is a message ID string.
                        //logger.info("SUCCESS : "+data21+" response:- "+JSON.stringify(response),'notificationLog');
                        console.log('Successfully sent message to Topic:', response);
                        //  addNotificationHistory('C',topic,notificationType,title,body,imageUri,data1,data2,data3,data4,data5,channelId,JSON.stringify(response),1)

                    })
                    .catch((error) => {
                        // logger.info("ERROR : "+data21+" error:- "+JSON.stringify(error),'notificationLog');
                        console.log('Error sending message:', error);
                        //addNotificationHistory('C',topic,notificationType,title,body,imageUri,data1,data2,data3,data4,data5,channelId,JSON.stringify(error),1)

                    });
            }
        }
        else if (Array.isArray(deviceID)) {
            console.log(deviceID)
            console.log('multicast');
            deviceID.forEach(deviceID => {
                admin.messaging().sendToDevice(deviceID, message, options)
                    .then((response) => {
                        // Response is a message ID string.
                        // logger.info("SUCCESS : "+data21+" response:- "+JSON.stringify(response),'notificationLog');
                        console.log('Successfully sent message to Device:', response);
                        // addNotificationHistory('S',deviceID,notificationType,title,body,imageUri,data1,data2,data3,data4,data5,channelId,JSON.stringify(response),1)

                    })
                    .catch((error) => {
                        //logger.info("ERROR : "+data21+" error:- "+JSON.stringify(error),'notificationLog');
                        console.log('Error sending message:', error);
                        // addNotificationHistory('S',deviceID,notificationType,title,body,imageUri,data1,data2,data3,data4,data5,channelId,JSON.stringify(error),1)

                    });
            });
        }
        else if (deviceID) {
            console.log('device');

            admin.messaging().sendToDevice(deviceID, message, options)
                .then((response) => {
                    // Response is a message ID string.
                    //logger.info(response,'0');

                    //logger.info("SUCCESS : "+data21+" response:- "+JSON.stringify(response),'notificationLog');
                    console.log('Successfully sent message to Device:', response);
                    // addNotificationHistory('S',deviceID,notificationType,title,body,imageUri,data1,data2,data3,data4,data5,channelId,JSON.stringify(response),1)

                })
                .catch((error) => {
                    //logger.info(error,'0');
                    //logger.info("ERROR : "+data21+" error:- "+JSON.stringify(error),'notificationLog');
                    console.log('Error sending message:', error);
                    //addNotificationHistory('S',deviceID,notificationType,title,body,imageUri,data1,data2,data3,data4,data5,channelId,JSON.stringify(error),1)

                });
        }
    } catch (error) {
        console.log(error);

    }

}

function addNotificationHistory(TYPE, TYPE_NAME, DATA, RESULT, STATUS, TITLE, BODY, ATTACHMENT_TYPE, ATTACHMENT_URL) {
    require('./globalModule').executeQueryData(`CALL sp_firebase_AddNotificationHistory(?,?,?,?,?,?,?,?,?)`, [TYPE, TYPE_NAME, DATA, RESULT, STATUS, TITLE, BODY, ATTACHMENT_TYPE, ATTACHMENT_URL], 'addNotificationHistory', (error, results) => {

        if (error) {
            console.log("Notification data save error. ", error);
        }
        else {
            console.log("Notification data saved successfully.", results);
        }
    });
}

