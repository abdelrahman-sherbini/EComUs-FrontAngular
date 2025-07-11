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

import { PagedResponseProductDTO } from '../model/models';
import { ProductDTO } from '../model/models';
import { WishlistDTO } from '../model/models';


import { Configuration }                                     from '../configuration';



export interface CustomerWishlistServiceInterface {
    defaultHeaders: HttpHeaders;
    configuration: Configuration;

    /**
     * 
     * 
     * @param productId 
     */
    _delete(productId: number, extraHttpRequestParams?: any): Observable<{}>;

    /**
     * 
     * 
     * @param productId 
     */
    add(productId: number, extraHttpRequestParams?: any): Observable<ProductDTO>;

    /**
     * 
     * 
     * @param productId 
     */
    getById(productId: number, extraHttpRequestParams?: any): Observable<WishlistDTO>;

    /**
     * 
     * 
     * @param pageNum 
     * @param pageSize 
     * @param sortField Field to sort by. Allowed values: productId, userId
     * @param sortDir Sort direction
     * @param keyword Keyword to search across multiple fields
     * @param productName Filter by product name
     * @param description Filter by description
     * @param priceMin Filter by minimum price
     * @param priceMax Filter by maximum price
     * @param categoryId Filter by categoryId
     * @param categoryName Filter by categoryName
     */
    getWishItems(pageNum?: number, pageSize?: number, sortField?: 'productId' | 'userId', sortDir?: 'asc' | 'desc', keyword?: any, productName?: any, description?: any, priceMin?: any, priceMax?: any, categoryId?: any, categoryName?: any, extraHttpRequestParams?: any): Observable<PagedResponseProductDTO>;

}
