/**
 * E-Commerce Application
 *
 * Contact: sad@gmail.com
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
/* tslint:disable:no-unused-variable member-ordering */

import { Inject, Injectable, Optional }                      from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams,
         HttpResponse, HttpEvent, HttpParameterCodec, HttpContext 
        }       from '@angular/common/http';
import { CustomHttpParameterCodec }                          from '../encoder';
import { Observable }                                        from 'rxjs';

// @ts-ignore
import { PasswordResetDTO } from '../model/password-reset-dto';
// @ts-ignore
import { PasswordResetRequestDTO } from '../model/password-reset-request-dto';
// @ts-ignore
import { Token } from '../model/token';
// @ts-ignore
import { UserSignInDTO } from '../model/user-sign-in-dto';
// @ts-ignore
import { UserSignUpDTO } from '../model/user-sign-up-dto';

// @ts-ignore
import { BASE_PATH, COLLECTION_FORMATS }                     from '../variables';
import { Configuration }                                     from '../configuration';
import { BaseService } from '../api.base.service';
import {
    AuthenticationServiceInterface
} from './authentication.serviceInterface';



@Injectable({
  providedIn: 'root'
})
export class AuthenticationService extends BaseService implements AuthenticationServiceInterface {

    constructor(protected httpClient: HttpClient, @Optional() @Inject(BASE_PATH) basePath: string|string[], @Optional() configuration?: Configuration) {
        super(basePath, configuration);
    }

    /**
     * @param passwordResetRequestDTO 
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     */
    public forgotPassword(passwordResetRequestDTO: PasswordResetRequestDTO, observe?: 'body', reportProgress?: boolean, options?: {httpHeaderAccept?: undefined, context?: HttpContext, transferCache?: boolean}): Observable<any>;
    public forgotPassword(passwordResetRequestDTO: PasswordResetRequestDTO, observe?: 'response', reportProgress?: boolean, options?: {httpHeaderAccept?: undefined, context?: HttpContext, transferCache?: boolean}): Observable<HttpResponse<any>>;
    public forgotPassword(passwordResetRequestDTO: PasswordResetRequestDTO, observe?: 'events', reportProgress?: boolean, options?: {httpHeaderAccept?: undefined, context?: HttpContext, transferCache?: boolean}): Observable<HttpEvent<any>>;
    public forgotPassword(passwordResetRequestDTO: PasswordResetRequestDTO, observe: any = 'body', reportProgress: boolean = false, options?: {httpHeaderAccept?: undefined, context?: HttpContext, transferCache?: boolean}): Observable<any> {
        if (passwordResetRequestDTO === null || passwordResetRequestDTO === undefined) {
            throw new Error('Required parameter passwordResetRequestDTO was null or undefined when calling forgotPassword.');
        }

        let localVarHeaders = this.defaultHeaders;

        const localVarHttpHeaderAcceptSelected: string | undefined = options?.httpHeaderAccept ?? this.configuration.selectHeaderAccept([
        ]);
        if (localVarHttpHeaderAcceptSelected !== undefined) {
            localVarHeaders = localVarHeaders.set('Accept', localVarHttpHeaderAcceptSelected);
        }

        const localVarHttpContext: HttpContext = options?.context ?? new HttpContext();

        const localVarTransferCache: boolean = options?.transferCache ?? true;


        // to determine the Content-Type header
        const consumes: string[] = [
            'application/json'
        ];
        const httpContentTypeSelected: string | undefined = this.configuration.selectHeaderContentType(consumes);
        if (httpContentTypeSelected !== undefined) {
            localVarHeaders = localVarHeaders.set('Content-Type', httpContentTypeSelected);
        }

        let responseType_: 'text' | 'json' | 'blob' = 'json';
        if (localVarHttpHeaderAcceptSelected) {
            if (localVarHttpHeaderAcceptSelected.startsWith('text')) {
                responseType_ = 'text';
            } else if (this.configuration.isJsonMime(localVarHttpHeaderAcceptSelected)) {
                responseType_ = 'json';
            } else {
                responseType_ = 'blob';
            }
        }

        let localVarPath = `/api/auth/forgot-password`;
        const { basePath, withCredentials } = this.configuration;
        return this.httpClient.request<any>('post', `${basePath}${localVarPath}`,
            {
                context: localVarHttpContext,
                body: passwordResetRequestDTO,
                responseType: <any>responseType_,
                ...(withCredentials ? { withCredentials } : {}),
                headers: localVarHeaders,
                observe: observe,
                transferCache: localVarTransferCache,
                reportProgress: reportProgress
            }
        );
    }

