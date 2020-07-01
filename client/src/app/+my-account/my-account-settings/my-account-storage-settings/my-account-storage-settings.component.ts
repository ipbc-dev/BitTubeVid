import { Component, OnInit, Input, OnDestroy } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Notifier, ServerService } from '@app/core'
import { environment } from '../../../../environments/environment'
import { RestExtractor } from '../../../shared'
// import { UserUpdateMe } from '../../../../../../shared/models/users'
import { User, UserService } from '@app/shared/users'
import { AuthService } from '../../../core'
import { FormReactive } from '@app/shared/forms/form-reactive'
import { I18n } from '@ngx-translate/i18n-polyfill'
import { FormValidatorService } from '@app/shared/forms/form-validators/form-validator.service'
import { forkJoin, Subject, Subscription } from 'rxjs'
import { SelectItem } from 'primeng/api'
import { first, catchError } from 'rxjs/operators'
import { NSFWPolicyType } from '@shared/models/videos/nsfw-policy.type'
import { forEach } from 'lodash-es'
import { BytesPipe } from 'ngx-pipes'

@Component({
  selector: 'my-account-storage-settings',
  templateUrl: './my-account-storage-settings.component.html',
  styleUrls: ['./my-account-storage-settings.component.scss']
})
export class MyAccountStorageSettingsComponent extends FormReactive implements OnInit, OnDestroy {
  static GET_PREMIUM_STORAGE_API_URL = environment.apiUrl + '/api/v1/premium-storage/'
  @Input() user: User = null
  @Input() reactiveUpdate = false
  @Input() notifyOnUpdate = true
  @Input() userInformationLoaded: Subject<any>
  @Input() userQuotaObject: Object

  languageItems: SelectItem[] = []
  defaultNSFWPolicy: NSFWPolicyType
  formValuesWatcher: Subscription
  configCopy: any
  havePremium: boolean
  userHavePremium: boolean
  userPremiumPlan: any
  dropdownSelectedPlan: number
  storagePlans: any
  private notifier: Notifier
  private bytesPipe: BytesPipe

  constructor (
    protected formValidatorService: FormValidatorService,
    private authHttp: HttpClient,
    private restExtractor: RestExtractor,
    // private authService: AuthService,
    // private notifier: Notifier,
    // private userService: UserService,
    private serverService: ServerService,
    private i18n: I18n
  ) {
    super()
    this.bytesPipe = new BytesPipe()
  }

  ngOnInit () {
    this.buildForm({
      storagePlan: null
    })
    this.startSubscriptions()
  }

  ngOnDestroy () {
    this.formValuesWatcher?.unsubscribe()
  }

  startSubscriptions () {
    let oldForm: any
    forkJoin([
      this.getPlans(),
      this.getMyPlan(),
      this.serverService.getVideoLanguages(),
      this.serverService.getConfig(),
      this.userInformationLoaded.pipe(first())
    ]).subscribe(([ plans, myPlan, languages, config ]) => {
      console.log('ICEICE plans', plans)
      console.log('ICEICE myPlan', myPlan)
      /* Check User storage plan */
      if (myPlan['success'] && myPlan['data'].length > 0) {
        this.userHavePremium = true
        this.userPremiumPlan = myPlan['data'][myPlan['data'].length - 1]
        // this.form.value['storagePlan'] = this.userPremiumPlan
      } else {
        this.userHavePremium = false
        this.userPremiumPlan = {}
        this.userPremiumPlan.planId = -1
      }
      this.dropdownSelectedPlan = this.userPremiumPlan
      /* Check instance premium storage plans and disable the ones lower than user actual plan */
      if (plans['success'] && plans['plans'].length > 0) {
        this.havePremium = true
        this.storagePlans = plans['plans']
      } else {
        this.havePremium = false
      }
      this.languageItems = [ { label: this.i18n('Unknown language'), value: '_unknown' } ]
      this.languageItems = this.languageItems
                               .concat(languages.map(l => ({ label: l.label, value: l.id })))

      const videoLanguages = this.user.videoLanguages
        ? this.user.videoLanguages
        : this.languageItems.map(l => l.value)

      // this.defaultNSFWPolicy = config.instance.defaultNSFWPolicy
      this.configCopy = config
      /* Update form values after check userData */
      this.form.patchValue({
        storagePlan: this.userPremiumPlan.planId
      })

      if (this.reactiveUpdate) {
        oldForm = { ...this.form.value }
        this.formValuesWatcher = this.form.valueChanges.subscribe((formValue: any) => {
          const updatedKey = Object.keys(formValue).find(k => formValue[k] !== oldForm[k])
          oldForm = { ...this.form.value }
          // this.updateDetails([updatedKey])
        })
      }
    })
  }

