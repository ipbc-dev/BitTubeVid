(window.webpackJsonp=window.webpackJsonp||[]).push([[30],{eijS:function(e,n,t){"use strict";t.r(n),t.d(n,"ResetPasswordModule",function(){return S});var r=t("sWvm"),o=t("xMQD"),i=t("tyNb"),a=t("Phsq"),s=t("ey9i"),c=t("3Pt+");const l={VALIDATORS:[c.w.required],MESSAGES:{required:"Bitte best\xE4tige das Passwort."}};var u=t("nnN+"),d=t("fXoL"),m=t("RM9B"),p=t("ofXK");function g(e,n){if(1&e&&(d.Wb(0,"div",13),d.Tc(1),d.Vb()),2&e){const e=d.oc();d.Db(1),d.Vc(" ",e.formErrors.password," ")}}function b(e,n){if(1&e&&(d.Wb(0,"div",13),d.Tc(1),d.Vb()),2&e){const e=d.oc();d.Db(1),d.Vc(" ",e.formErrors["password-confirm"]," ")}}const f=function(e){return{"input-error":e}},h=[{path:"",component:(()=>{class e extends r.a{constructor(e,n,t,r,o){super(),this.formValidatorService=e,this.userService=n,this.notifier=t,this.router=r,this.route=o}ngOnInit(){this.buildForm({password:u.j,"password-confirm":l}),this.userId=this.route.snapshot.queryParams.userId,this.verificationString=this.route.snapshot.queryParams.verificationString,this.userId&&this.verificationString||(this.notifier.error("Benutzer-ID oder Verifizierungscode nicht gefunden."),this.router.navigate(["/"]))}resetPassword(){this.userService.resetPassword(this.userId,this.verificationString,this.form.value.password).subscribe(()=>{this.notifier.success("Dein Passwort wurde zur\xFCckgesetzt!"),this.router.navigate(["/login"])},e=>this.notifier.error(e.message))}isConfirmedPasswordValid(){const e=this.form.value;return e.password===e["password-confirm"]}}return e.\u0275fac=function(n){return new(n||e)(d.Qb(r.b),d.Qb(s.D),d.Qb(s.m),d.Qb(i.h),d.Qb(i.a))},e.\u0275cmp=d.Kb({type:e,selectors:[["my-login"]],features:[d.Ab],decls:15,vars:10,consts:function(){let e,n,t,r,o,i;return e="\n    Mein Passwort zur\xFCcksetzen\n  ",n="Passwort",t="Passwort",r="Passwort best\xE4tigen",o="Best\xE4tigtes Passwort",i="Passwort zur\xFCcksetzen",[[1,"margin-content"],[1,"title-page","title-page-single"],e,["role","form",3,"formGroup","ngSubmit"],[1,"form-group"],["for","password"],n,["formControlName","password","inputId","password","placeholder",t,"autocomplete","new-password",3,"ngClass"],["class","form-error",4,"ngIf"],["for","password-confirm"],r,["formControlName","password-confirm","inputId","password-confirm","placeholder",o,"autocomplete","new-password",3,"ngClass"],["type","submit","value",i,3,"disabled"],[1,"form-error"]]},template:function(e,n){1&e&&(d.Wb(0,"div",0),d.Wb(1,"div",1),d.ac(2,2),d.Vb(),d.Wb(3,"form",3),d.kc("ngSubmit",function(){return n.resetPassword()}),d.Wb(4,"div",4),d.Wb(5,"label",5),d.ac(6,6),d.Vb(),d.Rb(7,"my-input-toggle-hidden",7),d.Rc(8,g,2,1,"div",8),d.Vb(),d.Wb(9,"div",4),d.Wb(10,"label",9),d.ac(11,10),d.Vb(),d.Rb(12,"my-input-toggle-hidden",11),d.Rc(13,b,2,1,"div",8),d.Vb(),d.Rb(14,"input",12),d.Vb(),d.Vb()),2&e&&(d.Db(3),d.vc("formGroup",n.form),d.Db(4),d.vc("ngClass",d.zc(6,f,n.formErrors.password)),d.Db(1),d.vc("ngIf",n.formErrors.password),d.Db(4),d.vc("ngClass",d.zc(8,f,n.formErrors["password-confirm"])),d.Db(1),d.vc("ngIf",n.formErrors["password-confirm"]),d.Db(1),d.vc("disabled",!n.form.valid||!n.isConfirmedPasswordValid()))},directives:[c.y,c.n,c.h,m.a,c.m,c.f,p.l,p.n],styles:['input[_ngcontent-%COMP%]:not([type=submit]){display:inline-block;height:30px;width:340px;color:var(--inputForegroundColor);background-color:var(--inputBackgroundColor);border:1px solid #c6c6c6;border-radius:3px;padding-left:15px;padding-right:15px;font-size:15px;display:block}input[_ngcontent-%COMP%]:not([type=submit])::placeholder{color:var(--inputPlaceholderColor)}input[_ngcontent-%COMP%]:not([type=submit])[readonly]{opacity:.7}@media screen and (max-width:340px){input[_ngcontent-%COMP%]:not([type=submit]){width:100%}}input[type=submit][_ngcontent-%COMP%]{border:none;font-weight:600;font-size:15px;height:30px;line-height:30px;border-radius:3px;text-align:center;padding:0 17px 0 13px;cursor:pointer}input[type=submit].focus-visible[_ngcontent-%COMP%], input[type=submit][_ngcontent-%COMP%]:focus{box-shadow:0 0 0 .2rem var(--mainColorLightest)}input[type=submit][_ngcontent-%COMP%], input[type=submit][_ngcontent-%COMP%]:active, input[type=submit][_ngcontent-%COMP%]:focus{color:#fff;background-color:var(--mainColor)}input[type=submit][_ngcontent-%COMP%]:hover{color:#fff;background-color:var(--mainHoverColor)}input[type=submit].disabled[_ngcontent-%COMP%], input[type=submit][disabled][_ngcontent-%COMP%]{cursor:default;color:#fff;background-color:#c6c6c6}input[type=submit][_ngcontent-%COMP%]   my-global-icon[_ngcontent-%COMP%]     .feather, input[type=submit][_ngcontent-%COMP%]   my-global-icon[_ngcontent-%COMP%]     .material{color:#fff}input[type=submit][_ngcontent-%COMP%]   my-global-icon[_ngcontent-%COMP%]     svg circle[fill="#000"], input[type=submit][_ngcontent-%COMP%]   my-global-icon[_ngcontent-%COMP%]     svg g[fill="#000"], input[type=submit][_ngcontent-%COMP%]   my-global-icon[_ngcontent-%COMP%]     svg path[fill="#000"], input[type=submit][_ngcontent-%COMP%]   my-global-icon[_ngcontent-%COMP%]     svg polygon[fill="#000"], input[type=submit][_ngcontent-%COMP%]   my-global-icon[_ngcontent-%COMP%]     svg rect[fill="#000"]{fill:#fff}input[type=submit][_ngcontent-%COMP%]   my-global-icon[_ngcontent-%COMP%]     svg circle[stroke="#000"], input[type=submit][_ngcontent-%COMP%]   my-global-icon[_ngcontent-%COMP%]     svg g[stroke="#000"], input[type=submit][_ngcontent-%COMP%]   my-global-icon[_ngcontent-%COMP%]     svg path[stroke="#000"], input[type=submit][_ngcontent-%COMP%]   my-global-icon[_ngcontent-%COMP%]     svg polygon[stroke="#000"], input[type=submit][_ngcontent-%COMP%]   my-global-icon[_ngcontent-%COMP%]     svg rect[stroke="#000"]{stroke:#fff}input[type=submit][_ngcontent-%COMP%]   my-global-icon[_ngcontent-%COMP%]     svg stop[stop-color="#000"]{stop-color:#fff}']}),e})(),canActivate:[a.a],data:{meta:{title:"Reset password"}}}];let w=(()=>{class e{}return e.\u0275mod=d.Ob({type:e}),e.\u0275inj=d.Nb({factory:function(n){return new(n||e)},imports:[[i.l.forChild(h)],i.l]}),e})(),S=(()=>{class e{}return e.\u0275mod=d.Ob({type:e}),e.\u0275inj=d.Nb({factory:function(n){return new(n||e)},providers:[],imports:[[w,o.h,r.c]]}),e})()},"nnN+":function(e,n,t){"use strict";t.d(n,"m",function(){return o}),t.d(n,"b",function(){return i}),t.d(n,"f",function(){return a}),t.d(n,"h",function(){return s}),t.d(n,"g",function(){return c}),t.d(n,"j",function(){return l}),t.d(n,"i",function(){return u}),t.d(n,"c",function(){return d}),t.d(n,"o",function(){return m}),t.d(n,"n",function(){return p}),t.d(n,"k",function(){return g}),t.d(n,"e",function(){return b}),t.d(n,"d",function(){return f}),t.d(n,"l",function(){return h}),t.d(n,"a",function(){return w});var r=t("3Pt+");const o={VALIDATORS:[r.w.required,r.w.minLength(1),r.w.maxLength(50),r.w.pattern(/^[a-z0-9][a-z0-9._]*$/)],MESSAGES:{required:"Bitte gib einen Benutzernamen ein.",minlength:"Der Benutzername muss mindestens 1 Zeichen lang sein.",maxlength:"Der Benutzername darf nicht l\xE4nger als 50 Zeichen sein.",pattern:"Der Benutzername sollte alphanumerisch in Kleinbuchstaben sein; Punkte und Unterstriche sind erlaubt."}},i={VALIDATORS:[r.w.required,r.w.minLength(1),r.w.maxLength(50),r.w.pattern(/^[a-z0-9][a-z0-9._]*$/)],MESSAGES:{required:"Kanalname wird ben\xF6tigt.",minlength:"Kanalname muss mindestens ein Zeichen enthalten.",maxlength:"Kanalname darf nicht mehr als 50 Zeichen lang sein.",pattern:"Der Kanalname sollte klein geschrieben werden und darf nur alphanumerische Zeichen, Punkte und Unterstriche enthalten."}},a={VALIDATORS:[r.w.required,r.w.email],MESSAGES:{required:"Bitte gib eine E-Mail-Adresse ein.",email:"Bitte gebe eine g\xFCltige E-Mail-Adresse ein."}},s={VALIDATORS:[r.w.required,r.w.pattern(/@.+/)],MESSAGES:{required:"Aktion erforderlich.",pattern:"Handle muss g\xFCltig sein (z. B. chocobozzz@example.com)."}},c={VALIDATORS:[r.w.required],MESSAGES:{required:"Bitte gib ein Passwort ein."}},l={VALIDATORS:[r.w.required,r.w.minLength(6),r.w.maxLength(255)],MESSAGES:{required:"Bitte gib ein Passwort ein.",minlength:"Das Passwort muss mindestens 6 Zeichen lang sein.",maxlength:"Das Passwort darf nicht l\xE4nger als 255 Zeichen lang sein."}},u={VALIDATORS:[r.w.minLength(6),r.w.maxLength(255)],MESSAGES:{minlength:"Das Passwort muss mindestens 6 Zeichen lang sein.",maxlength:"Das Passwort darf nicht l\xE4nger als 255 Zeichen lang sein."}},d={VALIDATORS:[],MESSAGES:{matchPassword:"Die Passw\xF6rter stimmen nicht \xFCberein."}},m={VALIDATORS:[r.w.required,r.w.min(-1)],MESSAGES:{required:"Das Videokontingent muss angegeben werden.",min:"Das Kontingent muss gr\xF6\xDFer als -1 sein."}},p={VALIDATORS:[r.w.required,r.w.min(-1)],MESSAGES:{required:"Bitte gibt eine t\xE4gliche Obergrenze zum Hochladen ein.",min:"Die t\xE4gliche Obergrenze zum Hochladen muss gr\xF6\xDFer als -1 sein."}},g={VALIDATORS:[r.w.required],MESSAGES:{required:"Die Benutzerrolle muss angegeben werden."}},b=function(e){const n={VALIDATORS:[r.w.minLength(1),r.w.maxLength(120)],MESSAGES:{required:"Der Anzeigename muss angegeben werden.",minlength:"Der Anzeigename muss mindestens 1 Zeichen lang sein.",maxlength:"Der Anzeigename darf nicht l\xE4nger als 50 Zeichen lang sein."}};return n.VALIDATORS.push(r.w.required),n}(),f={VALIDATORS:[r.w.minLength(3),r.w.maxLength(1e3)],MESSAGES:{minlength:"Die Beschreibung muss mindestens 3 Zeichen umfassen.",maxlength:"Beschreibung kann nicht l\xE4nger als 1000 Zeichen sein."}},h={VALIDATORS:[r.w.requiredTrue],MESSAGES:{required:"Du musst den Bedingungen dieser Instanz zustimmen um dich zu registrieren."}},w={VALIDATORS:[r.w.minLength(3),r.w.maxLength(250)],MESSAGES:{minlength:"Der Grund f\xFCr die Sperrung muss mindestens 3 Zeichen umfassen.",maxlength:"Der Grund f\xFCr die Sperrung darf nicht mehr als 250 Zeichen umfassen."}}}}]);