    /**
     * @param userSignInDTO 
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     */
    public login(userSignInDTO: UserSignInDTO, observe?: 'body', reportProgress?: boolean, options?: {httpHeaderAccept?: 'application/json', context?: HttpContext, transferCache?: boolean}): Observable<Token>;
    public login(userSignInDTO: UserSignInDTO, observe?: 'response', reportProgress?: boolean, options?: {httpHeaderAccept?: 'application/json', context?: HttpContext, transferCache?: boolean}): Observable<HttpResponse<Token>>;
    public login(userSignInDTO: UserSignInDTO, observe?: 'events', reportProgress?: boolean, options?: {httpHeaderAccept?: 'application/json', context?: HttpContext, transferCache?: boolean}): Observable<HttpEvent<Token>>;
    public login(userSignInDTO: UserSignInDTO, observe: any = 'body', reportProgress: boolean = false, options?: {httpHeaderAccept?: 'application/json', context?: HttpContext, transferCache?: boolean}): Observable<any> {
        if (userSignInDTO === null || userSignInDTO === undefined) {
            throw new Error('Required parameter userSignInDTO was null or undefined when calling login.');
        }

        let localVarHeaders = this.defaultHeaders;

        const localVarHttpHeaderAcceptSelected: string | undefined = options?.httpHeaderAccept ?? this.configuration.selectHeaderAccept([
            'application/json'
        ]);
        if (localVarHttpHeaderAcceptSelected !== undefined) {
            localVarHeaders = localVarHeaders.set('Accept', localVarHttpHeaderAcceptSelected);
        }

        const localVarHttpContext: HttpContext = options?.context ?? new HttpContext();

        const localVarTransferCache: boolean = options?.transferCache ?? true;


        // to determine the Content-Type header
        const consumes: string[] = [
            'application/json'
        ];
        const httpContentTypeSelected: string | undefined = this.configuration.selectHeaderContentType(consumes);
        if (httpContentTypeSelected !== undefined) {
            localVarHeaders = localVarHeaders.set('Content-Type', httpContentTypeSelected);
        }

        let responseType_: 'text' | 'json' | 'blob' = 'json';
        if (localVarHttpHeaderAcceptSelected) {
            if (localVarHttpHeaderAcceptSelected.startsWith('text')) {
                responseType_ = 'text';
            } else if (this.configuration.isJsonMime(localVarHttpHeaderAcceptSelected)) {
                responseType_ = 'json';
            } else {
                responseType_ = 'blob';
            }
        }

        let localVarPath = `/api/auth/login`;
        const { basePath, withCredentials } = this.configuration;
        return this.httpClient.request<Token>('post', `${basePath}${localVarPath}`,
            {
                context: localVarHttpContext,
                body: userSignInDTO,
                responseType: <any>responseType_,
                ...(withCredentials ? { withCredentials } : {}),
                headers: localVarHeaders,
                observe: observe,
                transferCache: localVarTransferCache,
                reportProgress: reportProgress
            }
        );
    }

