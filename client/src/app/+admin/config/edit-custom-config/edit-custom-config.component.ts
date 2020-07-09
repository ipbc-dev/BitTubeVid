import { AfterViewChecked, Component, OnInit, ViewChild } from '@angular/core'
import { ConfigService } from '@app/+admin/config/shared/config.service'
import { ServerService } from '@app/core/server/server.service'
import { CustomConfigValidatorsService, FormReactive, UserValidatorsService } from '@app/shared'
import { Notifier } from '@app/core'
import { CustomConfig } from '../../../../../../shared/models/server/custom-config.model'
import { newPremiumStoragePlan } from '@shared/models/server/premium-storage-plan-interface'
import { I18n } from '@ngx-translate/i18n-polyfill'
import { FormValidatorService } from '@app/shared/forms/form-validators/form-validator.service'
import { SelectItem } from 'primeng/api'
import { forkJoin } from 'rxjs'
import { catchError } from 'rxjs/operators'
import { ServerConfig } from '@shared/models'
import { ViewportScroller } from '@angular/common'
import { NgbNav } from '@ng-bootstrap/ng-bootstrap'
import { HttpClient } from '@angular/common/http'
import { RestExtractor } from '../../../shared'
import { environment } from '../../../../environments/environment'
import { BytesPipe } from 'ngx-pipes'

@Component({
  selector: 'my-edit-custom-config',
  templateUrl: './edit-custom-config.component.html',
  styleUrls: [ './edit-custom-config.component.scss' ]
})
export class EditCustomConfigComponent extends FormReactive implements OnInit, AfterViewChecked {
  // FIXME: use built-in router
  static GET_PREMIUM_STORAGE_API_URL = environment.apiUrl + '/api/v1/premium-storage/'
  @ViewChild('nav') nav: NgbNav

  initDone = false
  customConfig: CustomConfig
  newStoragePlan: newPremiumStoragePlan

  resolutions: { id: string, label: string, description?: string }[] = []
  transcodingThreadOptions: { label: string, value: number }[] = []

  languageItems: SelectItem[] = []
  categoryItems: SelectItem[] = []
  storagePlans: any[] = []
  planIndex: number = null
  premiumStorageActive = false
  addPremiumPlanClicked = false

  private serverConfig: ServerConfig
  private bytesPipe: BytesPipe

  constructor (
    private viewportScroller: ViewportScroller,
    protected formValidatorService: FormValidatorService,
    private customConfigValidatorsService: CustomConfigValidatorsService,
    private userValidatorsService: UserValidatorsService,
    private notifier: Notifier,
    private authHttp: HttpClient,
    private restExtractor: RestExtractor,
    private configService: ConfigService,
    private serverService: ServerService,
    private i18n: I18n
  ) {
    super()
    this.bytesPipe = new BytesPipe()
    this.resolutions = [
      {
        id: '0p',
        label: this.i18n('Audio-only'),
        description: this.i18n('A <code>.mp4</code> that keeps the original audio track, with no video')
      },
      {
        id: '240p',
        label: this.i18n('240p')
      },
      {
        id: '360p',
        label: this.i18n('360p')
      },
      {
        id: '480p',
        label: this.i18n('480p')
      },
      {
        id: '720p',
        label: this.i18n('720p')
      },
      {
        id: '1080p',
        label: this.i18n('1080p')
      },
      {
        id: '2160p',
        label: this.i18n('2160p')
      }
    ]

    this.transcodingThreadOptions = [
      { value: 0, label: this.i18n('Auto (via ffmpeg)') },
      { value: 1, label: '1' },
      { value: 2, label: '2' },
      { value: 4, label: '4' },
      { value: 8, label: '8' }
    ]
  }

  get videoQuotaOptions () {
    return this.configService.videoQuotaOptions
  }

  get videoQuotaDailyOptions () {
    return this.configService.videoQuotaDailyOptions
  }

  get availableThemes () {
    return this.serverConfig.theme.registered
      .map(t => t.name)
  }

