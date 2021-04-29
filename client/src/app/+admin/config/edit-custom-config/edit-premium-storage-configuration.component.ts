import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core'
import { FormGroup } from '@angular/forms'
import { forkJoin } from 'rxjs'
import { CustomConfig, ServerConfig } from '@shared/models'
import { ConfigService } from '../shared/config.service'
import { EditConfigurationService } from './edit-configuration.service'
import { SelectItem } from 'primeng/api'
import { catchError } from 'rxjs/operators'
import { ViewportScroller } from '@angular/common'
import { PremiumStorageModalComponent } from '@app/modal/premium-storage-modal.component'
import { identifierModuleUrl } from '@angular/compiler'
import { interfacePremiumStoragePlan } from '@shared/models/server/premium-storage-plan-interface'
import { HttpClient } from '@angular/common/http'
import { environment } from '../../../../environments/environment'
import { BytesPipe } from '@app/shared/shared-main/angular'
import { ConfirmService } from '@app/core/confirm'
import { RestExtractor } from '@app/core/rest'
import { ServerService } from '@app/core/server/server.service'
import { Notifier } from '@app/core'

@Component({
  selector: 'my-edit-premium-storage-configuration',
  templateUrl: './edit-premium-storage-configuration.component.html',
  styleUrls: [ './edit-custom-config.component.scss' ]
})
export class EditPremiumStorageConfiguration implements OnInit, OnChanges {
  @Input() form: FormGroup
  @Input() formErrors: any
  @Input() serverConfig: ServerConfig

  static GET_PREMIUM_STORAGE_API_URL = environment.apiUrl + '/api/v1/premium-storage/'
  // @ViewChild('nav') nav: NgbNav
  activeNav: string

  customConfig: CustomConfig
  newStoragePlan: interfacePremiumStoragePlan
  serverStats: any = null
  storagePlans: any[] = []
  planIndex: number = null
  premiumStorageActive = false
  addPremiumPlanClicked = false
  showAddPlanModal = false
  private bytesPipe: BytesPipe

  constructor (
    private configService: ConfigService,
    private editConfigurationService: EditConfigurationService,
    private authHttp: HttpClient,
    private confirmService: ConfirmService,
    private restExtractor: RestExtractor,
    private notifier: Notifier,
    private serverService: ServerService
  ) { 
    this.bytesPipe = new BytesPipe()
  }

  ngOnInit () {
    this.subscribeConfigAndPlans()
    this.serverConfig = this.serverService.getTmpConfig()
    this.resetNewStoragePlan()
    // Subscribe to serverConfig
    this.serverService.getConfig()
        .subscribe(config => {
          this.serverConfig = config
          console.log('ICEICE config is: ', config)
    })
    // Subcribe to serveStats
    this.serverService.getServerStats()
      .subscribe(res => {
        this.serverStats = res
      })
  }

  ngOnChanges (changes: SimpleChanges) {
    if (changes['serverConfig']) {
      // this.transcodingProfiles = this.buildAvailableTranscodingProfile()
    }
  }

  resetNewStoragePlan () {
    this.newStoragePlan = {
      name: null,
      quota: 0,
      dailyQuota: 0,
      priceTube: 0,
      duration: 0,
      expiration: 0,
      active: false,
      tubePayId: null
    }
  }

  subscribeConfigAndPlans () {
    forkJoin([
      this.getPlans(),
      this.serverService.getConfig()
    ]).subscribe(([ plans, config ]) => {
      if (plans['success']) {
        this.storagePlans = plans['plans']
        this.storagePlans.forEach(plan => {
          plan.quota = Math.round(plan.quota / 1073741824)
          plan.dailyQuota = Math.round(plan.dailyQuota / 1073741824)
          plan.updateData = plan
        })
      } else {
        this.storagePlans = []
      }
      if (config) {
        this.serverConfig = config
        this.premiumStorageActive = config.premium_storage.enabled
      }
    })
  }

  addPlanButtonClick () {
    if (!this.isAddPlanButtonDisabled()) {
      this.newStoragePlan.quota = this.newStoragePlan.quota * 1073741824 /* to bytes */
      this.newStoragePlan.dailyQuota = this.newStoragePlan.dailyQuota * 1073741824 /* to bytes */
      this.addPlan(this.newStoragePlan).subscribe(resp => {
        if (resp['success']) {
          this.notifier.success('Your new plan has been successfully added')
          this.showAddPlanModal = false
          this.resetNewStoragePlan()
          this.subscribeConfigAndPlans()
        } else {
          this.notifier.error(resp['error'])
          this.newStoragePlan.quota = this.newStoragePlan.quota / 1073741824 /* to bytes */
          this.newStoragePlan.dailyQuota = this.newStoragePlan.dailyQuota / 1073741824 /* to bytes */
        }
      })
    }
  }

  addPlanCancel () {
    this.showAddPlanModal = false
  }

  addPlanShow () {
    this.showAddPlanModal = true
  }

