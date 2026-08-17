const express = require('express');
const router = express.Router();
const ReportService = require('../../services/Reports/reports');
const CouponReportService = require('../../services/Reports/coupon');

router
    .post('/getCount', ReportService.getCount)//d
    .post('/technicianBelow4Ratings', ReportService.technicianBelow4Ratings)//d
    .post('/technicianHighRatings', ReportService.techniciaNHighRatings)//d
    .post('/customerBelow4Ratings', ReportService.customerBelow4Ratings)//d
    .post('/customerHighRatings', ReportService.customerHighRatings)//d
    .post('/getEarnings', ReportService.getEarnings)//d
    .post('/orderPieChart', ReportService.orderPieChart)//d
    .post('/orderSummaryReport', ReportService.OrderSummaryReport)//d
    .post('/orderDetailedReport', ReportService.orderDetailedReport)//d
    .post('/technicianPerformanceReport', ReportService.technicianPerformanceReport)//d
    .post('/serviceUtilizationReport', ReportService.serviceUtilizationReport)//d
    .post('/refundReport', ReportService.refundReport)//d
    .post('/technicianwiseJobCardReport', ReportService.technicianwiseJobCardReport)//d
    .post('/vendorPerformanceReport', ReportService.vendorPerformanceReport)//d
    .post('/customerServiceFeedbackReport', ReportService.customerServiceFeedbackReport)//d
    .post('/customerTechnicianFeedbackReport', ReportService.customerTechnicianFeedbackReport)//d
    .post('/technicianCustomerFeedbackReport', ReportService.technicianCustomerFeedbackReport)
    .post('/orderCancellationReport', ReportService.orderCancellationReport)//d
    .post('/customerRegistrationReport', ReportService.customerRegistrationReport)
    .post('/jobAssignmentReport', ReportService.jobAssignmentReport)//d
    .post('/orderwiseJobCardDetailedReport', ReportService.orderwiseJobCardDetailedReport)//d
    .post('/orderwiseJobCardDetailedReport/customers', ReportService.getScopedCustomersForOrderDetailsReport)//d
    .post('/emailTransactionHistory', ReportService.emailTransactionHistory)//d
    .post('/smsTransactionHistory', ReportService.smsTransactionHistory)//d
    .post('/whatsappTransactionHistory', ReportService.whatsappTransactionHistory)//d
    .post('/b2bcustomerServicesSummery', ReportService.b2bcustomerServicesSummery)//d
    .post('/technicianTimeSheet', ReportService.technicianTimeSheet)//d
    .post('/coupon/detailed/get', CouponReportService.getDetailedReport)//d
    .post('/coupon/summary/get', CouponReportService.getSummaryReport)//d
    .post('/getTechnicianEarnings', ReportService.getTechnicianEarnings)//d
    .post('/couponDetailedReport', CouponReportService.getCustomerDetailedReport)//d
    .post('/couponSummaryReport', CouponReportService.getCustomerSummaryReport)//d
    .post('/gettechnicianCashCollection', ReportService.gettechnicianCashCollection)//d
    .post('/getDistinctOrderNumbers', ReportService.getDistinctOrderNumbers)//d
    .post('/vendorDetailedPerformanceReport', ReportService.vendorDetailedPerformanceReport)//d
    .post('/getTechnicianSLAReport', ReportService.getTechnicianSLAReport)//d
    .post('/getCustomerAddressLogs', ReportService.getCustomerAddressLogs)//d
    .post('/userloginLogs', ReportService.userloginLogs)//d






module.exports = router;
