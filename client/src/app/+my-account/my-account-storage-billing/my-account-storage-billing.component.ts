import { Component, OnInit } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Notifier, RestPagination, RestExtractor } from '@app/core'
import { SortMeta } from 'primeng/api'
import { environment } from '../../../environments/environment'
import { forkJoin, Observable, Subject, Subscription } from 'rxjs'
import { catchError } from 'rxjs/operators'
import { BytesPipe } from '@app/shared/shared-main/angular'

@Component({
  selector: 'my-account-storage-billing',
  styleUrls: [ './my-account-storage-billing.component.scss' ],
  templateUrl: './my-account-storage-billing.component.html'
})
export class MyAccountStorageBillingComponent implements OnInit {
  static GET_PREMIUM_STORAGE_API_URL = environment.apiUrl + '/api/v1/premium-storage/'
  billingInformation: any = []
  totalRecords = 0
  rowsPerPage = 20
  sort: SortMeta = { field: 'createdAt', order: -1 }
  pagination: RestPagination = { count: this.rowsPerPage, start: 0 }
  private bytesPipe: BytesPipe

  constructor (
    // private notifier: Notifier,
    // private blocklistService: BlocklistService,
    private authHttp: HttpClient,
    private restExtractor: RestExtractor
  ) {
    // super()
    this.bytesPipe = new BytesPipe()
  }

  ngOnInit () {
    // this.initialize()
    this.startSubscriptions()
  }

  startSubscriptions () {
    forkJoin([
      this.getUserBilling()
    ]).subscribe(([ billingInfo ]) => {
      console.log('ICEICE bills', billingInfo)
      if (billingInfo['success']) {
        this.billingInformation = billingInfo['billing']
      }
    })
  }

  getUserBilling () {
    return this.authHttp.get(MyAccountStorageBillingComponent.GET_PREMIUM_STORAGE_API_URL + '/billing-info')
    .pipe(catchError(res => this.restExtractor.handleError(res)))
  }

  getFormattedDate (date: any) {
    const aux = new Date(date)
    return aux.toLocaleDateString()
  }

  getHRBytes (num: any) {
    return this.bytesPipe.transform(parseInt(num, 10), 0)
  }

  getHRTime (timestamp: any) {
    return `${timestamp / 2678400000} month/s`
  }
  // getIdentifier () {
  //   return 'MyAccountBlocklistComponent'
  // }

  // unblockAccount (accountBlock: AccountBlock) {
  //   const blockedAccount = accountBlock.blockedAccount

  //   this.blocklistService.unblockAccountByUser(blockedAccount)
  //       .subscribe(
  //         () => {
  //           this.notifier.success(this.i18n('Account {{nameWithHost}} unmuted.', { nameWithHost: blockedAccount.nameWithHost }))

  //           this.loadData()
  //         }
  //       )
  // }

  // protected loadData () {
  //   return this.blocklistService.getUserAccountBlocklist(this.pagination, this.sort)
  //     .subscribe(
  //       resultList => {
  //         this.blockedAccounts = resultList.data
  //         this.totalRecords = resultList.total
  //       },

  //       err => this.notifier.error(err.message)
  //     )
  // }
}