  addPlan (body: interfacePremiumStoragePlan) {
    const bodyWithToken: any = body
    bodyWithToken.accessToken = localStorage.getItem('access_token')
    return this.authHttp.post(EditPremiumStorageConfiguration.GET_PREMIUM_STORAGE_API_URL + 'add-plan', bodyWithToken)
               .pipe(catchError(res => this.restExtractor.handleError(res)))
  }

  isAddPlanButtonDisabled () {
    const { name, quota, dailyQuota, priceTube, duration, active, expiration } = this.newStoragePlan
    if (typeof name !== 'string' || name === null || name === '' || name.length > 50) return true
    if (typeof quota !== 'number' || quota < -1 || quota === 0) return true
    if (typeof dailyQuota !== 'number' || dailyQuota < -1 || dailyQuota === 0) return true
    if (typeof priceTube !== 'number' || priceTube < 0) return true
    if (typeof duration !== 'number' || duration < 2628000000 || duration > 31536000000) return true
    if (typeof expiration !== 'number' || expiration < 0) return true
    if (typeof active !== 'boolean') return true
    return false
  }
  showAddButtonSubmitError () {
    if (this.addPremiumPlanClicked === false) return false
    return this.isAddPlanButtonDisabled()
  }

  getPlans () {
    return this.authHttp.get(EditPremiumStorageConfiguration.GET_PREMIUM_STORAGE_API_URL + 'plans')
               .pipe(catchError(res => this.restExtractor.handleError(res)))
  }

  getFormattedPrice (price: any) {
    return parseFloat(price).toFixed(2)
  }

  getHRBytes (num: any) {
    try {
      if (num === null || num === undefined) return ''
      return this.bytesPipe.transform(parseInt(num, 10), 0)
    } catch (err) {
      return err
    }
  }

  numberRound (num: number) {
    return Math.round(num)
  }

  onRowEditInit (rowData: interfacePremiumStoragePlan) {
    // this.updateStoragePlan = rowData
  }

  async onRowDelete (rowData: any) {
    const res = await this.confirmService.confirm(
      $localize`Do you really want to delete '{{planName}}' plan? \n ATENTION! If some user already bought this plan you can delete his payment also! Before delete a plan, be sure that anybody is using it or consider to just deactivate it", { planName: rowData.name }`,
      $localize`Delete`
    )
    if (res === false) return
    const body = {
      planId: rowData.id,
      tubePayId: rowData.tubePayId
    }
    // console.log('ICEICE calling onRowDelete function with data: ', body)
    this.deletePlan(body).subscribe(resp => {
      // console.log('ICEICE deletePlan response is: ', resp)
      if (resp['success']) {
        this.subscribeConfigAndPlans()
        setTimeout(() => { this.notifier.success('Plan successfully deleted') } , 1000) /* Wait 1 sec for subscription */
      } else {
        this.notifier.error(`Something went wrong deleting the plan, reload and try again`)
      }
    })
  }

  deletePlan (body: any) {
    return this.authHttp.post(EditPremiumStorageConfiguration.GET_PREMIUM_STORAGE_API_URL + 'delete-plan', body)
               .pipe(catchError(res => this.restExtractor.handleError(res)))
  }

  onRowEditSave (rowData: interfacePremiumStoragePlan) {
    // console.log('ICEICE calling onRowEditSave function with data: ', rowData)
    const body = {
      id: rowData.id,
      tubePayId: rowData.tubePayId,
      name: rowData.name,
      quota: rowData.quota * 1073741824, /* to bytes */
      dailyQuota: rowData.dailyQuota * 1073741824, /* to bytes */
      priceTube: rowData.priceTube,
      duration: rowData.duration,
      expiration: rowData.expiration,
      active: rowData.active
    }
    // console.log('ICEICE calling onRowEditSave function with body: ', body)
    this.updatePlan(body).subscribe(resp => {
      // console.log('ICEICE onRowEditSave updatePlan response is: ', resp)
      if (resp['success']) {
        this.subscribeConfigAndPlans()
        this.notifier.success('Plan successfully updated')
      } else {
        this.notifier.error(`Something went wrong updating the plan, reload and try again`)
      }
    })
  }

  updatePlan (body: interfacePremiumStoragePlan) {
    // console.log('ICEICE going to call addPlan with body: ', body)
    return this.authHttp.post(EditPremiumStorageConfiguration.GET_PREMIUM_STORAGE_API_URL + 'update-plan', body)
               .pipe(catchError(res => this.restExtractor.handleError(res)))
  }

  onRowEditCancel (rowData: any, ri: number) {
    // console.log('ICEICE calling onRowEditCancel function with data: ', rowData)
    // console.log('ICEICE ri is: ', ri)
  }


  showFormSubmitButton () {
    console.log(this.activeNav);
    return false;
    // if (this.nav !== undefined && this.nav.activeId !== undefined) {
    //   return this.nav.activeId !== 'premium-storage-config'
    // } else {
    //   return false
    // }
  }

}