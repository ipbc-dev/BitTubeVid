(window.webpackJsonp=window.webpackJsonp||[]).push([[35],{"4aiV":function(n,t,e){"use strict";e.r(t),e.d(t,"LoginModule",function(){return q});var o=e("sWvm"),r=e("P8w3"),i=e("RxIU"),a=e("xMQD"),c=e("tyNb"),s=e("Phsq"),l=e("mrSG"),d=e("AytR"),g=e("ey9i"),u=e("ihI+"),b=e("3Pt+");const p={VALIDATORS:[b.w.required],MESSAGES:{required:"Es requereix nom d'usuari."}},f={VALIDATORS:[b.w.required],MESSAGES:{required:"Es requereix contrasenya."}};var m=e("IEtR"),C=e("fXoL"),P=e("1kSV"),h=e("ofXK"),M=e("RM9B"),_=e("QPT+"),O=e("UkmY");const w=["usernameInput"],x=["forgotPasswordModal"];function v(n,t){1&n&&(C.Vb(0,"div",6),C.fc(1,7),C.Qb(2,"a",8),C.cc(),C.Ub())}function y(n,t){1&n&&(C.Vb(0,"span"),C.Vb(1,"a",33),C.Zb(2,34),C.Ub(),C.Ub())}function k(n,t){if(1&n&&(C.Vb(0,"div",6),C.Uc(1),C.Sc(2,y,3,0,"span",4),C.Ub()),2&n){const n=C.nc(2);C.Cb(1),C.Wc("",n.error," "),C.Cb(1),C.uc("ngIf","User email is not verified."===n.error)}}function U(n,t){if(1&n&&(C.Vb(0,"div",35),C.Uc(1),C.Ub()),2&n){const n=C.nc(2);C.Cb(1),C.Wc(" ",n.formErrors.username," ")}}function I(n,t){if(1&n&&(C.Vb(0,"div",35),C.Uc(1),C.Ub()),2&n){const n=C.nc(2);C.Cb(1),C.Wc(" ",n.formErrors.password," ")}}function E(n,t){1&n&&(C.Vb(0,"div",36),C.Vb(1,"span"),C.Uc(2,"\xb7"),C.Ub(),C.Vb(3,"a",37),C.Zb(4,38),C.Ub(),C.Ub())}function V(n,t){if(1&n){const n=C.Wb();C.Vb(0,"div"),C.fc(1,39),C.Vb(2,"a",40),C.jc("click",function(t){C.Jc(n),C.nc();const e=C.Hc(37);return C.nc().onTermsClick(t,e)}),C.Ub(),C.Qb(3,"a",41),C.Qb(4,"br"),C.Qb(5,"a",42),C.cc(),C.Ub()}}function S(n,t){if(1&n){const n=C.Wb();C.Vb(0,"div"),C.fc(1,43),C.Vb(2,"a",29),C.jc("click",function(t){C.Jc(n),C.nc();const e=C.Hc(37);return C.nc().onTermsClick(t,e)}),C.Ub(),C.Qb(3,"br"),C.Qb(4,"a",42),C.cc(),C.Ub()}}function A(n,t){if(1&n&&(C.Vb(0,"a",48),C.Uc(1),C.Ub()),2&n){const n=t.$implicit,e=C.nc(3);C.uc("href",e.getAuthHref(n),C.Lc),C.Cb(1),C.Wc(" ",n.authDisplayName," ")}}function $(n,t){if(1&n&&(C.Vb(0,"div",44),C.Vb(1,"div",45),C.Zb(2,46),C.Ub(),C.Vb(3,"div"),C.Sc(4,A,2,2,"a",47),C.Ub(),C.Ub()),2&n){const n=C.nc(2);C.Cb(4),C.uc("ngForOf",n.getExternalLogins())}}const L=function(n){return{"input-error":n}};function z(n,t){if(1&n){const n=C.Wb();C.Tb(0),C.Sc(1,k,3,2,"div",3),C.Vb(2,"div",9),C.Vb(3,"div",10),C.Vb(4,"form",11),C.jc("ngSubmit",function(){return C.Jc(n),C.nc().login()}),C.Vb(5,"div",12),C.Vb(6,"div"),C.Vb(7,"label",13),C.Zb(8,14),C.Ub(),C.Qb(9,"input",15,16),C.Ub(),C.Sc(11,U,2,1,"div",17),C.Ub(),C.Vb(12,"div",12),C.Vb(13,"label",18),C.Zb(14,19),C.Ub(),C.Qb(15,"my-input-toggle-hidden",20),C.Sc(16,I,2,1,"div",17),C.Ub(),C.Qb(17,"input",21),C.Vb(18,"div",22),C.Vb(19,"a",23),C.jc("click",function(){return C.Jc(n),C.nc().openForgotPasswordModal()}),C.Uc(20,"I forgot my password"),C.Ub(),C.Sc(21,E,5,0,"div",24),C.Ub(),C.Vb(22,"div",25),C.Vb(23,"h6",26),C.Zb(24,27),C.Ub(),C.Sc(25,V,6,0,"div",4),C.Sc(26,S,5,0,"div",4),C.Ub(),C.Ub(),C.Sc(27,$,5,1,"div",28),C.Ub(),C.Vb(28,"a",29),C.jc("click",function(t){return C.Jc(n),C.nc().social_login(t,"facebook")}),C.Uc(29,"Login with Facebook"),C.Ub(),C.Uc(30,"\xa0 "),C.Vb(31,"a",29),C.jc("click",function(t){return C.Jc(n),C.nc().social_login(t,"google")}),C.Uc(32,"Login with Google"),C.Ub(),C.Uc(33,"\xa0 "),C.Vb(34,"a",29),C.jc("click",function(t){return C.Jc(n),C.nc().social_login(t,"twitter")}),C.Uc(35,"Login with Twitter"),C.Ub(),C.Vb(36,"div",30,31),C.Vb(38,"my-instance-about-accordion",32),C.jc("init",function(t){return C.Jc(n),C.nc().onInstanceAboutAccordionInit(t)}),C.Ub(),C.Ub(),C.Ub(),C.Sb()}if(2&n){const n=C.nc();C.Cb(1),C.uc("ngIf",n.error),C.Cb(3),C.uc("formGroup",n.form),C.Cb(5),C.uc("ngClass",C.yc(13,L,n.formErrors.username)),C.Cb(2),C.uc("ngIf",n.formErrors.username),C.Cb(4),C.uc("ngClass",C.yc(15,L,n.formErrors.password))("tabindex",2),C.Cb(1),C.uc("ngIf",n.formErrors.password),C.Cb(1),C.uc("disabled",!n.form.valid),C.Cb(4),C.uc("ngIf",n.signupAllowed),C.Cb(4),C.uc("ngIf",n.signupAllowed),C.Cb(1),C.uc("ngIf",!n.signupAllowed),C.Cb(1),C.uc("ngIf",0!==n.getExternalLogins().length),C.Cb(11),C.uc("panels",n.instanceInformationPanels)}}function T(n,t){1&n&&(C.Vb(0,"div",6),C.Zb(1,63),C.Ub())}function N(n,t){1&n&&(C.Vb(0,"div",64),C.Zb(1,65),C.Ub())}function R(n,t){if(1&n){const n=C.Wb();C.Vb(0,"div",49),C.Vb(1,"h4",50),C.Zb(2,51),C.Ub(),C.Vb(3,"my-global-icon",52),C.jc("click",function(){return C.Jc(n),C.nc().hideForgotPasswordModal()}),C.Ub(),C.Ub(),C.Vb(4,"div",53),C.Sc(5,T,2,0,"div",3),C.Sc(6,N,2,0,"div",54),C.Vb(7,"div",55),C.Vb(8,"label",56),C.Zb(9,57),C.Ub(),C.Vb(10,"input",58,59),C.jc("ngModelChange",function(t){return C.Jc(n),C.nc().forgotPasswordEmail=t}),C.Ub(),C.Ub(),C.Ub(),C.Vb(12,"div",60),C.Vb(13,"input",61),C.jc("click",function(){return C.Jc(n),C.nc().hideForgotPasswordModal()})("key.enter",function(){return C.Jc(n),C.nc().hideForgotPasswordModal()}),C.Ub(),C.Vb(14,"input",62),C.jc("click",function(){return C.Jc(n),C.nc().askResetPassword()}),C.Ub(),C.Ub()}if(2&n){const n=C.Hc(11),t=C.nc();C.Cb(5),C.uc("ngIf",t.isEmailDisabled()),C.Cb(1),C.uc("ngIf",!t.isEmailDisabled()),C.Cb(1),C.uc("hidden",t.isEmailDisabled()),C.Cb(3),C.uc("ngModel",t.forgotPasswordEmail),C.Cb(4),C.uc("disabled",!n.validity.valid)}}let j=(()=>{class n extends o.a{constructor(n,t,e,o,r,i,a,c){super(),this.formValidatorService=n,this.route=t,this.modalService=e,this.authService=o,this.userService=r,this.redirectService=i,this.notifier=a,this.hooks=c,this.error=null,this.forgotPasswordEmail="",this.isAuthenticatedWithExternalAuth=!1,this.externalAuthError=!1,this.externalLogins=[],this.instanceInformationPanels={terms:!0,administrators:!1,features:!1,moderation:!1,codeOfConduct:!1}}get signupAllowed(){return!0===this.serverConfig.signup.allowed}onTermsClick(n,t){n.preventDefault(),this.accordion&&(this.accordion.expand("terms"),t.scrollIntoView({behavior:"smooth"}))}isEmailDisabled(){return!1===this.serverConfig.email.enabled}ngOnInit(){const n=this.route.snapshot;this.buildForm({username:p,password:f}),this.serverConfig=n.data.serverConfig,n.queryParams.externalAuthToken?this.loadExternalAuthToken(n.queryParams.username,n.queryParams.externalAuthToken):n.queryParams.externalAuthError&&(this.externalAuthError=!0)}ngAfterViewInit(){this.usernameInput&&this.usernameInput.nativeElement.focus(),this.hooks.runAction("action:login.init","login")}getExternalLogins(){return this.serverConfig.plugin.registeredExternalAuths}getAuthHref(n){return d.a.apiUrl+`/plugins/${n.name}/${n.version}/auth/${n.authName}`}social_login(n,t){n.preventDefault();let e=null;switch(t){case"facebook":e=new m.b.auth.FacebookAuthProvider;break;case"google":e=new m.b.auth.GoogleAuthProvider;break;case"twitter":e=new m.b.auth.TwitterAuthProvider}m.a.signInWithPopup(e).then(n=>Object(l.a)(this,void 0,void 0,function*(){const t=n.user.email,e=yield Object(m.c)();this.authService.login(t,e).subscribe(()=>this.redirectService.redirectToPreviousRoute(),n=>{this.error=-1!==n.message.indexOf("credentials are invalid")?"Incorrect username or password.":-1!==n.message.indexOf("blocked")?"You account is blocked.":n.message})}),n=>this.error=n.message)}login(){this.error=null;const{username:n,password:t}=this.form.value;this.authService.login(n,t).subscribe(()=>(-1!==n.indexOf("@")&&m.a.signInWithEmailAndPassword(n,t).catch(n=>console.error(n)),this.redirectService.redirectToPreviousRoute()),n=>this.handleError(n))}askResetPassword(){this.userService.askResetPassword(this.forgotPasswordEmail).subscribe(()=>{const n="S'enviar\xE0 un correu amb les instruccions per restablir la contrasenya a " + this.forgotPasswordEmail + ". L'enlla\xE7 caducar\xE0 al cap d'una hora.";this.notifier.success(n),this.hideForgotPasswordModal()},n=>this.notifier.error(n.message))}openForgotPasswordModal(){this.openedForgotPasswordModal=this.modalService.open(this.forgotPasswordModal)}hideForgotPasswordModal(){this.openedForgotPasswordModal.close()}onInstanceAboutAccordionInit(n){this.accordion=n.accordion}loadExternalAuthToken(n,t){this.isAuthenticatedWithExternalAuth=!0,this.authService.login(n,null,t).subscribe(()=>this.redirectService.redirectToPreviousRoute(),n=>{this.handleError(n),this.isAuthenticatedWithExternalAuth=!1})}handleError(n){this.error=-1!==n.message.indexOf("credentials are invalid")?"Incorrect username or password.":-1!==n.message.indexOf("blocked")?"Your account is blocked.":n.message}}return n.\u0275fac=function(t){return new(t||n)(C.Pb(o.b),C.Pb(c.a),C.Pb(P.m),C.Pb(g.a),C.Pb(g.D),C.Pb(g.q),C.Pb(g.m),C.Pb(u.a))},n.\u0275cmp=C.Jb({type:n,selectors:[["my-login"]],viewQuery:function(n,t){if(1&n&&(C.Yc(w,!0),C.Pc(x,!0)),2&n){let n;C.Gc(n=C.kc())&&(t.usernameInput=n.first),C.Gc(n=C.kc())&&(t.forgotPasswordModal=n.first)}},features:[C.zb],decls:7,vars:2,consts:function(){let n,t,e,o,r,i,a,c,s,l,d,g,u,b,p,f,m,P,h,M,_;return n="\n    Inicia sessi\xF3  ",t="Hi ha hagut un problema amb el proc\xE9s extern d'identificaci\xF3. Poseu-vos en contacte amb " + "\ufffd#2\ufffd" + "l'administraci\xF3" + "\ufffd/#2\ufffd" + ". ",e="Usuari",o="Nom d'usuari o adre\xE7a de correu electr\xF2nic",r="Contrasenya",i="Contrasenya",a="Login",c="Premeu aqu\xED per restablir la contrasenya",s=" Logging into an account lets you publish content ",l="Demana nou correu de verificaci\xF3..",d="Registrar un compte",g=" This instance allows registration. However, be careful to check the " + "\ufffd#2\ufffd" + "Terms" + "[\ufffd/#2\ufffd|\ufffd/#3\ufffd|\ufffd/#5\ufffd]" + "" + "\ufffd#3\ufffd" + "Terms" + "[\ufffd/#2\ufffd|\ufffd/#3\ufffd|\ufffd/#5\ufffd]" + " before creating an account. You may also search for another instance to match your exact needs at: " + "\ufffd#4\ufffd\ufffd/#4\ufffd" + "" + "\ufffd#5\ufffd" + "https://joinpeertube.org/instances" + "[\ufffd/#2\ufffd|\ufffd/#3\ufffd|\ufffd/#5\ufffd]" + ". ",g=C.ec(g),u=" Currently this instance doesn't allow for user registration, you may check the " + "\ufffd#2\ufffd" + "Terms" + "[\ufffd/#2\ufffd|\ufffd/#4\ufffd]" + " for more details or find an instance that gives you the possibility to sign up for an account and upload your videos there. Find yours among multiple instances at: " + "\ufffd#3\ufffd\ufffd/#3\ufffd" + "" + "\ufffd#4\ufffd" + "https://joinpeertube.org/instances" + "[\ufffd/#2\ufffd|\ufffd/#4\ufffd]" + ". ",u=C.ec(u),b="O identifiqueu-vos amb",p="Has oblidat la teva contrasenya",f="Correu",m="Adre\xE7a de correu",P="Cancel",h="Restableix",M=" We are sorry, you cannot recover your password because your instance administrator did not configure the BitTube email system. ",_="Inseriu la vostra adre\xE7a de correu electr\xF2nic i us enviarem un enlla\xE7 per a restablir la contrasenya.",[[1,"margin-content"],[1,"title-page","title-page-single"],n,["class","alert alert-danger",4,"ngIf"],[4,"ngIf"],["forgotPasswordModal",""],[1,"alert","alert-danger"],t,["routerLink","/about"],[1,"wrapper"],[1,"login-form-and-externals"],["role","form",3,"formGroup","ngSubmit"],[1,"form-group"],["for","username"],e,["type","text","id","username","placeholder",o,"required","","tabindex","1","formControlName","username",1,"form-control",3,"ngClass"],["usernameInput",""],["class","form-error",4,"ngIf"],["for","password"],r,["formControlName","password","inputId","password","placeholder",i,"autocomplete","current-password",3,"ngClass","tabindex"],["type","submit","value",a,3,"disabled"],[1,"additionnal-links"],["title",c,1,"forgot-password-button",3,"click"],["class","signup-link",4,"ngIf"],["role","alert",1,"looking-for-account","alert","alert-info"],[1,"alert-heading"],s,["class","external-login-blocks",4,"ngIf"],["href","#",3,"click"],[1,"instance-information"],["instanceInformation",""],[3,"panels","init"],["routerLink","/verify-account/ask-send-email"],l,[1,"form-error"],[1,"signup-link"],["routerLink","/signup",1,"create-an-account"],d,g,["href","#",1,"terms-anchor",3,"click"],["target","_blank","routerLink","/about/instance","fragment","terms",1,"terms-link"],["href","https://joinpeertube.org/instances","target","_blank","rel","noopener noreferrer",1,"alert-link"],u,[1,"external-login-blocks"],[1,"block-title"],b,["class","external-login-block","role","button",3,"href",4,"ngFor","ngForOf"],["role","button",1,"external-login-block",3,"href"],[1,"modal-header"],[1,"modal-title"],p,["iconName","cross","aria-label","Close","role","button",3,"click"],[1,"modal-body"],["class","forgot-password-instructions",4,"ngIf"],[1,"form-group",3,"hidden"],["for","forgot-password-email"],f,["type","email","id","forgot-password-email","placeholder",m,"required","",3,"ngModel","ngModelChange"],["forgotPasswordEmailInput",""],[1,"modal-footer","inputs"],["type","button","role","button","value",P,1,"action-button","action-button-cancel",3,"click","key.enter"],["type","submit","value",h,1,"action-button-submit",3,"disabled","click"],M,[1,"forgot-password-instructions"],_]},template:function(n,t){1&n&&(C.Vb(0,"div",0),C.Vb(1,"div",1),C.Zb(2,2),C.Ub(),C.Sc(3,v,3,0,"div",3),C.Sc(4,z,39,17,"ng-container",4),C.Ub(),C.Sc(5,R,15,5,"ng-template",null,5,C.Tc)),2&n&&(C.Cb(3),C.uc("ngIf",t.externalAuthError),C.Cb(1),C.uc("ngIf",!t.externalAuthError&&!t.isAuthenticatedWithExternalAuth))},directives:[h.n,c.k,b.y,b.n,b.h,b.b,b.u,b.m,b.f,h.l,M.a,_.a,h.m,O.a,b.p],styles:['label[_ngcontent-%COMP%]{display:block}input[_ngcontent-%COMP%]:not([type=submit]){height:30px;width:340px;color:var(--inputForegroundColor);background-color:var(--inputBackgroundColor);border:1px solid #c6c6c6;border-radius:3px;padding-left:15px;padding-right:15px;font-size:15px;display:inline-block;margin-right:5px}input[_ngcontent-%COMP%]:not([type=submit])::-moz-placeholder{color:var(--inputPlaceholderColor)}input[_ngcontent-%COMP%]:not([type=submit])::placeholder{color:var(--inputPlaceholderColor)}input[_ngcontent-%COMP%]:not([type=submit])[readonly]{opacity:.7}@media screen and (max-width:340px){input[_ngcontent-%COMP%]:not([type=submit]){width:100%}}input[type=submit][_ngcontent-%COMP%]{border:none;font-weight:600;font-size:15px;height:30px;line-height:30px;border-radius:3px;text-align:center;padding:0 17px 0 13px;cursor:pointer}input[type=submit].focus-visible[_ngcontent-%COMP%], input[type=submit][_ngcontent-%COMP%]:focus{box-shadow:0 0 0 .2rem var(--mainColorLightest)}input[type=submit][_ngcontent-%COMP%], input[type=submit][_ngcontent-%COMP%]:active, input[type=submit][_ngcontent-%COMP%]:focus{color:#fff;background-color:var(--mainColor)}input[type=submit][_ngcontent-%COMP%]:hover{color:#fff;background-color:var(--mainHoverColor)}input[type=submit].disabled[_ngcontent-%COMP%], input[type=submit][disabled][_ngcontent-%COMP%]{cursor:default;color:#fff;background-color:#c6c6c6}input[type=submit][_ngcontent-%COMP%]   my-global-icon[_ngcontent-%COMP%]     .feather, input[type=submit][_ngcontent-%COMP%]   my-global-icon[_ngcontent-%COMP%]     .material{color:#fff}input[type=submit][_ngcontent-%COMP%]   my-global-icon[_ngcontent-%COMP%]     svg circle[fill="#000"], input[type=submit][_ngcontent-%COMP%]   my-global-icon[_ngcontent-%COMP%]     svg g[fill="#000"], input[type=submit][_ngcontent-%COMP%]   my-global-icon[_ngcontent-%COMP%]     svg path[fill="#000"], input[type=submit][_ngcontent-%COMP%]   my-global-icon[_ngcontent-%COMP%]     svg polygon[fill="#000"], input[type=submit][_ngcontent-%COMP%]   my-global-icon[_ngcontent-%COMP%]     svg rect[fill="#000"]{fill:#fff}input[type=submit][_ngcontent-%COMP%]   my-global-icon[_ngcontent-%COMP%]     svg circle[stroke="#000"], input[type=submit][_ngcontent-%COMP%]   my-global-icon[_ngcontent-%COMP%]     svg g[stroke="#000"], input[type=submit][_ngcontent-%COMP%]   my-global-icon[_ngcontent-%COMP%]     svg path[stroke="#000"], input[type=submit][_ngcontent-%COMP%]   my-global-icon[_ngcontent-%COMP%]     svg polygon[stroke="#000"], input[type=submit][_ngcontent-%COMP%]   my-global-icon[_ngcontent-%COMP%]     svg rect[stroke="#000"]{stroke:#fff}input[type=submit][_ngcontent-%COMP%]   my-global-icon[_ngcontent-%COMP%]     svg stop[stop-color="#000"]{stop-color:#fff}.modal-body[_ngcontent-%COMP%]{text-align:left}.modal-body[_ngcontent-%COMP%]   .forgot-password-instructions[_ngcontent-%COMP%]{margin-bottom:20px}.modal-footer.inputs[_ngcontent-%COMP%]   .action-button.action-button-cancel[_ngcontent-%COMP%]{width:auto!important;display:inline-block}@media screen and (max-width:420px){.modal-body[_ngcontent-%COMP%]   #forgot-password-email[_ngcontent-%COMP%]{width:100%}.modal-footer.inputs[_ngcontent-%COMP%]   .action-button.action-button-cancel[_ngcontent-%COMP%]{display:none}}.create-an-account[_ngcontent-%COMP%], .forgot-password-button[_ngcontent-%COMP%]{color:var(--mainForegroundColor);cursor:pointer;transition:opacity cubic-bezier(.39,.575,.565,1)}.create-an-account[_ngcontent-%COMP%]:hover, .forgot-password-button[_ngcontent-%COMP%]:hover{text-decoration:none!important;opacity:.7!important}.wrapper[_ngcontent-%COMP%]{display:flex;justify-content:space-around;flex-wrap:wrap}.wrapper[_ngcontent-%COMP%] > div[_ngcontent-%COMP%]{flex:1 1}.wrapper[_ngcontent-%COMP%]   .login-form-and-externals[_ngcontent-%COMP%]{display:flex;flex-wrap:wrap;font-size:15px;max-width:450px;margin-bottom:40px;margin-left:10px;margin-right:10px}.wrapper[_ngcontent-%COMP%]   .login-form-and-externals[_ngcontent-%COMP%]   form[_ngcontent-%COMP%]{margin:0}.wrapper[_ngcontent-%COMP%]   .login-form-and-externals[_ngcontent-%COMP%]   form[_ngcontent-%COMP%], .wrapper[_ngcontent-%COMP%]   .login-form-and-externals[_ngcontent-%COMP%]   form[_ngcontent-%COMP%]   input[_ngcontent-%COMP%]{width:100%}.wrapper[_ngcontent-%COMP%]   .login-form-and-externals[_ngcontent-%COMP%]   form[_ngcontent-%COMP%]   .additionnal-links[_ngcontent-%COMP%]{display:block;text-align:center;margin-top:20px;margin-bottom:20px}.wrapper[_ngcontent-%COMP%]   .login-form-and-externals[_ngcontent-%COMP%]   form[_ngcontent-%COMP%]   .additionnal-links[_ngcontent-%COMP%]   .create-an-account[_ngcontent-%COMP%], .wrapper[_ngcontent-%COMP%]   .login-form-and-externals[_ngcontent-%COMP%]   form[_ngcontent-%COMP%]   .additionnal-links[_ngcontent-%COMP%]   .forgot-password-button[_ngcontent-%COMP%]{padding:4px;display:inline-block;color:var(--mainColor)}.wrapper[_ngcontent-%COMP%]   .login-form-and-externals[_ngcontent-%COMP%]   form[_ngcontent-%COMP%]   .additionnal-links[_ngcontent-%COMP%]   .create-an-account[_ngcontent-%COMP%]:active, .wrapper[_ngcontent-%COMP%]   .login-form-and-externals[_ngcontent-%COMP%]   form[_ngcontent-%COMP%]   .additionnal-links[_ngcontent-%COMP%]   .create-an-account[_ngcontent-%COMP%]:hover, .wrapper[_ngcontent-%COMP%]   .login-form-and-externals[_ngcontent-%COMP%]   form[_ngcontent-%COMP%]   .additionnal-links[_ngcontent-%COMP%]   .forgot-password-button[_ngcontent-%COMP%]:active, .wrapper[_ngcontent-%COMP%]   .login-form-and-externals[_ngcontent-%COMP%]   form[_ngcontent-%COMP%]   .additionnal-links[_ngcontent-%COMP%]   .forgot-password-button[_ngcontent-%COMP%]:hover{color:var(--mainHoverColor)}.wrapper[_ngcontent-%COMP%]   .login-form-and-externals[_ngcontent-%COMP%]   .external-login-blocks[_ngcontent-%COMP%]{min-width:200px}.wrapper[_ngcontent-%COMP%]   .login-form-and-externals[_ngcontent-%COMP%]   .external-login-blocks[_ngcontent-%COMP%]   .block-title[_ngcontent-%COMP%]{font-weight:600}.wrapper[_ngcontent-%COMP%]   .login-form-and-externals[_ngcontent-%COMP%]   .external-login-blocks[_ngcontent-%COMP%]   .external-login-block[_ngcontent-%COMP%]{cursor:pointer;border:1px solid #d1d7e0;border-radius:5px;color:var(--mainForegroundColor);margin:10px 10px 0 0;display:flex;justify-content:center;align-items:center;min-height:35px;min-width:100px}.wrapper[_ngcontent-%COMP%]   .login-form-and-externals[_ngcontent-%COMP%]   .external-login-blocks[_ngcontent-%COMP%]   .external-login-block[_ngcontent-%COMP%]:active, .wrapper[_ngcontent-%COMP%]   .login-form-and-externals[_ngcontent-%COMP%]   .external-login-blocks[_ngcontent-%COMP%]   .external-login-block[_ngcontent-%COMP%]:focus, .wrapper[_ngcontent-%COMP%]   .login-form-and-externals[_ngcontent-%COMP%]   .external-login-blocks[_ngcontent-%COMP%]   .external-login-block[_ngcontent-%COMP%]:hover{text-decoration:none!important;outline:none!important}.wrapper[_ngcontent-%COMP%]   .login-form-and-externals[_ngcontent-%COMP%]   .external-login-blocks[_ngcontent-%COMP%]   .external-login-block[_ngcontent-%COMP%]:hover{background-color:rgba(209,215,224,.5)}.wrapper[_ngcontent-%COMP%]   .login-form-and-externals[_ngcontent-%COMP%]   .signup-link[_ngcontent-%COMP%]{display:inline-block}.wrapper[_ngcontent-%COMP%]   .instance-information[_ngcontent-%COMP%]{max-width:600px;min-width:350px;margin-bottom:40px;margin-left:10px;margin-right:10px}.wrapper[_ngcontent-%COMP%]   .terms-anchor[_ngcontent-%COMP%]{display:inline}.wrapper[_ngcontent-%COMP%]   .terms-link[_ngcontent-%COMP%]{display:none}@media screen and (max-width:768px){.wrapper[_ngcontent-%COMP%]{flex-direction:column-reverse}.wrapper[_ngcontent-%COMP%]   .instance-information[_ngcontent-%COMP%], .wrapper[_ngcontent-%COMP%]   .login-form-and-externals[_ngcontent-%COMP%]{width:100%;margin-left:0;margin-right:0;max-width:450px;min-width:unset;align-self:center}.wrapper[_ngcontent-%COMP%]   .instance-information[_ngcontent-%COMP%]     .accordion, .wrapper[_ngcontent-%COMP%]   .terms-anchor[_ngcontent-%COMP%]{display:none}.wrapper[_ngcontent-%COMP%]   .terms-link[_ngcontent-%COMP%]{display:inline}}@media screen and (max-width:1008px){.main-col[_nghost-%COMP%]:not(.expanded)   .wrapper[_ngcontent-%COMP%], .main-col:not(.expanded)   [_nghost-%COMP%]   .wrapper[_ngcontent-%COMP%]{flex-direction:column-reverse}.main-col[_nghost-%COMP%]:not(.expanded)   .wrapper[_ngcontent-%COMP%]   .instance-information[_ngcontent-%COMP%], .main-col:not(.expanded)   [_nghost-%COMP%]   .wrapper[_ngcontent-%COMP%]   .instance-information[_ngcontent-%COMP%], .main-col[_nghost-%COMP%]:not(.expanded)   .wrapper[_ngcontent-%COMP%]   .login-form-and-externals[_ngcontent-%COMP%], .main-col:not(.expanded)   [_nghost-%COMP%]   .wrapper[_ngcontent-%COMP%]   .login-form-and-externals[_ngcontent-%COMP%]{width:100%;margin-left:0;margin-right:0;max-width:450px;min-width:unset;align-self:center}.main-col[_nghost-%COMP%]:not(.expanded)   .wrapper[_ngcontent-%COMP%]   .instance-information[_ngcontent-%COMP%]     .accordion, .main-col:not(.expanded)   [_nghost-%COMP%]   .wrapper[_ngcontent-%COMP%]   .instance-information[_ngcontent-%COMP%]     .accordion, .main-col[_nghost-%COMP%]:not(.expanded)   .wrapper[_ngcontent-%COMP%]   .terms-anchor[_ngcontent-%COMP%], .main-col:not(.expanded)   [_nghost-%COMP%]   .wrapper[_ngcontent-%COMP%]   .terms-anchor[_ngcontent-%COMP%]{display:none}.main-col[_nghost-%COMP%]:not(.expanded)   .wrapper[_ngcontent-%COMP%]   .terms-link[_ngcontent-%COMP%], .main-col:not(.expanded)   [_nghost-%COMP%]   .wrapper[_ngcontent-%COMP%]   .terms-link[_ngcontent-%COMP%]{display:inline}}']}),n})();var F=e("trhE");const J=[{path:"",component:j,canActivate:[s.a],data:{meta:{title:"Login"}},resolve:{serverConfig:F.a}}];let W=(()=>{class n{}return n.\u0275mod=C.Nb({type:n}),n.\u0275inj=C.Mb({factory:function(t){return new(t||n)},imports:[[c.l.forChild(J)],c.l]}),n})(),q=(()=>{class n{}return n.\u0275mod=C.Nb({type:n}),n.\u0275inj=C.Mb({factory:function(t){return new(t||n)},providers:[],imports:[[W,a.h,o.c,r.a,i.c]]}),n})()}}]);