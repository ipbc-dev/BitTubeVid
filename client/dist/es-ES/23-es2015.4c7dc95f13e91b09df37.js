(window.webpackJsonp=window.webpackJsonp||[]).push([[23],{mWEW:function(e,i,t){"use strict";t.r(i),t.d(i,"VerifyAccountModule",(function(){return D}));var n,c,o,r,s=t("tyNb"),a=t("Phsq"),l=t("ey9i"),u=t("M0ag"),f=t("fXoL"),d=t("7FIj"),m=t("ofXK"),g=t("B/uj");function p(e,i){1&e&&f.Yb(0,"my-signup-success",5)}function b(e,i){1&e&&(f.dc(0,"div",6),f.hc(1,c),f.cc())}n="\n    Verificar la confirmaci\xF3n de la direcci\xF3n de correo electr\xF3nico de la   cuenta\n  ",c="Correo electr\xF3nico actualizado.",o="Ocurri\xF3 un error.",r="Solicitar un nuevo correo de verificaci\xF3n.";const h=function(e){return{isPendingEmail:e}};function v(e,i){if(1&e&&(f.dc(0,"div"),f.dc(1,"span"),f.hc(2,o),f.cc(),f.dc(3,"a",7),f.hc(4,r),f.cc(),f.cc()),2&e){const e=f.wc();f.Jb(3),f.Dc("queryParams",f.Hc(1,h,e.isPendingEmail))}}let y=(()=>{class e{constructor(e,i,t,n,c,o){this.userService=e,this.authService=i,this.notifier=t,this.router=n,this.route=c,this.i18n=o,this.success=!1,this.failed=!1,this.isPendingEmail=!1}ngOnInit(){const e=this.route.snapshot.queryParams;this.userId=e.userId,this.verificationString=e.verificationString,this.isPendingEmail="true"===e.isPendingEmail,this.userId&&this.verificationString?this.verifyEmail():this.notifier.error(this.i18n("Unable to find user id or verification string."))}verifyEmail(){this.userService.verifyEmail(this.userId,this.verificationString,this.isPendingEmail).subscribe(()=>{this.authService.isLoggedIn()&&this.authService.refreshUserInformation(),this.success=!0},e=>{this.failed=!0,this.notifier.error(e.message)})}}return e.\u0275fac=function(i){return new(i||e)(f.Xb(u.j),f.Xb(l.a),f.Xb(l.f),f.Xb(s.h),f.Xb(s.a),f.Xb(d.a))},e.\u0275cmp=f.Rb({type:e,selectors:[["my-verify-account-email"]],decls:6,vars:3,consts:[[1,"margin-content"],[1,"title-page","title-page-single"],["message","Your email has been verified and you may now login.",4,"ngIf"],["class","alert alert-success",4,"ngIf"],[4,"ngIf"],["message","Your email has been verified and you may now login."],[1,"alert","alert-success"],["routerLink","/verify-account/ask-send-email",3,"queryParams"]],template:function(e,i){1&e&&(f.dc(0,"div",0),f.dc(1,"div",1),f.hc(2,n),f.cc(),f.ad(3,p,1,0,"my-signup-success",2),f.ad(4,b,2,0,"div",3),f.ad(5,v,5,3,"div",4),f.cc()),2&e&&(f.Jb(3),f.Dc("ngIf",!i.isPendingEmail&&i.success),f.Jb(1),f.Dc("ngIf",i.isPendingEmail&&i.success),f.Jb(1),f.Dc("ngIf",i.failed))},directives:[m.u,g.a,s.k],encapsulation:2}),e})();var C,P,M=t("cPqw"),O=t("3szM"),_=t("Qmuk"),E=t("3Pt+");C="\n    Solicitar un correo electr\xF3nico de verificaci\xF3n de la cuenta\n  ",P="Correo electr\xF3nico ";const k=["placeholder","Correo electr\xF3nico "],S=["value","Enviar un correo electr\xF3nico de verificaci\xF3n"];function w(e,i){if(1&e&&(f.dc(0,"div",10),f.cd(1),f.cc()),2&e){const e=f.wc(2);f.Jb(1),f.ed(" ",e.formErrors["verify-email-email"]," ")}}const I=function(e){return{"input-error":e}};function x(e,i){if(1&e){const e=f.ec();f.dc(0,"form",4),f.sc("ngSubmit",(function(){return f.Rc(e),f.wc().askSendVerifyEmail()})),f.dc(1,"div",5),f.dc(2,"label",6),f.hc(3,P),f.cc(),f.dc(4,"input",7),f.jc(5,k),f.cc(),f.ad(6,w,2,1,"div",8),f.cc(),f.dc(7,"input",9),f.jc(8,S),f.cc(),f.cc()}if(2&e){const e=f.wc();f.Dc("formGroup",e.form),f.Jb(4),f.Dc("ngClass",f.Hc(4,I,e.formErrors["verify-email-email"])),f.Jb(2),f.Dc("ngIf",e.formErrors["verify-email-email"]),f.Jb(1),f.Dc("disabled",!e.form.valid)}}var V;function X(e,i){1&e&&(f.dc(0,"div"),f.hc(1,V),f.cc())}V="Esta instancia no requiere verificaci\xF3n de correo electr\xF3nico.";const q=[{path:"",canActivateChild:[a.a],children:[{path:"email",component:y,data:{meta:{title:"Verify account email"}}},{path:"ask-send-email",component:(()=>{class e extends u.b{constructor(e,i,t,n,c,o,r){super(),this.formValidatorService=e,this.userValidatorsService=i,this.userService=t,this.serverService=n,this.notifier=c,this.redirectService=o,this.i18n=r}get requiresEmailVerification(){return this.serverConfig.signup.requiresEmailVerification}ngOnInit(){this.serverConfig=this.serverService.getTmpConfig(),this.serverService.getConfig().subscribe(e=>this.serverConfig=e),this.buildForm({"verify-email-email":this.userValidatorsService.USER_EMAIL})}askSendVerifyEmail(){const e=this.form.value["verify-email-email"];this.userService.askSendVerifyEmail(e).subscribe(()=>{const i=this.i18n("An email with verification link will be sent to {{email}}.",{email:e});this.notifier.success(i),this.redirectService.redirectToHomepage()},e=>{this.notifier.error(e.message)})}}return e.\u0275fac=function(i){return new(i||e)(f.Xb(O.a),f.Xb(_.a),f.Xb(u.j),f.Xb(M.a),f.Xb(l.f),f.Xb(l.h),f.Xb(d.a))},e.\u0275cmp=f.Rb({type:e,selectors:[["my-verify-account-ask-send-email"]],features:[f.Gb],decls:6,vars:2,consts:[[1,"margin-content"],[1,"title-page","title-page-single"],["role","form",3,"formGroup","ngSubmit",4,"ngIf","ngIfElse"],["emailVerificationNotRequired",""],["role","form",3,"formGroup","ngSubmit"],[1,"form-group"],["for","verify-email-email"],["type","email","id","verify-email-email","required","","formControlName","verify-email-email",1,"form-control",3,"ngClass",6,"placeholder"],["class","form-error",4,"ngIf"],["type","submit",3,"disabled",6,"value"],[1,"form-error"]],template:function(e,i){if(1&e&&(f.dc(0,"div",0),f.dc(1,"div",1),f.hc(2,C),f.cc(),f.ad(3,x,9,6,"form",2),f.ad(4,X,2,0,"ng-template",null,3,f.bd),f.cc()),2&e){const e=f.Pc(5);f.Jb(3),f.Dc("ngIf",i.requiresEmailVerification)("ngIfElse",e)}},directives:[m.u,E.J,E.u,E.m,E.d,E.E,E.t,E.k,m.r],styles:['input[_ngcontent-%COMP%]:not([type=submit]){display:inline-block;height:30px;width:340px;color:var(--inputForegroundColor);background-color:var(--inputBackgroundColor);border:1px solid #c6c6c6;border-radius:3px;padding-left:15px;padding-right:15px;font-size:15px;display:block}input[_ngcontent-%COMP%]:not([type=submit])::-webkit-input-placeholder{color:var(--inputPlaceholderColor)}input[_ngcontent-%COMP%]:not([type=submit])::-moz-placeholder{color:var(--inputPlaceholderColor)}input[_ngcontent-%COMP%]:not([type=submit])::-ms-input-placeholder{color:var(--inputPlaceholderColor)}input[_ngcontent-%COMP%]:not([type=submit])::placeholder{color:var(--inputPlaceholderColor)}@media screen and (max-width:340px){input[_ngcontent-%COMP%]:not([type=submit]){width:100%}}input[type=submit][_ngcontent-%COMP%]{border:none;font-weight:600;font-size:15px;height:30px;line-height:30px;border-radius:3px;text-align:center;padding:0 17px 0 13px;cursor:pointer}input[type=submit].focus-visible[_ngcontent-%COMP%], input[type=submit][_ngcontent-%COMP%]:focus{box-shadow:0 0 0 .2rem var(--mainColorLightest)}input[type=submit][_ngcontent-%COMP%], input[type=submit][_ngcontent-%COMP%]:active, input[type=submit][_ngcontent-%COMP%]:focus{color:#fff;background-color:var(--mainColor)}input[type=submit][_ngcontent-%COMP%]:hover{color:#fff;background-color:var(--mainHoverColor)}input[type=submit].disabled[_ngcontent-%COMP%], input[type=submit][disabled][_ngcontent-%COMP%]{cursor:default;color:#fff;background-color:#c6c6c6}input[type=submit][_ngcontent-%COMP%]   my-global-icon[_ngcontent-%COMP%]     svg circle[fill="#000000"], input[type=submit][_ngcontent-%COMP%]   my-global-icon[_ngcontent-%COMP%]     svg g[fill="#000000"], input[type=submit][_ngcontent-%COMP%]   my-global-icon[_ngcontent-%COMP%]     svg path[fill="#000000"], input[type=submit][_ngcontent-%COMP%]   my-global-icon[_ngcontent-%COMP%]     svg polygon[fill="#000000"], input[type=submit][_ngcontent-%COMP%]   my-global-icon[_ngcontent-%COMP%]     svg rect[fill="#000000"]{fill:#fff}input[type=submit][_ngcontent-%COMP%]   my-global-icon[_ngcontent-%COMP%]     svg circle[stroke="#000000"], input[type=submit][_ngcontent-%COMP%]   my-global-icon[_ngcontent-%COMP%]     svg g[stroke="#000000"], input[type=submit][_ngcontent-%COMP%]   my-global-icon[_ngcontent-%COMP%]     svg path[stroke="#000000"], input[type=submit][_ngcontent-%COMP%]   my-global-icon[_ngcontent-%COMP%]     svg polygon[stroke="#000000"], input[type=submit][_ngcontent-%COMP%]   my-global-icon[_ngcontent-%COMP%]     svg rect[stroke="#000000"]{stroke:#fff}input[type=submit][_ngcontent-%COMP%]   my-global-icon[_ngcontent-%COMP%]     svg stop[stop-color="#000000"]{stop-color:#fff}']}),e})(),data:{meta:{title:"Verify account ask send email"}}}]}];let z=(()=>{class e{}return e.\u0275mod=f.Vb({type:e}),e.\u0275inj=f.Ub({factory:function(i){return new(i||e)},imports:[[s.l.forChild(q)],s.l]}),e})();var J=t("xXAv");let D=(()=>{class e{}return e.\u0275mod=f.Vb({type:e}),e.\u0275inj=f.Ub({factory:function(i){return new(i||e)},providers:[],imports:[[z,u.h,J.a]]}),e})()}}]);