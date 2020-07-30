import { AfterViewChecked, Component, OnInit, ViewChild } from '@angular/core'
import { ConfigService } from '@app/+admin/config/shared/config.service'
import { ServerService } from '@app/core/server/server.service'
import { Notifier, RestExtractor } from '@app/core'
import { ConfirmService } from '@app/core/confirm'
import { interfacePremiumStoragePlan } from '@shared/models/server/premium-storage-plan-interface'
import { catchError } from 'rxjs/operators'
import { SelectItem } from 'primeng/api'
import { forkJoin } from 'rxjs'
import { ViewportScroller } from '@angular/common'
import { CustomConfigValidatorsService, FormReactive, FormValidatorService, UserValidatorsService } from '@app/shared/shared-forms'
import { NgbNav } from '@ng-bootstrap/ng-bootstrap'
import { HttpClient } from '@angular/common/http'
import { environment } from '../../../../environments/environment'
import { BytesPipe } from 'ngx-pipes'
import { PremiumStorageModalComponent } from '@app/modal/premium-storage-modal.component'
import { identifierModuleUrl } from '@angular/compiler'
import { I18n } from '@ngx-translate/i18n-polyfill'
import { CustomConfig, ServerConfig } from '@shared/models'

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
  newStoragePlan: interfacePremiumStoragePlan

  resolutions: { id: string, label: string, description?: string }[] = []
  transcodingThreadOptions: { label: string, value: number }[] = []

  languageItems: SelectItem[] = []
  categoryItems: SelectItem[] = []
  storagePlans: any[] = []
  planIndex: number = null
  premiumStorageActive = false
  addPremiumPlanClicked = false
  showAddPlanModal = false

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
    private confirmService: ConfirmService,
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
    this.subscribeConfigAndPlans()
    this.serverConfig = this.serverService.getTmpConfig()
    // this.serverService.getConfig()
    //     .subscribe(config => this.serverConfig = config)
    this.resetNewStoragePlan()

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
      },
      premium_storage: {
        enabled: null
      },
      broadcastMessage: {
        enabled: null,
        level: null,
        dismissable: null,
        message: null
      },
      search: {
        remoteUri: {
          users: null,
          anonymous: null
        },
        searchIndex: {
          enabled: null,
          url: this.customConfigValidatorsService.SEARCH_INDEX_URL,
          disableLocalSearch: null,
          isDefaultSearch: null
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

  resetNewStoragePlan () {
    this.newStoragePlan = {
      name: null,
      quota: 0,
      dailyQuota: 0,
      priceTube: 0,
      duration: 0,
      active: false
    }
  }

  subscribeConfigAndPlans () {
    forkJoin([
      this.getPlans(),
      this.serverService.getConfig()
    ]).subscribe(([ plans, config ]) => {
      if (plans['success'] && plans['plans'].length > 0) {
        this.storagePlans = plans['plans']
        this.storagePlans.forEach(plan => {
          plan.updateData = plan
        })
      }
      if (config) {
        this.serverConfig = config
        console.log('ICEICE config is: ', this.serverConfig)
      }
    })
  }

  addPlanButtonClick () {
    if (!this.isAddPlanButtonDisabled()) {
      console.log('ICEICE going to call addPlan with body. ', this.newStoragePlan)
      this.addPlan(this.newStoragePlan).subscribe(resp => {
        console.log('ICEICE addPlanButtonClick response is: ', resp)
        if (resp['success']) {
          this.notifier.success('Your new plan has been successfully added')
          this.showAddPlanModal = false
          this.resetNewStoragePlan()
          this.subscribeConfigAndPlans()
        } else {
          this.notifier.error(resp['error'])
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
    return this.authHttp.post(EditCustomConfigComponent.GET_PREMIUM_STORAGE_API_URL + 'add-plan', body)
               .pipe(catchError(res => this.restExtractor.handleError(res)))
  }

  isAddPlanButtonDisabled () {
    const { name, quota, dailyQuota, priceTube, duration, active } = this.newStoragePlan
    if (typeof name !== 'string' || name === null || name === '' || name.length > 50) return true
    if (typeof quota !== 'number' || quota < -1 || quota === 0) return true
    if (typeof dailyQuota !== 'number' || dailyQuota < -1 || dailyQuota === 0) return true
    if (typeof priceTube !== 'number' || priceTube < 0) return true
    if (typeof duration !== 'number' || duration < 2628000000 || duration > 31536000000) return true
    if (typeof active !== 'boolean') return true
    return false
  }
  showAddButtonSubmitError () {
    if (this.addPremiumPlanClicked === false) return false
    return this.isAddPlanButtonDisabled()
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

  onRowEditInit (rowData: interfacePremiumStoragePlan) {
    // this.updateStoragePlan = rowData
  }

  async onRowDelete (rowData: any) {
    const res = await this.confirmService.confirm(
      this.i18n("Do you really want to delete '{{planName}}' plan? \n ATENTION! If some user already bought this plan you can delete his payment also! Before delete a plan, be sure that anybody is using it or consider to just deactivate it", { planName: rowData.name }),
      this.i18n('Delete')
    )
    if (res === false) return
    const body = {
      planId: rowData.id
    }
    console.log('ICEICE calling onRowDelete function with data: ', body)
    this.deletePlan(body).subscribe(resp => {
      console.log('ICEICE deletePlan response is: ', resp)
      if (resp['success']) {
        this.subscribeConfigAndPlans()
        this.notifier.success('Plan successfully deleted')
      } else {
        this.notifier.error(`Something went wrong deleting the plan, reload and try again`)
      }
    })
  }

  deletePlan (body: any) {
    return this.authHttp.post(EditCustomConfigComponent.GET_PREMIUM_STORAGE_API_URL + 'delete-plan', body)
               .pipe(catchError(res => this.restExtractor.handleError(res)))
  }

  onRowEditSave (rowData: interfacePremiumStoragePlan) {
    console.log('ICEICE calling onRowEditSave function with data: ', rowData)
    const body = {
      id: rowData.id,
      name: rowData.name,
      quota: rowData.quota,
      dailyQuota: rowData.dailyQuota,
      priceTube: rowData.priceTube,
      duration: rowData.duration,
      active: rowData.active
    }
    console.log('ICEICE calling onRowEditSave function with body: ', body)
    this.updatePlan(body).subscribe(resp => {
      console.log('ICEICE onRowEditSave updatePlan response is: ', resp)
      if (resp['success']) {
        this.subscribeConfigAndPlans()
        this.notifier.success('Plan successfully updated')
      } else {
        this.notifier.error(`Something went wrong updating the plan, reload and try again`)
      }
    })
  }

  updatePlan (body: interfacePremiumStoragePlan) {
    console.log('ICEICE going to call addPlan with body: ', body)
    return this.authHttp.post(EditCustomConfigComponent.GET_PREMIUM_STORAGE_API_URL + 'update-plan', body)
               .pipe(catchError(res => this.restExtractor.handleError(res)))
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

  isSearchIndexEnabled () {
    return this.form.value['search']['searchIndex']['enabled'] === true
  }

  isAutoFollowIndexEnabled () {
    return this.form.value['followings']['instance']['autoFollowIndex']['enabled'] === true
  }

  async formValidated () {
    console.log('ICEICE going to update config with form : ', this.form.getRawValue())
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