  getPlans () {
    return this.authHttp.get(MyAccountStorageSettingsComponent.GET_PREMIUM_STORAGE_API_URL + 'plans')
               .pipe(catchError(res => this.restExtractor.handleError(res)))
  }

  getMyPlan () {
    return this.authHttp.get(MyAccountStorageSettingsComponent.GET_PREMIUM_STORAGE_API_URL + 'get-user-active-payment')
               .pipe(catchError(res => this.restExtractor.handleError(res)))
  }

  havePremiumStorage () {
    return this.havePremium
  }

  userHavePremiumStorage () {
    return this.userHavePremium
  }

  getUserPremiumPlanId () {
    return this.userPremiumPlan ? this.userPremiumPlan.planId : -1
  }

  isOptionDisabled (optionId: number) {
    return optionId < this.getUserPremiumPlanId() ? 'disabled' : ''
  }

  isUpgradeDisabled () {
    return parseInt(this.form.value['storagePlan'], 10) === -1
  }

  getButtonValue () {
    return this.form.value['storagePlan'] <= this.getUserPremiumPlanId() ? 'Extend' : 'Upgrade'
  }

  getHRBytes (num: any) {
    return this.bytesPipe.transform(parseInt(num, 10), 0)
  }

  getFormattedDate (date: any) {
    const aux = new Date(date)
    return aux.toLocaleDateString()
  }

  async formatDate (date: any, formatStyle: any, locale: string) {
    // return formatWithOptions({date: date,formatStyle: formatStyle,locale: {
    //   locale: getLocale(locale)
    // }})
  }

  updateDetails (onlyKeys?: string[]) {
    // console.log('ICEICE printing userInformationLoaded')
    // console.log(this.userInformationLoaded)
    // console.log('ICEICE printing userQuotaObject')
    // console.log(this.userQuotaObject)
    // console.log('ICEICE printing config.instance')
    // console.log(this.configCopy)
    const paymentConfirmed = true /* Testing purposes */
    const chosenPlanId = parseInt(this.form.value['storagePlan'], 10)
    let chosenPlanDuration: any
    let chosenPlanPrice: any

    console.log('Chosen plan is: ', chosenPlanId)
    this.storagePlans.forEach((plan: any) => {
      if (plan.id === chosenPlanId) {
        chosenPlanDuration = plan.duration
        chosenPlanPrice = plan.priceTube
      }
    })
    console.log('ICEICE chosenPlanPrice is: ', chosenPlanPrice)
    if (paymentConfirmed && chosenPlanId > -1 && chosenPlanDuration !== undefined && chosenPlanPrice !== undefined) {
      const postBody = {
        planId: chosenPlanId,
        duration: chosenPlanDuration,
        priceTube: chosenPlanPrice
      }
      console.log('ICEICE going to call plan-payment with body: ', postBody)
      const postResponse = this.paymentPost(postBody)
        .subscribe(
          resp => {
            console.log('ICEICE postResponse is: ', resp)
            if (resp['success'] && resp['data'] && resp['data'].active === true) {
              this.startSubscriptions()
            }
          },

          err => this.notifier.error(err.message)
        )
    }
  }

  paymentPost (body: any) {
    return this.authHttp.post(MyAccountStorageSettingsComponent.GET_PREMIUM_STORAGE_API_URL + 'plan-payment', body)
    .pipe(catchError(res => this.restExtractor.handleError(res)))
  }

  // getDefaultVideoLanguageLabel () {
  //   return this.i18n('No language')
  // }

  // getSelectedVideoLanguageLabel () {
  //   return this.i18n('{{\'{0} languages selected')
  // }

}
