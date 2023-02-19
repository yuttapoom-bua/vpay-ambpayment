import { environment } from './../environments/environment';
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, Subscriber } from 'rxjs';
import parallel from 'async/parallel';
import _ from 'underscore';
import axios from 'axios';

@Injectable({
  providedIn: 'root',
})
export class RestServiceApi {
  private token: any = null;
  private role: any = null;
  private hostUrl = environment.backendUrl;
  private loginURL = `${this.hostUrl}/common/login`;
  private statusPostmanRefId = `${this.hostUrl}/merchant/v3/get-status`;
  private statusPostmanPaymentId = `${this.hostUrl}/merchant/v2/get-status`;
  private urlVpayPostman = `${this.hostUrl}/backoffice/transaction/v3/get-status`;
  private postRecheckSuccess = `${this.hostUrl}/backoffice/transaction/re-check/problem/update`;
  private searchPayment = `${this.hostUrl}/backoffice/search-payment`;
  private adminUpdatePaymentTransactionUrl = `${this.hostUrl}/backoffice/update-status`;
  private retryCallbackUrl = `${this.hostUrl}/frontapi/user/recall-callback`;
  private retryCallbackAdminUrl = `${this.hostUrl}/merchant/recall-callback`;
  private username: string = '';
  private password: string = '';

  constructor(private http: HttpClient) {}

