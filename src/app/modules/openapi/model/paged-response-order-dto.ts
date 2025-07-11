/**
 * E-Commerce Application
 *
 * Contact: sad@gmail.com
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
import { OrderDTO } from './order-dto';


export interface PagedResponseOrderDTO { 
    content?: Array<OrderDTO>;
    currentPage?: number;
    totalPages?: number;
    totalElements?: number;
    pageSize?: number;
    first?: boolean;
    last?: boolean;
    empty?: boolean;
    sortField?: string;
    sortDir?: string;
    keyword?: string;
    searchParams?: { [key: string]: any; };
    allowedSortFields?: Set<string>;
}