    /**
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     */
    public logout(observe?: 'body', reportProgress?: boolean, options?: {httpHeaderAccept?: '*/*', context?: HttpContext, transferCache?: boolean}): Observable<string>;
    public logout(observe?: 'response', reportProgress?: boolean, options?: {httpHeaderAccept?: '*/*', context?: HttpContext, transferCache?: boolean}): Observable<HttpResponse<string>>;
    public logout(observe?: 'events', reportProgress?: boolean, options?: {httpHeaderAccept?: '*/*', context?: HttpContext, transferCache?: boolean}): Observable<HttpEvent<string>>;
    public logout(observe: any = 'body', reportProgress: boolean = false, options?: {httpHeaderAccept?: '*/*', context?: HttpContext, transferCache?: boolean}): Observable<any> {

        let localVarHeaders = this.defaultHeaders;

        const localVarHttpHeaderAcceptSelected: string | undefined = options?.httpHeaderAccept ?? this.configuration.selectHeaderAccept([
            '*/*'
        ]);
        if (localVarHttpHeaderAcceptSelected !== undefined) {
            localVarHeaders = localVarHeaders.set('Accept', localVarHttpHeaderAcceptSelected);
        }

        const localVarHttpContext: HttpContext = options?.context ?? new HttpContext();

        const localVarTransferCache: boolean = options?.transferCache ?? true;


        let responseType_: 'text' | 'json' | 'blob' = 'json';
        if (localVarHttpHeaderAcceptSelected) {
            if (localVarHttpHeaderAcceptSelected.startsWith('text')) {
                responseType_ = 'text';
            } else if (this.configuration.isJsonMime(localVarHttpHeaderAcceptSelected)) {
                responseType_ = 'json';
            } else {
                responseType_ = 'blob';
            }
        }

        let localVarPath = `/api/auth/logout`;
        const { basePath, withCredentials } = this.configuration;
        return this.httpClient.request<string>('post', `${basePath}${localVarPath}`,
            {
                context: localVarHttpContext,
                responseType: <any>responseType_,
                ...(withCredentials ? { withCredentials } : {}),
                headers: localVarHeaders,
                observe: observe,
                transferCache: localVarTransferCache,
                reportProgress: reportProgress
            }
        );
    }

    /**
     * @param userSignUpDTO 
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     */
    public register(userSignUpDTO: UserSignUpDTO, observe?: 'body', reportProgress?: boolean, options?: {httpHeaderAccept?: 'application/json', context?: HttpContext, transferCache?: boolean}): Observable<Token>;
    public register(userSignUpDTO: UserSignUpDTO, observe?: 'response', reportProgress?: boolean, options?: {httpHeaderAccept?: 'application/json', context?: HttpContext, transferCache?: boolean}): Observable<HttpResponse<Token>>;
    public register(userSignUpDTO: UserSignUpDTO, observe?: 'events', reportProgress?: boolean, options?: {httpHeaderAccept?: 'application/json', context?: HttpContext, transferCache?: boolean}): Observable<HttpEvent<Token>>;
    public register(userSignUpDTO: UserSignUpDTO, observe: any = 'body', reportProgress: boolean = false, options?: {httpHeaderAccept?: 'application/json', context?: HttpContext, transferCache?: boolean}): Observable<any> {
        if (userSignUpDTO === null || userSignUpDTO === undefined) {
            throw new Error('Required parameter userSignUpDTO was null or undefined when calling register.');
        }

        let localVarHeaders = this.defaultHeaders;

        const localVarHttpHeaderAcceptSelected: string | undefined = options?.httpHeaderAccept ?? this.configuration.selectHeaderAccept([
            'application/json'
        ]);
        if (localVarHttpHeaderAcceptSelected !== undefined) {
            localVarHeaders = localVarHeaders.set('Accept', localVarHttpHeaderAcceptSelected);
        }

        const localVarHttpContext: HttpContext = options?.context ?? new HttpContext();

        const localVarTransferCache: boolean = options?.transferCache ?? true;


        // to determine the Content-Type header
        const consumes: string[] = [
            'application/json'
        ];
        const httpContentTypeSelected: string | undefined = this.configuration.selectHeaderContentType(consumes);
        if (httpContentTypeSelected !== undefined) {
            localVarHeaders = localVarHeaders.set('Content-Type', httpContentTypeSelected);
        }

        let responseType_: 'text' | 'json' | 'blob' = 'json';
        if (localVarHttpHeaderAcceptSelected) {
            if (localVarHttpHeaderAcceptSelected.startsWith('text')) {
                responseType_ = 'text';
            } else if (this.configuration.isJsonMime(localVarHttpHeaderAcceptSelected)) {
                responseType_ = 'json';
            } else {
                responseType_ = 'blob';
            }
        }

        let localVarPath = `/api/auth/register`;
        const { basePath, withCredentials } = this.configuration;
        return this.httpClient.request<Token>('post', `${basePath}${localVarPath}`,
            {
                context: localVarHttpContext,
                body: userSignUpDTO,
                responseType: <any>responseType_,
                ...(withCredentials ? { withCredentials } : {}),
                headers: localVarHeaders,
                observe: observe,
                transferCache: localVarTransferCache,
                reportProgress: reportProgress
            }
        );
    }

