import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationEnd, PRIMARY_OUTLET, Router, UrlSegment } from '@angular/router';
import { filter } from 'rxjs/operators';
import { BreadCrumbModel } from './model/breadcrumb.model';
import { BreadcrumbObserver } from './services/breadcrumb.observer';

@Component({
  selector: 'app-breadcrumb',
  templateUrl: './breadcrumb.component.html',
  styleUrls: ['./breadcrumb.component.css']
})
export class BreadcrumbComponent implements OnInit {

  breadcrumbs: Array<BreadCrumbModel> = new Array<BreadCrumbModel>();

  constructor(private activatedRoute: ActivatedRoute, private router: Router, private breadcrumbObs: BreadcrumbObserver) { }

  ngOnInit() {
    this.cadastrarEventos();
  }

  cadastrarEventos() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)).subscribe(() => {
        this.listarRotas();
      });

    this.breadcrumbObs.$listarRotas.subscribe(() => {
      this.listarRotas();
    });
  }
  
  private listarRotas() {
    const root: ActivatedRoute = this.activatedRoute.root;
    this.breadcrumbs = this.getBreadcrumbs(root);
  }

  private getBreadcrumbs(route: ActivatedRoute, url: string = '', breadcrumbs: BreadCrumbModel[] = []): BreadCrumbModel[] {
    const ROUTE_DATA_BREADCRUMB = 'titulo';
    const children: ActivatedRoute[] = route.children;

    if (children.length === 0) {
      return breadcrumbs;
    }

    for (const child of children) {

      if (child.outlet !== PRIMARY_OUTLET) {
        continue;
      }

      if (!child.snapshot.data.hasOwnProperty(ROUTE_DATA_BREADCRUMB)) {
        return this.getBreadcrumbs(child, url, breadcrumbs);
      }

      const routeURL: string = child.snapshot.url.map((segment: UrlSegment) => segment.path).join('/');

      url += `/${routeURL}`;

      const breadcrumb: BreadCrumbModel = {
        titulo: child.snapshot.data[ROUTE_DATA_BREADCRUMB],
        params: child.snapshot.params,
        link: url
      };

      breadcrumbs.push(breadcrumb);
      return this.getBreadcrumbs(child, url, breadcrumbs);
    }
  }

}
