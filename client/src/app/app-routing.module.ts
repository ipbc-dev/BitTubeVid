import { NgModule } from '@angular/core'
import { RouteReuseStrategy, RouterModule, Routes } from '@angular/router'
<<<<<<< Updated upstream

import { PreloadSelectedModulesList } from './core'
import { AppComponent } from '@app/app.component'
import { CustomReuseStrategy } from '@app/core/routing/custom-reuse-strategy'
import { MenuGuards } from '@app/core/routing/menu-guard.service'
=======
import { CustomReuseStrategy } from '@app/core/routing/custom-reuse-strategy'
import { MenuGuards } from '@app/core/routing/menu-guard.service'
import { PreloadSelectedModulesList } from './core'
import { EmptyComponent } from './empty.component'
import { POSSIBLE_LOCALES } from '@shared/core-utils/i18n'
>>>>>>> Stashed changes

const routes: Routes = [
  {
    path: 'admin',
    canActivate: [ MenuGuards.close() ],
    canDeactivate: [ MenuGuards.open() ],
    loadChildren: () => import('./+admin/admin.module').then(m => m.AdminModule)
  },
  {
    path: 'my-account',
    loadChildren: () => import('./+my-account/my-account.module').then(m => m.MyAccountModule)
  },
  {
    path: 'my-library',
    loadChildren: () => import('./+my-library/my-library.module').then(m => m.MyLibraryModule)
  },
  {
    path: 'verify-account',
    loadChildren: () => import('./+signup/+verify-account/verify-account.module').then(m => m.VerifyAccountModule)
  },
  {
    path: 'accounts',
    loadChildren: () => import('./+accounts/accounts.module').then(m => m.AccountsModule)
  },
  {
    path: 'video-channels',
    loadChildren: () => import('./+video-channels/video-channels.module').then(m => m.VideoChannelsModule)
  },
  {
    path: 'about',
    loadChildren: () => import('./+about/about.module').then(m => m.AboutModule)
  },
  {
    path: 'signup',
    loadChildren: () => import('./+signup/+register/register.module').then(m => m.RegisterModule)
  },
  {
    path: '',
<<<<<<< Updated upstream
    component: AppComponent // Avoid 404, app component will redirect dynamically
  },
  {
    path: '**',
    loadChildren: () => import('./+page-not-found/page-not-found.module').then(m => m.PageNotFoundModule)
=======
    component: EmptyComponent // Avoid 404, app component will redirect dynamically
>>>>>>> Stashed changes
  }
]

// Avoid 404 when changing language
for (const locale of POSSIBLE_LOCALES) {
  routes.push({
    path: locale,
    component: EmptyComponent
  })
}

routes.push({
  path: '**',
  loadChildren: () => import('./+page-not-found/page-not-found.module').then(m => m.PageNotFoundModule)
})

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      useHash: Boolean(history.pushState) === false,
      scrollPositionRestoration: 'disabled',
      preloadingStrategy: PreloadSelectedModulesList,
      anchorScrolling: 'disabled'
    })
  ],
  providers: [
    MenuGuards.guards,
    PreloadSelectedModulesList,
    { provide: RouteReuseStrategy, useClass: CustomReuseStrategy }
  ],
  exports: [ RouterModule ]
})
export class AppRoutingModule {}
