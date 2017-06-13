import {Component, OnInit, ViewChild, ChangeDetectorRef} from "@angular/core";
import {ActivatedRoute, Router} from "@angular/router";
import {FormGroup, FormControl, FormBuilder, FormArray, Validators} from "@angular/forms";
import {DatasetService} from "./dataset.service";
import {CodesService} from "./codes.service";
import {CatalogService} from "../catalog/catalog.service";
import {Dataset} from "./dataset";
import {Catalog} from "../catalog/catalog"
import { Observable } from 'rxjs';
import { Http, Response } from '@angular/http';
import {NgModule} from '@angular/core';
import {environment} from "../../environments/environment";
import {ConfirmComponent} from "../confirm/confirm.component";
import { DialogService } from "ng2-bootstrap-modal";
import {DistributionFormComponent} from "./distribution/distribution.component";
import * as _ from 'lodash';
import {ThemesService} from "./themes.service";
import {IMyDpOptions} from 'mydatepicker';

@Component({
  selector: 'app-dataset',
  templateUrl: './dataset.component.html',
  styleUrls: ['./dataset.component.css', '../../assets/css/designsystem.css', '../../assets/css/registrering.css']
})// class Select

export class DatasetComponent implements OnInit {
  title = 'Registrer datasett';
  dataset: Dataset;
  catalog: Catalog;
  // title: string;
  description: string;
  language: string;
  timer: number;
  saved: boolean;
  catId: string;
  lastSaved: string;

  identifiersForm: FormGroup;

  datasetSavingEnabled: boolean = false; // upon page init, saving is disabled

  saveDelay:number = 1000;

  datasetForm: FormGroup = new FormGroup({});
  myDatePickerOptions: IMyDpOptions = {
    dateFormat: 'yyyy.mm.dd',
  };
  availableLanguages: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private service: DatasetService,
    private codesService: CodesService,
    private themesService: ThemesService,
    private catalogService: CatalogService,
    private http: Http,
    private dialogService: DialogService,
    private formBuilder: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {  }


  ngOnInit() {
    this.language = 'nb';
    this.availableLanguages = [ // this should be delivered from the server together with index.html (for example)
      {
        uri: "http://publications.europa.eu/resource/authority/language/ENG",
        code: 'ENG',
        prefLabel: {
          nb: 'Engelsk'
        },
        selected: false
      },
      {
        uri: "http://publications.europa.eu/resource/authority/language/NOR",
        code: 'NOR',
        prefLabel: {
          nb: 'Norsk'
        },
        selected: false
      },
      {
        uri: "http://publications.europa.eu/resource/authority/language/SMI",
        code: 'SMI',
        prefLabel: {
          nb: 'Samisk'
        },
        selected: false
      }
    ];
    this.timer = 0;
    var that = this;
    // snapshot alternative
    this.catId = this.route.snapshot.params['cat_id'];

    this.identifiersForm = new FormGroup({});
    this.identifiersForm.addControl("identifiersControl", new FormControl([]));

    let datasetId = this.route.snapshot.params['dataset_id'];
    this.catalogService.get(this.catId).then((catalog: Catalog) => this.catalog = catalog);
    this.service.get(this.catId, datasetId).then((dataset: Dataset) => {
      this.dataset = dataset;
      if(dataset.languages) {
        this.availableLanguages.forEach((language, languageIndex, languageArray) => {
          dataset.languages.forEach((datasetLanguage, datasetLanguageIndex, datasetLanguageArray)=> {
            if(language.code === datasetLanguage.code) {
              languageArray[languageIndex].selected = true;
            }
          })
        })
      }

      // Only allows one contact point per dataset
      this.dataset.contactPoints[0] = this.dataset.contactPoints[0] || {};
      this.dataset.identifiers = this.dataset.identifiers || [];

      //set default publisher to be the same as catalog
      this.dataset.publisher = this.dataset.publisher || this.catalog.publisher;
      this.dataset.languages = [];

      dataset.samples = dataset.samples || [];
      dataset.languages = dataset.languages || [];

      this.datasetForm = this.toFormGroup(this.dataset);
      setTimeout(()=>this.datasetSavingEnabled = true, this.saveDelay);
      this.datasetForm.valueChanges // when fetching back data, de-flatten the object
          .subscribe(dataset => {
            dataset.issued = "2017-05-16T11:52:25+00:00";
            dataset.modified = "2017-05-16T11:52:25+00:00";

            dataset.languages = [];
            this.availableLanguages.forEach((language, index)=>{
              dataset.checkboxArray.forEach((checkbox, checkboxIndex)=>{
                if((index === checkboxIndex) && checkbox) dataset.languages.push(language);
              });
            });

            if(dataset.distributions) {
              dataset.distributions.forEach((distribution) => {
                distribution.title = typeof distribution.title === 'object' ? distribution.title : {'nb': distribution.title};
                distribution.description = typeof distribution.description === 'object' ? distribution.description : {'nb': distribution.description};
              })
            }
            if(dataset.samples) {
              dataset.samples.forEach((distribution) => {
                distribution.title = typeof distribution.title === 'object' ? distribution.title : {'nb': distribution.title};
                distribution.description = typeof distribution.description === 'object' ? distribution.description : {'nb': distribution.description};
              })
            }
            if(dataset.modified && dataset.modified.formatted) {
              dataset.modified = dataset.modified.formatted.replace(/\./g,"-");
            }
            if(dataset.issued && dataset.issued.formatted) {
              dataset.issued = dataset.issued.formatted.replace(/\./g,"-");
            }
            this.dataset = _.merge(this.dataset, dataset);
            this.dataset.languages = dataset.languages;
            this.cdr.detectChanges();
            var that = this;
            this.delay(()=>{
              if(this.datasetSavingEnabled){
                that.save.call(that);
              }
            }, this.saveDelay);
          });
    });
  }

