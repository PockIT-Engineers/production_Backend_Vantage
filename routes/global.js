const express = require('express');
const router = express.Router();
const mm = require('../utilities/globalModule.js')
var globalService = require('../services/global');
const serviceNowAuth = require('../services/serviceNowAuth');


router

  .get('/inventoryRequest/processTokenRequest', require('../services/Inventory/inventoryRequest').processTokenRequest)
  .post('/inventoryRequest/updateRequestStatusEmail', require('../services/Inventory/inventoryRequest').updateRequestStatusEmail)
  .post('/inventoryRequest/updateRequestStatus', require('../services/Inventory/inventoryRequest').updateRequestStatus)

  .all('*', globalService.requireAuthentication)

  // Apis for service now integration
  .post('/api/serviceNow/generateToken', require('../services/Order/serviceNow').generateToken)
  .post('/api/serviceNow/customer/getCompanyNames', serviceNowAuth.verifyServiceNowToken, require('../services/Masters/customer').getCompanyNames)
  .post('/api/serviceNow/customer/get', serviceNowAuth.verifyServiceNowToken, require('../services/Masters/customer').get)
  .post('/api/serviceNow/customerSlaPriorityMapping/getPrioritytoData', serviceNowAuth.verifyServiceNowToken, require('../services/Masters/customerSlaPriorityMapping').getPrioritytoData)
  .post('/api/serviceNow/order/getCategories', serviceNowAuth.verifyServiceNowToken, require('../services/Order/order').getCategoriesHierarchy)
  .post('/api/serviceNow/customerHolidayMapping/get', serviceNowAuth.verifyServiceNowToken, require('../services/Masters/customerHolidayMapping').get)
  .post('/api/serviceNow/order/getServices', serviceNowAuth.verifyServiceNowToken, require('../services/Order/order').getServices)
  .post('/api/serviceNow/customerAddress/get', serviceNowAuth.verifyServiceNowToken, require('../services/Masters/customerAddress').get)
  .post('/api/serviceNow/addressSpocMapping/get', serviceNowAuth.verifyServiceNowToken, require('../services/Masters/addressSpocMapping').get)
  .post('/api/serviceNow/customerSlaPriorityMapping/get', serviceNowAuth.verifyServiceNowToken, require('../services/Masters/customerSlaPriorityMapping').get)
  .post('/api/serviceNow/ServiceNow/placeOrder', serviceNowAuth.verifyServiceNowToken, require('../services/Order/serviceNow').placeOrder)



  .post('/getPlaces', require('../services/global').getPlaces)
  .post('/getDirections', require('../services/global').getDirections)
  .post('/getPlaceDetails', require('../services/global').getPlaceDetails)
  .post('/upload/:folderName', globalService.uploadFiles)
  .use('/joinOurTeam/create', require('../services/Masters/joinOurTeam.js').create)
  .use('/joinOurTeam/get', require('../services/Masters/joinOurTeam.js').get)
  //without token used methods
  .post('/user/login', require('../services/UserAccess/user').login)
  .post('/updateOrderDelivery', require('../services/ShipModule/shopOrder').updateOrderDelivery)
  .post('/app/login', require('../services/Masters/technician').login)
  .post('/app/global/search', require('../services/global').searchGlobally)
  .post('/serviceCategory/get', require('../services/Masters/category').get)
  .post('/serviceSubCategory/get', require('../services/Masters/subCategory').get)
  .get('/app/inventoryCategory', require('../services/Inventory/inventoryCategory').get)
  .get('/app/inventorySubCategory', require('../services/Inventory/inventorySubCategory').get)
  //newly added
  .post('/services/get', require('../services/Masters/service').get)
  .post('/app/getinventorySubCategory', require('../services/Inventory/inventorySubCategory').get)
  .post('/app/getinventoryCategory', require('../services/Inventory/inventoryCategory').get)
  //newly ended
  .post('/app/ServiceCategory', require('../services/Masters/category').getCategorys)
  .post('/app/global/webSearch', require('../services/global').globalDataForWeb)
  .post('/app/technician/sendOTP', require('../services/Masters/technician').sendOTP)
  .post('/app/technician/verifyOTP', require('../services/Masters/technician').verifyOTP)
  .post('/app/technician/sendOTPToConfirm', require('../services/Masters/technician').sendOTPtoConfirm)
  .post('/app/technician/verifyOTPToConfirm', require('../services/Masters/technician').verifyOTPToConfirm)
  .post('/app/technician/confirmByLink', require('../services/Masters/technician').confirmByLink)
  .use('/globalSetting', require('./globalSettings'))
  .post('/customer/sendOTP/', require('../services/Masters/customer').sendOTPToDevice)
  .post('/customer/verifyOTP/', require('../services/Masters/customer').verifyOTP)
  .post('/customer/customerlogin/', require('../services/Masters/customer').customerlogin)
  .post('/customer/changeCustomerPassword/', require('../services/Masters/customer').changeCustomerPassword)
  .post('/customer/sendotpforchangepassword/', require('../services/Masters/customer').sendotpforchangepassword)
  .post('/customer/verifyOTPpassword/', require('../services/Masters/customer').verifyOTPpassword)
  .post('/admin/sendOTP', require('../services/UserAccess/user').sendOTPToDevice)
  .post('/admin/verifyOTP', require('../services/UserAccess/user').verifyOTP)
  .post('/admin/changePassword', require('../services/UserAccess/user').changePassword)
  .post('/customer/registerOtp/', require('../services/Masters/customer').registerOtp)

  //new api as per sla
  // .post('/order/getServices/', require('../services/Masters/service').getServices)//vantage old
  .post('/order/getServices/', require('../services/Order/order').getServices)
  .post('/order/getServicesForWeb/', require('../services/Order/order').getServicesForWeb)
  .post('/order/getCategories/', require('../services/Order/order').getCategoriesHierarchy)
  .post('/pincode/get', require('../services/Masters/pincode').get)
  .post('/state/get', require('../services/Masters/state').get)
  // .get('/app/getPoppulerServices', require('../services/Masters/service').getPoppulerServices) vantage old
  .post('/app/getPoppulerServicesForWeb', require('../services/Masters/service').getPoppulerServicesForWeb)
  .get('/app/getPoppulerServices/:CUSTOMER_TYPE/:CUSTOMER_ID', require('../services/Masters/service').getPoppulerServices)
  .post('/app/getPopularInvenotry', require('../services/Inventory/inventory').getPopularInvenotry)
  .post('/banner/get', require('../services/Masters/banner').get)
  .post('/brand/get', require('../services/Masters/brand').get)
  .post('/inventory/get', require('../services/Inventory/inventory').getForCart)
  .post('/inventory/getForCart', require('../services/Inventory/inventory').getForCart)
  .post('/territory/pincode/get', require('../services/Masters/territoryPincodeMapping').get)
  .post('/territory/pincode/get', require('../services/Masters/territoryPincodeMapping').get)
  .post('/customer/addCustomer', require('../services/Masters/customer').addCustomer)
  .post('/inventoryUnitMapping/get', require('../services/Inventory/inventoryUnitMapping').get)
  .post('/inventoryImageMapping/get', require('../services/Inventory/inventoryImageMapping').get)
  .post('/knowledgeBaseCategory/get', require('../services/Support/knowledgeBaseCategory').get)
  .post('/knowledgebaseSubCategory/get', require('../services/Support/knowledgebaseSubCategory').get)
  .post('/knowledgeBase/get', require('../services/Support/knowledgeBase').get)
  .post('/customerServiceFeedback/get', require('../services/Order/customerservicefeedback').get)
  .post('/customerServiceFeedback/getCustomerServiceFeedback', require('../services/Order/customerservicefeedback').getCustomerServiceFeedback)
  .post('/faq/get', require('../services/Support/faq').get)
  .post('/faqHead/get', require('../services/Support/faqHead').get)
  .all('*', globalService.requireAuthentication)
  .use('/api', globalService.checkToken)

  //user access
  .use('/api/form', require('./UserAccess/form'))
  .use('/api/role', require('./UserAccess/role'))
  .use('/api/roleDetails', require('./UserAccess/roleDetail'))
  .use('/api/user', require('./UserAccess/user'))

  //Masters
  .use('/api/addressSpocMapping', require('./Masters/addressSpocMapping.js'))
  .use('/api/appLanguage', require('./Masters/appLanguage'))
  .use('/api/b2bAvailabilityMapping', require('./Masters/b2bAvailabilityMapping'))
  .use('/api/backofficeDepartmentMapping', require('./Masters/backofficeDepartmentMapping'))
  .use('/api/backofficeTeam', require('./Masters/backofficeTeam'))
  .use('/api/backofficeTerritoryMapping', require('./Masters/backofficeTerritoryMapping'))//d
  .use('/api/banner', require('./Masters/banner'))
  .use('/api/branch', require('./Masters/branch'))
  .use('/api/brand', require('./Masters/brand'))
  .use('/api/category', require('./Masters/category'))
  .use('/api/city', require('./Masters/city'))
  .use('/api/country', require('./Masters/country'))
  .use('/api/countryCurrencyMapping', require('./Masters/countryCurrencyMapping'))//d
  .use('/api/coupon', require('./Masters/coupon'))//not in use
  .use('/api/couponCodeCountryMapping', require('./Masters/couponCodeCountryMapping'))//d
  .use('/api/couponCodeInventoryMapping', require('./Masters/couponCodeInventoryMapping'))//d
  .use('/api/couponCodeServiceMapping', require('./Masters/couponCodeServiceMapping'))//d
  .use('/api/couponCodeTerritoryMapping', require('./Masters/couponCodeTerritoryMapping'))//d
  .use('/api/couponTransaction', require('./Masters/couponTransaction'))//d
  .use('/api/couponType', require('./Masters/couponType'))//d
  .use('/api/couponUsage', require('./Masters/couponUsage'))//d
  .use('/api/currency', require('./Masters/currency'))//d
  .use('/api/customer', require('./Masters/customer')) //only verify otp api is pending
  .use('/api/customerAddress', require('./Masters/customerAddress'))
  .use('/api/customerCategory', require('./Masters/customerCategory'))
  .use('/api/customerEmailMapping', require('./Masters/customerEmailMapping'))
  .use('/api/customerEmailMaster', require('./Masters/customerEmailMaster'))
  .use('/api/customerHolidayChangeLogs', require('./Masters/customerHolidayChangeLogs.js'))
  .use('/api/customerHolidayMapping', require('./Masters/customerHolidayMapping.js'))
  .use('/api/customerSiteVisitConfig', require('./Masters/customerSiteVisitConfig'))
  .use('/api/customerSla', require('./Masters/customerSla'))
  .use('/api/customerSlaPriorityMapping', require('./Masters/customerSlaPriorityMapping'))//only mapPrioritytoSla api pending
  .use('/api/customerSpocMapping', require('./Masters/customerSpocMapping'))
  .use('/api/customerSupportDocument', require('./Masters/customerSupportDocument'))
  .use('/api/customerTechnicianMapping', require('./Masters/customerTechnicianMapping'))
  .use('/api/dashboard', require('./Masters/dashboard'))
  .use('/api/district', require('./Masters/district'))
  .use('/api/emailTemplate', require('./Masters/emailTemplate'))
  .use('/api/excel', require('./Masters/excel.js'))//in mongo
  .use('/api/excelImportColumnJson', require('./Masters/excelImportColumnJson.js'))
  .use('/api/helpDocumentCategory', require('./Masters/helpDocumentCategory'))
  .use('/api/helpDocumentSubCategory', require('./Masters/helpDocumentSubCategory'))
  .use('/api/hsn', require('./Masters/hsn'))
  .use('/api/iana', require('./Masters/iana'))
  .use('/api/jobCardStatus', require('./Masters/jobCardStatus'))
  .use('/api/jobTraining', require('./Masters/jobTraining'))
  .use('/api/joinOurTeam', require('./Masters/joinOurTeam.js'))
  .use('/api/language', require('./Masters/language'))
  .use('/api/notification', require('./Masters/notification'))
  .use('/api/orderStatus', require('./Masters/orderStatus'))
  .use('/api/organisation', require('./Masters/organisation'))
  .use('/api/pincode', require('./Masters/pincode'))
  .use('/api/service', require('./Masters/service'))  //PENDING GET TESTING
  .use('/api/serviceLogs', require('./Masters/service'))
  .use('/api/serviceDocumemtMapping', require('./Masters/serviceDocumemtMapping'))
  .use('/api/serviceDocument', require('./Masters/serviceDocument'))
  .use('/api/serviceSkillMapping', require('./Masters/serviceSkillMapping'))
  .use('/api/siteVisitReport', require('./Masters/siteVisitReport'))
  .use('/api/skill', require('./Masters/skill'))
  .use('/api/state', require('./Masters/state'))
  .use('/api/subCategory', require('./Masters/subCategory'))
  .use('/api/tax', require('./Masters/tax'))
  .use('/api/taxDetails', require('./Masters/taxDetails'))
  .use('/api/taxStateMapping', require('./Masters/taxStateMapping'))
  .use('/api/technician', require('./Masters/technician'))//PENDING GET TESTING
  .use('/api/techniciancertificaterequest', require('./Masters/techniciancertificaterequest'))
  .use('/api/technicianConfigurations', require('./Masters/technicianConfigurations'))
  .use('/api/technicianLanguageMapping', require('./Masters/technicianLanguageMapping'))
  .use('/api/technicianPincodeMapping', require('./Masters/technicianPincodeMapping'))
  .use('/api/technicianProfileUpdateRequest', require('./Masters/technicianProfileupdaterequest'))
  .use('/api/technicianSkillMapping', require('./Masters/technicianSkillMapping'))
  .use('/api/technicianSkillRequest', require('./Masters/technicianSkillRequest'))
  .use('/api/territory', require('./Masters/territory'))
  .use('/api/territoryPincodeMapping', require('./Masters/territoryPincodeMapping'))
  .use('/api/territoryServicenOnAvailabilityMapping', require('./Masters/territoryServicenOnAvailabilityMapping'))
  .use('/api/unit', require('./Masters/unit'))
  .use('/api/vendor', require('./Masters/vendor'))
  .use('/api/vendorServiceCostMapping', require('./Masters/vendorServiceCostMapping'))
  .use('/api/vendorTerritoryMapping', require('./Masters/vendorTerritoryMapping'))
  .use('/api/warehouseTerritoryMapping', require('./Masters/warehouseTerritoryMapping'))






  //UPLODS 
  .post('/api/upload/:folderName', globalService.uploadFiles)

  //dowload
  .get('/api/getFile/:folderName/:filename', globalService.downloadFiles)
  .post('/api/getFileLink', globalService.getDownloadLink)

  // order 
  .use('/api/cart', require('./Order/cart'))
  .use('/api/ServiceNow', require('./Order/serviceNow.js'))
  .use('/api/cartItemDetails', require('./Order/cartItemDetails'))
  .use('/api/cartSummaryDetails', require('./Order/cartSummaryDetails'))
  .use('/api/order', require('./Order/order'))
  .use('/api/orderMasterAddressMap', require('./Order/orderMasterAddressMap'))
  .use('/api/orderSummeryDetails', require('./Order/orderSummeryDetails'))
  .use('/api/orderDetails', require('./Order/orderDetails'))
  .use('/api/jobCard', require('./Order/jobCard'))
  .use('/api/invoice', require('./Order/invoice'))
  .use('/api/orderTechnicianLocationTrack', require('./Order/orderTechnicianLocationTrack'))
  .use('/api/technicianTimeTrack', require('./Order/technicianTimeTrack'))
  .use('/api/technicianActionLogs', require('./Order/technicianActionLogs'))
  .use('/api/orderrefundtransactions', require('./Order/orderrefundtransactions'))
  .use('/api/ordercancellationtransactions', require('./Order/ordercancellationtransactions'))
  .use('/api/techniciancustomerfeedback', require('./Order/techniciancustomerfeedback'))
  .use('/api/customertechnicianfeedback', require('./Order/customertechnicianfeedback'))
  .use('/api/customerServiceFeedback', require('./Order/customerservicefeedback'))
  .use('/api/invoicepaymentdetails', require('./Order/invoicepaymentdetails'))
  .use('/api/technicianJobSchedule', require('./Order/technicianJobSchedule'))
  .use('/api/jobPhotosDetails', require('./Order/jobPhotosDetails'))
  .use('/api/cancleOrderReason', require('./Order/cancleOrderReason'))
  .use('/api/jobRescheduleTransactions', require('./Order/jobRescheduleTransactions'))

  // Inventory
  .use('/api/inventory', require('./Inventory/inventory'))
  .use('/api/inventoryAccountTransaction', require('./Inventory/inventoryAccountTransaction'))
  .use('/api/inventoryAdjustment', require('./Inventory/inventoryAdjustment'))
  .use('/api/inventoryCategory', require('./Inventory/inventoryCategory'))
  .use('/api/customerMovement', require('./Inventory/inventoryCustomerMovement'))
  .use('/api/customerMovementDetails', require('./Inventory/inventoryCustomerMovementDetails'))
  .use('/api/inventoryImageMapping', require('./Inventory/inventoryImageMapping'))
  .use('/api/inventoryInward', require('./Inventory/inventoryInward'))
  .use('/api/inventoryInwardDetails', require('./Inventory/inventoryInwardDetails'))
  .use('/api/inventoryMovement', require('./Inventory/inventoryMovement'))
  .use('/api/inventoryMovementDetails', require('./Inventory/inventoryMovementDetails'))
  .use('/api/inventoryRequest', require('./Inventory/inventoryRequest'))
  .use('/api/inventoryRequestDetails', require('./Inventory/inventoryRequestDetails'))
  .use('/api/inventorySubCategory', require('./Inventory/inventorySubCategory'))
  .use('/api/technicianMovement', require('./Inventory/inventoryTechnicianMovement'))
  .use('/api/technicianMovementDetails', require('./Inventory/inventoryTechnicianMovementDetails'))
  .use('/api/inventoryTransactions', require('./Inventory/inventoryTransactions'))

  .use('/api/warehouse', require('./Inventory/warehouse'))


  .use('/api/inventoryTransactions', require('./Inventory/inventoryTransactions'))
  .use('/api/inventoryWarehouseStockManagement', require('./Inventory/inventoryWarehouseStockManagement'))

  .use('/api/inventoryUnitMapping', require('./Inventory/inventoryUnitMapping'))



  .use('/api/varient', require('./Inventory/varient'))











  // Support
  .use('/api/department', require('./Support/department'))
  .use('/api/faq', require('./Support/faq'))
  .use('/api/faqHead', require('./Support/faqHead'))
  .use('/api/faqResponses', require('./Support/faqResponse'))
  .use('/api/knowledgeBase', require('./Support/knowledgeBase'))
  .use('/api/knowledgeBaseCategory', require('./Support/knowledgeBaseCategory'))
  .use('/api/knowledgeBaseFeedbackTransactions', require('./Support/knowledgeBaseFeedbackTransactions'))
  .use('/api/knowledgebaseSubCategory', require('./Support/knowledgebaseSubCategory'))
  .use('/api/supportCategory', require('./Support/supportCategory'))
  .use('/api/supportSubCategory', require('./Support/supportSubCategory'))
  .use('/api/tickdeskDepartmentAdminMapping', require('./Support/tickdeskDepartmentAdminMapping'))
  .use('/api/tickdeskSupportUserMapping', require('./Support/tickdeskSupportUserMapping'))
  .use('/api/ticket', require('./Support/ticket'))
  .use('/api/ticketDetails', require('./Support/ticketDetails'))
  .use('/api/ticketFaqMapping', require('./Support/ticketFaqMapping'))
  .use('/api/ticketGroup', require('./Support/ticketGroup'))
  .use('/api/ticketLogDetails', require('./Support/ticketLogDetails'))






  //config
  .use('/api/customerConfigurations', require('./Config/customerConfigurations'))
  .use('/api/searchData', require('./Config/search'))
  .use('/api/saveFilter', require('./Config/saveFilter'))
  .use('/api/global/search', require('../services/global').searchGlobally)
  .use('/api/globalTimeSlotConfig', require('./Config/globalTimeSlotConfig'))
  .use('/api/globalTimeSlotMapping', require('./Config/globalTimeSlotMapping'))
  .use('/api/tempaltecategory', require('./Config/tempaltecategory'))
  .use('/api/placeholder', require('./Config/placeholder'))
  .use('/api/paymentGatewayTransactions', require('./Config/paymentGatewayTransactions'))


  //reports
  .use('/api/reports', require('./Reports/reports'))
  .use('/api/inventoryReports', require('./Reports/inventoryReports'))
  .use('/api/ticketGroupwiseSummaryReport', require('./Reports/ticketGroupwiseSummaryReport'))
  .use('/api/ticketGroupwiseDetailedReport', require('./Reports/ticketGroupwiseDetailedReport'))
  .use('/api/ticketTransferReport', require('./Reports/ticketTransferReport'))
  .use('/api/ticketResolutionTimeGroupwise', require('./Reports/ticketResolutionTimeGroupwise'))
  .use('/api/ticketSupportAgentwiseDetailedReport', require('./Reports/ticketSupportAgentwiseDetailedReport'))
  .use('/api/reports/coupon', require('./Reports/coupon'))


  //Mongo API methods
  .use('/api/technicianLocationTrack', require('../mongoRoutes/technicianLocationTrack'))
  .use('/api/technicianActivityCalender', require('../mongoRoutes/technicianActivityCalender'))
  .use('/api/technicainDayLog', require('../mongoRoutes/technicainDayLog'))
  .use('/api/jobchat', require('../mongoRoutes/jobCardChat'))
  .use('/api/orderChat', require('../mongoRoutes/orderChat'))
  .use('/api/inventoryActivityLogs', require('../mongoRoutes/inventoryActivityLogs'))
  .use('/api/InventoryTrack', require('../mongoRoutes/InventoryTrack'))
  .use('/api/shopOrderActionLog', require('../mongoRoutes/shopOrderActionLog'))
  .use('/api/channel', require('../mongoRoutes/channel'))
  .use('/api/channelSubscribedUsers', require('../mongoRoutes/channelSubscribedUsers'))


  //Coupon Module
  .use('/api/couponType', require('./Masters/couponType'))
  .use('/api/coupon', require('./Masters/coupon'))
  .use('/api/couponCodeInventoryMapping', require('./Masters/couponCodeInventoryMapping'))
  .use('/api/couponCodeServiceMapping', require('./Masters/couponCodeServiceMapping'))
  .use('/api/couponTransaction', require('./Masters/couponTransaction'))
  .use('/api/couponCodeTerritoryMapping', require('./Masters/couponCodeTerritoryMapping'))

  //shop module
  .use('/api/customerProductFeedback', require('./ShipModule/customerProductFeedback'))
  .use('/api/pickupLocation', require('./ShipModule/pickupLocation'))
  .use('/api/productReturns', require('./ShipModule/productReturns'))
  .use('/api/shiprocket', require('./ShipModule/shiprocket'))
  .use('/api/shiprocketLoginInfo', require('./ShipModule/shiprocketLoginInfo'))
  .use('/api/shipRocketOrderDetails', require('./ShipModule/shipRocketOrderDetails'))
  .use('/api/shiprocketWebhookLogs', require('./ShipModule/shiprocketWebhookLogs'))
  .use('/api/shopOrder', require('./ShipModule/shopOrder'))
  .use('/api/shopOrderAddressMap', require('./ShipModule/shopOrderAddressmap'))
  .use('/api/shopOrdercancellationtransactions', require('./ShipModule/shopOrdercancellationtransactions'))
  .use('/api/shopOrderDetails', require('./ShipModule/shopOrderdetails'))
  .use('/api/shopOrderSummaryDetails', require('./ShipModule/shopOrderSummaryDetails'))




  //Newly Added apis/Modules
  .use('/api/customerSla', require('./Masters/customerSla'))
  .use('/api/customerSlaPriorityMapping', require('./Masters/customerSlaPriorityMapping'))
  .use('/api/customerSiteVisitConfig', require('./Masters/customerSiteVisitConfig'))
  .use('/api/siteVisitReport', require('./Masters/siteVisitReport'))
  .use('/api/slaBreachReport', require('./Reports/slaBreach.js'))

  //Excel Import Export
  .use('/api/excelImportColumnJson', require('./Masters/excelImportColumnJson.js'))
  .use('/api/customerHolidayMapping', require('./Masters/customerHolidayMapping.js'))
  .use('/api/excel', require('./Masters/excel.js'))
  .use('/api/customerHolidayChangeLogs', require('./Masters/customerHolidayChangeLogs.js'))
  .use('/api/excelImport', require('../mongoRoutes/excelImport'))





module.exports = router;
