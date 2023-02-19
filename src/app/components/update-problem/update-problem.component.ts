import { Component, OnInit, TemplateRef } from '@angular/core';
import { RestServiceApi } from '../../rest.service.api';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

declare var $: any;

@Component({
  selector: 'app-update-problem',
  templateUrl: './update-problem.component.html',
  styleUrls: ['./update-problem.component.css'],
})
export class UpdateProblemComponent implements OnInit {
  public refId: any = null;
  public multiRefId: any = null;
  public multi: boolean = false;
  public multiResult: any = null;
  public result: any = null;
  public loading: any = false;
  public current_transaction: any = null;
  public status_update: any;
  public currentPosition: any = null;
  public modalRef: BsModalRef;
  public username: string = '';
  public password: string = '';
  public authen: boolean = false;
  public vpayRefId: any = [];
  public haveVpay: boolean = false;
  public profile: any;
  public fullData: boolean = false;
  public postData: any = [];
  public listproblem: any = [];
  public start: string = '0';
  public limit: number = 500;
  public sumStatus: any = [];
  public countStatus: any;
  public resPost: boolean = false;
  public defaultStartDate: Date;
  public defaultEndDate: Date;
  public trans_response: Observable<any>;
  public totalUnfixed: number;
  public updateRefId: string;
  public remark: string;
  public txttoken: string = null;
  public chkdown: boolean = false;
  public soundfetch: any;
  public duration: number = 500;
  public loop: boolean = false;

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    public rest: RestServiceApi,
    private modalService: BsModalService
  ) {}

  async ngOnInit() {
    if (localStorage.getItem('token')) {
      this.authen = true;
    }
    this.soundfetch = new Audio(
      'https://notificationsounds.com/storage/sounds/file-sounds-1134-open-up.mp3'
    );

    // this.token = await this.rest.checkToken();
    // let role = await this.rest.getProfile();
    // if (role == 'SUPERADMIN') {
    //   this.fullData = true;
    // }

    this.route.queryParamMap.subscribe((params) => {
      let start = params.get('start');
      let limit = params.get('limit');
      let duration = params.get('duration');
      let loop = params.get('loop');
      if (start) {
        this.start = start;
      }
      if (limit) {
        this.limit = parseInt(limit);
      }
      if (duration) {
        this.duration = parseInt(duration);
      }
      if (loop) {
        this.loop = loop === 'true';
      }
    });

    const today = new Date();
    this.defaultStartDate = new Date(
      today.getFullYear() - 1,
      today.getMonth(),
      today.getDate(),
      0,
      0,
      0
    );
    this.defaultEndDate = new Date();

    $(document).ready(function () {
      $('#exampleModal').on('modal');
      $('#multiRefId').focus();
      $('#multiRefId').on('keypress', function (event) {
        if (event.keyCode == 13) {
          this.getSearch();
        }
      });

      $('body').on('keypress', function (event) {
        if (event.keyCode == 32) {
          $('html, body').animate(
            {
              scrollTop: 0,
            },
            0
          );
          return false;
        }
      });
    });
  }

  login() {
    console.log(this.username, this.password);
  }
  tolist(start) {
    return parseInt(start) + this.limit;
  }

  openModal(template: TemplateRef<any>, item = null) {
    this.updateRefId = null;
    this.remark = null;
    this.modalRef = this.modalService.show(template);
    if (item.ref_id) {
      const lt = new Date(item.date);
      const y = lt.getUTCFullYear().toString();
      let hour = lt.getHours() <= 9 ? `0${lt.getHours()}` : lt.getHours();

      const datetime = `${lt.getDate()}/${lt.getMonth() + 1}/${y.substring(
        2
      )}, ${hour}:${lt.getMinutes()}:${lt.getSeconds()}`;

      this.updateRefId = item.ref_id;
      this.remark = `${item.lastStatus} \t${datetime}`;
    }
  }

  async updateFixed() {
    if (this.updateRefId && this.remark != null) {
      const params = {
        orderId: this.updateRefId,
        fixed: true,
        remark: this.remark,
      };
      const response = await this.rest.updateFixed(params);
      if (response && response.code == 0) {
        alert('success');
        this.modalRef.hide();
        return true;
      }
    }
  }
  async getSearch() {
    // setTimeout(function () {
    //   $('#btnSearch').attr('disabled', false);
    // }, 1000 * 60);
    // $('#btnSearch').attr('disabled', true);
    $('#progress').html('Get Transaction ......');
    $('#progress').show();
    this.clear(false);
    this.chkdown = false;
    this.loading = true;
    this.postData = [];
    this.multiResult = [];
    this.countStatus = null;
    $('#checkall').prop('checked', false);
    $('tbody')
      .find('input[type=checkbox]')
      .each(function (i) {
        $(this).prop('checked', false);
      });

    $('#cnt').html('');
    await this.rest.checkToken();
    let listproblem = [];
    const params = {
      offset: parseInt(this.start),
      limit: this.limit,
      filter: {
        statusSelect: 'TRANSACTION_NOT_FOUND',
        statusFixSelect: 'Not Fix',
      },
    };
    const response: any = await this.rest.problem3rd(params);
    if (response.code != 0) {
      alert(`${response.message}`);
      this.loading = false;
      return false;
    }

    if (response && response.result.totalUnfixed) {
      this.totalUnfixed = response.result.totalUnfixed;
    }
    // console.log(response.result.totalUnfixed); //fixed:false
    if (response && response.code == 0) {
      this.listproblem = response.result.transaction
        .filter((item) => item.fixed === false)
        .map((obj) => {
          listproblem.push(obj.refId);
        });
      this.listproblem = listproblem;
      await this.multiRef();
    }
  }

  async onCheckChange(event, ref_id = null) {
    if (event.target.checked) {
      if (ref_id != 'undefined') {
        this.postData.push(ref_id);
      }
    } else {
      var index = this.postData.indexOf(ref_id);
      if (index !== -1) {
        this.postData.splice(index, 1);
      }
    }
  }

  goDown() {
    $('html,body').animate(
      {
        scrollTop: $('.success').offset().top,
      },
      'slow'
    );
  }
  async onCheckAll(event) {
    if (event.target.checked) {
      let a = 0;
      $('tbody')
        .find('input[type=checkbox]')
        .each(function (i) {
          if (
            $(this).closest('tr').attr('class') != 'double' &&
            $(this).closest('tr').attr('class') != 'success'
          ) {
            a++;
            $(this).trigger('click');
          }
        });
      $('#cnt').html(a);
    } else {
      this.postData = [];
      $('tbody')
        .find('input[type=checkbox]')
        .each(function (i) {
          $(this).prop('checked', false);
        });
    }
  }

  async callApi(refId) {
    let Id2 = refId;
    // let Id2 = Id.replace(/^\s+|\s+$/gm, '');
    const params = {
      date_from: this.defaultStartDate,
      date_to: this.defaultEndDate,
      payment_id: '',
      merchant_id: '',
      service_id: '',
      service_include: [
        '100',
        '103',
        '104',
        '99',
        '98',
        '97',
        '96',
        '95',
        '94',
        '93',
        '92',
        '91',
        '90',
      ],
      status: '',
      ref_id: refId,
      limit: 50,
      page: 1,
    };
    let data = await this.rest.getStatus(params);

    if (data.result.transactions.length == 0) {
      Object.assign(data.result.transactions, [{ ref_id: refId }]);
    }

    return data;
  }

  async auth() {
    // const auth = { username: 'ADMIN_POST_MAN_BUNG', password: 'MMMfgf826' };
    if (this.txttoken) {
      localStorage.setItem('token', this.txttoken);
      this.authen = true;
    } else {
      alert('Please Fill Token');
    }
  }

  async logout() {
    localStorage.removeItem('token');
    window.location.reload();
  }

  // async timer(params) {
  //   return new Promise(async () =>
  //     setTimeout(async function () {
  //       console.log('timeout', params);
  //       // let data = await this.rest.getStatus(params);
  //     }, 5000)
  //   );
  // }

  async timer(seconds) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        console.log(new Date());
        resolve(true);
      }, 5000);
    });
  }

  // async timer(params) {
  //   return await setTimeout(async function () {
  //     // await this.rest.getStatus(params);
  //     console.log('timeout', new Date());
  //   }, 5000);
  // }

  async multiRef() {
    // this.clear(false);
    this.sumStatus = [];

    let result = [];
    const data = this.listproblem;
    console.log('--------------------------');
    for (let i = 0; i < data.length; i++) {
      console.log('gettransaction');
      if (data[i]) {
        const params = {
          date_from: this.defaultStartDate,
          date_to: this.defaultEndDate,
          payment_id: '',
          merchant_id: '',
          service_id: '',
          service_include: [
            '100',
            '103',
            '104',
            '99',
            '98',
            '97',
            '96',
            '95',
            '94',
            '93',
            '92',
            '91',
            '90',
          ],
          status: '',
          ref_id: data[i],
          limit: 50,
          page: 1,
        };

        let res: any;
        try {
          res = await new Promise((resolve, reject) => {
            setTimeout(async () => {
              resolve(await this.rest.getStatus(params));
            }, this.duration);
          });
        } catch (e) {
          console.error('error gettransaction', e);
        }

        if (res && res.result.transactions.length == 0) {
          Object.assign(res.result.transactions, [{ ref_id: data[i] }]);
        }

        result.push(res);
      }
    }

    result.map(async (item, index) => {
      let temp: any = { result: { data: { payment_status: 0 } } };
      if (item.result.transactions.length > 0) {
        for (let i = 0; i < item.result.transactions.length; i++) {
          let countSuccess = 0;
          let mergeStatus = '';

          item.result.transactions[i].status_history &&
            item.result.transactions[i].status_history.map((st, index) => {
              mergeStatus +=
                (st.status == 'PROBLEM' ? 'INCOMPLETE' : st.status) + ' > ';

              item.result.transactions[i].mergeStatus = mergeStatus.substring(
                0,
                mergeStatus.length - 2
              );
              if (
                st.status == 'REFUND' ||
                st.status == 'WAITING' ||
                st.status == 'WAITING_REFUND'
              ) {
                item.result.transactions[i].date = st.date;
                this.chkdown = true;
              }

              if (
                item.result.transactions[i].status_history.length - 1 ==
                index
              ) {
                item.result.transactions[i].lastStatus = st.status;
              }
              // console.log('>', i, st.status);
              if (st.status == 'SUCCESS') {
                countSuccess++;
              }
            });
          item.result.transactions[i].countSuccess = countSuccess;
          this.sumStatus.push(item.result.transactions[i].mergeStatus);
          if (item.result.transactions[i].channel_transfer == 'VPAY') {
            this.haveVpay = true;
            temp = await this.rest.getVpayPostman(
              item.result.transactions[i].ref_id
            );

            item.result.transactions[i].vpay_postman_status =
              temp.result.data.payment_status;
          }
        }
      }
    });

    const counts = {};

    for (const num of this.sumStatus) {
      counts[num] = counts[num] ? counts[num] + 1 : 1;
    }

    this.countStatus = counts;

    this.multiResult = result;
    this.loading = false;
    this.soundfetch.play();
    if (this.loop) {
      setTimeout(function () {
        $('#checkall').trigger('click');
      }, 2000);
      setTimeout(function () {
        $('#postSuccess').trigger('click');
      }, 4000);
    }
  }

  async postSuccess() {
    if (this.loop === false) {
      if (confirm('คุณต้องการปรับรายการ SUCCESS') === false) return false;
    }

    this.loading = true;
    let result: any;
    $('#progress').html('POSTING Inprogress .....');
    $('#progress').show();

    console.log('--------------------------');
    let soundsuccess = new Audio(
      'https://notificationsounds.com/storage/sounds/file-sounds-1210-succeeded.mp3'
    );

    for (let i = 0; i < this.postData.length; i++) {
      if (this.postData[i]) {
        let params = {
          orderId: `${this.postData[i]}`,
          fixed: true,
          remark: 'SUCCESS',
        };

        try {
          result = await new Promise((resolve, reject) => {
            setTimeout(async () => {
              const response = await this.rest.sendPostSuccess(params);
              if (response && response.code == 0) {
                console.log(i + 1, response.message, this.postData[i]);
              }
              resolve(true);
            }, this.duration);
          });
        } catch (e) {
          console.error('error gettransaction', e);
        }
      }
    }

    if (result) {
      console.log('result', result);
      $('#progress').html('POST SUCCESS');
      $('#progress').show();
      soundsuccess.play();
      setTimeout(() => {
        $('#btnSearch').trigger('click');
      }, 5000);
    }
  }

  getBankName(name) {
    let bankName = '';
    switch (name) {
      case '001':
        bankName = '001 ธนาคารแห่งประเทศไทย Bank of Thailand (BOT)';
        break;
      case '002':
        bankName =
          '002 ธนาคารกรุงเทพ จํากัด (มหาชน) Bangkok Bank Public Company Limited (BBL)';
        break;
      case '004':
        bankName =
          '004 ธนาคารกสิกรไทย จํากัด (มหาชน) Kasikornbank Public Company Limited (KBANK)';
        break;
      case '005':
        bankName =
          '005 ธนาคารเอบีเอ็น แอมโร เอ็น.วี. ABN-AMRO Bank N.V. Bangkok Branch(AMRO)';
        break;
      case '006':
        bankName =
          '006 ธนาคารกรุงไทย จํากัด (มหาชน) Krung Thai Bank Public Company Limited (KTB)';
        break;
      case '008':
        bankName =
          '008 ธนาคารเจพี มอร์แกน เชส สาขากรุงเทพฯ JP Morgan Chase Bank, N.A Bangkok Branch (JPMC)';
        break;
      case '010':
        bankName =
          '010 ธนาคารแห่งโตเกียว-มิตซูบิชิ จก. กรุงเทพฯ The Bank of Tokyo-Mitsubishi Ltd. Bangkok Branch (BTMU)';
        break;
      case '011':
        bankName =
          '011 ธนาคารทหารไทย จํากัด (มหาชน) TMB Bank Public Company Limited (TMB)';
        break;
      case '014':
        bankName =
          '014 ธนาคารไทยพาณิชย์จํากัด (มหาชน) Siam Commercial Bank Public Company Limited (SCB)';
        break;
      case '015':
        bankName =
          '015 ธนาคารนครหลวงไทย จํากัด (มหาชน) Siam City Bank Public Company Limited (SCIB)';
        break;
      case '017':
        bankName = '017 ธนาคารซิตี้แบงค์ Citibank N.A. (CITI)';
        break;
      case '018':
        bankName =
          '018 ธนาคารซูมิโตโม มิตซุย แบงกิ้ง คอร์เปอเรชั่น Sumitomo Mitsui Banking Corporation (SMBC)';
        break;
      case '020':
        bankName =
          '020 ธนาคารสแตนดาร์ด ชาร์เตอร์ด (ไทย) จํากัด Standard Chartered Bank (Thai) Public Company Limited (SCBT)';
        break;
      case '022':
        bankName =
          '022 ธนาคารไทยธนาคาร จํากัด (มหาชน) BANKTHAI Public Company Limited (UOBT)';
        break;
      case '024':
        bankName =
          '024 ธนาคารยูไนเต็ด โอเวอร์ซีส (ไทย) จํากัด (มหาชน) United Overseas Bank (Thai) PCL (UOBT)';
        break;
      case '025':
        bankName =
          '025 ธนาคารกรุงศรีอยุธยา จํากัด (มหาชน) Bank of Ayudhya Public Company Limited (BAY)';
        break;
      case '026':
        bankName =
          '026 ธนาคารเมกะ สากลพาณิชย์ จํากัด (มหาชน) Mega International Commercial Bank PCL (MEGA ICBC)';
        break;
      case '027':
        bankName =
          '027 ธนาคารแห่งอเมริกา เนชั่นแนล แอสโซซิเอชั่น Bank of America National Association (BA)';
        break;
      case '028':
        bankName = '028 ธนาคารคาลิยง Calyon (CALYON)';
        break;
      case '030':
        bankName = '030 ธนาคารออมสิน Government Saving Bank (GOV)';
        break;
      case '031':
        bankName =
          '031 ธนาคารฮ่องกงและเซี่ยงไฮ้จํากัด Hong Kong & Shanghai Corporation Limited (HSBC)';
        break;
      case '032':
        bankName =
          '032 ธนาคารดอยซ์แบงก์ Deutsche Bank Aktiengesellschaft (DEUTSCHE)';
        break;
      case '033':
        bankName = '033 ธนาคารอาคารสงเคราะห์ Government Housing Bank (GHB)';
        break;
      case '034':
        bankName =
          '034 ธนาคารเพื่อการเกษตรและสหกรณ์การเกษตร Bank for Agriculture and Agricultural Cooperatives (AGRI)';
        break;
      case '039':
        bankName =
          '039 ธนาคารมิซูโฮ คอร์เปอเรท สาขากรุงเทพฯ Mizuho Corporate Bank Limited (MHCB)';
        break;
      case '065':
        bankName =
          '065 ธนาคารธนชาต จํากัด (มหาชน) Thanachart Bank Public Company Limited (TBANK)';
        break;
      case '066':
        bankName =
          '066 ธนาคารอิสลามแห่งประเทศไทย Islamic Bank of Thailand (ISBT)';
        break;
      case '067':
        bankName =
          '067 ธนาคารทิสโก้ จํากัด (มหาชน) Tisco Bank Public Company Limited (TISCO)';
        break;
      case '068':
        bankName =
          '068 ธนาคารเอไอจี เพื่อรายย่อย จํากัด (มหาชน) AIG Retail Bank Public Company Limited (AIG)';
        break;
      case '069':
        bankName =
          '069 ธนาคารเกียรตินาคิน จํากัด (มหาชน) Kiatnakin Bank Public Company Limited (KK)';
        break;
      case '070':
        bankName =
          '070 ธนาคารสินเอเชีย จํากัด (มหาชน) ACL Bank Public Company Limited (ACL)';
        break;
    }
    return bankName;
  }

  bgClass(type, countTrans, countSuccess, orderId) {
    let bg = '';
    if (type) {
      if (type != 'SUCCESS' || countSuccess >= 2) {
        bg = 'success';
      }
    }
    if (orderId == null || countTrans >= 2) {
      bg = 'double';
    }

    return bg;
  }
  getStatus(arr) {
    let max = arr.length - 1;
    return arr[max].status;
  }
  async updatestatus() {
    let request = {
      order_id: this.current_transaction.order_id,
      status: this.status_update,
      username: this.current_transaction.username,
      amount: this.current_transaction.customer_actual_amount,
      service_id: this.current_transaction.service_id,
    };

    if (
      this.currentPosition === 'ADMIN' ||
      this.currentPosition === 'ADMIN_READ_ONLY'
    ) {
      let response = await this.rest.adminUpdatePaymentTransaction(request);
      alert(response.message);
    }
    this.getSearch();
  }

  space(element) {
    element.value = element.value.replace(/[^0-9]+(?: \S+)*$/g, '');
    this.refId = element.value.replace(/[^0-9]+(?: \S+)*$/g, '');
  }

  async callback() {
    let request = {
      order_id: this.current_transaction.order_id,
      username: this.current_transaction.username,
      prefix: this.current_transaction.prefix,
    };

    if (
      this.currentPosition === 'MERCHANT' ||
      this.currentPosition === 'STAFF'
    ) {
      await this.rest.retryCallback(request);
    } else if (
      this.currentPosition === 'ADMIN' ||
      this.currentPosition === 'ADMIN_READ_ONLY'
    ) {
      await this.rest.retryAdminCallback(request);
    }

    this.getSearch();
  }

  chkPrefix(str) {
    if (str) {
      let p = str.replace('_O_AMB', '');
      let p1 = p.replace('_AMB', '');
      if (p1.indexOf('ABA') >= 0) {
        return 'ABA';
      } else {
        return p1;
      }
    }
  }

  copyTable(obj) {
    const string = document.getElementById('report').innerText;
    let selBox = document.createElement('textarea');
    selBox.style.position = 'fixed';
    selBox.style.left = '0';
    selBox.style.top = '0';
    selBox.style.opacity = '0';
    selBox.value = string;
    document.body.appendChild(selBox);
    selBox.focus();
    selBox.select();
    document.execCommand('copy');
    document.body.removeChild(selBox);
    $('.alert > span').html('คัดลอกสำเร็จ.');
    $('#notisuccess').show().delay(1000).fadeOut();
  }

  copyText(obj) {
    const msg = $(obj).html();
    const msg1 = msg
      .replace(/<(br)[^>]+>/gi, '<$1>')
      .replace(/<(span)[^>]+>/gi, '<$1>'); //remove attr
    const msg2 = msg1.replace(/<\/?span[^>]*>/g, '').replace(/&lt;/, '<'); //remove span tag
    const string = msg2.replace(/<br\s*[\/]?>/gi, '\n'); //new line

    let selBox = document.createElement('textarea');
    selBox.style.position = 'fixed';
    selBox.style.left = '0';
    selBox.style.top = '0';
    selBox.style.opacity = '0';
    selBox.value = string;
    document.body.appendChild(selBox);
    selBox.focus();
    selBox.select();
    document.execCommand('copy');
    document.body.removeChild(selBox);
    $('.alert > span').html('คัดลอกสำเร็จ.');
    $('#notisuccess').show().delay(1000).fadeOut();
    this.modalRef.hide();
  }

  async clear(clearRef = true) {
    if (clearRef) {
      this.resPost = false;
      this.refId = null;
      this.multiRefId = null;
      this.multi = false;
    }
    this.multiResult = [];
    this.postData = [];
    this.vpayRefId = [];
    this.haveVpay = false;
    this.current_transaction = null;
    this.status_update = null;
    this.loading = false;
    this.result = null;
    $('#refId').focus();
  }
}
