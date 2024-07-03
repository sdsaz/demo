
import { HttpClient, HttpClientModule } from "@angular/common/http";
import { Injector, ModuleWithProviders, NgModule } from "@angular/core";
import { TranslateLoader, TranslateModule, } from "@ngx-translate/core";
import { Observable } from "rxjs";
import { CommonHelper } from "../../@core/common-helper";

export function CustomTranslateHttpLoaderFactory(http: HttpClient, injector: Injector) {
    return new CustomTranslateHttpLoader(http, injector);
}

export class CustomTranslateHttpLoader implements TranslateLoader {
    constructor(private http: HttpClient, private readonly injector: Injector) { }

    getTranslation(lang: string): Observable<any> {
        const ch = this.injector.get(CommonHelper);
        if(ch?.app_version){
            // Fetch the translations from the server if the extraParam is provided, otherwise return empty object.
            return this.http.get(`assets/i18n/${lang}.json?${ch.app_version}`);
        }
        else{
            // Fetch the translations from the server if the extraParam is provided, otherwise return empty object.
            return this.http.get(`assets/i18n/${lang}.json?${Date.now()}`);
        }
    }
}

@NgModule({
    declarations: [],
    imports: [
        HttpClientModule,
        TranslateModule.forChild({
            loader: { provide: TranslateLoader, useFactory: CustomTranslateHttpLoaderFactory, deps: [HttpClient, Injector] },
            isolate: false,
            extend: true
        }),
    ],
    providers: [],
    exports: [TranslateModule],
})

export class SharedModule {
    static forRoot(): ModuleWithProviders<SharedModule> {
        return {
            ngModule: SharedModule,
            providers: []
        }
    }
}