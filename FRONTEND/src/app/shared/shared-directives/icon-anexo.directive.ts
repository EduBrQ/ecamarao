
import { Directive, OnChanges, ElementRef, Input } from '@angular/core';

import { IconAnexoEnum, IconAnexoEnumBadge } from './../shared-models/enum/icon-anexo.enum';
import { TiposExtensao } from '@shared/models/enum/tipos-extensao.enum';

@Directive({
  selector: '[appIconAnexo]'
})
export class IconAnexoDirective implements OnChanges {

  @Input('appIconAnexo') iconAnexoEnum: IconAnexoEnum;

  constructor(private elementRef: ElementRef) { }

  ngOnChanges(): void {
    if (this.iconAnexoEnum) {
      const icon = `${IconAnexoEnumBadge[this.iconAnexoEnum.toUpperCase()] || IconAnexoEnumBadge[TiposExtensao.FILE_DEFAULT]}`;
      const color = this.colorIcone(this.iconAnexoEnum);

      this.elementRef.nativeElement.classList.add('fas');
      this.elementRef.nativeElement.classList.add(color);
      this.elementRef.nativeElement.classList.add(icon);
    }
  }

  private colorIcone(iconAnexoEnum: IconAnexoEnum): string {

    function isPDF(): string {
      return 'text-danger';
    }

    function isImagem(): string {
      return 'text-primary';
    }

    function isExecel(): string {
      return 'text-success';
    }

    function isPadrao(): string {
      return 'text-secondary';
    }

    const color = {
      [IconAnexoEnum.PDF]: isPDF,
      [IconAnexoEnum.JPG]: isImagem,
      [IconAnexoEnum.PNG]: isImagem,
      [IconAnexoEnum.DWG]: isPadrao,
      [IconAnexoEnum.XLS]: isExecel,
      [IconAnexoEnum.JPEG]: isImagem,
      [IconAnexoEnum.XLSX]: isExecel,
      ['default']: isPadrao
    };

    return (color[iconAnexoEnum.toUpperCase()] || color['default'])();
  }

}
