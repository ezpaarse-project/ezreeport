import cors from 'cors';
import config from '~/lib/config';

const allowedOrigins = (config.get('allowedOrigins')).split(',');

export default cors({
  origin: (origin, next) => {
    if (
      allowedOrigins[0] === '*'
      || (origin && allowedOrigins.indexOf(origin) !== -1)
    ) {
      next(null, true);
    } else {
      next(new Error('Not allowed by CORS'));
    }
  },
});