  onSave(ok:boolean) {
      this.save();
  }

  save(): void {

    this.datasetSavingEnabled = false;
    this.service.save(this.catId, this.dataset)
      .then(() => {
        this.saved = true;
        var d = new Date();
        this.lastSaved = ("0" + d.getHours()).slice(-2) + ':' + ("0" + d.getMinutes()).slice(-2) + ':' + ("0" + d.getSeconds()).slice(-2);
        this.datasetSavingEnabled = true;
      })
  }

  valuechange(): void {
    var that = this;
    this.delay(()=>{
      if(this.datasetSavingEnabled){
        that.save.call(that);
      }
    }, this.saveDelay);

  }

  delay(callback, ms): void {
      clearTimeout (this.timer);
      this.timer = setTimeout(callback, ms);
  }

  back(): void {
    this.router.navigate(['/catalogs', this.catId]);
  }

  delete(): void {
    this.service.delete(this.catId, this.dataset)
      .then(() => {this.back()})
  }

  showConfirmDelete() {
    let disposable = this.dialogService.addDialog(ConfirmComponent, {
      title:'Slett datasett',
      message:'Vil du virkelig slette datasett ' + this.dataset.title[this.language] + '?'})
      .subscribe((isConfirmed)=>{
        //We get dialog result
        if(isConfirmed) {
          this.delete();
        }
      });
    //If dialog was not closed manually close it by timeout
    setTimeout(()=>{
      disposable.unsubscribe();
    },10000);
  }


  private getDatasett(): Promise<Dataset> {
      // Insert mock object here.  Likely provided via a resolver in a
      // real world scenario
      let datasetId = this.route.snapshot.params['dataset_id'];
      return this.service.get(this.catId, datasetId);
  }

  private getDateObjectFromUnixTimestamp(timestamp:string) {
    let date = new Date(timestamp);
    return {
      date: {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate()
      },
      formatted: date.getFullYear() + '-' + ('0' + date.getMonth()).slice(-2) + '-' + date.getDate()
    }
  }
/*
    get skills(): FormArray {
      return this.form.get('skills') as FormArray;
    };*/

  private toFormGroup(data: Dataset): FormGroup {
    this.getDateObjectFromUnixTimestamp(data.issued)
    const formGroup = this.formBuilder.group({
          //title: title,
          description: [ data.description],
          catalog: [ data.catalog],
          landingPages: [ data.landingPages],
          publisher: [ data.publisher],
          contactPoints: this.formBuilder.array([]),
          distributions: this.formBuilder.array([]),
          issued:[this.getDateObjectFromUnixTimestamp(data.issued || (new Date()).toString())],
          modified: [this.getDateObjectFromUnixTimestamp(data.modified || (new Date()).toString())],
          samples: this.formBuilder.array([]),
          checkboxArray: this.formBuilder.array(this.availableLanguages.map(s => {return this.formBuilder.control(s.selected)}))
        });
      return formGroup;
  }
}
