<<<<<<< Updated upstream
import { LOCALE_ID, NgModule, TRANSLATIONS, TRANSLATIONS_FORMAT } from '@angular/core'
=======
import 'focus-visible'
import { APP_BASE_HREF, registerLocaleData } from '@angular/common'
import { NgModule } from '@angular/core'
>>>>>>> Stashed changes
import { BrowserModule } from '@angular/platform-browser'
import { ServerService } from '@app/core'
import { ResetPasswordModule } from '@app/reset-password'

import { MetaLoader, MetaModule, MetaStaticLoader, PageTitlePositioning } from '@ngx-meta/core'
<<<<<<< Updated upstream
import 'focus-visible'

import { AppRoutingModule } from './app-routing.module'
import { AppComponent } from './app.component'
import { CoreModule } from './core'
import { HeaderComponent, SearchTypeaheadComponent, SuggestionsComponent, SuggestionComponent } from './header'
import { LoginModule } from './login'
import { AvatarNotificationComponent, LanguageChooserComponent, MenuComponent } from './menu'
import { SharedModule } from './shared'
import { VideosModule } from './videos'
import { SearchModule } from '@app/search'
import { WelcomeModalComponent } from '@app/modal/welcome-modal.component'
import { InstanceConfigWarningModalComponent } from '@app/modal/instance-config-warning-modal.component'
import { buildFileLocale, getCompleteLocale, isDefaultLocale } from '@shared/models'
import { APP_BASE_HREF } from '@angular/common'
import { QuickSettingsModalComponent } from '@app/modal/quick-settings-modal.component'
import { CustomModalComponent } from '@app/modal/custom-modal.component'
=======
import { AppRoutingModule } from './app-routing.module'
import { AppComponent } from './app.component'
import { CoreModule } from './core'
import { EmptyComponent } from './empty.component'
import { HeaderComponent, SearchTypeaheadComponent, SuggestionComponent } from './header'
import { HighlightPipe } from './header/highlight.pipe'
import { NotificationComponent, LanguageChooserComponent, MenuComponent } from './menu'
import { ConfirmComponent } from './modal/confirm.component'
import { CustomModalComponent } from './modal/custom-modal.component'
import { InstanceConfigWarningModalComponent } from './modal/instance-config-warning-modal.component'
import { QuickSettingsModalComponent } from './modal/quick-settings-modal.component'
import { WelcomeModalComponent } from './modal/welcome-modal.component'
import { SharedFormModule } from './shared/shared-forms'
import { SharedGlobalIconModule } from './shared/shared-icons'
import { SharedInstanceModule } from './shared/shared-instance'
import { SharedMainModule } from './shared/shared-main'
import { SharedUserInterfaceSettingsModule } from './shared/shared-user-settings'

registerLocaleData(localeOc, 'oc')
>>>>>>> Stashed changes

@NgModule({
  bootstrap: [ AppComponent ],
  declarations: [
    AppComponent,

    MenuComponent,
    LanguageChooserComponent,
    QuickSettingsModalComponent,
    NotificationComponent,
    HeaderComponent,
    SearchTypeaheadComponent,
    SuggestionsComponent,
    SuggestionComponent,

    CustomModalComponent,
    WelcomeModalComponent,
    InstanceConfigWarningModalComponent
  ],
  imports: [
    BrowserModule,

    CoreModule,
    SharedModule,

    CoreModule,
    LoginModule,
    ResetPasswordModule,
    SearchModule,
    SharedModule,
    VideosModule,

    MetaModule.forRoot({
      provide: MetaLoader,
      useFactory: (serverService: ServerService) => {
        return new MetaStaticLoader({
          pageTitlePositioning: PageTitlePositioning.PrependPageTitle,
          pageTitleSeparator: ' - ',
          get applicationName () { return serverService.getTmpConfig().instance.name },
          defaults: {
            get title () { return serverService.getTmpConfig().instance.name },
            get description () { return serverService.getTmpConfig().instance.shortDescription }
          }
        })
      },
      deps: [ ServerService ]
    }),

    AppRoutingModule // Put it after all the module because it has the 404 route
  ],

  providers: [
    {
      provide: APP_BASE_HREF,
      useValue: '/'
    }
  ]
})
export class AppModule {}
