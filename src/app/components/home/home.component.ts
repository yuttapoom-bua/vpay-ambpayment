import { Component, OnInit, TemplateRef } from '@angular/core';
import { RestServiceApi } from '../../rest.service.api';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { Router } from '@angular/router';

declare var $: any;

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit {
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
  public txttoken: string = null;

  constructor(
    public router: Router,
    public rest: RestServiceApi,
    private modalService: BsModalService
  ) { }

  async ngOnInit() {
    this.authen = true;
    // this.checkAuthorized();
    let role = await this.rest.getProfile();
    if (role == 'SUPERADMIN') {
      this.fullData = true;
    }
    $(document).ready(function () {
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

  openModal(template: TemplateRef<any>) {
    this.modalRef = this.modalService.show(template);
  }

  async getSearch() {
    this.multiRef();
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
    console.log(this.postData);
  }

  async onCheckAll(event) {
    if (event.target.checked) {
      $('tbody')
        .find('input[type=checkbox]')
        .each(function (i) {
          if (
            $(this).closest('tr').attr('class') != 'double' &&
            $(this).closest('tr').attr('class') != 'success'
          ) {
            $(this).trigger('click');
          }
        });
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
    let Id = refId.trim();
    let Id2 = Id.replace(/^\s+|\s+$/gm, '');
    const today = new Date();
    const defaultStartDate = new Date(
      today.getFullYear() - 1,
      today.getMonth(),
      today.getDate(),
      0,
      0,
      0
    );
    const defaultEndDate = new Date();
    const params = {
      date_from: defaultStartDate,
      date_to: defaultEndDate,
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
      ref_id: Id,
      limit: 50,
      page: 1,
    };
    let data: any = await this.rest.getStatus(params);
    if (this.fullData && data.result.transactions.length == 0) {
      Object.assign(data.result.transactions, [{ ref_id: Id }]);
    }

    return data;
  }

  // async auth() {
  //   // this.username = 'Tong_Admin';
  //   // this.password = 'Aa1122';
  //   localStorage.setItem(
  //     'vpay',
  //     JSON.stringify({ username: this.username, password: this.password })
  //   );
  //   this.checkAuthorized();
  // }

  async auth() {
    // const auth = { username: 'ADMIN_POST_MAN_BUNG', password: 'MMMfgf826' };
    if (this.txttoken) {
      localStorage.setItem('token', this.txttoken);
      this.authen = true;
    } else {
      alert('Please Fill Token');
    }
  }

  async checkAuthorized() {
    // const _v = localStorage.getItem('vpay');
    // const auth = JSON.parse(_v);
    const auth = { username: 'ADMIN_POST_MAN_BUNG', password: 'MMMfgf826' };
    if (auth && auth.username) {
      this.authen = true;
      await this.rest.getLogin(auth);
    } else {
      this.authen = false;
    }
  }

  async multiRef() {
    this.clear(false);
    this.loading = true;
    await this.rest.checkToken();

    let result = [];
    const data = this.multiRefId.split('\n');
    await Promise.all(
      data.map(async (refId): Promise<any> => {
        if (refId) {
          result.push(await this.callApi(refId));
        }
      })
    );

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
                item.result.transactions[i].status_history.length - 1 ==
                index
              ) {
                item.result.transactions[i].lastStatus = st.status;
              }
              console.log('>', i, st.status);
              if (st.status == 'SUCCESS') {
                countSuccess++;
              }
            });
          item.result.transactions[i].countSuccess = countSuccess;

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

    // console.log(result);
    this.multiResult = result;
    this.loading = false;
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

  // switchInput(e) {
  //   this.clear();

  //   $('#multiRefId').show();
  //   this.multi = true;
  //   $('#multiRefId').focus();
  // }

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
      this.refId = null;
      this.multiRefId = null;
      this.multi = false;
      this.multiResult = null;
    }
    this.vpayRefId = [];
    this.haveVpay = false;
    this.current_transaction = null;
    this.status_update = null;
    this.loading = false;
    this.result = null;
    $('#refId').focus();
  }
}