  private async getTokenHeader() {
    let authHeader = await new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + this.token,
    });
    return Promise.resolve(authHeader);
  }

  async getLogin(params) {
    let response = await this.http
      .post<any>(`${this.loginURL}`, params)
      .toPromise();
    return response;
  }

  async saveAuthorized(params) {
    this.username = params.username;
    this.password = params.password;
  }

  async getStatus(params) {
    if (!this.token) {
      await this.checkToken();
    }
    let response;
    try {
      response = await this.http
        .post<any>(`${this.searchPayment}`, params, {
          headers: await this.getTokenHeader(),
        })
        .toPromise();
    } catch (e) {
      console.error(e.name);
      console.error(e.message);
    }
    return response;
  }

  async getVpayPostman(ref_id) {
    let response = await this.http
      .post<any>(
        `${this.urlVpayPostman}`,
        { ref_id },
        {
          headers: await this.getTokenHeader(),
        }
      )
      .toPromise();
    return response;
  }

  async checkToken() {
    this.token =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjp7Il9pZCI6IjYxODhkZDZmYTM3NDdhMDAxNzEwOGQxNiIsInVzZXJuYW1lIjoiQURNSU5fUE9TVF9NQU5fQlVORyIsInJvbGUiOiJBRE1JTl9SRUFEX09OTFkiLCJwcmVmaXgiOiJBRE1JTiIsInV1aWQiOiIxZmNjZmNhMi02M2FmLTQ0YzAtYjBjOS1lN2Q5MzIwZTY2MjAifSwiaWF0IjoxNjcyNzYzMTgwLCJleHAiOjE3MDQzMjA3ODB9.W6uDcorq3cNVFdXkrj3cyrJfN2d7FAn14Yh8z1-7irU';
    // this.token = localStorage.getItem('token');
    // if (!this.token) {
    //   await this.getToken();
    // }
    return this.token;
  }

  async getToken() {
    if (this.username && this.password) {
      console.log('getToken');
      const res = await this.getLogin({
        username: this.username,
        password: this.password,
      });
      localStorage.setItem('token', res.result.token);
      this.token = res.result.token;
      this.role = res.result.profile.role;
      console.log('this.token', this.token);
    } else {
      alert('You not login!!');
      localStorage.removeItem('vpay');
    }
  }

  async getProfile() {
    return localStorage.getItem('role');
  }

  async promiseWait() {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve(true);
      }, 5000);
    });
  }

  // async getProblemDetail(taskList) {
  //   let data = await Promise.all(
  //     taskList.map(async (obj) => {
  //       let response = await this.http
  //         .post(this.searchPayment, obj, {
  //           headers: await this.getTokenHeader(),
  //         })
  //         .toPromise();
  //       // console.log('>>>>', response);
  //       // await this.promiseWait();
  //       return response;
  //     })
  //   );
  //   return data;
  //   // await this.checkToken();
  //   // let response = [];
  //   // parallel(taskList, async (err, result) => {
  //   //   _.each(result, async (obj, cnt) => {
  //   //     let res = setTimeout(async () => {
  //   //       delete obj.timeOut;

  //   //       let rs: any = await this.http
  //   //         .post(this.searchPayment, obj, {
  //   //           headers: await this.getTokenHeader(),
  //   //         })
  //   //         .toPromise();

  //   //       // console.log('rs>', rs);
  //   //       // response.push(rs);
  //   //       if (rs.code == 0) {
  //   //         console.log(cnt + 1, rs.message, obj.orderId);
  //   //       }
  //   //     }, obj.timeOut);
  //   //   });
  //   // });

  //   // return response;
  // }

  async sendPostSuccess(params) {
    let response;
    try {
      response = await this.http
        .post(this.postRecheckSuccess, params, {
          headers: await this.getTokenHeader(),
        })
        .toPromise();
    } catch (e) {
      console.error(e.name);
      console.error(e.message);
    }
    return response;
  }

  // async sendPostSuccess(taskList, authHeader) {
  //   console.log('--------------------------');
  //   let soundsuccess = new Audio(
  //     'https://notificationsounds.com/storage/sounds/file-sounds-1210-succeeded.mp3'
  //   );

  //   parallel(taskList, async (err, result) => {
  //     _.each(result, async (obj, cnt) => {
  //       let res = setTimeout(async () => {
  //         delete obj.timeOut;

  //         try {
  //           let response: any = await this.http
  //             .post(this.postRecheckSuccess, obj, {
  //               headers: authHeader,
  //             })
  //             .toPromise();
  //           if (response.code == 0) {
  //             console.log(cnt + 1, response.message, obj.orderId);
  //           }
  //           if (taskList.length == cnt + 1) {
  //             soundsuccess.play();
  //             return true;
  //           }
  //         } catch (e) {
  //           console.error('error postsuccess', e);
  //         }
  //       }, obj.timeOut);
  //     });
  //   });

  //   return true;
  // }

  async recheckSuccess(params) {
    let response = await this.http
      .post<any>(this.postRecheckSuccess, params, {
        headers: await this.getTokenHeader(),
      })
      .toPromise();
    return response;
  }

  async problem3rd(params) {
    let response = await this.http
      .post<any>(
        `https://amp.askmepays.com/ambpayment/backoffice/transaction/re-check/problem/list`,
        params,
        {
          headers: await this.getTokenHeader(),
        }
      )
      .toPromise();
    return response;
  }

  async updateFixed(params) {
    let response = await this.http
      .post<any>(
        `https://amp.askmepays.com/ambpayment/backoffice/transaction/re-check/problem/update`,
        params,
        {
          headers: await this.getTokenHeader(),
        }
      )
      .toPromise();
    return response;
  }

  public async adminUpdatePaymentTransaction(request) {
    let response = await this.http
      .post<any>(this.adminUpdatePaymentTransactionUrl, request, {
        headers: await this.getTokenHeader(),
      })
      .toPromise();
    console.log('Get User Profile');
    console.log(response);
    if (response.code === 9003) {
      alert(response.message);
    } else if (response.code !== 0) {
      alert(response.message);
    }
    return Promise.resolve(response);
  }

  public async retryCallback(request) {
    let response = await this.http
      .post<any>(this.retryCallbackUrl, request, {
        headers: await this.getTokenHeader(),
      })
      .toPromise();
    console.log('Get User Profile');
    console.log(response);
    if (response.code === 9003) {
      alert(response.message);
    } else if (response.code !== 0) {
      alert(response.message);
    } else {
      alert(response.message);
    }
    return Promise.resolve(response);
  }

  public async retryAdminCallback(request) {
    let response = await this.http
      .post<any>(this.retryCallbackAdminUrl, request, {
        headers: await this.getTokenHeader(),
      })
      .toPromise();
    console.log('Get User Profile');
    console.log(response);
    if (response.code === 9003) {
      alert(response.message);
    } else if (response.code !== 0) {
      alert(response.message);
    } else {
      alert(response.message);
    }
    return Promise.resolve(response);
  }
}
