/**
 * E-Commerce Application
 *
 * Contact: sad@gmail.com
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
import { HttpHeaders }                                       from '@angular/common/http';

import { Observable }                                        from 'rxjs';

import { CustomerOrderStatsProjection } from '../model/models';
import { DailyOrderStatsProjection } from '../model/models';
import { DashboardSummaryProjection } from '../model/models';
import { MonthlyOrderStatsProjection } from '../model/models';
import { OrderDetailsStatsProjection } from '../model/models';
import { OrderStatsProjection } from '../model/models';
import { OrderStatusDistributionProjection } from '../model/models';
import { OrdersByLocationProjection } from '../model/models';
import { PaymentTypeStatsProjection } from '../model/models';
import { ProductSalesStatsProjection } from '../model/models';
import { RecentOrderProjection } from '../model/models';
import { RevenueByPeriodProjection } from '../model/models';
import { TopCustomersProjection } from '../model/models';
import { TopSellingProductProjection } from '../model/models';
import { UserRoleDistributionProjection } from '../model/models';


import { Configuration }                                     from '../configuration';



export interface AdminStatisticsServiceInterface {
    defaultHeaders: HttpHeaders;
    configuration: Configuration;

    /**
     * 
     * 
     */
    getCustomerOrderStatistics(extraHttpRequestParams?: any): Observable<Array<CustomerOrderStatsProjection>>;

    /**
     * 
     * 
     * @param days 
     */
    getDailyOrderStats(days?: number, extraHttpRequestParams?: any): Observable<Array<DailyOrderStatsProjection>>;

    /**
     * 
     * 
     */
    getDashboardSummary(extraHttpRequestParams?: any): Observable<DashboardSummaryProjection>;

    /**
     * 
     * 
     */
    getLast10Orders(extraHttpRequestParams?: any): Observable<Array<RecentOrderProjection>>;

    /**
     * 
     * 
     */
    getLastMonthOrderStats(extraHttpRequestParams?: any): Observable<Array<DailyOrderStatsProjection>>;

    /**
     * 
     * 
     */
    getLastWeekOrderStats(extraHttpRequestParams?: any): Observable<Array<DailyOrderStatsProjection>>;

    /**
     * 
     * 
     */
    getLastYearOrderStats(extraHttpRequestParams?: any): Observable<Array<MonthlyOrderStatsProjection>>;

    /**
     * 
     * 
     * @param months 
     */
    getMonthlyOrderStats(months?: number, extraHttpRequestParams?: any): Observable<Array<MonthlyOrderStatsProjection>>;

    /**
     * 
     * 
     */
    getOrderDetailsStatistics(extraHttpRequestParams?: any): Observable<OrderDetailsStatsProjection>;

    /**
     * 
     * 
     */
    getOrderStatistics(extraHttpRequestParams?: any): Observable<OrderStatsProjection>;

    /**
     * 
     * 
     */
    getOrderStatusDistribution(extraHttpRequestParams?: any): Observable<Array<OrderStatusDistributionProjection>>;

    /**
     * 
     * 
     */
    getOrdersByLocation(extraHttpRequestParams?: any): Observable<Array<OrdersByLocationProjection>>;

    /**
     * 
     * 
     */
    getPaymentTypeStatistics(extraHttpRequestParams?: any): Observable<Array<PaymentTypeStatsProjection>>;

    /**
     * 
     * 
     */
    getProductSalesStatistics(extraHttpRequestParams?: any): Observable<Array<ProductSalesStatsProjection>>;

    /**
     * 
     * 
     * @param limit 
     */
    getRecentOrders(limit?: number, extraHttpRequestParams?: any): Observable<Array<RecentOrderProjection>>;

    /**
     * 
     * 
     * @param startDate 
     * @param endDate 
     */
    getRevenueByPeriod(startDate: string, endDate: string, extraHttpRequestParams?: any): Observable<Array<RevenueByPeriodProjection>>;

    /**
     * 
     * 
     */
    getTop10Customers(extraHttpRequestParams?: any): Observable<Array<TopCustomersProjection>>;

    /**
     * 
     * 
     */
    getTop10Products(extraHttpRequestParams?: any): Observable<Array<TopSellingProductProjection>>;

    /**
     * 
     * 
     * @param limit 
     */
    getTopCustomers(limit?: number, extraHttpRequestParams?: any): Observable<Array<TopCustomersProjection>>;

    /**
     * 
     * 
     * @param limit 
     */
    getTopSellingProducts(limit?: number, extraHttpRequestParams?: any): Observable<Array<TopSellingProductProjection>>;

    /**
     * 
     * 
     */
    getUserRoleDistribution(extraHttpRequestParams?: any): Observable<Array<UserRoleDistributionProjection>>;

}
