import { invoke } from '@tauri-apps/api/core';
import { APP_VERSION } from '../config/suiteManifest';
import { isTauriRuntime } from './storage';
export interface SuiteUpdateResult {enabled:boolean;currentVersion:string;available:boolean;version?:string;message?:string}
export async function checkForSuiteUpdate():Promise<SuiteUpdateResult>{if(!isTauriRuntime())return{enabled:false,currentVersion:APP_VERSION,available:false,message:'A verificação de atualização só funciona no aplicativo instalado.'};return invoke<SuiteUpdateResult>('check_for_update')}
export async function installSuiteUpdate():Promise<void>{if(!isTauriRuntime())throw new Error('Instalação de atualização indisponível no preview.');await invoke('install_pending_update')}