  ngOnInit () {
    forkJoin([
      this.getPlans(),
      this.serverService.getConfig()
    ]).subscribe(([ plans, config ]) => {
      if (plans['success'] && plans['plans'].length > 0) {
        this.storagePlans = plans['plans']
      }
      if (config) {
        this.serverConfig = config
      }
    })
    this.serverConfig = this.serverService.getTmpConfig()
    // this.serverService.getConfig()
    //     .subscribe(config => this.serverConfig = config)

    this.newStoragePlan = {
      name: null,
      quota: 0,
      dailyQuota: 0,
      price: 0,
      duration: 0,
      active: false
    }

    const formGroupData: { [key in keyof CustomConfig ]: any } = {
      instance: {
        name: this.customConfigValidatorsService.INSTANCE_NAME,
        shortDescription: this.customConfigValidatorsService.INSTANCE_SHORT_DESCRIPTION,
        description: null,

        isNSFW: false,
        defaultNSFWPolicy: null,

        terms: null,
        codeOfConduct: null,

        creationReason: null,
        moderationInformation: null,
        administrator: null,
        maintenanceLifetime: null,
        businessModel: null,

        hardwareInformation: null,

        categories: null,
        languages: null,

        defaultClientRoute: null,

        customizations: {
          javascript: null,
          css: null
        }
      },
      theme: {
        default: null
      },
      services: {
        twitter: {
          username: this.customConfigValidatorsService.SERVICES_TWITTER_USERNAME,
          whitelisted: null
        }
      },
      cache: {
        previews: {
          size: this.customConfigValidatorsService.CACHE_PREVIEWS_SIZE
        },
        captions: {
          size: this.customConfigValidatorsService.CACHE_CAPTIONS_SIZE
        }
      },
      signup: {
        enabled: null,
        limit: this.customConfigValidatorsService.SIGNUP_LIMIT,
        requiresEmailVerification: null
      },
      import: {
        videos: {
          http: {
            enabled: null
          },
          torrent: {
            enabled: null
          }
        }
      },
      admin: {
        email: this.customConfigValidatorsService.ADMIN_EMAIL
      },
      contactForm: {
        enabled: null
      },
      user: {
        videoQuota: this.userValidatorsService.USER_VIDEO_QUOTA,
        videoQuotaDaily: this.userValidatorsService.USER_VIDEO_QUOTA_DAILY
      },
      transcoding: {
        enabled: null,
        threads: this.customConfigValidatorsService.TRANSCODING_THREADS,
        allowAdditionalExtensions: null,
        allowAudioFiles: null,
        resolutions: {},
        hls: {
          enabled: null
        },
        webtorrent: {
          enabled: null
        }
      },
      autoBlacklist: {
        videos: {
          ofUsers: {
            enabled: null
          }
        }
      },
      followers: {
        instance: {
          enabled: null,
          manualApproval: null
        }
      },
      followings: {
        instance: {
          autoFollowBack: {
            enabled: null
          },
          autoFollowIndex: {
            enabled: null,
            indexUrl: this.customConfigValidatorsService.INDEX_URL
          }
        }
      }
    }

    const defaultValues = {
      transcoding: {
        resolutions: {}
      }
    }
    for (const resolution of this.resolutions) {
      defaultValues.transcoding.resolutions[resolution.id] = 'false'
      formGroupData.transcoding.resolutions[resolution.id] = null
    }

    this.buildForm(formGroupData)
    this.loadForm()
    this.checkTranscodingFields()
  }

  ngAfterViewChecked () {
    if (!this.initDone) {
      this.initDone = true
      this.gotoAnchor()
    }
  }

  // this.newStoragePlan = {
  //   name: null,
  //   quota: 0,
  //   dailyQuota: 0,
  //   price: 0,
  //   duration: 0,
  //   active: false
  // }

  addPlanButtonClick () {
    if (!this.isAddPlanButtonDisabled()) {
      this.addPlan(this.newStoragePlan).subscribe(resp => {
        console.log('ICEICE addPlanButtonClick response is: ', resp)
      })
    }
  }

  addPlan (body: newPremiumStoragePlan) {
    console.log('ICEICE goinf to call addPlan with body: ', body)
    return this.authHttp.post(EditCustomConfigComponent.GET_PREMIUM_STORAGE_API_URL + 'add-plan', body)
               .pipe(catchError(res => this.restExtractor.handleError(res)))
  }

  isAddPlanButtonDisabled () {
    const { name, quota, dailyQuota, price, duration, active } = this.newStoragePlan
    if (typeof name !== 'string' || name === null || name === '' || name.length > 50) return true
    if (typeof quota !== 'number' || quota < -1 || quota === 0) return true
    if (typeof dailyQuota !== 'number' || dailyQuota < -1 || dailyQuota === 0) return true
    if (typeof price !== 'number' || price < 0) return true
    if (typeof duration !== 'number' || duration < 2628000000 || duration > 31536000000) return true
    if (typeof active !== 'boolean') return true
    return false
  }
  showAddButtonSubmitError () {
    if (this.addPremiumPlanClicked === false) return false
    return this.isAddPlanButtonDisabled()
  }

