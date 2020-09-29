
import { AfterViewChecked, Component, OnInit, ViewChild } from '@angular/core'
import { ConfigService } from '@app/+admin/config/shared/config.service'
import { ServerService } from '@app/core/server/server.service'
import { Notifier } from '@app/core'
import { ConfirmService } from '@app/core/confirm'
import { interfacePremiumStoragePlan } from '@shared/models/server/premium-storage-plan-interface'
import { RestExtractor } from '@app/core/rest'
import { SelectItem } from 'primeng/api'
import { forkJoin } from 'rxjs'
import { catchError } from 'rxjs/operators'
import { ViewportScroller } from '@angular/common'
import { HttpClient } from '@angular/common/http'
import { environment } from '../../../../environments/environment'
import { BytesPipe } from '@app/shared/shared-main/angular'
import { PremiumStorageModalComponent } from '@app/modal/premium-storage-modal.component'
import { identifierModuleUrl } from '@angular/compiler'
import {
  ADMIN_EMAIL_VALIDATOR,
  CACHE_CAPTIONS_SIZE_VALIDATOR,
  CACHE_PREVIEWS_SIZE_VALIDATOR,
  INDEX_URL_VALIDATOR,
  INSTANCE_NAME_VALIDATOR,
  INSTANCE_SHORT_DESCRIPTION_VALIDATOR,
  SEARCH_INDEX_URL_VALIDATOR,
  SERVICES_TWITTER_USERNAME_VALIDATOR,
  SIGNUP_LIMIT_VALIDATOR,
  TRANSCODING_THREADS_VALIDATOR
} from '@app/shared/form-validators/custom-config-validators'
import { USER_VIDEO_QUOTA_DAILY_VALIDATOR, USER_VIDEO_QUOTA_VALIDATOR } from '@app/shared/form-validators/user-validators'
import { FormReactive, FormValidatorService, SelectOptionsItem } from '@app/shared/shared-forms'
import { NgbNav } from '@ng-bootstrap/ng-bootstrap'
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

  storagePlans: any[] = []
  planIndex: number = null
  premiumStorageActive = false
  addPremiumPlanClicked = false
  showAddPlanModal = false
  languageItems: SelectOptionsItem[] = []
  categoryItems: SelectOptionsItem[] = []

  private serverConfig: ServerConfig
  private bytesPipe: BytesPipe

  constructor (
    private viewportScroller: ViewportScroller,
    protected formValidatorService: FormValidatorService,
    private notifier: Notifier,
    private authHttp: HttpClient,
    private restExtractor: RestExtractor,
    private configService: ConfigService,
    private confirmService: ConfirmService,
    private serverService: ServerService
  ) {
    super()
    this.bytesPipe = new BytesPipe()
    this.resolutions = [
      {
        id: '0p',
        label: $localize`Audio-only`,
        description: $localize`A <code>.mp4</code> that keeps the original audio track, with no video`
      },
      {
        id: '240p',
        label: $localize`240p`
      },
      {
        id: '360p',
        label: $localize`360p`
      },
      {
        id: '480p',
        label: $localize`480p`
      },
      {
        id: '720p',
        label: $localize`720p`
      },
      {
        id: '1080p',
        label: $localize`1080p`
      },
      {
        id: '2160p',
        label: $localize`2160p`
      }
    ]

    this.transcodingThreadOptions = [
      { value: 0, label: $localize`Auto (via ffmpeg)` },
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
        name: INSTANCE_NAME_VALIDATOR,
        shortDescription: INSTANCE_SHORT_DESCRIPTION_VALIDATOR,
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
          username: SERVICES_TWITTER_USERNAME_VALIDATOR,
          whitelisted: null
        }
      },
      cache: {
        previews: {
          size: CACHE_PREVIEWS_SIZE_VALIDATOR
        },
        captions: {
          size: CACHE_CAPTIONS_SIZE_VALIDATOR
        }
      },
      signup: {
        enabled: null,
        limit: SIGNUP_LIMIT_VALIDATOR,
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
        email: ADMIN_EMAIL_VALIDATOR
      },
      contactForm: {
        enabled: null
      },
      user: {
        videoQuota: USER_VIDEO_QUOTA_VALIDATOR,
        videoQuotaDaily: USER_VIDEO_QUOTA_DAILY_VALIDATOR
      },
      transcoding: {
        enabled: null,
        threads: TRANSCODING_THREADS_VALIDATOR,
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
            indexUrl: INDEX_URL_VALIDATOR
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
          url: SEARCH_INDEX_URL_VALIDATOR,
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
      }
    })
  }

  addPlanButtonClick () {
    if (!this.isAddPlanButtonDisabled()) {
      console.log('ICEICE going to call addPlan with body. ', this.newStoragePlan)
      this.newStoragePlan.quota = this.newStoragePlan.quota * 1073741824 /* to bytes */
      this.newStoragePlan.dailyQuota = this.newStoragePlan.dailyQuota * 1073741824 /* to bytes */
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
    const bodyWithToken: any = body
    bodyWithToken.accessToken = localStorage.getItem('access_token')
    return this.authHttp.post(EditCustomConfigComponent.GET_PREMIUM_STORAGE_API_URL + 'add-plan', bodyWithToken)
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
    console.log('ICEICE calling onRowDelete function with data: ', body)
    this.deletePlan(body).subscribe(resp => {
      console.log('ICEICE deletePlan response is: ', resp)
      if (resp['success']) {
        this.subscribeConfigAndPlans()
        setTimeout(() => { this.notifier.success('Plan successfully deleted') } , 1000) /* Wait 1 sec for subscription */
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
      tubePayId: rowData.tubePayId,
      name: rowData.name,
      quota: rowData.quota * 1073741824, /* to bytes */
      dailyQuota: rowData.dailyQuota * 1073741824, /* to bytes */
      priceTube: rowData.priceTube,
      duration: rowData.duration,
      expiration: rowData.expiration,
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

          this.notifier.success($localize`Configuration updated.`)
        },

        err => this.notifier.error(err.message)
      )
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

        this.languageItems = languages.map(l => ({ label: l.label, id: l.id }))
        this.categoryItems = categories.map(l => ({ label: l.label, id: l.id + '' }))

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