    /**
     * @param passwordResetDTO 
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     */
    public resetPassword(passwordResetDTO: PasswordResetDTO, observe?: 'body', reportProgress?: boolean, options?: {httpHeaderAccept?: undefined, context?: HttpContext, transferCache?: boolean}): Observable<any>;
    public resetPassword(passwordResetDTO: PasswordResetDTO, observe?: 'response', reportProgress?: boolean, options?: {httpHeaderAccept?: undefined, context?: HttpContext, transferCache?: boolean}): Observable<HttpResponse<any>>;
    public resetPassword(passwordResetDTO: PasswordResetDTO, observe?: 'events', reportProgress?: boolean, options?: {httpHeaderAccept?: undefined, context?: HttpContext, transferCache?: boolean}): Observable<HttpEvent<any>>;
    public resetPassword(passwordResetDTO: PasswordResetDTO, observe: any = 'body', reportProgress: boolean = false, options?: {httpHeaderAccept?: undefined, context?: HttpContext, transferCache?: boolean}): Observable<any> {
        if (passwordResetDTO === null || passwordResetDTO === undefined) {
            throw new Error('Required parameter passwordResetDTO was null or undefined when calling resetPassword.');
        }

        let localVarHeaders = this.defaultHeaders;

        const localVarHttpHeaderAcceptSelected: string | undefined = options?.httpHeaderAccept ?? this.configuration.selectHeaderAccept([
        ]);
        if (localVarHttpHeaderAcceptSelected !== undefined) {
            localVarHeaders = localVarHeaders.set('Accept', localVarHttpHeaderAcceptSelected);
        }

        const localVarHttpContext: HttpContext = options?.context ?? new HttpContext();

        const localVarTransferCache: boolean = options?.transferCache ?? true;


        // to determine the Content-Type header
        const consumes: string[] = [
            'application/json'
        ];
        const httpContentTypeSelected: string | undefined = this.configuration.selectHeaderContentType(consumes);
        if (httpContentTypeSelected !== undefined) {
            localVarHeaders = localVarHeaders.set('Content-Type', httpContentTypeSelected);
        }

        let responseType_: 'text' | 'json' | 'blob' = 'json';
        if (localVarHttpHeaderAcceptSelected) {
            if (localVarHttpHeaderAcceptSelected.startsWith('text')) {
                responseType_ = 'text';
            } else if (this.configuration.isJsonMime(localVarHttpHeaderAcceptSelected)) {
                responseType_ = 'json';
            } else {
                responseType_ = 'blob';
            }
        }

        let localVarPath = `/api/auth/reset-password`;
        const { basePath, withCredentials } = this.configuration;
        return this.httpClient.request<any>('post', `${basePath}${localVarPath}`,
            {
                context: localVarHttpContext,
                body: passwordResetDTO,
                responseType: <any>responseType_,
                ...(withCredentials ? { withCredentials } : {}),
                headers: localVarHeaders,
                observe: observe,
                transferCache: localVarTransferCache,
                reportProgress: reportProgress
            }
        );
    }

