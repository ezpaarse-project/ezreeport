import assert from 'assert';
import axios from 'axios';
import { StatusCodes } from 'http-status-codes';

const http = axios.create({
  baseURL: 'http://localhost:8080',
  validateStatus: () => true,
});

describe('Report', () => {
  describe('General', () => {
    it('ping should return 204', async () => {
      const { status } = await http.get<void>('/ping');
      assert.equal(status, StatusCodes.NO_CONTENT);
    });

    it('random should return 404', async () => {
      const { status } = await http.get<void>('/ghfigyzqdsfuoqdtqsddfqs');
      assert.equal(status, StatusCodes.NOT_FOUND);
    });
  });

  describe('Tasks', () => {
    // it('should return ', () => {
    //   assert.equal([1, 2, 3].indexOf(4), -1);
    // });
  });
});
