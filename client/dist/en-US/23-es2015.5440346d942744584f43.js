(window.webpackJsonp=window.webpackJsonp||[]).push([[23],{"4aiV":function(e,t,n){"use strict";n.r(t),n.d(t,"LoginModule",(function(){return oe}));var o=n("sWvm"),r=n("P8w3"),c=n("xMQD"),i=n("tyNb"),a=n("Phsq"),s=n("mrSG"),l=n("ey9i"),d=n("ihI+"),u=n("IEtR"),g=n("AytR"),f=n("fXoL"),b=n("1kSV"),p=n("7FIj"),h=n("ofXK"),m=n("3Pt+"),v=n("UkmY");const P=["usernameInput"],w=["forgotPasswordModal"];var C,y,x;function M(e,t){1&e&&(f.dc(0,"div",5),f.nc(1,y),f.Yb(2,"a",6),f.kc(),f.cc())}C=$localize`:␟12910217fdcdbca64bee06f511639b653d5428ea␟7329323998926911298: Login `,y=$localize`:␟6b6240483bee515c1e20c0c21fc6096e8cdd08e9␟7087184891192042832: Sorry but there was an issue with the external login process. Please ${"\ufffd#2\ufffd"}:START_LINK:contact an administrator${"\ufffd/#2\ufffd"}:CLOSE_LINK:. `,x=$localize`:␟e08a77594f3d89311cdf6da5090044270909c194␟2392488717875840729:User`;const k=["placeholder",$localize`:␟51ef29329faccb28d94369897068897d1b3d0478␟3997350348765083892:Username or email address`];var O;O=$localize`:␟c32ef07f8803a223a83ed17024b38e8d82292407␟1431416938026210429:Password`;const _=["placeholder",$localize`:␟c32ef07f8803a223a83ed17024b38e8d82292407␟1431416938026210429:Password`],E=["title",$localize`:␟48ff0628dcbb4d37e9687302df3023b8427b48f2␟8715156686857791956:Click here to reset your password`],I=["value",$localize`:␟6765b4c916060f6bc42d9bb69e80377dbcb5e4e9␟2454050363478003966:Login`];var A,S,$,D,L;function z(e,t){1&e&&(f.dc(0,"div",22),f.dc(1,"h6",23),f.hc(2,A),f.cc(),f.dc(3,"div"),f.nc(4,S),f.Yb(5,"br"),f.Yb(6,"a",24),f.kc(),f.cc(),f.cc())}function J(e,t){1&e&&(f.dc(0,"span"),f.dc(1,"a",25),f.hc(2,$),f.cc(),f.cc())}function R(e,t){if(1&e&&(f.dc(0,"div",5),f.cd(1),f.ad(2,J,3,0,"span",3),f.cc()),2&e){const e=f.wc(2);f.Jb(1),f.ed("",e.error," "),f.Jb(1),f.Dc("ngIf","User email is not verified."===e.error)}}function F(e,t){1&e&&(f.dc(0,"a",26),f.hc(1,D),f.cc())}function T(e,t){if(1&e&&(f.dc(0,"div",27),f.cd(1),f.cc()),2&e){const e=f.wc(2);f.Jb(1),f.ed(" ",e.formErrors.username," ")}}function j(e,t){if(1&e&&(f.dc(0,"div",27),f.cd(1),f.cc()),2&e){const e=f.wc(2);f.Jb(1),f.ed(" ",e.formErrors.password," ")}}function N(e,t){if(1&e&&(f.dc(0,"a",31),f.cd(1),f.cc()),2&e){const e=t.$implicit,n=f.wc(3);f.Dc("href",n.getAuthHref(e),f.Tc),f.Jb(1),f.ed(" ",e.authDisplayName," ")}}function X(e,t){if(1&e&&(f.dc(0,"div",28),f.dc(1,"div",29),f.hc(2,L),f.cc(),f.dc(3,"div"),f.ad(4,N,2,2,"a",30),f.cc(),f.cc()),2&e){const e=f.wc(2);f.Jb(4),f.Dc("ngForOf",e.getExternalLogins())}}A=$localize`:␟17f43ee2fb343f8b60568527d105777b99ae8414␟8129155036644127983: If you are looking for an account… `,S=$localize`:␟8b339f3b4ba60cd2f880c7c19e8b375e7892f4c1␟4652281956954200409: Currently this instance doesn't allow for user registration, but you can find an instance that gives you the possibility to sign up for an account and upload your videos there. ${"\ufffd#5\ufffd\ufffd/#5\ufffd"}:LINE_BREAK: Find yours among multiple instances at ${"\ufffd#6\ufffd"}:START_LINK:https://joinpeertube.org/instances${"\ufffd/#6\ufffd"}:CLOSE_LINK:. `,$=$localize`:␟ae3cb52bf2dee3101ee654812b5d16e8665a9453␟8390073108781420493:Request new verification email.`,D=$localize`:␟9fed9d6f57dafb967ffaaf3c63f54ad976cab926␟2608759089874155841: or create an account `,L=$localize`:␟f5d783c0613d323fdd20074ffbc519ee715a4f2b␟3183213940445113677:Or sign in with`;const q=function(e){return{"input-error":e}};function V(e,t){if(1&e){const e=f.ec();f.bc(0),f.ad(1,z,7,0,"div",7),f.ad(2,R,3,2,"div",2),f.dc(3,"div",8),f.dc(4,"form",9),f.sc("ngSubmit",(function(){return f.Rc(e),f.wc().login()})),f.dc(5,"div",10),f.dc(6,"div"),f.dc(7,"label",11),f.hc(8,x),f.cc(),f.dc(9,"input",12,13),f.jc(11,k),f.cc(),f.ad(12,F,2,0,"a",14),f.cc(),f.ad(13,T,2,1,"div",15),f.cc(),f.dc(14,"div",10),f.dc(15,"label",16),f.hc(16,O),f.cc(),f.dc(17,"div"),f.dc(18,"input",17),f.jc(19,_),f.cc(),f.dc(20,"a",18),f.jc(21,E),f.sc("click",(function(){return f.Rc(e),f.wc().openForgotPasswordModal()})),f.cd(22,"I forgot my password"),f.cc(),f.cc(),f.ad(23,j,2,1,"div",15),f.cc(),f.dc(24,"input",19),f.jc(25,I),f.cc(),f.cc(),f.ad(26,X,5,1,"div",20),f.cc(),f.dc(27,"a",21),f.sc("click",(function(t){return f.Rc(e),f.wc().social_login(t,"facebook")})),f.cd(28,"Login with Facebook"),f.cc(),f.cd(29,"\xa0 "),f.dc(30,"a",21),f.sc("click",(function(t){return f.Rc(e),f.wc().social_login(t,"google")})),f.cd(31,"Login with Google"),f.cc(),f.cd(32,"\xa0 "),f.dc(33,"a",21),f.sc("click",(function(t){return f.Rc(e),f.wc().social_login(t,"twitter")})),f.cd(34,"Login with Twitter"),f.cc(),f.ac()}if(2&e){const e=f.wc();f.Jb(1),f.Dc("ngIf",!1===e.signupAllowed),f.Jb(1),f.Dc("ngIf",e.error),f.Jb(2),f.Dc("formGroup",e.form),f.Jb(5),f.Dc("ngClass",f.Hc(10,q,e.formErrors.username)),f.Jb(3),f.Dc("ngIf",!0===e.signupAllowed),f.Jb(1),f.Dc("ngIf",e.formErrors.username),f.Jb(5),f.Dc("ngClass",f.Hc(12,q,e.formErrors.password)),f.Jb(5),f.Dc("ngIf",e.formErrors.password),f.Jb(1),f.Dc("disabled",!e.form.valid),f.Jb(2),f.Dc("ngIf",0!==e.getExternalLogins().length)}}var W,G;W=$localize`:␟d2eb6c5d41f70d4b8c0937e7e19e196143b47681␟3238209155172574367:Forgot your password`,G=$localize`:␟244aae9346da82b0922506c2d2581373a15641cc␟4768749765465246664:Email`;const U=["placeholder",$localize`:␟69b6ac577a19acc39fc0c22342092f327fff2529␟3967269098753656610:Email address`],K=["value",$localize`:␟d7b35c384aecd25a516200d6921836374613dfe7␟2159130950882492111:Cancel`],Y=["value",$localize`:␟78be69e4d26b3b654c49962839d8545e61bf8b55␟2088892374757803217:Send me an email to reset my password`];var H;function B(e,t){1&e&&(f.dc(0,"div",5),f.hc(1,H),f.cc())}function Q(e,t){if(1&e){const e=f.ec();f.dc(0,"div",32),f.dc(1,"h4",33),f.hc(2,W),f.cc(),f.dc(3,"my-global-icon",34),f.sc("click",(function(){return f.Rc(e),f.wc().hideForgotPasswordModal()})),f.cc(),f.cc(),f.dc(4,"div",35),f.ad(5,B,2,0,"div",2),f.dc(6,"div",36),f.dc(7,"label",37),f.hc(8,G),f.cc(),f.dc(9,"input",38,39),f.jc(11,U),f.sc("ngModelChange",(function(t){return f.Rc(e),f.wc().forgotPasswordEmail=t})),f.cc(),f.cc(),f.cc(),f.dc(12,"div",40),f.dc(13,"input",41),f.jc(14,K),f.sc("click",(function(){return f.Rc(e),f.wc().hideForgotPasswordModal()}))("key.enter",(function(){return f.Rc(e),f.wc().hideForgotPasswordModal()})),f.cc(),f.dc(15,"input",42),f.jc(16,Y),f.sc("click",(function(){return f.Rc(e),f.wc().askResetPassword()})),f.cc(),f.cc()}if(2&e){const e=f.Pc(10),t=f.wc();f.Jb(5),f.Dc("ngIf",t.isEmailDisabled()),f.Jb(1),f.Dc("hidden",t.isEmailDisabled()),f.Jb(3),f.Dc("ngModel",t.forgotPasswordEmail),f.Jb(6),f.Dc("disabled",!e.validity.valid)}}H=$localize`:␟2b32966311070e6482576d09d1e8f242677da5e9␟3980956683681380538: We are sorry, you cannot recover your password because your instance administrator did not configure the BitTube email system. `;let Z=(()=>{class e extends o.c{constructor(e,t,n,o,r,c,i,a,s,l){super(),this.formValidatorService=e,this.route=t,this.modalService=n,this.loginValidatorsService=o,this.authService=r,this.userService=c,this.redirectService=i,this.notifier=a,this.hooks=s,this.i18n=l,this.error=null,this.forgotPasswordEmail="",this.isAuthenticatedWithExternalAuth=!1,this.externalAuthError=!1,this.externalLogins=[]}get signupAllowed(){return!0===this.serverConfig.signup.allowed}isEmailDisabled(){return!1===this.serverConfig.email.enabled}ngOnInit(){const e=this.route.snapshot;this.serverConfig=e.data.serverConfig,e.queryParams.externalAuthToken?this.loadExternalAuthToken(e.queryParams.username,e.queryParams.externalAuthToken):e.queryParams.externalAuthError?this.externalAuthError=!0:this.buildForm({username:this.loginValidatorsService.LOGIN_USERNAME,password:this.loginValidatorsService.LOGIN_PASSWORD})}ngAfterViewInit(){this.usernameInput&&this.usernameInput.nativeElement.focus(),this.hooks.runAction("action:login.init","login")}getExternalLogins(){return this.serverConfig.plugin.registeredExternalAuths}getAuthHref(e){return g.a.apiUrl+`/plugins/${e.name}/${e.version}/auth/${e.authName}`}social_login(e,t){e.preventDefault();let n=null;switch(t){case"facebook":n=new u.b.auth.FacebookAuthProvider;break;case"google":n=new u.b.auth.GoogleAuthProvider;break;case"twitter":n=new u.b.auth.TwitterAuthProvider}u.a.signInWithPopup(n).then(e=>Object(s.a)(this,void 0,void 0,(function*(){const t=e.user.email,n=yield Object(u.c)();this.authService.login(t,n).subscribe(()=>this.redirectService.redirectToPreviousRoute(),e=>{this.error=-1!==e.message.indexOf("credentials are invalid")?this.i18n("Incorrect username or password."):-1!==e.message.indexOf("blocked")?this.i18n("You account is blocked."):e.message})})),e=>this.error=e.message)}login(){this.error=null;const{username:e,password:t}=this.form.value;this.authService.login(e,t).subscribe(()=>(-1!==e.indexOf("@")&&u.a.signInWithEmailAndPassword(e,t).catch(e=>console.error(e)),this.redirectService.redirectToPreviousRoute()),e=>this.handleError(e))}askResetPassword(){this.userService.askResetPassword(this.forgotPasswordEmail).subscribe(()=>{const e=this.i18n("An email with the reset password instructions will be sent to {{email}}. The link will expire within 1 hour.",{email:this.forgotPasswordEmail});this.notifier.success(e),this.hideForgotPasswordModal()},e=>this.notifier.error(e.message))}openForgotPasswordModal(){this.openedForgotPasswordModal=this.modalService.open(this.forgotPasswordModal)}hideForgotPasswordModal(){this.openedForgotPasswordModal.close()}loadExternalAuthToken(e,t){this.isAuthenticatedWithExternalAuth=!0,this.authService.login(e,null,t).subscribe(()=>this.redirectService.redirectToPreviousRoute(),e=>{this.handleError(e),this.isAuthenticatedWithExternalAuth=!1})}handleError(e){this.error=-1!==e.message.indexOf("credentials are invalid")?this.i18n("Incorrect username or password."):-1!==e.message.indexOf("blocked")?this.i18n("Your account is blocked."):e.message}}return e.\u0275fac=function(t){return new(t||e)(f.Xb(o.d),f.Xb(i.a),f.Xb(b.k),f.Xb(o.f),f.Xb(l.a),f.Xb(l.z),f.Xb(l.m),f.Xb(l.k),f.Xb(d.a),f.Xb(p.a))},e.\u0275cmp=f.Rb({type:e,selectors:[["my-login"]],viewQuery:function(e,t){var n;1&e&&(f.gd(P,!0),f.Xc(w,!0)),2&e&&(f.Oc(n=f.tc())&&(t.usernameInput=n.first),f.Oc(n=f.tc())&&(t.forgotPasswordModal=n.first))},features:[f.Gb],decls:7,vars:2,consts:[[1,"margin-content"],[1,"title-page","title-page-single"],["class","alert alert-danger",4,"ngIf"],[4,"ngIf"],["forgotPasswordModal",""],[1,"alert","alert-danger"],["routerLink","/about"],["class","looking-for-account alert alert-info","role","alert",4,"ngIf"],[1,"login-form-and-externals"],["role","form",3,"formGroup","ngSubmit"],[1,"form-group"],["for","username"],["type","text","id","username","required","","tabindex","1","formControlName","username",1,"form-control",3,"ngClass",6,"placeholder"],["usernameInput",""],["routerLink","/signup","class","create-an-account",4,"ngIf"],["class","form-error",4,"ngIf"],["for","password"],["type","password","name","password","id","password","required","","tabindex","2","autocomplete","current-password","formControlName","password",1,"form-control",3,"ngClass",6,"placeholder"],[1,"forgot-password-button",3,"click",6,"title"],["type","submit",3,"disabled",6,"value"],["class","external-login-blocks",4,"ngIf"],["href","#",3,"click"],["role","alert",1,"looking-for-account","alert","alert-info"],[1,"alert-heading"],["href","https://joinpeertube.org/instances","target","_blank","rel","noopener noreferrer",1,"alert-link"],["routerLink","/verify-account/ask-send-email"],["routerLink","/signup",1,"create-an-account"],[1,"form-error"],[1,"external-login-blocks"],[1,"block-title"],["class","external-login-block","role","button",3,"href",4,"ngFor","ngForOf"],["role","button",1,"external-login-block",3,"href"],[1,"modal-header"],[1,"modal-title"],["iconName","cross","aria-label","Close","role","button",3,"click"],[1,"modal-body"],[1,"form-group",3,"hidden"],["for","forgot-password-email"],["type","email","id","forgot-password-email","required","",3,"ngModel","ngModelChange",6,"placeholder"],["forgotPasswordEmailInput",""],[1,"modal-footer","inputs"],["type","button","role","button",1,"action-button","action-button-cancel",3,"click","key.enter",6,"value"],["type","submit",1,"action-button-submit",3,"disabled","click",6,"value"]],template:function(e,t){1&e&&(f.dc(0,"div",0),f.dc(1,"div",1),f.hc(2,C),f.cc(),f.ad(3,M,3,0,"div",2),f.ad(4,V,35,14,"ng-container",3),f.cc(),f.ad(5,Q,17,4,"ng-template",null,4,f.bd)),2&e&&(f.Jb(3),f.Dc("ngIf",t.externalAuthError),f.Jb(1),f.Dc("ngIf",!t.externalAuthError&&!t.isAuthenticatedWithExternalAuth))},directives:[h.u,i.k,m.J,m.u,m.m,m.d,m.E,m.t,m.k,h.r,h.t,v.a,m.w],styles:['label[_ngcontent-%COMP%]{display:block}input[_ngcontent-%COMP%]:not([type=submit]){height:30px;width:340px;color:var(--inputForegroundColor);background-color:var(--inputBackgroundColor);border:1px solid #c6c6c6;border-radius:3px;padding-left:15px;padding-right:15px;font-size:15px;display:inline-block;margin-right:5px}input[_ngcontent-%COMP%]:not([type=submit])::-moz-placeholder{color:var(--inputPlaceholderColor)}input[_ngcontent-%COMP%]:not([type=submit])::-ms-input-placeholder{color:var(--inputPlaceholderColor)}input[_ngcontent-%COMP%]:not([type=submit])::placeholder{color:var(--inputPlaceholderColor)}input[_ngcontent-%COMP%]:not([type=submit])[readonly]{opacity:.7}@media screen and (max-width:340px){input[_ngcontent-%COMP%]:not([type=submit]){width:100%}}input[type=submit][_ngcontent-%COMP%]{border:none;font-weight:600;font-size:15px;height:30px;line-height:30px;border-radius:3px;text-align:center;padding:0 17px 0 13px;cursor:pointer}input[type=submit].focus-visible[_ngcontent-%COMP%], input[type=submit][_ngcontent-%COMP%]:focus{box-shadow:0 0 0 .2rem var(--mainColorLightest)}input[type=submit][_ngcontent-%COMP%], input[type=submit][_ngcontent-%COMP%]:active, input[type=submit][_ngcontent-%COMP%]:focus{color:#fff;background-color:var(--mainColor)}input[type=submit][_ngcontent-%COMP%]:hover{color:#fff;background-color:var(--mainHoverColor)}input[type=submit].disabled[_ngcontent-%COMP%], input[type=submit][disabled][_ngcontent-%COMP%]{cursor:default;color:#fff;background-color:#c6c6c6}input[type=submit][_ngcontent-%COMP%]   my-global-icon[_ngcontent-%COMP%]     .feather, input[type=submit][_ngcontent-%COMP%]   my-global-icon[_ngcontent-%COMP%]     .material{color:#fff}input[type=submit][_ngcontent-%COMP%]   my-global-icon[_ngcontent-%COMP%]     svg circle[fill="#000"], input[type=submit][_ngcontent-%COMP%]   my-global-icon[_ngcontent-%COMP%]     svg g[fill="#000"], input[type=submit][_ngcontent-%COMP%]   my-global-icon[_ngcontent-%COMP%]     svg path[fill="#000"], input[type=submit][_ngcontent-%COMP%]   my-global-icon[_ngcontent-%COMP%]     svg polygon[fill="#000"], input[type=submit][_ngcontent-%COMP%]   my-global-icon[_ngcontent-%COMP%]     svg rect[fill="#000"]{fill:#fff}input[type=submit][_ngcontent-%COMP%]   my-global-icon[_ngcontent-%COMP%]     svg circle[stroke="#000"], input[type=submit][_ngcontent-%COMP%]   my-global-icon[_ngcontent-%COMP%]     svg g[stroke="#000"], input[type=submit][_ngcontent-%COMP%]   my-global-icon[_ngcontent-%COMP%]     svg path[stroke="#000"], input[type=submit][_ngcontent-%COMP%]   my-global-icon[_ngcontent-%COMP%]     svg polygon[stroke="#000"], input[type=submit][_ngcontent-%COMP%]   my-global-icon[_ngcontent-%COMP%]     svg rect[stroke="#000"]{stroke:#fff}input[type=submit][_ngcontent-%COMP%]   my-global-icon[_ngcontent-%COMP%]     svg stop[stop-color="#000"]{stop-color:#fff}.create-an-account[_ngcontent-%COMP%], .forgot-password-button[_ngcontent-%COMP%]{color:var(--mainForegroundColor);cursor:pointer;transition:opacity cubic-bezier(.39,.575,.565,1)}.create-an-account[_ngcontent-%COMP%]:hover, .forgot-password-button[_ngcontent-%COMP%]:hover{text-decoration:none!important;opacity:.7!important}.login-form-and-externals[_ngcontent-%COMP%]{display:flex;flex-wrap:wrap;font-size:15px}.login-form-and-externals[_ngcontent-%COMP%]   form[_ngcontent-%COMP%]{margin:0 50px 20px 0}.login-form-and-externals[_ngcontent-%COMP%]   .external-login-blocks[_ngcontent-%COMP%]{min-width:200px}.login-form-and-externals[_ngcontent-%COMP%]   .external-login-blocks[_ngcontent-%COMP%]   .block-title[_ngcontent-%COMP%]{font-weight:600}.login-form-and-externals[_ngcontent-%COMP%]   .external-login-blocks[_ngcontent-%COMP%]   .external-login-block[_ngcontent-%COMP%]{cursor:pointer;border:1px solid #d1d7e0;border-radius:5px;color:var(--mainForegroundColor);margin:10px 10px 0 0;display:flex;justify-content:center;align-items:center;min-height:35px;min-width:100px}.login-form-and-externals[_ngcontent-%COMP%]   .external-login-blocks[_ngcontent-%COMP%]   .external-login-block[_ngcontent-%COMP%]:active, .login-form-and-externals[_ngcontent-%COMP%]   .external-login-blocks[_ngcontent-%COMP%]   .external-login-block[_ngcontent-%COMP%]:focus, .login-form-and-externals[_ngcontent-%COMP%]   .external-login-blocks[_ngcontent-%COMP%]   .external-login-block[_ngcontent-%COMP%]:hover{text-decoration:none!important;outline:none!important}.login-form-and-externals[_ngcontent-%COMP%]   .external-login-blocks[_ngcontent-%COMP%]   .external-login-block[_ngcontent-%COMP%]:hover{background-color:rgba(209,215,224,.5)}']}),e})();var ee=n("trhE");const te=[{path:"",component:Z,canActivate:[a.a],data:{meta:{title:"Login"}},resolve:{serverConfig:ee.a}}];let ne=(()=>{class e{}return e.\u0275mod=f.Vb({type:e}),e.\u0275inj=f.Ub({factory:function(t){return new(t||e)},imports:[[i.l.forChild(te)],i.l]}),e})(),oe=(()=>{class e{}return e.\u0275mod=f.Vb({type:e}),e.\u0275inj=f.Ub({factory:function(t){return new(t||e)},providers:[],imports:[[ne,c.g,o.h,r.a]]}),e})()}}]);