    /**
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     */
    public token(observe?: 'body', reportProgress?: boolean, options?: {httpHeaderAccept?: 'application/json', context?: HttpContext, transferCache?: boolean}): Observable<Token>;
    public token(observe?: 'response', reportProgress?: boolean, options?: {httpHeaderAccept?: 'application/json', context?: HttpContext, transferCache?: boolean}): Observable<HttpResponse<Token>>;
    public token(observe?: 'events', reportProgress?: boolean, options?: {httpHeaderAccept?: 'application/json', context?: HttpContext, transferCache?: boolean}): Observable<HttpEvent<Token>>;
    public token(observe: any = 'body', reportProgress: boolean = false, options?: {httpHeaderAccept?: 'application/json', context?: HttpContext, transferCache?: boolean}): Observable<any> {

        let localVarHeaders = this.defaultHeaders;

        const localVarHttpHeaderAcceptSelected: string | undefined = options?.httpHeaderAccept ?? this.configuration.selectHeaderAccept([
            'application/json'
        ]);
        if (localVarHttpHeaderAcceptSelected !== undefined) {
            localVarHeaders = localVarHeaders.set('Accept', localVarHttpHeaderAcceptSelected);
        }

        const localVarHttpContext: HttpContext = options?.context ?? new HttpContext();

        const localVarTransferCache: boolean = options?.transferCache ?? true;


        let responseType_: 'text' | 'json' | 'blob' = 'json';
        if (localVarHttpHeaderAcceptSelected) {
            if (localVarHttpHeaderAcceptSelected.startsWith('text')) {
                responseType_ = 'text';
            } else if (this.configuration.isJsonMime(localVarHttpHeaderAcceptSelected)) {
                responseType_ = 'json';
            } else {
                responseType_ = 'blob';
            }
        }

        let localVarPath = `/api/auth/token`;
        const { basePath, withCredentials } = this.configuration;
        return this.httpClient.request<Token>('post', `${basePath}${localVarPath}`,
            {
                context: localVarHttpContext,
                responseType: <any>responseType_,
                ...(withCredentials ? { withCredentials } : {}),
                headers: localVarHeaders,
                observe: observe,
                transferCache: localVarTransferCache,
                reportProgress: reportProgress
            }
        );
    }

    /**
     * @param token 
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     */
    public validateResetToken(token: string, observe?: 'body', reportProgress?: boolean, options?: {httpHeaderAccept?: 'application/json', context?: HttpContext, transferCache?: boolean}): Observable<boolean>;
    public validateResetToken(token: string, observe?: 'response', reportProgress?: boolean, options?: {httpHeaderAccept?: 'application/json', context?: HttpContext, transferCache?: boolean}): Observable<HttpResponse<boolean>>;
    public validateResetToken(token: string, observe?: 'events', reportProgress?: boolean, options?: {httpHeaderAccept?: 'application/json', context?: HttpContext, transferCache?: boolean}): Observable<HttpEvent<boolean>>;
    public validateResetToken(token: string, observe: any = 'body', reportProgress: boolean = false, options?: {httpHeaderAccept?: 'application/json', context?: HttpContext, transferCache?: boolean}): Observable<any> {
        if (token === null || token === undefined) {
            throw new Error('Required parameter token was null or undefined when calling validateResetToken.');
        }

        let localVarQueryParameters = new HttpParams({encoder: this.encoder});
        localVarQueryParameters = this.addToHttpParams(localVarQueryParameters,
          <any>token, 'token');

        let localVarHeaders = this.defaultHeaders;

        const localVarHttpHeaderAcceptSelected: string | undefined = options?.httpHeaderAccept ?? this.configuration.selectHeaderAccept([
            'application/json'
        ]);
        if (localVarHttpHeaderAcceptSelected !== undefined) {
            localVarHeaders = localVarHeaders.set('Accept', localVarHttpHeaderAcceptSelected);
        }

        const localVarHttpContext: HttpContext = options?.context ?? new HttpContext();

        const localVarTransferCache: boolean = options?.transferCache ?? true;


        let responseType_: 'text' | 'json' | 'blob' = 'json';
        if (localVarHttpHeaderAcceptSelected) {
            if (localVarHttpHeaderAcceptSelected.startsWith('text')) {
                responseType_ = 'text';
            } else if (this.configuration.isJsonMime(localVarHttpHeaderAcceptSelected)) {
                responseType_ = 'json';
            } else {
                responseType_ = 'blob';
            }
        }

        let localVarPath = `/api/auth/reset-password/validate`;
        const { basePath, withCredentials } = this.configuration;
        return this.httpClient.request<boolean>('get', `${basePath}${localVarPath}`,
            {
                context: localVarHttpContext,
                params: localVarQueryParameters,
                responseType: <any>responseType_,
                ...(withCredentials ? { withCredentials } : {}),
                headers: localVarHeaders,
                observe: observe,
                transferCache: localVarTransferCache,
                reportProgress: reportProgress
            }
        );
    }

}
