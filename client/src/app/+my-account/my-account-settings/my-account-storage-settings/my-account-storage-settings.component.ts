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
// import { pick } from 'lodash-es'

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
  storagePlans: any
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
    let oldForm: any

    this.buildForm({
      storagePlan: null
    })

    forkJoin([
      this.getPlans(),
      this.serverService.getVideoLanguages(),
      this.serverService.getConfig(),
      this.userInformationLoaded.pipe(first())
    ]).subscribe(([ plans, languages, config ]) => {
      console.log('ICE plans', plans)
      if (plans['success']) {
        this.havePremium = true
        this.storagePlans = plans['plans']
        // this.storagePlans.forEach((plan: any, index: number) => {
        //   this.storagePlans[index].dailyQuotaHumanReadable = this.bytesPipe.transform(plan.dailyQuota)
        // })
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

      this.form.patchValue({
        storagePlan: '50' /* HardCoded by the moment */
      })

      if (this.reactiveUpdate) {
        oldForm = { ...this.form.value }
        this.formValuesWatcher = this.form.valueChanges.subscribe((formValue: any) => {
          const updatedKey = Object.keys(formValue).find(k => formValue[k] !== oldForm[k])
          oldForm = { ...this.form.value }
          this.updateDetails([updatedKey])
        })
      }
    })
  }

  ngOnDestroy () {
    this.formValuesWatcher?.unsubscribe()
  }

  getPlans () {
    return this.authHttp.get(MyAccountStorageSettingsComponent.GET_PREMIUM_STORAGE_API_URL + 'plans')
               .pipe(catchError(res => this.restExtractor.handleError(res)))
  }

  havePremiumStorage () {
    return this.havePremium
  }

  getHRBytes (num: any) {
    return this.bytesPipe.transform(parseInt(num, 10), 0)
  }

  updateDetails (onlyKeys?: string[]) {
    console.log('ICEICE printing userInformationLoaded')
    console.log(this.userInformationLoaded)
    console.log('ICEICE printing userQuotaObject')
    console.log(this.userQuotaObject)
    console.log('ICEICE printing config.instance')
    console.log(this.configCopy)
    // const nsfwPolicy = this.form.value[ 'nsfwPolicy' ]
    // const webTorrentEnabled = this.form.value['webTorrentEnabled']
    // const autoPlayVideo = this.form.value['autoPlayVideo']
    // const autoPlayNextVideo = this.form.value['autoPlayNextVideo']

    // let videoLanguages: string[] = this.form.value['videoLanguages']
    // if (Array.isArray(videoLanguages)) {
    //   if (videoLanguages.length === this.languageItems.length) {
    //     videoLanguages = null // null means "All"
    //   } else if (videoLanguages.length > 20) {
    //     this.notifier.error('Too many languages are enabled. Please enable them all or stay below 20 enabled languages.')
    //     return
    //   } else if (videoLanguages.length === 0) {
    //     this.notifier.error('You need to enabled at least 1 video language.')
    //     return
    //   }
    // }

    // let details: UserUpdateMe = {
    //   nsfwPolicy,
    //   webTorrentEnabled,
    //   autoPlayVideo,
    //   autoPlayNextVideo,
    //   videoLanguages
    // }

    // if (onlyKeys) details = pick(details, onlyKeys)

    // if (this.authService.isLoggedIn()) {
    //   this.userService.updateMyProfile(details).subscribe(
    //     () => {
    //       this.authService.refreshUserInformation()

    //       if (this.notifyOnUpdate) this.notifier.success(this.i18n('Video settings updated.'))
    //     },

    //     err => this.notifier.error(err.message)
    //   )
    // } else {
    //   this.userService.updateMyAnonymousProfile(details)
    //   if (this.notifyOnUpdate) this.notifier.success(this.i18n('Display/Video settings updated.'))
    // }
  }

  // getDefaultVideoLanguageLabel () {
  //   return this.i18n('No language')
  // }

  // getSelectedVideoLanguageLabel () {
  //   return this.i18n('{{\'{0} languages selected')
  // }

}
