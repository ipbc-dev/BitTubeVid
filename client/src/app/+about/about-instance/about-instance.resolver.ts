import { Injectable } from '@angular/core'
import { ActivatedRouteSnapshot, Resolve } from '@angular/router'
<<<<<<< Updated upstream
import { map, switchMap } from 'rxjs/operators'
import { forkJoin } from 'rxjs'
import { InstanceService } from '@app/shared/instance/instance.service'
import { About } from '@shared/models/server'
=======
import { ServerService } from '@app/core'
import { InstanceService } from '@app/shared/shared-instance'
import { About, ServerConfig } from '@shared/models/server'
>>>>>>> Stashed changes

export type ResolverData = { about: About, languages: string[], categories: string[], serverConfig: ServerConfig }

@Injectable()
export class AboutInstanceResolver implements Resolve<any> {
<<<<<<< Updated upstream
  constructor (
    private instanceService: InstanceService
=======

  constructor (
    private instanceService: InstanceService,
    private serverService: ServerService
>>>>>>> Stashed changes
  ) {}

  resolve (route: ActivatedRouteSnapshot) {
    return this.instanceService.getAbout()
               .pipe(
                 switchMap(about => {
                   return forkJoin([
                     this.instanceService.buildTranslatedLanguages(about),
                     this.instanceService.buildTranslatedCategories(about),
                     this.serverService.getConfig()
                   ]).pipe(map(([ languages, categories, serverConfig ]) => ({ about, languages, categories, serverConfig })))
                 })
               )
  }
}
