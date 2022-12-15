import { setDefaultOptions } from 'date-fns';
import { fr } from 'date-fns/locale';

setDefaultOptions({ locale: fr, weekStartsOn: 1 });

export * from 'date-fns';
