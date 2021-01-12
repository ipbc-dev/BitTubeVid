import { NgModule } from '@angular/core'
<<<<<<< Updated upstream
=======
import { SignupSharedModule } from '@app/+signup/shared/signup-shared.module'
import { SharedInstanceModule } from '@app/shared/shared-instance'
import { CustomStepperComponent } from './custom-stepper.component'
>>>>>>> Stashed changes
import { RegisterRoutingModule } from './register-routing.module'
import { RegisterComponent } from './register.component'
import { SharedModule } from '@app/shared'
import { CdkStepperModule } from '@angular/cdk/stepper'
import { RegisterStepChannelComponent } from './register-step-channel.component'
import { RegisterStepTermsComponent } from './register-step-terms.component'
import { RegisterStepUserComponent } from './register-step-user.component'
import { CustomStepperComponent } from './custom-stepper.component'
import { SignupSharedModule } from '@app/+signup/shared/signup-shared.module'
import { NgbAccordionModule } from '@ng-bootstrap/ng-bootstrap'

@NgModule({
  imports: [
    RegisterRoutingModule,
    SharedModule,
    CdkStepperModule,
<<<<<<< Updated upstream
=======

>>>>>>> Stashed changes
    SignupSharedModule,
    NgbAccordionModule
  ],

  declarations: [
    RegisterComponent,
    CustomStepperComponent,
    RegisterStepChannelComponent,
    RegisterStepTermsComponent,
    RegisterStepUserComponent
  ],

  exports: [
    RegisterComponent
  ],

  providers: [
  ]
})
export class RegisterModule { }
