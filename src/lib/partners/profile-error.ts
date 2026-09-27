export function profileSaveError(error:unknown):string {
 const e=error as {code?:string;message?:string};
 if(e?.code==='23502')return 'Profile setup needs a database update. Please contact support to enable saving each profile step.';
 if(e?.code==='23505')return 'These identity details are already registered. Please check your PAN or contact support.';
 if(e?.code==='23514')return 'Some profile details do not meet the required format. Check your date of birth, PIN code and identity details.';
 if(['42703','42P01','PGRST204','PGRST205'].includes(e?.code||''))return 'Profile setup is temporarily unavailable. Please contact support for a database update.';
 return 'Unable to save profile right now. Please try again or contact support.';
}