  onPremiumStorageCheckboxClick (data: any) {
    console.log('ICEICE onPremiumStorageCheckboxClick with data: ', data)
  }

  getPlans () {
    return this.authHttp.get(EditCustomConfigComponent.GET_PREMIUM_STORAGE_API_URL + 'plans')
               .pipe(catchError(res => this.restExtractor.handleError(res)))
  }

  getHRBytes (num: any) {
    try {
      if (num === null || num === undefined) return ''
      return this.bytesPipe.transform(parseInt(num, 10), 0)
    } catch (err) {
      return err
    }
  }

  onRowEditInit (rowData: any) {
    console.log('ICEICE calling onRowEditInit function with data: ', rowData)
  }

  onRowDelete (rowData: any) {
    console.log('ICEICE calling onRowDelete function with data: ', rowData)
    const body = {
      planId: rowData.id
    }
    const deleteResult = this.deletePlan(body)
    console.log('ICEICE calling deletePlan respponse is: ', deleteResult)
  }

  deletePlan (body: any) {
    return this.authHttp.post(EditCustomConfigComponent.GET_PREMIUM_STORAGE_API_URL + 'delete-plan', body)
               .pipe(catchError(res => this.restExtractor.handleError(res)))
  }

  onRowEditSave (rowData: any) {
    console.log('ICEICE calling onRowEditSave function with data: ', rowData)
  }

  onRowEditCancel (rowData: any, ri: number) {
    console.log('ICEICE calling onRowEditCancel function with data: ', rowData)
    console.log('ICEICE ri is: ', ri)
  }

  getResolutionKey (resolution: string) {
    return 'transcoding.resolutions.' + resolution
  }

  showFormSubmitButton () {
    if (this.nav !== undefined && this.nav.activeId !== undefined) {
      return this.nav.activeId !== 'premium-storage-config'
    } else {
      return false
    }
  }

  isTranscodingEnabled () {
    return this.form.value['transcoding']['enabled'] === true
  }

  isSignupEnabled () {
    return this.form.value['signup']['enabled'] === true
  }

  isAutoFollowIndexEnabled () {
    return this.form.value['followings']['instance']['autoFollowIndex']['enabled'] === true
  }

  async formValidated () {
    this.configService.updateCustomConfig(this.form.getRawValue())
      .subscribe(
        res => {
          this.customConfig = res

          // Reload general configuration
          this.serverService.resetConfig()

          this.updateForm()

          this.notifier.success(this.i18n('Configuration updated.'))
        },

        err => this.notifier.error(err.message)
      )
  }

  getSelectedLanguageLabel () {
    return this.i18n('{{\'{0} languages selected')
  }

  getDefaultLanguageLabel () {
    return this.i18n('No language')
  }

  getSelectedCategoryLabel () {
    return this.i18n('{{\'{0} categories selected')
  }

  getDefaultCategoryLabel () {
    return this.i18n('No category')
  }

  gotoAnchor () {
    const hashToNav = {
      'customizations': 'advanced-configuration'
    }
    const hash = window.location.hash.replace('#', '')

    if (hash && Object.keys(hashToNav).includes(hash)) {
      this.nav.select(hashToNav[hash])
      setTimeout(() => this.viewportScroller.scrollToAnchor(hash), 100)
    }
  }

  private updateForm () {
    this.form.patchValue(this.customConfig)
  }

  private loadForm () {
    forkJoin([
      this.configService.getCustomConfig(),
      this.serverService.getVideoLanguages(),
      this.serverService.getVideoCategories()
    ]).subscribe(
      ([ config, languages, categories ]) => {
        this.customConfig = config

        this.languageItems = languages.map(l => ({ label: l.label, value: l.id }))
        this.categoryItems = categories.map(l => ({ label: l.label, value: l.id }))

        this.updateForm()
        // Force form validation
        this.forceCheck()
      },

      err => this.notifier.error(err.message)
    )
  }

  private checkTranscodingFields () {
    const hlsControl = this.form.get('transcoding.hls.enabled')
    const webtorrentControl = this.form.get('transcoding.webtorrent.enabled')

    webtorrentControl.valueChanges
                     .subscribe(newValue => {
                       if (newValue === false && !hlsControl.disabled) {
                         hlsControl.disable()
                       }

                       if (newValue === true && !hlsControl.enabled) {
                         hlsControl.enable()
                       }
                     })

    hlsControl.valueChanges
              .subscribe(newValue => {
                if (newValue === false && !webtorrentControl.disabled) {
                  webtorrentControl.disable()
                }

                if (newValue === true && !webtorrentControl.enabled) {
                  webtorrentControl.enable()
                }
              })
  }
}
