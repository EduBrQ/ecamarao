import { TiposExtensao } from './tipos-extensao.enum';

export enum IconAnexoEnum {
    PDF = 'PDF',
    JPG = 'JPG',
    PNG = 'PNG',
    DWG = 'DWG',
    XLS = 'XLS',
    JPEG = 'JPEG',
    XLSX = 'XLSX',
}

export const IconAnexoEnumMensagem = {
    [IconAnexoEnum.PDF]: 'Arquivo tipo PDF',
    [IconAnexoEnum.JPG]: 'Arquivo tipo JPG',
    [IconAnexoEnum.PNG]: 'Arquivo tipo PNG',
    [IconAnexoEnum.DWG]: 'Arquivo tipo AutoCAD',
    [IconAnexoEnum.JPG]: 'Arquivo tipo JPEG',
    [IconAnexoEnum.XLS]: 'Arquivo tipo Excel',
    [IconAnexoEnum.XLSX]: 'Arquivo tipo Excel',
};

export const IconAnexoEnumBadge = {
    [IconAnexoEnum.PDF]: TiposExtensao.PDF,
    [IconAnexoEnum.JPG]: TiposExtensao.JPG,
    [IconAnexoEnum.PNG]: TiposExtensao.PNG,
    [IconAnexoEnum.DWG]: TiposExtensao.DWG,
    [IconAnexoEnum.JPEG]: TiposExtensao.JPEG,
    [IconAnexoEnum.XLS]: TiposExtensao.XLS,
    [IconAnexoEnum.XLSX]: TiposExtensao.XLSX
};
